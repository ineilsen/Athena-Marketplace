# m365-admin-mcp

MCP server exposing tools for Microsoft 365 administration.

## Tools

**Microsoft Graph (transactional)**
- `graph.discoverTenant({ domain })`
- `graph.listSubscribedSkus()`
- `graph.getUser({ userIdOrUpn })`
- `graph.createUser({ userPrincipalName, displayName, usageLocation, passwordProfile })`
- `graph.updateUser({ userIdOrUpn, patch })`
- `graph.disableUser({ userIdOrUpn })`
- `graph.assignLicense({ userIdOrUpn, addSkuIds, removeSkuIds })`

**Microsoft 365 Admin (non-transactional / help + agent assignment)**
- `m365admin.supportQuery({ question })` (stub)
- `m365admin.searchAgentsByTitle({ title })` (stub)
- `m365admin.getAgent({ agentId })` (stub)
- `m365admin.assignAgent({ agentId, scope })` (stub)

## Environment

Required for Graph:
- `AZURE_TENANT_DOMAIN` (e.g. `CRMbc395940.onmicrosoft.com`)
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

Optional:
- `GRAPH_API_BASE` (default `https://graph.microsoft.com/v1.0`)
- `ALLOW_RETURN_PASSWORD` (`true` to return generated passwords in tool output; default `false`)

## Run

```bash
cd m365-admin-mcp
npm install
npm start
```

This server is typically launched by the Athena Desktop backend via MCP stdio transport.
