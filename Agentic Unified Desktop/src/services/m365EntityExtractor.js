import logger from '../utils/logger.js';
import { runUtilityLLMJson } from './llmOrchestrator.js';

function normalizeCandidates(subscribedSkus = []) {
	return (Array.isArray(subscribedSkus) ? subscribedSkus : [])
		.map(s => {
			const enabled = Number(s?.prepaidUnits?.enabled ?? 0);
			const consumed = Number(s?.consumedUnits ?? 0);
			return {
				skuPartNumber: String(s?.skuPartNumber || ''),
				enabled,
				consumed
			};
		})
		.filter(c => c.skuPartNumber);
}

export async function resolveTenantSkuByUtterance({ utterance, subscribedSkus }) {
	const text = String(utterance || '').trim();
	const candidates = normalizeCandidates(subscribedSkus);
	if (!text || candidates.length === 0) return null;

	// Limit payload size; sort to surface likely paid SKUs first.
	const top = [...candidates]
		.sort((a, b) => (b.enabled - a.enabled) || a.skuPartNumber.localeCompare(b.skuPartNumber))
		.slice(0, 60);

	const prompt = [
		'You are mapping a user request about Microsoft licensing to a tenant SKU.',
		'',
		'Task:',
		'- Choose the single best matching skuPartNumber from the provided candidates.',
		'- Prefer Microsoft 365 / Office 365 E3/E5 SKUs when the user says E3/E5.',
		'- If the user says "no Teams" or "without Teams", prefer NO_TEAMS variants.',
		'- If there is no good match, return skuPartNumber as an empty string.',
		'',
		'User utterance:',
		text,
		'',
		'Candidates (skuPartNumber + counts):',
		JSON.stringify(top),
		'',
		'Return ONLY minified JSON with keys:',
		'{"skuPartNumber":"","confidence":0-1,"reason":""}'
	].join('\n');

	try {
		const out = await runUtilityLLMJson({ prompt, temperature: 0.0 });
		const skuPartNumber = String(out?.skuPartNumber || '').trim();
		const confidence = Number(out?.confidence ?? 0);
		if (!skuPartNumber) return null;
		if (!Number.isFinite(confidence) || confidence < 0.45) {
			if (logger.isDebug) logger.debug('resolveTenantSkuByUtterance low confidence', { skuPartNumber, confidence });
			return null;
		}
		return { skuPartNumber, confidence, reason: String(out?.reason || '') };
	} catch (e) {
		logger.warn('resolveTenantSkuByUtterance failed', { message: e.message });
		return null;
	}
}

export async function extractProvisioningEntitiesFromUtterance({ utterance }) {
	const text = String(utterance || '').trim();
	if (!text) return null;

	const prompt = [
		'Extract Microsoft 365 provisioning entities from a support-agent instruction.',
		'User utterance:',
		text,
		'',
		'Return ONLY minified JSON with keys:',
		'{"upn":"","displayName":"","usageLocation":"","license":""}',
		'Rules:',
		'- upn must be an email-like UPN if present; otherwise empty string.',
		'- usageLocation should be a 2-letter country code (e.g., GB) if present; otherwise empty string.',
		'- license should be a product label like "Microsoft 365 E5" if present; otherwise empty string.'
	].join('\n');

	try {
		const out = await runUtilityLLMJson({ prompt, temperature: 0.0 });
		if (!out || typeof out !== 'object') return null;
		return {
			upn: String(out.upn || '').trim(),
			displayName: String(out.displayName || '').trim(),
			usageLocation: String(out.usageLocation || '').trim().toUpperCase(),
			license: String(out.license || '').trim()
		};
	} catch (e) {
		logger.warn('extractProvisioningEntitiesFromUtterance failed', { message: e.message });
		return null;
	}
}
