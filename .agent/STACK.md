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
- src/lib/ai/models.ts — active registry for direct Ollama API + Gemini AI Studio
- src/lib/ai/providers/openai-compatible.ts
- src/lib/ai/providers/ollama.ts
- src/lib/ai/analyze-images.ts — dispatcher
- src/lib/ai/parse-analysis.ts — parser + normalizer
- src/lib/ai/prompts/box-analysis.ts — box-specific prompt

## Image Processing
- sharp — bounding box crops → item thumbnails

## QR Code
- qrcode — generation
- html5-qrcode — in-app scanning

## Deployment
- DevPilot → Caddy → kistenscanner.local
