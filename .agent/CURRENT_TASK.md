# Current Task

## Status:
🟢 LAN deployment confirmed

## Current Goal
Keep the deployed LAN version stable and verify the remaining real-device flows against the live hostname.

## Next Action
Validate the live app on real devices against `http://kistenscanner.local`:
- confirm mobile camera capture and torch behavior against the deployed hostname
- test QR scan and print label flow in the LAN environment
- verify persisted SQLite data and uploaded images survive another container restart

## Open Questions
- No blocking implementation questions. Remaining work is live device validation against the deployed LAN URL.

## Done Recently
- Monorepo scaffolded with `client/` and `server/`
- Vite + React + strict TypeScript set up on port `5174`
- Express + better-sqlite3 set up on port `4001`
- `models.ts` copied 1:1 from `inventarisierung`
- Vertex provider extracted into `server/src/lib/ai/providers/vertex.ts` from the source project's analyze route
- Typed AI skeleton files created under `server/src/lib/ai/`
- Verified `npm run check`, `npm run build`, `http://127.0.0.1:4001/api/health` and `http://127.0.0.1:5174`
- Added `server/src/db/schema.ts` with `boxes`, `items`, `images` and `item_images`
- Added `server/src/db/migrate.ts` and run migrations during DB initialization
- Enabled SQLite foreign keys and verified created tables in `server/data/kistenscanner.db`
- Added `client/src/design-reference/` with Stitch HTML references and a pruning README for implementation use
- Added `server/.env.example` and ignored `server/.env`
- Implemented `POST /api/analyze` with multipart upload, image storage and Sharp thumbnail crops
- Implemented AI provider adapters for Ollama, OpenAI-compatible and Anthropic models
- Implemented JSON-first analysis parsing with fallback for half-formatted responses
- Verified the full analyze pipeline end-to-end with `AI_ANALYZE_USE_MOCK=1`, including saved originals and reachable crop URLs
- Debugged a real Gemini request against `/api/analyze` and confirmed fenced JSON parsing works with non-mock output
- Tightened the analysis prompt to prefer best-effort item extraction instead of returning empty arrays for ambiguous object photos
- Added inventory services plus REST routes for boxes, items and item images
- Implemented the Store UI flow in `client/src/pages/AddBox.tsx` from photo upload through AI review to saved box with QR label
- Added `Boxes` and `BoxDetail` pages and wired React Router for `/`, `/boxes`, `/boxes/add` and `/boxes/:id`
- Verified the end-to-end store persistence flow with a mock AI server: analyze → create box → save items → fetch list/detail
- Added a manual review-item fallback when AI returns no detected items so saving a box is not blocked by an empty analysis result
- Fixed item thumbnail rendering by resolving server-relative `/images/...` asset paths to the backend origin in the client dev flow
- Translated the UI to German and normalized visible copy to proper umlauts (`ä`, `ö`, `ü`, `ß`)
- Updated the box analysis prompt so AI item names and descriptions are requested in German with proper umlauts (`ä`, `ö`, `ü`, `ß`)
- Added `GET /api/search?q=` across item name, description and detail with box context in the response
- Added `GET /api/boxes?number=` so QR lookups can resolve a Kistennummer back to a box record
- Implemented the Search page with focused live search, result cards and navigation into `/boxes/:id`
- Implemented the Scan page with `html5-qrcode` camera scanning and QR resolution through the new number lookup endpoint
- Changed QR generation to encode the Kistennummer instead of the internal box ID
- Added a printable A6 label view in `client/src/pages/BoxDetail.tsx` with QR code, box info and top 5 item names
- Verified `npm run check`, `npm run build`, `GET /api/search?q=adapter`, `GET /api/boxes?number=2` and the client routes `/`, `/scan` and `/boxes/2`
- Reworked item move in `client/src/pages/BoxDetail.tsx` into a simple open/confirm flow with target-box select, confirmation feedback and source-list removal
- Verified item move with real data by moving item `#11` from box `#3` to box `#2`, checking source and target, then restoring it to box `#3`
- Added `/api/settings`, `/api/settings/keys`, `/api/settings/test` and `/api/models` with JSON-backed active-model storage in `server/data/settings.json`
- Implemented `client/src/pages/Settings.tsx` with model cards, provider key status, connection tests and runtime key saving to `server/.env`
- Updated `POST /api/analyze` to fall back to the saved active model when `modelId` is omitted and synced `AddBox` to load that active model on mount
- Verified `GET /api/settings`, `GET /api/models`, `POST /api/settings`, `POST /api/analyze` without `modelId` and the client route `/settings`
- Replaced the hardcoded AddBox model dropdown with the dynamic `/api/models` list and preselected the stored active model from `/api/settings`
- Hardened Settings model persistence by reloading saved settings after each model switch and verified active-model roundtrips through repeated `POST /api/settings` + `GET /api/settings`
- Added a mobile-focused Add Box camera preview with progressive fallback to the system capture input and a conditional torch toggle for supported devices
- Raised interactive targets and input font sizing for mobile, reduced horizontal overflow risk, and increased bottom safe-area padding around the fixed navigation
- Added a multi-stage Docker build plus `compose.yaml` so the Express server and built Vite client run together in one production container on port `4001`
- Added `.agent/DEPLOYMENT.md`, switched client assets to same-origin paths, and verified `docker build`, `docker compose up`, `http://localhost:4001` and `http://localhost:4001/api/health`
- Confirmed the DevPilot LAN deployment is live at `http://kistenscanner.local`, restarted the deployed container on the VM, and re-verified both `/api/health` and `/`
- Added a route-keyed main content wrapper in `client/src/App.tsx` so tab navigation remounts page components cleanly and avoids stale blank screens between bottom-nav routes
- Added route-specific desktop width caps so default pages stay mobile-first on large screens, `Kisten` expands to a multi-column desktop grid, and `BoxDetail` no longer stretches across the full shell width
- Normalized client asset paths and added thumbnail fallbacks so AddBox review can use the source image and BoxDetail can fall back to stored item or box images when a crop path is missing
- Removed the BoxDetail fallback to whole-box photos so saved items now render only their own stored crop or item image instead of showing the original Kistenfoto as a misleading thumbnail
- Added a gated thumbnail debug trace to `GET /api/boxes/:id` via `DEBUG_BOX_THUMBNAILS=1` so persisted item thumbnail paths can be inspected quickly during API debugging
- Fixed the mobile bottom navigation to render all five tabs in a single row and corrected the search field icon alignment on the Search page after a live browser pass against `kistenscanner.local`
