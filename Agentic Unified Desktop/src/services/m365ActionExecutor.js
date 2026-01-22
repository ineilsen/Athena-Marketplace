import logger from '../utils/logger.js';
import { callM365Tool } from './m365McpClient.js';
import { resolveTenantSkuByUtterance, extractProvisioningEntitiesFromUtterance } from './m365EntityExtractor.js';

const READ_ONLY_INTENTS = new Set([
	'get_license_counts',
	'license_counts',
	'list_subscribed_skus',
	'check_user_license_assignments',
	'check_license_assignment',
	'verify_license_assignment',
	'get_user_licenses'
]);

function splitLicenseCandidates(raw) {
	if (!raw) return [];
	if (Array.isArray(raw)) {
		return [...new Set(raw.flatMap(splitLicenseCandidates).map(s => s.trim()).filter(Boolean))];
	}
	const s = String(raw).trim();
	if (!s) return [];
	// Common planner formatting: "A,B" or "A, B" or "A and B".
	const parts = s
		.split(/\s*(?:,|;|\/|\||\band\b|\bor\b)\s*/i)
		.map(p => p.trim())
		.filter(Boolean);
	return [...new Set(parts.length ? parts : [s])];
}

function hasCustomerConfirmation(conversationHistory = []) {
	// Look at the most recent customer utterance.
	const lastCustomer = [...(conversationHistory || [])].reverse().find(m => String(m?.role || '').toLowerCase() === 'customer');
	const text = String(lastCustomer?.content || '').toLowerCase();
	if (!text) return false;
	// Simple heuristics for demo confirmation.
	return [
		'yes', 'yep', 'yeah', 'please proceed', 'proceed', 'go ahead', 'ok', 'okay', 'confirm', 'do it', 'please do it'
	].some(tok => text.includes(tok));
}

function parseM365ActionPayload(actionQuery = '') {
	const marker = 'M365_ACTION:';
	const idx = actionQuery.indexOf(marker);
	if (idx === -1) return null;
	const jsonPart = actionQuery.slice(idx + marker.length).trim();
	try {
		return JSON.parse(jsonPart);
	} catch {
		return null;
	}
}

function isReadOnlyIntent(intent) {
	return READ_ONLY_INTENTS.has(String(intent || '').toLowerCase());
}

function normalizeConfidence(ok) {
	return ok ? 0.85 : 0.35;
}

function buildResult({ shortDescription, summary, findings = [], confidence }) {
	return {
		shortDescription: shortDescription || 'Microsoft 365 admin action',
		summary: summary || '',
		findings,
		confidence: confidence ?? 0.6
	};
}

function isToolError(obj) {
	return obj && typeof obj === 'object' && String(obj.error || '').toUpperCase() === 'TOOL_ERROR';
}

function buildToolErrorResult(toolName, toolResp) {
	const msg = String(toolResp?.message || 'Unknown MCP/Graph error');
	const details = toolResp?.details;
	return buildResult({
		shortDescription: 'Microsoft 365 / Graph call failed',
		summary: msg,
		findings: [
			{ label: 'tool', value: toolName },
			...(details ? [{ label: 'details', value: typeof details === 'string' ? details : JSON.stringify(details) }] : []),
			{ label: 'hint', value: 'Check AZURE_TENANT_DOMAIN, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET in Agentic Unified Desktop/.env and ensure Graph app permissions + admin consent.' }
		],
		confidence: 0.2
	});
}

async function resolveSkuIdsByIntent(licenseLabel, subscribedSkus = []) {
	const label = String(licenseLabel || '').trim().toLowerCase();
	if (!label) return [];

	const candidates = subscribedSkus.map(s => ({
		id: s.skuId,
		part: String(s.skuPartNumber || ''),
		status: s.capabilityStatus
	}));

	const patterns = [
		// E3
		{ key: 'e3', re: /ENTERPRISEPACK|O365_E3|SPE_E3|(^|_)E3($|_)/i },
		// E5 (cover common tenant variants beyond SPE_E5)
		{ key: 'e5', re: /SPE_E5|ENTERPRISEPREMIUM|O365_E5|M365[_-]?E5|(^|_)E5($|_)/i },
		// E5 without Teams
		{ key: 'e5_no_teams', re: /NO[_-]?TEAMS|SPE_E5.*NO|SPE_E5_NO|E5.*NO[_-]?TEAMS/i },
		// Teams Enterprise
		{ key: 'teams_enterprise', re: /TEAMS.*ENTERPRISE|TEAMS_ENTERPRISE|TEAMS.*PREMIUM/i }
	];

	let wanted = null;
	if (label === 'e3' || label.includes('microsoft 365 e3') || label.includes('office 365 e3')) wanted = 'e3';
	else if (label === 'e5' || label.includes('microsoft 365 e5') || label.includes('office 365 e5')) wanted = label.includes('no teams') ? 'e5_no_teams' : 'e5';
	else if (label.includes('no teams')) wanted = 'e5_no_teams';
	else if (label.includes('teams enterprise')) wanted = 'teams_enterprise';

	const pat = patterns.find(p => p.key === wanted)?.re;
	if (pat) {
		const hit = candidates.find(c => pat.test(c.part));
		if (hit?.id) return [hit.id];
	}

	// Fallback: try substring match on skuPartNumber
	const token = label.replace(/\s+/g, '_').toUpperCase();
	const hit = candidates.find(c => c.part.toUpperCase().includes(token));
	return hit?.id ? [hit.id] : [];
}

function findSkuByLabel(licenseLabel, subscribedSkus = []) {
	const label = String(licenseLabel || '').trim().toLowerCase();
	if (!label) return null;

	const candidates = subscribedSkus.map(s => ({
		sku: s,
		part: String(s.skuPartNumber || '')
	}));

	const patterns = [
		{ key: 'e3', re: /ENTERPRISEPACK|O365_E3|SPE_E3|(^|_)E3($|_)/i },
		{ key: 'e5', re: /SPE_E5|ENTERPRISEPREMIUM|O365_E5|M365[_-]?E5|(^|_)E5($|_)/i },
		{ key: 'e5_no_teams', re: /NO[_-]?TEAMS|SPE_E5.*NO|SPE_E5_NO|E5.*NO[_-]?TEAMS/i },
		{ key: 'teams_enterprise', re: /TEAMS.*ENTERPRISE|TEAMS_ENTERPRISE|TEAMS.*PREMIUM/i }
	];

	let wanted = null;
	if (label === 'e3' || label.includes('microsoft 365 e3') || label.includes('office 365 e3')) wanted = 'e3';
	else if (label === 'e5' || label.includes('microsoft 365 e5') || label.includes('office 365 e5')) wanted = label.includes('no teams') ? 'e5_no_teams' : 'e5';
	else if (label.includes('no teams')) wanted = 'e5_no_teams';
	else if (label.includes('teams enterprise')) wanted = 'teams_enterprise';

	const pat = patterns.find(p => p.key === wanted)?.re;
	if (pat) {
		const hit = candidates.find(c => pat.test(c.part));
		return hit?.sku || null;
	}

	const token = label.replace(/\s+/g, '_').toUpperCase();
	const hit = candidates.find(c => c.part.toUpperCase().includes(token));
	return hit?.sku || null;
}

function formatSkuCounts(sku) {
	const enabled = Number(sku?.prepaidUnits?.enabled ?? 0);
	const consumed = Number(sku?.consumedUnits ?? 0);
	const remaining = Math.max(0, enabled - consumed);
	return { enabled, consumed, remaining };
}

function buildSkuIdToPartNumberMap(subscribedSkus = []) {
	const map = new Map();
	for (const s of subscribedSkus || []) {
		if (!s) continue;
		const id = s.skuId;
		if (!id) continue;
		map.set(String(id), String(s.skuPartNumber || ''));
	}
	return map;
}

export async function executeM365Action({ actionQuery, conversationHistory, tenantDomain }) {
	const payload = parseM365ActionPayload(actionQuery);
	if (!payload) {
		return buildResult({
			shortDescription: 'Microsoft 365 action parse failed',
			summary: 'Could not parse M365_ACTION payload. Expected: M365_ACTION: {"intent":...}',
			findings: [{ label: 'actionQuery', value: String(actionQuery || '').slice(0, 180) }],
			confidence: 0.25
		});
	}

	const intent = String(payload.intent || '').toLowerCase();

	// NOTE: Confirmation gating intentionally disabled per workspace requirement.

	const upn = payload.upn || payload.userPrincipalName;
	const displayName = payload.displayName;
	const usageLocation = payload.usageLocation || 'GB';

	function looksLikeBadDisplayName(name) {
		const s = String(name || '').trim();
		if (!s) return true;
		const lower = s.toLowerCase();
		if (lower === 'new user' || lower === 'user') return true;
		if (lower.startsWith('new user ')) return true;
		// name should not look like an email
		if (/@/.test(s)) return true;
		return false;
	}

	function sanitizeDisplayName(name) {
		let s = String(name || '').trim();
		if (!s) return '';
		s = s.replace(/^\s*(?:a\s+)?new\s+user\b\s*[-:]*\s*/i, '');
		s = s.replace(/^\s*user\b\s*[-:]*\s*/i, '');
		// Collapse whitespace
		s = s.replace(/\s{2,}/g, ' ').trim();
		return s;
	}

	async function resolveUpnFromName(name) {
		const n = sanitizeDisplayName(name);
		if (!n) return { upn: null, error: 'MISSING_NAME' };
		const matches = await callM365Tool('graph.findUsersByDisplayNamePrefix', { prefix: n });
		if (isToolError(matches)) return { upn: null, error: 'TOOL_ERROR', tool: 'graph.findUsersByDisplayNamePrefix', toolResp: matches };
		const arr = Array.isArray(matches) ? matches : [];
		if (arr.length === 0) return { upn: null, error: 'NO_MATCH' };
		// Prefer exact displayName match when possible, else take the first (prefix search is ordered).
		const exact = arr.find(u => String(u?.displayName || '').toLowerCase() === n.toLowerCase());
		const chosen = exact || arr[0];
		const candidateUpn = chosen?.userPrincipalName || chosen?.mail || chosen?.id || null;
		if (!candidateUpn) return { upn: null, error: 'NO_UPN' };
		// If multiple and not exact, ask for UPN to avoid accidental deletion.
		if (!exact && arr.length > 1) {
			return { upn: null, error: 'MULTIPLE_MATCHES', matches: arr.slice(0, 5).map(u => ({ displayName: u?.displayName, upn: u?.userPrincipalName })) };
		}
		return { upn: String(candidateUpn), chosen: { displayName: chosen?.displayName, upn: chosen?.userPrincipalName } };
	}

	async function resolveUpnFromUtteranceOrPayload({ currentUpn, currentDisplayName }) {
		let effectiveUpn = currentUpn || null;
		let effectiveDisplayName = currentDisplayName || null;
		const utterance = String(payload.utterance || '').trim();
		if (utterance) {
			const extracted = await extractProvisioningEntitiesFromUtterance({ utterance });
			if (extracted) {
				if (!effectiveUpn && extracted.upn) effectiveUpn = extracted.upn;
				if (!effectiveDisplayName && extracted.displayName) effectiveDisplayName = extracted.displayName;
			}
		}
		effectiveDisplayName = sanitizeDisplayName(effectiveDisplayName);
		if (!effectiveUpn && effectiveDisplayName) {
			const resolved = await resolveUpnFromName(effectiveDisplayName);
			if (resolved?.upn) effectiveUpn = resolved.upn;
			else return { upn: null, displayName: effectiveDisplayName, resolutionError: resolved };
		}
		return { upn: effectiveUpn, displayName: effectiveDisplayName };
	}

	try {
		if (tenantDomain) {
			// Pass through tenant domain if MCP server is configured from Athena
			process.env.AZURE_TENANT_DOMAIN = process.env.AZURE_TENANT_DOMAIN || tenantDomain;
		}

		if (intent === 'discover_tenant') {
			const domain = payload.domain || tenantDomain;
			const info = await callM365Tool('graph.discoverTenant', { domain });
			return buildResult({
				shortDescription: 'Tenant discovered',
				summary: `Discovered tenant organizationId=${info?.organizationId || '—'}`,
				findings: [
					{ label: 'displayName', value: info?.displayName || '—' },
					{ label: 'organizationId', value: info?.organizationId || '—' }
				],
				confidence: normalizeConfidence(!!info?.organizationId)
			});
		}

		if (intent === 'get_license_counts' || intent === 'license_counts') {
			const skuLabelRaw = payload.license || payload.sku || payload.skuPartNumber || payload.product;
			const utterance = payload.utterance || skuLabelRaw;
			const skus = await callM365Tool('graph.listSubscribedSkus', {});
			if (isToolError(skus)) return buildToolErrorResult('graph.listSubscribedSkus', skus);
			const arr = Array.isArray(skus) ? skus : [];
			if (!arr.length) {
				return buildResult({
					shortDescription: 'No subscribed SKUs returned',
					summary: 'Microsoft Graph returned 0 subscribed SKUs. This is unusual if the tenant has licenses; check Graph permissions/admin consent and that you are targeting the correct tenant.',
					findings: [
						{ label: 'tool', value: 'graph.listSubscribedSkus' },
						{ label: 'tenantDomain', value: String(process.env.AZURE_TENANT_DOMAIN || '') || '—' },
						{ label: 'hint', value: 'Grant Microsoft Graph Application permissions (Directory.Read.All + Organization.Read.All recommended; SubscribedSku.Read.All if used) and admin-consent the app.' }
					],
					confidence: 0.25
				});
			}
			const candidates = splitLicenseCandidates(skuLabelRaw);
			const sample = arr.slice(0, 12).map(s => String(s?.skuPartNumber || '')).filter(Boolean);

			if (!candidates.length) {
				return buildResult({
					shortDescription: 'No license specified',
					summary: 'Provide a license label like “Microsoft 365 E5”.',
					findings: [
						{ label: 'tenantSkuCount', value: String(arr.length) },
						{ label: 'tenantSkuSample', value: sample.length ? sample.join(', ') : '—' }
					],
					confidence: 0.35
				});
			}

			const results = [];
			const missing = [];
			let fuzzyNote = null;

			for (const label of candidates) {
				let sku = findSkuByLabel(label, arr);
				if (!sku && utterance) {
					const resolved = await resolveTenantSkuByUtterance({ utterance: label, subscribedSkus: arr });
					if (resolved?.skuPartNumber) {
						sku = arr.find(s => String(s?.skuPartNumber || '') === resolved.skuPartNumber) || null;
						fuzzyNote = `LLM resolved skuPartNumber=${resolved.skuPartNumber} confidence=${resolved.confidence}`;
					}
				}
				if (!sku) {
					missing.push(label);
					continue;
				}
				const { enabled, consumed, remaining } = formatSkuCounts(sku);
				results.push({ label, skuPartNumber: String(sku?.skuPartNumber || ''), enabled, consumed, remaining });
			}

			if (!results.length) {
				const llmConfigured = !!(process.env.ENDPOINT_URL || process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_API_BASE) && !!(process.env.DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT_NAME) && !!(process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
				fuzzyNote = fuzzyNote || (llmConfigured ? 'LLM fuzzy mapping did not return a confident match' : 'LLM not configured; fuzzy mapping unavailable');
				return buildResult({
					shortDescription: 'License not found',
					summary: `Could not find a subscribed SKU matching “${candidates.join(', ')}”.`,
					findings: [
						{ label: 'requested', value: String(skuLabelRaw || '—') },
						{ label: 'tenantSkuCount', value: String(arr.length) },
						{ label: 'tenantSkuSample', value: sample.length ? sample.join(', ') : '—' },
						{ label: 'fuzzyMapping', value: fuzzyNote },
						{ label: 'hint', value: 'Try: Microsoft 365 E5, Microsoft 365 E3, Microsoft 365 E5 (no Teams), Microsoft Teams Enterprise' },
						{ label: 'hint2', value: 'If your tenant uses different SKU names, use list_subscribed_skus or ensure LLM is configured for fuzzy mapping.' }
					],
					confidence: 0.4
				});
			}

			const lines = results.map(r => `${r.skuPartNumber}: ${r.enabled} total, ${r.consumed} assigned, ${r.remaining} available`);
			const summary = `License availability: ${lines.join(' | ')}`;
			return buildResult({
				shortDescription: 'License counts',
				summary,
				findings: [
					...results.map(r => ({ label: r.skuPartNumber || r.label, value: `${r.enabled} total, ${r.consumed} assigned, ${r.remaining} available` })),
					...(missing.length ? [{ label: 'notFound', value: missing.join(', ') }] : []),
					...(fuzzyNote ? [{ label: 'fuzzyMapping', value: fuzzyNote }] : [])
				],
				confidence: normalizeConfidence(true)
			});
		}

		if (intent === 'list_subscribed_skus') {
			const skus = await callM365Tool('graph.listSubscribedSkus', {});
			if (isToolError(skus)) return buildToolErrorResult('graph.listSubscribedSkus', skus);
			const arr = Array.isArray(skus) ? skus : [];
			// Keep the summary compact; provide details in findings.
			return buildResult({
				shortDescription: 'Subscribed SKUs',
				summary: `Found ${arr.length} subscribed SKUs in the tenant.`,
				findings: arr.slice(0, 25).map(s => {
					const { enabled, consumed, remaining } = formatSkuCounts(s);
					return {
						label: String(s?.skuPartNumber || 'SKU'),
						value: `${enabled} total, ${consumed} assigned, ${remaining} available`
					};
				}),
				confidence: normalizeConfidence(true)
			});
		}

		if (intent === 'check_user_license_assignments' || intent === 'check_license_assignment' || intent === 'verify_license_assignment' || intent === 'get_user_licenses') {
			let resolvedUpn = upn;
			if (!resolvedUpn) {
				const name = String(displayName || '').trim();
				if (!name) {
					return buildResult({
						shortDescription: 'Missing required fields',
						summary: 'Need a user identifier to check license assignment (upn or displayName).',
						findings: [
							{ label: 'upn', value: 'missing' },
							{ label: 'displayName', value: 'missing' },
							{ label: 'hint', value: 'Use a UPN like alans@yourtenant.onmicrosoft.com for unambiguous results.' }
						],
						confidence: 0.4
					});
				}
				const hits = await callM365Tool('graph.findUsersByDisplayNamePrefix', { displayNamePrefix: name, top: 5 });
				if (isToolError(hits)) return buildToolErrorResult('graph.findUsersByDisplayNamePrefix', hits);
				const arr = Array.isArray(hits) ? hits : [];
				if (arr.length === 0) {
					return buildResult({
						shortDescription: 'User not found',
						summary: `Could not find any user whose displayName starts with “${name}”.`,
						findings: [{ label: 'displayNamePrefix', value: name }],
						confidence: 0.35
					});
				}
				if (arr.length > 1) {
					return buildResult({
						shortDescription: 'Multiple users match',
						summary: `Multiple users match “${name}”. Please specify the exact UPN.`,
						findings: arr.slice(0, 5).map(u => ({ label: u?.displayName || 'user', value: u?.userPrincipalName || u?.id || '—' })),
						confidence: 0.45
					});
				}
				resolvedUpn = arr[0]?.userPrincipalName;
				if (!resolvedUpn) {
					return buildResult({
						shortDescription: 'User lookup incomplete',
						summary: 'Found a matching user but could not determine userPrincipalName; please use UPN.',
						findings: [{ label: 'displayNamePrefix', value: name }],
						confidence: 0.35
					});
				}
			}

			const user = await callM365Tool('graph.getUserLicenses', { userIdOrUpn: resolvedUpn });
			if (isToolError(user)) return buildToolErrorResult('graph.getUserLicenses', user);

			const skus = await callM365Tool('graph.listSubscribedSkus', {});
			if (isToolError(skus)) return buildToolErrorResult('graph.listSubscribedSkus', skus);
			const skuArr = Array.isArray(skus) ? skus : [];
			const skuIdToPart = buildSkuIdToPartNumberMap(skuArr);

			const assigned = Array.isArray(user?.assignedLicenses) ? user.assignedLicenses : [];
			const states = Array.isArray(user?.licenseAssignmentStates) ? user.licenseAssignmentStates : [];
			const assignedSkuIds = assigned.map(a => String(a?.skuId || '')).filter(Boolean);
			const assignedPartNumbers = assignedSkuIds
				.map(id => ({ skuId: id, skuPartNumber: skuIdToPart.get(id) || '' }))
				.sort((a, b) => String(a.skuPartNumber || a.skuId).localeCompare(String(b.skuPartNumber || b.skuId)));

			const list = assignedPartNumbers.length
				? assignedPartNumbers.map(x => x.skuPartNumber || x.skuId)
				: [];

			const hasErrors = states.some(s => String(s?.state || '').toLowerCase() === 'error');
			const summary = list.length
				? `License assignment for ${user?.userPrincipalName || resolvedUpn}: ${list.join(', ')}`
				: `License assignment for ${user?.userPrincipalName || resolvedUpn}: none`;

			return buildResult({
				shortDescription: 'License assignment checked',
				summary,
				findings: [
					{ label: 'upn', value: user?.userPrincipalName || resolvedUpn },
					{ label: 'displayName', value: user?.displayName || '—' },
					{ label: 'accountEnabled', value: String(user?.accountEnabled ?? '—') },
					{ label: 'usageLocation', value: String(user?.usageLocation || '—') },
					{ label: 'assignedLicenses', value: list.length ? list.join(', ') : 'none' },
					...(hasErrors ? [{ label: 'licenseAssignmentStates', value: JSON.stringify(states.slice(0, 10)) }] : [])
				],
				confidence: normalizeConfidence(true)
			});
		}

		if (intent === 'create_user') {
			let effectiveUpn = upn;
			let effectiveDisplayName = displayName;
			let effectiveUsageLocation = usageLocation;
			let requestedLicense = payload.license || payload.sku || payload.skuPartNumber || null;

			// LLM-based extraction: improve accuracy for names and optional fields.
			// Trigger when displayName is missing or looks like an artifact (e.g., "new user Anushka Sen").
			const utterance = String(payload.utterance || '').trim();
			if (utterance && (!effectiveUpn || looksLikeBadDisplayName(effectiveDisplayName))) {
				const extracted = await extractProvisioningEntitiesFromUtterance({ utterance });
				if (extracted) {
					if (!effectiveUpn && extracted.upn) effectiveUpn = extracted.upn;
					if ((!effectiveDisplayName || looksLikeBadDisplayName(effectiveDisplayName)) && extracted.displayName) {
						effectiveDisplayName = extracted.displayName;
					}
					if ((!effectiveUsageLocation || effectiveUsageLocation === 'GB') && extracted.usageLocation) {
						effectiveUsageLocation = extracted.usageLocation;
					}
					if (!requestedLicense && extracted.license) requestedLicense = extracted.license;
				}
			}

			effectiveDisplayName = sanitizeDisplayName(effectiveDisplayName);

			if (!effectiveUpn || !effectiveDisplayName) {
				const missing = [];
				if (!effectiveUpn) missing.push('UPN (email)');
				if (!effectiveDisplayName) missing.push('display name (full name)');
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: `Need ${missing.join(' and ')} to create a user. Ask the customer to provide: "Full Name (upn@domain)".`,
					findings: [
						{ label: 'upn', value: effectiveUpn ? 'provided' : 'missing' },
						{ label: 'displayName', value: effectiveDisplayName ? 'provided' : 'missing' },
						{ label: 'example', value: 'Add user: Anushka Sen (anushkas@CRMbc395940.OnMicrosoft.com)' }
					],
					confidence: 0.4
				});
			}
			const created = await callM365Tool('graph.createUser', {
				userPrincipalName: effectiveUpn,
				displayName: effectiveDisplayName,
				usageLocation: effectiveUsageLocation || 'GB'
			});
			if (isToolError(created)) return buildToolErrorResult('graph.createUser', created);

			// Optional: assign a license immediately after create, if provided.
			let assigned = null;
			if (requestedLicense) {
				const skus = await callM365Tool('graph.listSubscribedSkus', {});
				if (isToolError(skus)) return buildToolErrorResult('graph.listSubscribedSkus', skus);
				const skuArr = Array.isArray(skus) ? skus : [];
				let addSkuIds = [];
				const candidates = splitLicenseCandidates(requestedLicense);
				for (const candidate of candidates) {
					let ids = await resolveSkuIdsByIntent(candidate, skuArr);
					if (!ids.length) {
						const resolved = await resolveTenantSkuByUtterance({ utterance: candidate, subscribedSkus: skuArr });
						if (resolved?.skuPartNumber) {
							const hit = skuArr.find(s => String(s?.skuPartNumber || '') === resolved.skuPartNumber);
							if (hit?.skuId) ids = [hit.skuId];
						}
					}
					if (ids.length) { addSkuIds = ids; break; }
				}
				if (addSkuIds.length) {
					assigned = await callM365Tool('graph.assignLicense', { userIdOrUpn: effectiveUpn, addSkuIds, removeSkuIds: [] });
					if (isToolError(assigned)) return buildToolErrorResult('graph.assignLicense', assigned);
				}
			}
			return buildResult({
				shortDescription: 'User created',
				summary: `Created ${created?.userPrincipalName || effectiveUpn}${requestedLicense ? ' and attempted license assignment' : ''}`,
				findings: [
					{ label: 'userId', value: created?.id || '—' },
					{ label: 'upn', value: created?.userPrincipalName || effectiveUpn },
					{ label: 'displayName', value: created?.displayName || effectiveDisplayName },
					{ label: 'usageLocation', value: created?.usageLocation || effectiveUsageLocation || 'GB' },
					...(requestedLicense ? [{ label: 'requestedLicense', value: String(requestedLicense) }] : []),
					...(assigned ? [{ label: 'licenseAssignment', value: 'ok' }] : (requestedLicense ? [{ label: 'licenseAssignment', value: 'not assigned (no matching SKU)' }] : []))
				],
				confidence: normalizeConfidence(!!created?.id)
			});
		}

		if (intent === 'disable_user') {
			const resolved = await resolveUpnFromUtteranceOrPayload({ currentUpn: upn, currentDisplayName: displayName });
			const effectiveUpn = resolved?.upn;
			if (!effectiveUpn) {
				const reason = resolved?.resolutionError?.error;
				if (reason === 'MULTIPLE_MATCHES') {
					return buildResult({
						shortDescription: 'User resolution ambiguous',
						summary: 'Multiple users match that display name. Please provide the exact UPN/email to disable the correct user.',
						findings: [
							{ label: 'displayName', value: resolved?.displayName || '—' },
							{ label: 'matches', value: JSON.stringify(resolved?.resolutionError?.matches || []) }
						],
						confidence: 0.35
					});
				}
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need UPN/email to disable a user. Ask the customer for the exact UPN (or provide "Full Name (upn@domain)").',
					findings: [
						{ label: 'upn', value: 'missing' },
						...(resolved?.displayName ? [{ label: 'displayName', value: resolved.displayName }] : []),
						{ label: 'example', value: 'Disable user: Alan Smith (alans@CRMbc395940.OnMicrosoft.com)' }
					],
					confidence: 0.4
				});
			}
			const resp = await callM365Tool('graph.disableUser', { userIdOrUpn: effectiveUpn });
			if (isToolError(resp)) return buildToolErrorResult('graph.disableUser', resp);
			return buildResult({
				shortDescription: 'User disabled',
				summary: `Disabled ${effectiveUpn}`,
				findings: [{ label: 'upn', value: effectiveUpn }],
				confidence: 0.85
			});
		}

		if (intent === 'delete_user') {
			const resolved = await resolveUpnFromUtteranceOrPayload({ currentUpn: upn, currentDisplayName: displayName });
			const effectiveUpn = resolved?.upn;
			if (!effectiveUpn) {
				const reason = resolved?.resolutionError?.error;
				if (reason === 'MULTIPLE_MATCHES') {
					return buildResult({
						shortDescription: 'User resolution ambiguous',
						summary: 'Multiple users match that display name. Please provide the exact UPN/email to delete the correct user.',
						findings: [
							{ label: 'displayName', value: resolved?.displayName || '—' },
							{ label: 'matches', value: JSON.stringify(resolved?.resolutionError?.matches || []) }
						],
						confidence: 0.3
					});
				}
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need UPN/email to delete a user. Ask the customer for the exact UPN (or provide "Full Name (upn@domain)").',
					findings: [
						{ label: 'upn', value: 'missing' },
						...(resolved?.displayName ? [{ label: 'displayName', value: resolved.displayName }] : []),
						{ label: 'example', value: 'Delete user: Alan Smith (alans@CRMbc395940.OnMicrosoft.com)' }
					],
					confidence: 0.4
				});
			}
			const resp = await callM365Tool('graph.deleteUser', { userIdOrUpn: effectiveUpn });
			if (isToolError(resp)) return buildToolErrorResult('graph.deleteUser', resp);
			return buildResult({
				shortDescription: 'User deleted',
				summary: `Deleted ${effectiveUpn}`,
				findings: [{ label: 'upn', value: effectiveUpn }],
				confidence: 0.85
			});
		}

		if (intent === 'update_user') {
			const resolved = await resolveUpnFromUtteranceOrPayload({ currentUpn: upn, currentDisplayName: displayName });
			const effectiveUpn = resolved?.upn;
			if (!effectiveUpn) {
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need UPN/email to update a user. Ask the customer for the exact UPN (or provide "Full Name (upn@domain)").',
					findings: [
						{ label: 'upn', value: 'missing' },
						...(resolved?.displayName ? [{ label: 'displayName', value: resolved.displayName }] : [])
					],
					confidence: 0.4
				});
			}
			const patch = payload.patch;
			if (!patch || typeof patch !== 'object') {
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need patch object to update user (e.g., {"usageLocation":"GB"}).',
					findings: [{ label: 'patch', value: 'missing' }],
					confidence: 0.4
				});
			}
			const resp = await callM365Tool('graph.updateUser', { userIdOrUpn: effectiveUpn, patch });
			if (isToolError(resp)) return buildToolErrorResult('graph.updateUser', resp);
			return buildResult({
				shortDescription: 'User updated',
				summary: `Updated ${effectiveUpn}`,
				findings: [{ label: 'upn', value: effectiveUpn }, { label: 'patch', value: JSON.stringify(patch) }],
				confidence: 0.85
			});
		}

		if (intent === 'assign_license') {
			if (!upn) {
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need upn to assign a license.',
					findings: [{ label: 'upn', value: 'missing' }],
					confidence: 0.4
				});
			}
			const skuLabelRaw = payload.license || payload.sku || payload.skuPartNumber;
			if (!skuLabelRaw) {
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need a license label (e.g., “Microsoft 365 E5”) to assign a license.',
					findings: [
						{ label: 'upn', value: upn },
						{ label: 'license', value: 'missing' },
						{ label: 'hint', value: 'Specify license like “Microsoft 365 E5” or run list_subscribed_skus.' }
					],
					confidence: 0.4
				});
			}
			const candidates = splitLicenseCandidates(skuLabelRaw);
			if (!candidates.length) {
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need a license label (e.g., “Microsoft 365 E5”) to assign a license.',
					findings: [
						{ label: 'upn', value: upn },
						{ label: 'license', value: 'missing' }
					],
					confidence: 0.4
				});
			}
			const skus = await callM365Tool('graph.listSubscribedSkus', {});
			if (isToolError(skus)) return buildToolErrorResult('graph.listSubscribedSkus', skus);
			const skuArr = Array.isArray(skus) ? skus : [];
			let addSkuIds = [];
			let chosenLabel = null;
			for (const candidate of candidates) {
				let ids = await resolveSkuIdsByIntent(candidate, skuArr);
				if (!ids.length) {
					const resolved = await resolveTenantSkuByUtterance({ utterance: candidate, subscribedSkus: skuArr });
					if (resolved?.skuPartNumber) {
						const hit = skuArr.find(s => String(s?.skuPartNumber || '') === resolved.skuPartNumber);
						if (hit?.skuId) ids = [hit.skuId];
					}
				}
				if (ids.length) {
					addSkuIds = ids;
					chosenLabel = candidate;
					break;
				}
			}
			if (!addSkuIds.length) {
				return buildResult({
					shortDescription: 'License not found',
					summary: `Could not resolve any of these licenses to a subscribed SKU in this tenant: “${candidates.join(', ')}”.`,
					findings: [
						{ label: 'requested', value: candidates.join(', ') },
						{ label: 'hint', value: 'Check tenant subscribed SKUs and update mapping.' }
					],
					confidence: 0.35
				});
			}
			const resp = await callM365Tool('graph.assignLicense', { userIdOrUpn: upn, addSkuIds, removeSkuIds: [] });
			if (isToolError(resp)) return buildToolErrorResult('graph.assignLicense', resp);
			return buildResult({
				shortDescription: 'License assigned',
				summary: `Assigned license to ${upn}${chosenLabel ? ` (selected: ${chosenLabel})` : ''}`,
				findings: [
					{ label: 'upn', value: upn },
					{ label: 'addSkuIds', value: addSkuIds.join(',') },
					{ label: 'status', value: resp?.id ? 'updated' : 'ok' }
				],
				confidence: 0.8
			});
		}

		return buildResult({
			shortDescription: 'Unsupported M365 intent',
			summary: `Intent “${intent}” not implemented yet.`,
			findings: [{ label: 'intent', value: intent }],
			confidence: 0.3
		});
	} catch (e) {
		logger.error('executeM365Action error', { message: e.message });
		return buildResult({
			shortDescription: 'Microsoft 365 action failed',
			summary: e.message,
			findings: [{ label: 'error', value: e.message }],
			confidence: 0.25
		});
	}
}
