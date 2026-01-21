# Athena Unified Desktop Copilot Notes

## Architecture
- `src/server.js` boots an Express app that serves the SPA from `public/`, exposes `/api/v1/*`, and keeps in-memory maps for rolling conversation history, executed actions, and last Customer 360 snapshots. Restarting resets demo state.
- `src/routes/api.js` handles all API traffic: `get-insights`, `external-chat`, `agent-reply`, SSE streaming, and latest snapshot polling. SSE clients are keyed by customerId; always update `lastCustomer360` before broadcasting.
- `src/services/llmOrchestrator.js` orchestrates widget fan-out. Each widget type must be added to `jsonWidgets` (to force JSON parsing) and typically references a prompt template in `src/prompts/*.txt`. Provider routing: planning (`AGENT_NETWORK_ACTIONS`) is OpenAI-only, execution (`AGENT_NETWORK_EXECUTE`, `LIVE_RESPONSE`, `NEXT_BEST_ACTION`) can be switched to Neuro SAN via `providerMap` or the UI selector.
- Service classification utilities live in `src/config/serviceClassification.js` with keywords in `serviceKeywords.json`. Env vars `SERVICE_KEYWORD_GROUPS` or `SERVICE_KEYWORDS_JSON_PATH` override defaults.

## Running & Environment
- Requires Node 18+. In `Agentic Unified Desktop/`: `npm install` then `npm run start:debug` (disables static caching) or `npm start`.
- Configure `.env` (not committed): `ENDPOINT_URL`, `DEPLOYMENT_NAME`, `AZURE_OPENAI_API_KEY`, optional `NEUROSAN_BASE_URL` plus `NEUROSAN_NETWORK_*`. `SUPPRESS_AUTO_BOT_REPLY=true` removes `botReply` from `/external-chat` and SSE payloads.
- Front-end code assumes same-origin API. Override via `window.__API_BASE__` only if proxying.

## Backend Conventions
- `fetchInsights` expects `requestedWidgets` to be explicit; UI modules only update widgets they asked for. When adding a widget, update both `jsonWidgets` and any consumers in `public/js/modules` plus `public/js/api.js` (`ALL_WIDGETS`).
- SSE streaming endpoint `/api/v1/stream/customer-360/:id` pushes the entire `payload` produced by `/external-chat`. Keep `traceId` stable for deduplication and include `insights` map when the UI needs per-widget diffs.
- Conversation, executed actions, and customer snapshots are demo-grade in-memory stores; do not rely on persistence across processes.

## Front-End Patterns
- Vanilla ES modules only. `public/js/main.js` bootstraps panels, manages `activeCustomerId`, and wires SSE plus SharedEvents defined in `public/js/config/appConfig.js`.
- `modules/aiPanel.js` expects structured JSON for each widget (e.g., `NEXT_BEST_ACTION.guidedSteps` supports strings or `{ text, source }`). Maintain these shapes server-side to avoid null selectors.
- `modules/conversationPanel.js` owns `conversationHistory` and emits `conversationChanged`, which triggers agent action refreshes and NBA recompute. Any new module listening for chat updates should hook into the constants in `config/appConfig.js` rather than hard-coded event names.
- `modules/customerPanel.js` merges partial SSE updates into `window.__lastC360`. When changing server payloads, keep key paths (`customer360.products`, `cards.geoServiceContext`, etc.) so the merge logic works.

## Workflow Tips
- Typical demo flow: CX client sends `/api/v1/external-chat` → `fetchInsights` builds widgets → SSE updates both desktop and CX clients. Agent replies through `/api/v1/agent-reply` and are streamed as `{ type: "agentReply", traceId }` events.
- When introducing new prompts, add a `.txt` file under `src/prompts/` and wire it in `buildPrompt`. Templates use `{{VAR}}` placeholders; renderer injects JSON when values are objects.
- UI grading/visualizations (sentiment/risk dials, health bubbles, word cloud) prefer existing numeric/string ranges; keep outputs bounded (0–100 percentages, sentiment keywords) to avoid layout issues.
