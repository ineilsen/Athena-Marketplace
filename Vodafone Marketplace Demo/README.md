# Vodafone Marketplace Support Demo

A Vodafone Business Marketplace–style customer portal that proxies support chats to the Athena Cognitive Desktop and streams live resolutions via SSE.

## Quick start

Prereqs:
- Node.js 18+
- Athena Desktop running locally (defaults to `http://localhost:3001`)

Run the proxy server:

```bash
cd Vodafone\ Marketplace\ Demo/server
npm install
npm start
```

Then open the UI:
- http://localhost:4105/
- Optional params: `?cust=GB13820473&athena=http://localhost:3001`

Login with any email + customer ID (or choose `random`). The dashboard shows purchased products and support coverage while the “Support Assistant” chat forwards messages through `/chat/send` to Athena and streams replies from `/api/v1/stream/customer-360/:id`.

## Structure

```
client/
  public/
    index.html        # Login + dashboard shell
    css/styles.css    # Layout + Vodafone styling
    js/app.js         # Login flow, SSE hookups, chat logic
server/
  app.js              # Express static server + proxy
  routes/chat.js      # Forwards /chat/send to Athena
  utils/logger.js
  package.json
```

## Environment

- `PORT` (default `4105`)
- `COMPANY_NAME` overrides the Vodafone branding text in the UI.

## Notes

- SSE auto-reconnect backs off exponentially (max 15s).
- Chat deduplicates streamed replies via `traceId` to avoid showing both HTTP fallback and SSE payloads.
- Product/service cards are driven by a small deterministic dataset seeded by customer ID so demos remain consistent across sessions.
