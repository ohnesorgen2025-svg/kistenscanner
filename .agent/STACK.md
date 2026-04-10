# Stack — kistenscanner

## Frontend
- React + TypeScript + Vite
- Dark mode only (--bg: #1E2124, --card-bg: #2B2F33)
- Font: Space Grotesk (headings + body)
- Icons: Material Symbols Outlined
- Mobile-first, single accent color --accent: #3B82F6
- Vanilla CSS (App.css + index.css), no Tailwind, no CSS modules
- Design reference: client/src/design-reference/

## Backend
- Node.js + Express
- REST API

## Database
- SQLite via better-sqlite3

## AI Layer
- server/src/lib/ai-hub.ts — ai-hub client (fetches models, keys, providers from central service)
- server/src/lib/ai/models.ts — ProviderType + ResolvedModel types
- server/src/lib/ai/providers/ollama.ts — Ollama / Ollama-Cloud provider
- server/src/lib/ai/providers/openai-compatible.ts — OpenAI-compatible provider (Gemini, OpenAI, Anthropic, custom)
- server/src/lib/ai/providers/shared.ts — shared utilities (normalizeEndpoint, fetchWithTimeout)
- server/src/lib/ai/analyze-images.ts — dispatcher (resolves model via ai-hub, routes to provider)
- server/src/lib/ai/parse-analysis.ts — parser + normalizer
- server/src/lib/ai/prompts/box-analysis.ts — box-specific prompt
- server/src/services/models.ts — model list with 5-min cache, model resolution via ai-hub
- server/src/services/settings.ts — active model ID only (settings.json)

## AI Configuration
- All model assignments, API keys and provider details managed by **ai-hub** (`https://ai-hub.ohnesorgen.net`)
- Env vars: `AI_HUB_URL`, `AI_HUB_TOKEN`, `AI_HUB_APP_ID`
- No local key storage, no custom-models.json, no provider test endpoints

## Image Processing
- sharp — bounding box crops → item thumbnails

## QR Code
- qrcode — generation
- html5-qrcode — in-app scanning

## Deployment
- Local verification → Docker Compose on `127.0.0.1:3008`
- Shared LAN runtime → `kistenscanner.local` / `192.168.44.106` via SSH + `docker compose`
- Local HTTPS requires certs under `data/certs/`; otherwise use local HTTP for verification
