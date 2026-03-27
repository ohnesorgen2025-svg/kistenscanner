# Current Task

## Status:
🟢 Foundation scaffold complete

## Current Goal
Move from scaffold to the first persisted backend layer: SQLite schema and typed DB access for boxes, items, images and item_images.

## Next Action
Implement the initial database bootstrap in `server/src/db/`:
- create schema setup for boxes, items, images and item_images
- keep DB access separated from routes
- verify schema creation on server start

## Open Questions
- None for the scaffold step.

## Done Recently
- Monorepo scaffolded with `client/` and `server/`
- Vite + React + strict TypeScript set up on port `5174`
- Express + better-sqlite3 set up on port `4001`
- `models.ts` copied 1:1 from `inventarisierung`
- Vertex provider extracted into `server/src/lib/ai/providers/vertex.ts` from the source project's analyze route
- Typed AI skeleton files created under `server/src/lib/ai/`
- Verified `npm run check`, `npm run build`, `http://127.0.0.1:4001/api/health` and `http://127.0.0.1:5174`
