import axios from 'axios';
import crypto from 'crypto';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

function requireEnv(name) {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required env var: ${name}`);
	return value;
}

function isTruthy(v) {
	return /^(1|true|yes)$/i.test(String(v ?? '').trim());
}

function redactSecrets(obj) {
	if (!obj || typeof obj !== 'object') return obj;
	const clone = Array.isArray(obj) ? [] : {};
	for (const [k, v] of Object.entries(obj)) {
		if (/secret|password|token/i.test(k)) {
			clone[k] = '***REDACTED***';
			continue;
		}
		clone[k] = (v && typeof v === 'object') ? redactSecrets(v) : v;
	}
	return clone;
}

function makeMsalClient(authority) {
	const clientId = requireEnv('AZURE_CLIENT_ID');
	const clientSecret = requireEnv('AZURE_CLIENT_SECRET');
	return new ConfidentialClientApplication({
		auth: { clientId, authority, clientSecret },
		system: { loggerOptions: { loggerCallback: () => {}, piiLoggingEnabled: false } }
	});
}

async function getGraphToken({ tenantDomain }) {
	const authority = `https://login.microsoftonline.com/${encodeURIComponent(tenantDomain)}`;
	const app = makeMsalClient(authority);
	const resp = await app.acquireTokenByClientCredential({
		scopes: ['https://graph.microsoft.com/.default']
	});
	if (!resp?.accessToken) throw new Error('Failed to acquire Graph access token');
	return resp.accessToken;
}

function graphBase() {
	return (process.env.GRAPH_API_BASE || 'https://graph.microsoft.com/v1.0').replace(/\/+$/, '');
}

async function graphGet(path, accessToken) {
	const url = `${graphBase()}${path}`;
	const resp = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
	return resp.data;
}

async function graphPost(path, body, accessToken) {
	const url = `${graphBase()}${path}`;
	const resp = await axios.post(url, body, { headers: { Authorization: `Bearer ${accessToken}` } });
	return resp.data;
}

async function graphPatch(path, body, accessToken) {
	const url = `${graphBase()}${path}`;
	const resp = await axios.patch(url, body, { headers: { Authorization: `Bearer ${accessToken}` } });
	return resp.data;
}

function normalizeUpn(userIdOrUpn) {
	if (!userIdOrUpn || typeof userIdOrUpn !== 'string') throw new Error('userIdOrUpn is required');
	return userIdOrUpn.trim();
}

function generateTempPassword() {
	// Reasonable demo password generator; do NOT log this value.
	return crypto.randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g, 'A').slice(0, 16) + '1!';
}

const server = new Server(
	{ name: 'm365-admin-mcp', version: '0.1.0' },
	{ capabilities: { tools: { listChanged: true } } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'graph.discoverTenant',
				description: 'Discover tenant GUID and org info using a verified domain (client-credentials).',
				inputSchema: {
					type: 'object',
					properties: { domain: { type: 'string' } },
					required: ['domain']
				}
			},
			{
				name: 'graph.listSubscribedSkus',
				description: 'List subscribed SKUs for the configured tenant.',
				inputSchema: { type: 'object', properties: {} }
			},
			{
				name: 'graph.getUser',
				description: 'Get a user by UPN or id.',
				inputSchema: {
					type: 'object',
					properties: { userIdOrUpn: { type: 'string' } },
					required: ['userIdOrUpn']
				}
			},
			{
				name: 'graph.createUser',
				description: 'Create a user (password may be supplied; otherwise generated).',
				inputSchema: {
					type: 'object',
					properties: {
						userPrincipalName: { type: 'string' },
						displayName: { type: 'string' },
						usageLocation: { type: 'string' },
						passwordProfile: {
							type: 'object',
							properties: {
								password: { type: 'string' },
								forceChangePasswordNextSignIn: { type: 'boolean' }
							}
						}
					},
					required: ['userPrincipalName', 'displayName', 'usageLocation']
				}
			},
			{
				name: 'graph.updateUser',
				description: 'Patch user properties using a partial update object.',
				inputSchema: {
					type: 'object',
					properties: {
						userIdOrUpn: { type: 'string' },
						patch: { type: 'object' }
					},
					required: ['userIdOrUpn', 'patch']
				}
			},
			{
				name: 'graph.disableUser',
				description: 'Disable a user (accountEnabled=false).',
				inputSchema: {
					type: 'object',
					properties: { userIdOrUpn: { type: 'string' } },
					required: ['userIdOrUpn']
				}
			},
			{
				name: 'graph.assignLicense',
				description: 'Assign or remove licenses for a user (Graph assignLicense).',
				inputSchema: {
					type: 'object',
					properties: {
						userIdOrUpn: { type: 'string' },
						addSkuIds: { type: 'array', items: { type: 'string' } },
						removeSkuIds: { type: 'array', items: { type: 'string' } }
					},
					required: ['userIdOrUpn']
				}
			},
			{
				name: 'm365admin.supportQuery',
				description: 'Stub: answer admin.microsoft.com support queries (requires your OpenAPI details).',
				inputSchema: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] }
			},
			{
				name: 'm365admin.searchAgentsByTitle',
				description: 'Stub: list admin agents matching title (requires your OpenAPI details).',
				inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] }
			},
			{
				name: 'm365admin.getAgent',
				description: 'Stub: get admin agent details by id (requires your OpenAPI details).',
				inputSchema: { type: 'object', properties: { agentId: { type: 'string' } }, required: ['agentId'] }
			},
			{
				name: 'm365admin.assignAgent',
				description: 'Stub: assign an admin agent to user/org (requires your OpenAPI details).',
				inputSchema: {
					type: 'object',
					properties: { agentId: { type: 'string' }, scope: { type: 'string' } },
					required: ['agentId', 'scope']
				}
			}
		]
	};
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
	const tenantDomain = process.env.AZURE_TENANT_DOMAIN || process.env.M365_TENANT_DOMAIN;
	try {
		const { name, arguments: args } = req.params;
		if (name === 'graph.discoverTenant') {
			const domain = args?.domain;
			if (!domain) throw new Error('domain is required');
			const token = await getGraphToken({ tenantDomain: domain });
			const org = await graphGet('/organization?$select=id,displayName,verifiedDomains', token);
			const first = org?.value?.[0] || {};
			return { content: [{ type: 'text', text: JSON.stringify({
				organizationId: first.id,
				displayName: first.displayName,
				verifiedDomains: first.verifiedDomains
			}) }] };
		}

		if (!tenantDomain) {
						throw new Error('Missing AZURE_TENANT_DOMAIN (e.g. your-tenant.onmicrosoft.com)');
		}
		const token = await getGraphToken({ tenantDomain });

		switch (name) {
			case 'graph.listSubscribedSkus': {
				const data = await graphGet('/subscribedSkus', token);
				return { content: [{ type: 'text', text: JSON.stringify(data?.value || []) }] };
			}
			case 'graph.getUser': {
				const userIdOrUpn = normalizeUpn(args?.userIdOrUpn);
				const data = await graphGet(`/users/${encodeURIComponent(userIdOrUpn)}?$select=id,displayName,userPrincipalName,accountEnabled,usageLocation`, token);
				return { content: [{ type: 'text', text: JSON.stringify(data) }] };
			}
			case 'graph.createUser': {
				const userPrincipalName = normalizeUpn(args?.userPrincipalName);
				const displayName = String(args?.displayName || '').trim();
				const usageLocation = String(args?.usageLocation || '').trim().toUpperCase();
				if (!displayName) throw new Error('displayName is required');
				if (!usageLocation) throw new Error('usageLocation is required');
				const suppliedPassword = args?.passwordProfile?.password;
				const password = suppliedPassword || generateTempPassword();
				const forceChange = args?.passwordProfile?.forceChangePasswordNextSignIn;
				const body = {
					accountEnabled: true,
					displayName,
					mailNickname: userPrincipalName.split('@')[0],
					userPrincipalName,
					usageLocation,
					passwordProfile: {
						password,
						forceChangePasswordNextSignIn: forceChange !== false
					}
				};
				const created = await graphPost('/users', body, token);
				const allowReturnPassword = isTruthy(process.env.ALLOW_RETURN_PASSWORD);
				const out = allowReturnPassword ? { ...created, _temporaryPassword: password } : created;
				return { content: [{ type: 'text', text: JSON.stringify(out) }] };
			}
			case 'graph.updateUser': {
				const userIdOrUpn = normalizeUpn(args?.userIdOrUpn);
				const patch = args?.patch;
				if (!patch || typeof patch !== 'object') throw new Error('patch object is required');
				await graphPatch(`/users/${encodeURIComponent(userIdOrUpn)}`, patch, token);
				return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] };
			}
			case 'graph.disableUser': {
				const userIdOrUpn = normalizeUpn(args?.userIdOrUpn);
				await graphPatch(`/users/${encodeURIComponent(userIdOrUpn)}`, { accountEnabled: false }, token);
				return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] };
			}
			case 'graph.assignLicense': {
				const userIdOrUpn = normalizeUpn(args?.userIdOrUpn);
				const addSkuIds = Array.isArray(args?.addSkuIds) ? args.addSkuIds : [];
				const removeSkuIds = Array.isArray(args?.removeSkuIds) ? args.removeSkuIds : [];
				const body = {
					addLicenses: addSkuIds.map(skuId => ({ skuId })),
					removeLicenses: removeSkuIds
				};
				const data = await graphPost(`/users/${encodeURIComponent(userIdOrUpn)}/assignLicense`, body, token);
				return { content: [{ type: 'text', text: JSON.stringify(data) }] };
			}
			case 'm365admin.supportQuery':
			case 'm365admin.searchAgentsByTitle':
			case 'm365admin.getAgent':
			case 'm365admin.assignAgent': {
				// We cannot implement these without the concrete OpenAPI paths + auth wiring.
				// The hook remains here so Athena can still call the tools and receive a clear response.
				return {
					content: [{
						type: 'text',
						text: JSON.stringify({
							error: 'NOT_IMPLEMENTED',
							message: 'This tool is stubbed. Provide the exact OpenAPI paths + auth details to implement admin.microsoft.com calls.',
							received: redactSecrets(args || {})
						})
					}]
				};
			}
			default:
				throw new Error(`Unknown tool: ${name}`);
		}
	} catch (e) {
		return {
			content: [{
				type: 'text',
				text: JSON.stringify({ error: 'TOOL_ERROR', message: e.message })
			}]
		};
	}
});

const transport = new StdioServerTransport();
await server.connect(transport);
