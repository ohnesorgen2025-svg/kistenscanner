# Decisions — kistenscanner

## 2026-03-27 — AI Layer: New build, two files copied
New build based on inventarisierung spec document.
Exception: models.ts and vertex.ts copied directly (Vertex OAuth2 complexity).
Reason: Clean start without legacy, but no need to re-solve Vertex auth.

## 2026-03-27 — Dark mode only
No light/dark toggle. Dark only.
Reason: Dev-tool aesthetic, single user, no accessibility requirement from user.

## 2026-03-27 — No box status
Boxes are always accessible. No open/sealed/archived states in v1.
Reason: User explicitly out of scope.

## 2026-03-27 — No duplicate detection in v1
Reason: User explicitly out of scope.

## 2026-03-27 — Item move supported
Move items between boxes is in scope.
Reason: User confirmed as needed.

## 2026-03-27 — Multiple photos per item, one title image
User selects title image. AI extracts details from detail photos.
Reason: Core workflow requirement (e.g. power supply voltage/specs).

## 2026-03-27 — Full-text search includes detail field
Search covers name + description + detail field.
Reason: Detail field contains specs — must be findable.

## 2026-03-27 — Monorepo with client/ and server/
Single repository with separate `client/` and `server/` folders.
Reason: Matches the current DevPilot task and keeps frontend/backend changes together for local execution.

## 2026-03-27 — Dev ports fixed to 5174 and 4001
Frontend dev server uses port `5174`, backend uses port `4001`.
Reason: Ports were checked before scaffold and both were available.

## 2026-03-27 — Vertex provider extracted from inventarisierung analyze route
`models.ts` was copied directly from `inventarisierung/src/config/models.ts`. The Vertex implementation was copied from the source project's inline analyze route into `server/src/lib/ai/providers/vertex.ts`.
Reason: The source repo no longer exposes a standalone Vertex provider file, but the working adapter logic still exists there and should stay isolated in the provider layer here.

## 2026-03-28 — SQLite schema bootstraps on server startup
The SQLite connection now enables foreign keys and runs `CREATE TABLE IF NOT EXISTS` migrations during startup. The local DB file is created under `server/data/`.
Reason: Keeps the initial backend setup minimal and ensures a fresh checkout can start the server without a separate manual migration step.

## 2026-03-28 — Stitch references stored as local implementation inputs
The supplied Stitch mockups are stored under `client/src/design-reference/` as static HTML reference files plus a README that lists what to keep and what to strip during implementation.
Reason: Keeps the visual source material inside the repo and makes the allowed design system elements explicit before UI work begins.

## 2026-03-28 — Analyze endpoint verified through a mock AI mode
The analyze pipeline supports verification with `AI_ANALYZE_USE_MOCK=1`, which returns a hardcoded analysis response so uploads, parsing and Sharp crop generation can be tested without external API keys or real provider calls.
Reason: Lets the project prove the full `/api/analyze` flow end-to-end while avoiding accidental live API usage during local development.

## 2026-03-28 — Box analysis prompt should prefer best-effort items over empty arrays
The analyze prompt now explicitly tells the model to return best-effort item guesses whenever physical objects are visible and to use an empty array only when there are truly no objects in view.
Reason: A real Gemini test showed the parser can handle fenced JSON correctly, so reducing empty results is best handled at the prompt level instead of by weakening parsing rules.

## 2026-03-28 — Box numbers are assigned only when a box is finalized
`POST /api/boxes` assigns the next sequential `number` at save time instead of reserving numbers during photo capture or analysis.
Reason: Keeps the store workflow simple, avoids gaps from abandoned drafts and matches the v1 single-user local flow.

## 2026-03-28 — Store review supports manual fallback items
The Add Box review step allows adding and removing manual items, and an empty AI analysis seeds a blank review row instead of blocking the workflow.
Reason: Real provider responses can still return an empty array for ambiguous photos, so the store flow needs a pragmatic fallback to remain usable.

## 2026-03-28 — Image asset paths stay server-relative
API responses continue to store image paths as server-relative values like `/images/crops/...`, while the React client resolves them to the backend origin during local Vite development.
Reason: Keeps persisted paths deployment-friendly while fixing local dev rendering where the frontend and backend run on different ports.

## 2026-03-28 — German UI copy uses real umlauts
Visible frontend copy uses German wording with proper `ä`, `ö`, `ü` and `ß` instead of ASCII substitutions.
Reason: The product is intended for German-language use and should read naturally during manual testing and later LAN deployment.

## 2026-03-28 — AI analysis should answer in German with proper umlauts
The box-analysis prompt explicitly requests German item names and descriptions and forbids ASCII substitutions like `ae`, `oe` and `ue` where umlauts are correct.
Reason: Stored AI output should match the German UI and remain natural and searchable for the intended user.

## 2026-03-28 — QR codes encode the visible Kistennummer
Generated QR codes now encode the box number instead of the internal database ID, and the app resolves scans back to a box through `GET /api/boxes?number=...`.
Reason: The printed label should expose the human-facing identifier, and scans should stay stable even if internal IDs are not meaningful to the user.

## 2026-03-28 — Initial search uses SQLite LIKE over saved item text
The first FIND slice searches `items.name`, `items.description` and `items.detail` with SQLite `LIKE` and returns item-plus-box result cards.
Reason: It is the smallest useful searchable layer on top of the existing schema and is easy to verify immediately before considering FTS5.

## 2026-03-28 — Item move uses a simple inline confirm panel
The box detail page opens a lightweight inline move panel with a target-box select plus confirm/cancel instead of a heavier modal flow.
Reason: The backend move endpoint already exists, and the smallest useful UI is easier to understand, verify and maintain.
