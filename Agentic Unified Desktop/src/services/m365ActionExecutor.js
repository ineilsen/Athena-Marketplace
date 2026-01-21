import logger from '../utils/logger.js';
import { callM365Tool } from './m365McpClient.js';

const READ_ONLY_INTENTS = new Set([
	'get_license_counts',
	'license_counts',
	'list_subscribed_skus'
]);

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

async function resolveSkuIdsByIntent(licenseLabel, subscribedSkus = []) {
	const label = String(licenseLabel || '').trim().toLowerCase();
	if (!label) return [];

	const candidates = subscribedSkus.map(s => ({
		id: s.skuId,
		part: String(s.skuPartNumber || ''),
		status: s.capabilityStatus
	}));

	const patterns = [
		{ key: 'e3', re: /ENTERPRISEPACK|O365_E3|SPE_E3/i },
		{ key: 'e5', re: /SPE_E5|ENTERPRISEPREMIUM/i },
		{ key: 'e5_no_teams', re: /NO_TEAMS|SPE_E5.*NO|SPE_E5_NO/i },
		{ key: 'teams_enterprise', re: /TEAMS.*ENTERPRISE|TEAMS_ENTERPRISE/i }
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
		{ key: 'e3', re: /ENTERPRISEPACK|O365_E3|SPE_E3/i },
		{ key: 'e5', re: /SPE_E5|ENTERPRISEPREMIUM/i },
		{ key: 'e5_no_teams', re: /NO_TEAMS|SPE_E5.*NO|SPE_E5_NO/i },
		{ key: 'teams_enterprise', re: /TEAMS.*ENTERPRISE|TEAMS_ENTERPRISE/i }
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

	// Gate on customer confirmation for change actions; allow read-only queries.
	if (!isReadOnlyIntent(intent) && !hasCustomerConfirmation(conversationHistory)) {
		return buildResult({
			shortDescription: 'Awaiting customer confirmation',
			summary: 'Customer has not confirmed yet. Ask the customer to confirm before executing Microsoft 365 changes.',
			findings: [{ label: 'required', value: 'Customer confirmation (e.g., “yes, proceed”)' }],
			confidence: 0.5
		});
	}

	const upn = payload.upn || payload.userPrincipalName;
	const displayName = payload.displayName;
	const usageLocation = payload.usageLocation || 'GB';

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
			const skuLabel = payload.license || payload.sku || payload.skuPartNumber || payload.product;
			const skus = await callM365Tool('graph.listSubscribedSkus', {});
			const arr = Array.isArray(skus) ? skus : [];
			const sku = skuLabel ? findSkuByLabel(skuLabel, arr) : null;
			if (!sku) {
				return buildResult({
					shortDescription: 'License not found',
					summary: skuLabel
						? `Could not find a subscribed SKU matching “${skuLabel}”.`
						: 'No license specified; provide a license label like “Microsoft 365 E5”.',
					findings: [
						{ label: 'requested', value: String(skuLabel || '—') },
						{ label: 'hint', value: 'Try: Microsoft 365 E5, Microsoft 365 E3, Microsoft 365 E5 (no Teams), Microsoft Teams Enterprise' }
					],
					confidence: 0.4
				});
			}
			const { enabled, consumed, remaining } = formatSkuCounts(sku);
			const part = String(sku?.skuPartNumber || '');
			return buildResult({
				shortDescription: 'License counts',
				summary: `Microsoft 365 licenses for ${part}: ${enabled} total, ${consumed} assigned, ${remaining} available.`,
				findings: [
					{ label: 'skuPartNumber', value: part || '—' },
					{ label: 'totalEnabled', value: String(enabled) },
					{ label: 'assignedConsumed', value: String(consumed) },
					{ label: 'availableRemaining', value: String(remaining) }
				],
				confidence: normalizeConfidence(true)
			});
		}

		if (intent === 'list_subscribed_skus') {
			const skus = await callM365Tool('graph.listSubscribedSkus', {});
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

		if (intent === 'create_user') {
			if (!upn || !displayName) {
				return buildResult({
					shortDescription: 'Missing required fields',
					summary: 'Need upn and displayName to create a user.',
					findings: [
						{ label: 'upn', value: upn ? 'provided' : 'missing' },
						{ label: 'displayName', value: displayName ? 'provided' : 'missing' }
					],
					confidence: 0.4
				});
			}
			const created = await callM365Tool('graph.createUser', {
				userPrincipalName: upn,
				displayName,
				usageLocation
			});
			return buildResult({
				shortDescription: 'User created',
				summary: `Created ${created?.userPrincipalName || upn}`,
				findings: [
					{ label: 'userId', value: created?.id || '—' },
					{ label: 'upn', value: created?.userPrincipalName || upn },
					{ label: 'displayName', value: created?.displayName || displayName }
				],
				confidence: normalizeConfidence(!!created?.id)
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
			const skuLabel = payload.license || payload.sku || payload.skuPartNumber;
			const skus = await callM365Tool('graph.listSubscribedSkus', {});
			const addSkuIds = await resolveSkuIdsByIntent(skuLabel, Array.isArray(skus) ? skus : []);
			if (!addSkuIds.length) {
				return buildResult({
					shortDescription: 'License not found',
					summary: `Could not resolve license “${skuLabel}” to a subscribed SKU in this tenant.`,
					findings: [
						{ label: 'requested', value: String(skuLabel || '—') },
						{ label: 'hint', value: 'Check tenant subscribed SKUs and update mapping.' }
					],
					confidence: 0.35
				});
			}
			const resp = await callM365Tool('graph.assignLicense', { userIdOrUpn: upn, addSkuIds, removeSkuIds: [] });
			return buildResult({
				shortDescription: 'License assigned',
				summary: `Assigned license to ${upn}`,
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
