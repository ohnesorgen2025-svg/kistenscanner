# Stack — kistenscanner

## Frontend
- React + TypeScript + Vite
- Dark mode only (#0F0F0F bg, #1A1A1A cards)
- Mobile-first, single accent color
- Design reference: client/src/design-reference/

## Backend
- Node.js + Express
- REST API

## Database
- SQLite via better-sqlite3

## AI Layer
- src/lib/ai/models.ts — copied from inventarisierung
- src/lib/ai/providers/anthropic.ts
- src/lib/ai/providers/openai-compatible.ts
- src/lib/ai/providers/ollama.ts
- src/lib/ai/providers/vertex.ts — copied from inventarisierung
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
