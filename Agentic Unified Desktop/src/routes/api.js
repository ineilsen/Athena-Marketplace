import { Router } from 'express';
import { fetchInsights, refineReply } from '../services/llmOrchestrator.js';
import { deriveServiceContext } from '../config/serviceClassification.js';
import logger from '../utils/logger.js';
import { executeM365Action } from '../services/m365ActionExecutor.js';

const router = Router();

// In-memory rolling conversation history per customer (simple demo storage)
const conversationStore = new Map(); // customerId -> [{role, content, ts}]
const MAX_HISTORY = 50; // cap messages per customer

// Executed agent network actions per customer
const executedActionsStore = new Map(); // customerId -> [{id, query, ts}]

function recordExecutedAction(customerId, id, query){
	if (!customerId || !query) return;
	if (!executedActionsStore.has(customerId)) executedActionsStore.set(customerId, []);
	const arr = executedActionsStore.get(customerId);
	arr.push({ id: id || `exec-${arr.length+1}`, query, ts: Date.now() });
	if (arr.length > 20) arr.splice(0, arr.length - 20);
}

function getExecutedActions(customerId){
	return executedActionsStore.get(customerId) || [];
}

function appendConversation(customerId, role, content){
	if (!conversationStore.has(customerId)) conversationStore.set(customerId, []);
	const arr = conversationStore.get(customerId);
	arr.push({ role, content, ts: Date.now() });
	if (arr.length > MAX_HISTORY) arr.splice(0, arr.length - MAX_HISTORY);
}

function getConversationHistory(customerId){
	return (conversationStore.get(customerId) || []).map(m => ({ role: m.role, content: m.content }));
}

function getLastCustomerUtterance(conversationHistory = []){
	try {
		const last = [...(conversationHistory || [])].reverse().find(m => String(m?.role || '').toLowerCase() === 'customer');
		return String(last?.content || '').trim();
	} catch(_) {
		return '';
	}
}

router.post('/v1/get-insights', async (req, res) => {
	const start = Date.now();
	if (logger.isDebug) logger.debug('POST /api/v1/get-insights', { requestedWidgets: req.body?.requestedWidgets, hasExtra: !!req.body?.extraVarsMap, providerMap: req.body?.providerMap });
	try {
		const { customerId, conversationHistory = [], requestedWidgets = [], extraVarsMap = {}, providerMap = {} } = req.body || {};
		if (!customerId) {
			logger.warn('get-insights validation failed: missing customerId');
			return res.status(400).json({ error: 'customerId required' });
		}
		if (!Array.isArray(requestedWidgets) || requestedWidgets.length === 0) {
			logger.warn('get-insights validation failed: requestedWidgets invalid');
			return res.status(400).json({ error: 'requestedWidgets must be non-empty array' });
		}

		// Fast-path: execute Microsoft 365 admin actions via MCP/Graph when the action query includes M365_ACTION payload.
		if (requestedWidgets.includes('AGENT_NETWORK_EXECUTE')) {
			const execVars = extraVarsMap?.AGENT_NETWORK_EXECUTE;
			const actionQuery = execVars?.ACTION_QUERY || '';
			const actionText = String(actionQuery || '');
			const lower = actionText.toLowerCase();
			const looksLikeLicenseCount = /licen[cs]e/.test(lower) && /(how many|number of|count|seat)/.test(lower) && /\be5\b|\be3\b|m365|microsoft\s*365|office\s*365/.test(lower);
			const upnMatch = actionText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
			const upn = upnMatch ? upnMatch[0] : null;
			const nameAfterFor = (() => {
				const m = actionText.match(/\bfor\s+([A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){0,2})\b/);
				return m ? m[1].trim() : null;
			})();
			const looksLikeLicenseAssignmentCheck = /licen[cs]e/.test(lower) && /(assignment|assigned|verify|check|status)/.test(lower) && (!!upn || !!nameAfterFor);
			const looksLikeLicenseAssign = /licen[cs]e/.test(lower) && /(assign|add\s+license|grant)/.test(lower) && !!upn;

			let effectiveActionQuery = actionText;
			if (!effectiveActionQuery.includes('M365_ACTION:') && looksLikeLicenseCount) {
				// Planner sometimes omits the machine payload; synthesize it for read-only count requests.
				let license = null;
				if (/teams\s+enterprise/i.test(actionText)) license = 'Microsoft Teams Enterprise';
				else if (/\be3\b/i.test(actionText)) license = 'Microsoft 365 E3';
				else if (/\be5\b/i.test(actionText) && /no\s*teams|without\s*teams/i.test(actionText)) license = 'Microsoft 365 E5 (no Teams)';
				else if (/\be5\b/i.test(actionText)) license = 'Microsoft 365 E5';
				effectiveActionQuery = `M365_ACTION: ${JSON.stringify({ intent: 'get_license_counts', license, utterance: actionText })}`;
			}
			if (!effectiveActionQuery.includes('M365_ACTION:') && looksLikeLicenseAssignmentCheck) {
				// Synthesize payload for read-only license assignment check.
				effectiveActionQuery = `M365_ACTION: ${JSON.stringify({ intent: 'check_user_license_assignments', upn, userPrincipalName: upn, displayName: nameAfterFor, utterance: actionText })}`;
			}
			if (!effectiveActionQuery.includes('M365_ACTION:') && looksLikeLicenseAssign) {
				// Synthesize payload for license assignment (write action; executor will require customer confirmation).
				let license = null;
				if (/teams\s+enterprise/i.test(actionText)) license = 'Microsoft Teams Enterprise';
				else if (/\be3\b/i.test(actionText)) license = 'Microsoft 365 E3';
				else if (/\be5\b/i.test(actionText) && /no\s*teams|without\s*teams/i.test(actionText)) license = 'Microsoft 365 E5 (no Teams)';
				else if (/\be5\b/i.test(actionText)) license = 'Microsoft 365 E5';
				// If we still don't have a license label, keep it null; executor will report missing.
				effectiveActionQuery = `M365_ACTION: ${JSON.stringify({ intent: 'assign_license', upn, userPrincipalName: upn, license, utterance: actionText })}`;
			}

			if (typeof effectiveActionQuery === 'string' && effectiveActionQuery.includes('M365_ACTION:')) {
				// Ensure fuzzy mapping has the original customer utterance.
				try {
					const marker = 'M365_ACTION:';
					const idx = effectiveActionQuery.indexOf(marker);
					if (idx !== -1) {
						const raw = effectiveActionQuery.slice(idx + marker.length).trim();
						const payload = JSON.parse(raw);
						// If planner emitted discover_tenant for a license action, override to the right intent.
						if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
							const payloadIntent = String(payload.intent || '').toLowerCase();
							const actionLower = String(actionText || '').toLowerCase();
							const payloadUpn = payload.upn || payload.userPrincipalName;
							const upn2 = payloadUpn || upn;
							const looksLikeAssignCheck2 = /licen[cs]e/.test(actionLower) && /(assignment|assigned|verify|check|status)/.test(actionLower) && (!!upn2 || !!nameAfterFor);
							const looksLikeAssign2 = /licen[cs]e/.test(actionLower) && /(assign|add\s+license|grant)/.test(actionLower) && !!upn2;
							if (payloadIntent === 'discover_tenant' && looksLikeAssignCheck2) {
								payload.intent = 'check_user_license_assignments';
								if (upn2) {
									payload.upn = upn2;
									payload.userPrincipalName = upn2;
								}
								if (!payload.displayName && nameAfterFor) payload.displayName = nameAfterFor;
								effectiveActionQuery = `${marker} ${JSON.stringify(payload)}`;
							}
							// If planner emitted assign_license for a verify/check action, downgrade to the read-only check intent.
							if (payloadIntent === 'assign_license' && looksLikeAssignCheck2 && !looksLikeAssign2) {
								payload.intent = 'check_user_license_assignments';
								if (upn2) {
									payload.upn = upn2;
									payload.userPrincipalName = upn2;
								}
								if (!payload.displayName && nameAfterFor) payload.displayName = nameAfterFor;
								// Remove any stale license field to avoid confusion.
								delete payload.license;
								effectiveActionQuery = `${marker} ${JSON.stringify(payload)}`;
							}
							if (payloadIntent === 'discover_tenant' && looksLikeAssign2) {
								payload.intent = 'assign_license';
								payload.upn = upn2;
								payload.userPrincipalName = upn2;
								// Best-effort license extraction from action text.
								if (!payload.license) {
									if (/teams\s+enterprise/i.test(actionText)) payload.license = 'Microsoft Teams Enterprise';
									else if (/\be3\b/i.test(actionText)) payload.license = 'Microsoft 365 E3';
									else if (/\be5\b/i.test(actionText) && /no\s*teams|without\s*teams/i.test(actionText)) payload.license = 'Microsoft 365 E5 (no Teams)';
									else if (/\be5\b/i.test(actionText)) payload.license = 'Microsoft 365 E5';
								}
								effectiveActionQuery = `${marker} ${JSON.stringify(payload)}`;
							}
						}
						const lastCustomerUtterance = getLastCustomerUtterance(conversationHistory);
						if (payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.utterance && lastCustomerUtterance) {
							payload.utterance = lastCustomerUtterance;
							effectiveActionQuery = `${marker} ${JSON.stringify(payload)}`;
						}
					}
				} catch (_) {
					// Non-fatal: proceed with original payload.
				}

				// Record as executed for UI badges.
				if (execVars?.ACTION_QUERY) recordExecutedAction(customerId, execVars.ACTION_ID, execVars.ACTION_QUERY);

				const tenantDomain = process.env.AZURE_TENANT_DOMAIN || process.env.M365_TENANT_DOMAIN || '';
				const result = await executeM365Action({ actionQuery: effectiveActionQuery, conversationHistory, tenantDomain });
				logger.info('M365 MCP execute result', { customerId, actionId: execVars?.ACTION_ID, shortDescription: result?.shortDescription, summary: String(result?.summary || '').slice(0, 180) });
				// Provide a minimal LIVE_RESPONSE draft so UI can insert text quickly.
				const draft = result?.summary ? `${result.summary}` : 'Microsoft 365 action processed.';
				return res.json({
					AGENT_NETWORK_EXECUTE: result,
					LIVE_RESPONSE: { draft }
				});
			}
		}
		// If execution requested, record before planning refresh
		if (requestedWidgets.includes('AGENT_NETWORK_EXECUTE')) {
			const execVars = extraVarsMap?.AGENT_NETWORK_EXECUTE;
			if (execVars?.ACTION_QUERY) recordExecutedAction(customerId, execVars.ACTION_ID, execVars.ACTION_QUERY);
			if (logger.isDebug) logger.debug('recordExecutedAction', { customerId, actionId: execVars?.ACTION_ID, queryPreview: (execVars?.ACTION_QUERY||'').slice(0,120) });
		}
		// Inject previously executed actions context for planner
		if (requestedWidgets.includes('AGENT_NETWORK_ACTIONS')) {
			const prev = getExecutedActions(customerId);
			extraVarsMap.AGENT_NETWORK_ACTIONS = { ...(extraVarsMap.AGENT_NETWORK_ACTIONS||{}), PREVIOUS_ACTIONS: prev.length ? prev.map(p=>`${p.id}: ${p.query}`).slice(-10).join('\n') : 'NONE' };
		}
		// Derive customer context (region, postalCode, serviceType) from last known Customer 360 snapshot
		function deriveCustomerContext(id){
			const snap = lastCustomer360.get(id);
			if (!snap) return {};
			const ctx = {};
			const demo = snap.insights?.CUSTOMER_360_DEMOGRAPHICS || snap.customer360?.demographics || null;
			const geoCard = snap.customer360?.cards?.geoServiceContext || {};
			const addr = demo?.address || {};
			if (geoCard.region || addr.region) ctx.region = geoCard.region || addr.region;
			if (geoCard.postalCode || addr.postcode) ctx.postalCode = geoCard.postalCode || addr.postcode;
			if (geoCard.city || addr.city) ctx.city = geoCard.city || addr.city;
			const products = snap.customer360?.products || [];
			if (products.length){
				const names = products.map(p=>String(p.name||''));
				const { detailedType } = deriveServiceContext(names);
				if (detailedType) ctx.serviceType = geoCard.serviceType || detailedType;
			}
			return ctx;
		}

		const customerContext = deriveCustomerContext(customerId);
		// Also attach context into execute extra vars for transparency (optional use by prompts)
		if (requestedWidgets.includes('AGENT_NETWORK_EXECUTE')){
			extraVarsMap.AGENT_NETWORK_EXECUTE = { ...(extraVarsMap.AGENT_NETWORK_EXECUTE||{}), CUSTOMER_CONTEXT: customerContext };
		}

		const data = await fetchInsights({ customerId, conversationHistory, requestedWidgets, extraVarsMap, providerMap, customerContext });
		// Augment agent network actions with executed list for UI badges
		if (requestedWidgets.includes('AGENT_NETWORK_ACTIONS')) {
			try {
				if (!data.AGENT_NETWORK_ACTIONS) data.AGENT_NETWORK_ACTIONS = { actions: [] };
				data.AGENT_NETWORK_ACTIONS.executedActions = getExecutedActions(customerId);
			} catch(e){ /* non-fatal */ }
		}
	if (logger.isDebug) logger.debug('get-insights result', { customerId, requestedWidgets, durationMs: Date.now() - start, keys: Object.keys(data||{}) });
		res.json(data);
	} catch (err) {
		logger.error('get-insights error', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// In-memory store for latest customer360 per customer
const lastCustomer360 = new Map();
const sseClients = new Map(); // customerId -> Set(res)

function sendSse(res, data){
	res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.get('/v1/stream/customer-360/:id', (req, res) => {
	const { id } = req.params;
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'Access-Control-Allow-Origin': '*'
	});
	if (!sseClients.has(id)) sseClients.set(id, new Set());
	sseClients.get(id).add(res);
	// Send last snapshot immediately if present
	const existing = lastCustomer360.get(id);
	if (existing) sendSse(res, existing);
	req.on('close', ()=> { sseClients.get(id)?.delete(res); });
});

// External chat webhook: receive a new message from the customer chat app
// and return updated customer 360 + updated widgets (wordcloud for account help)
router.post('/v1/external-chat', async (req, res) => {
	const start = Date.now();
	try {
		const { customerId, message, source = 'external' } = req.body || {};
		if (!customerId || !message) return res.status(400).json({ error: 'customerId and message required' });
		logger.info('Inbound customer message', { customerId, len: message.length, preview: message.slice(0,120) });

		// Append new customer message to rolling history
		appendConversation(customerId, 'customer', message);
		const conversationHistory = getConversationHistory(customerId);

		// Request core + enriched widgets (include V2 knowledge + live response & 360 for freshness)
		const requestedWidgets = [
			'MINI_INSIGHTS',
			'SERVICE_PEDIA', // legacy fallback
			'SERVICE_PEDIA_V2',
			'KNOWLEDGE_GRAPH',
			'ACCOUNT_HEALTH',
			'AI_SUMMARY',
			'RESOLUTION_PREDICTOR',
			'NEXT_BEST_ACTION',
			'LIVE_PROMPTS',
			'CUSTOMER_360',
			'CUSTOMER_360_DEMOGRAPHICS',
			'LIVE_RESPONSE',
			'AGENT_NETWORK_ACTIONS'
		];
		// If the source is marketplace, pass that as explicit customer context so prompts can route
		const customerContext = source === 'marketplace' ? { marketplace: true } : {};
		const insights = await fetchInsights({ customerId, conversationHistory, requestedWidgets, customerContext });

		// Marketplace fast-path: answer read-only M365 licensing questions via MCP/Graph (avoid prompt-simulated numbers).
		try {
			const msg = String(message || '');
			const lower = msg.toLowerCase();
			const isLicenseCountQuestion = /how many|number of|count/i.test(lower) && /licen[cs]e/i.test(lower);
			const mentionsM365 = /m365|microsoft\s*365|office\s*365/i.test(lower);
			const asksE5 = /\be5\b/.test(lower);
			const asksE3 = /\be3\b/.test(lower);
			const asksNoTeams = /no\s*teams|without\s*teams/i.test(lower);
			const asksTeamsEnterprise = /teams\s+enterprise/i.test(lower);

			if (source === 'marketplace' && isLicenseCountQuestion && (mentionsM365 || asksE5 || asksE3 || asksTeamsEnterprise)) {
				let license = null;
				if (asksTeamsEnterprise) license = 'Microsoft Teams Enterprise';
				else if (asksE3) license = 'Microsoft 365 E3';
				else if (asksE5 && asksNoTeams) license = 'Microsoft 365 E5 (no Teams)';
				else if (asksE5) license = 'Microsoft 365 E5';

				const actionQuery = `M365_ACTION: ${JSON.stringify({ intent: 'get_license_counts', license, utterance: msg })}`;
				const tenantDomain = process.env.AZURE_TENANT_DOMAIN || process.env.M365_TENANT_DOMAIN || '';
				logger.info('Marketplace M365 license count query detected; calling MCP/Graph', { customerId, license });
				const m365 = await executeM365Action({ actionQuery, conversationHistory, tenantDomain });
				if (m365?.summary) {
					insights.LIVE_RESPONSE = { ...(insights.LIVE_RESPONSE || {}), draft: m365.summary };
					insights.M365 = m365;
					// If we can answer deterministically, prefer returning directly rather than re-writing via refineReply.
					insights.__forceBotReply = m365.summary;
				}
			}
		} catch (e) {
			logger.warn('Marketplace M365 fast-path failed', { message: e.message });
		}

		// Build customer 360 object (prefer full CUSTOMER_360 payload if present)
		const baseC360 = insights.CUSTOMER_360 || {};
		const customer360 = {
			id: baseC360.id || customerId,
			lastMessage: message,
			segment: baseC360.segment,
			tenureMonths: baseC360.tenureMonths,
			products: baseC360.products || [],
			kpis: baseC360.kpis || {},
			billing: baseC360.billing || {},
			upsellPotential: baseC360.upsellPotential || [],
			riskSignals: baseC360.riskSignals || [],
			miniInsights: insights.MINI_INSIGHTS || {},
			knowledgeGraph: insights.KNOWLEDGE_GRAPH || {},
			accountHealth: insights.ACCOUNT_HEALTH || {},
			summary: insights.AI_SUMMARY?.summary || null,
			resolutionPrediction: insights.RESOLUTION_PREDICTOR || null
		};

		// Enrich with Geo & Service Context card (derive from demographics/products) with plausible fallbacks
		try {
			const demo = insights.CUSTOMER_360_DEMOGRAPHICS || baseC360.demographics || {};
			const addr = demo?.address || {};
			const products = customer360.products || [];
			// Infer service type with sensible default
			const names = products.map(p=>String(p.name||'').toLowerCase());
			let { detailedType: serviceType } = deriveServiceContext(names);
			// Seeded hash for deterministic, plausible IDs
			const idStr = String(customerId||'');
			let h = 0; for (let i=0;i<idStr.length;i++){ h = (h*31 + idStr.charCodeAt(i)) >>> 0; }
			const city = addr.city || (addr.region ? addr.region.split(/\s+/)[0] : 'UK');
			const cityCode = String(city).toUpperCase().replace(/[^A-Z]/g,'').slice(0,3) || 'UK';
			const cabNumA = (h % 60) + 1; const cabNumB = (Math.floor(h/7) % 12) + 1;
			const exNum = (Math.floor(h/13) % 80) + 10;
			const cabinetId = `CAB-${cityCode}-${cabNumA}/${cabNumB}`;
			const exchangeId = `${cityCode}-EX${exNum}`;
			const geoCard = {
				region: addr.region || 'Greater London',
				postalCode: addr.postcode || `GB${(h%9000+1000)}`,
				city: addr.city || city,
				serviceType: serviceType || undefined,
				cabinetId,
				exchangeId,
				shortDescription: `${serviceType || 'Service'} in ${addr?.region || addr?.city || 'region unknown'}`.slice(0,80),
				summary: `Context for outages/maintenance: ${addr?.region||'—'} ${addr?.postcode? '('+addr.postcode+')':''}; service=${serviceType||'—'}`.slice(0,200)
			};
			customer360.cards = customer360.cards || {};
			customer360.cards.geoServiceContext = geoCard;
		} catch(e){ /* non-fatal */ }

		// Add Tickets & Cases card (deterministic, plausible demo values)
		try {
			const idStr = String(customerId||'');
			let h = 0; for (let i=0;i<idStr.length;i++){ h = (h*31 + idStr.charCodeAt(i)) >>> 0; }
			const openCount = (h % 3) + 1; // 1-3
			const oldestDays = 1 + ((h >> 3) % 18); // 1-18 days
			const priority = ['Low','Medium','High'][(h >> 5) % 3];
			const sla = oldestDays > 10 ? 'At Risk' : oldestDays > 5 ? 'Watch' : 'Within SLA';
			const owner = ['Tier 1','Tier 2','Back Office','Field Ops'][(h >> 7) % 4];
			const lastAction = ['Awaiting customer response','Pending vendor','Diagnostics run','Engineer scheduled','Monitoring stability','Parts on order'][(h >> 9) % 6];
			const ticketsCard = {
				openCount,
				oldestDays,
				priority,
				sla,
				lastAction,
				owner,
				shortDescription: `${openCount} open ticket${openCount>1?'s':''} • ${priority} • ${sla}`.slice(0,80),
				summary: `Tickets: ${openCount} open; oldest ${oldestDays}d; priority ${priority}; SLA ${sla}; last: ${lastAction} (owner ${owner})`.slice(0,200)
			};
			customer360.cards = customer360.cards || {};
			customer360.cards.ticketsCases = ticketsCard;
		} catch(e){ /* non-fatal */ }

		// For account help wordcloud: derive from accountHealth reasons or knowledge graph titles
		const wordCandidates = [];
		if (customer360.accountHealth?.reasons) wordCandidates.push(...customer360.accountHealth.reasons);
		if (customer360.knowledgeGraph?.primary?.title) wordCandidates.push(customer360.knowledgeGraph.primary.title);
		const wordcloud = Array.from(new Set(wordCandidates.join(' ').split(/\W+/).filter(Boolean))).slice(0, 40);

		// Generate word details via LLM (WORD_DETAILS prompt uses words context)
		if (wordcloud.length) {
			const wordDetailsRaw = await fetchInsights({ customerId, conversationHistory, requestedWidgets: ['WORD_DETAILS'] });
			if (wordDetailsRaw.WORD_DETAILS) insights.wordDetails = wordDetailsRaw.WORD_DETAILS;
		}
		// Compose auto-reply flow when not suppressed: direct answer first, then concise steps
		// Treat common truthy strings as enabling suppression; trim to be robust to spaces in .env
		const SUPPRESS_AUTO = /^(1|true|yes)$/i.test((process.env.SUPPRESS_AUTO_BOT_REPLY || '').trim());
		let botReply = undefined;
		if (!SUPPRESS_AUTO) {
			if (typeof insights.__forceBotReply === 'string' && insights.__forceBotReply) {
				botReply = insights.__forceBotReply;
			} else {
			const prompts = Array.isArray(insights.LIVE_PROMPTS) ? insights.LIVE_PROMPTS : [];
			const empathetic = prompts[0]?.value || prompts[0]?.label || '';
			const liveDraft = insights.LIVE_RESPONSE?.draft || '';
			// Prefer LIVE_RESPONSE; fallback to ServicePedia (V2 or legacy) summary/draft; then NBA opening; then summary
			const spV2 = insights.SERVICE_PEDIA_V2;
			const spLegacy = insights.SERVICE_PEDIA;
			const spDraft = (typeof spV2?.draft === 'string' && spV2.draft) ? spV2.draft
											: (typeof spLegacy?.draft === 'string' && spLegacy.draft) ? spLegacy.draft
											: '';
			const nbOpening = insights.NEXT_BEST_ACTION?.suggestedOpening || '';
			const aiSummary = insights.AI_SUMMARY?.summary || '';
			const best = liveDraft || spDraft || nbOpening || aiSummary || '';
			// If we have anything meaningful, stitch with empathetic opener
			// Gather candidate agent actions (titles) to steer the reply when present
			const actionTitles = Array.isArray(insights.AGENT_NETWORK_ACTIONS?.actions)
				? insights.AGENT_NETWORK_ACTIONS.actions.map(a=>a?.title).filter(Boolean)
				: [];
			// Avoid repeating empathy if the last agent message was recent
			const recentAgent = conversationHistory.slice(-1)[0]?.role === 'agent' ? conversationHistory.slice(-1)[0] : null;
			const shouldAddEmpathy = empathetic && !recentAgent;
			if (best) {
				// If best already reads as an opener (short <= 20 words) and empathetic is similar, avoid duplication
				const looksLikeOpener = (s) => String(s||'').split(/\s+/).length <= 20;
				const useEmpathy = shouldAddEmpathy && !looksLikeOpener(best);
				const candidate = useEmpathy ? `${empathetic}\n\n${best}` : best;
				// Final refinement via LLM for concision + tone
				const customerData = { id: customerId, segment: 'VIP', tenureMonths: 38, ...customerContext };
				botReply = await refineReply({ conversationHistory, draft: candidate, customerId, customerData, actions: actionTitles });
			} else {
				const candidate = empathetic || 'Let me check this and guide you through the steps.';
				const customerData = { id: customerId, segment: 'VIP', tenureMonths: 38, ...customerContext };
				botReply = await refineReply({ conversationHistory, draft: candidate, customerId, customerData, actions: actionTitles });
			}
			}
		}
		const traceId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
		const payload = SUPPRESS_AUTO
			? { customer360, wordcloud, insights, traceId }
			: { customer360, wordcloud, insights, botReply, traceId };
		// persist latest state in memory so front-end can poll
		lastCustomer360.set(customerId, payload);
		if (logger.isDebug) logger.debug('/v1/external-chat result', { customerId, durationMs: Date.now() - start });
		// Broadcast via SSE if subscribers
		const set = sseClients.get(customerId);
		if (set) {
			for (const clientRes of set) {
				try { sendSse(clientRes, payload); } catch(e) { /* ignore */ }
			}
		}
		res.json(payload);
	} catch (err) {
		logger.error('external-chat error', err);
		res.status(500).json({ error: 'Internal' });
	}
});

// Agent (human) sends a reply from Athena desktop UI to customer chat
router.post('/v1/agent-reply', (req, res) => {
	try {
		const { customerId, message } = req.body || {};
		if (!customerId || !message) return res.status(400).json({ error: 'customerId and message required' });
		logger.info('Agent reply sent', { customerId, len: message.length, preview: message.slice(0,120) });
		// Persist agent message in rolling history
		appendConversation(customerId, 'agent', message);
		const traceId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
		const payload = { type: 'agentReply', customerId, message, traceId, ts: Date.now() };
		const set = sseClients.get(customerId);
		if (set) {
			for (const clientRes of set) {
				try { sendSse(clientRes, payload); } catch(_){}
			}
		}
		return res.json({ ok: true, traceId });
	} catch (err) {
		logger.error('agent-reply error', err);
		res.status(500).json({ error: 'Internal' });
	}
});

// GET latest customer360
router.get('/v1/customer-360/:id', (req, res) => {
	const id = req.params.id;
	if (!id) return res.status(400).json({ error: 'id required' });
	const payload = lastCustomer360.get(id);
	if (!payload) return res.status(404).json({ error: 'not found' });
	res.json(payload);
});

export default router;
