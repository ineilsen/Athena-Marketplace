import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

let clientPromise = null;

function mcpServerEntryPath() {
	// Athena server runs from "Agentic Unified Desktop" folder.
	// The MCP server lives at repo root: ../m365-admin-mcp/src/index.js
	return path.resolve(process.cwd(), '..', 'm365-admin-mcp', 'src', 'index.js');
}

async function getClient() {
	if (clientPromise) return clientPromise;
	clientPromise = (async () => {
		const entry = mcpServerEntryPath();
		if (logger.isDebug) logger.debug('Starting m365-admin-mcp via stdio', { entry });

		const transport = new StdioClientTransport({
			command: process.execPath,
			args: [entry],
			env: {
				...process.env,
				// Explicitly pass tenant domain if set via Athena env
				AZURE_TENANT_DOMAIN: process.env.AZURE_TENANT_DOMAIN || process.env.M365_TENANT_DOMAIN || process.env.AZURE_TENANT_DOMAIN,
			}
		});

		const client = new Client({ name: 'athena-desktop', version: '1.0.0' }, { capabilities: {} });
		await client.connect(transport);
		return client;
	})();
	return clientPromise;
}

function parseToolTextResult(result) {
	// Our MCP server returns content: [{type:'text', text: JSON.stringify(...) }]
	const first = result?.content?.find(c => c?.type === 'text');
	if (!first?.text) return null;
	try { return JSON.parse(first.text); } catch { return first.text; }
}

export async function callM365Tool(name, args = {}) {
	const client = await getClient();
	const result = await client.callTool({ name, arguments: args });
	return parseToolTextResult(result);
}

export async function discoverTenantGuidFromDomain(domain) {
	return await callM365Tool('graph.discoverTenant', { domain });
}
