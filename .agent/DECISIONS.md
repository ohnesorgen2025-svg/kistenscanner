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

## 2026-03-28 — Active model is stored outside the database
The selected active model lives in `server/data/settings.json` and `POST /api/analyze` falls back to that stored model when no `modelId` is sent.
Reason: The setting is small, local and operational rather than relational, so a JSON file keeps it easy to inspect and change without expanding the SQLite schema.

## 2026-03-28 — Provider keys stay runtime-managed in server/.env
Settings writes managed provider keys back to `server/.env` and updates `process.env` at runtime instead of introducing a dedicated encrypted storage layer in v1.
Reason: This is the smallest practical bridge between the Settings UI and the existing provider adapters, and it matches the current local single-user deployment model.

## 2026-03-28 — Model selectors should come from the server model registry
Client model pickers load their options from `/api/models` and use `/api/settings` for the active default instead of hardcoding a subset of known models in the UI.
Reason: `models.ts` is the single source of truth, so UI selectors must stay aligned automatically when models are added or renamed.

## 2026-03-28 — Mobile capture uses progressive enhancement
The Add Box flow now prefers a live `getUserMedia` camera preview for mobile capture, exposes a torch toggle only when the active device reports torch support, and falls back to the existing `accept="image/*"` plus `capture="environment"` file input when live camera access is unavailable.
Reason: This keeps the mobile capture flow practical on real phones without breaking the simpler file-input path on unsupported browsers or desktops.

## 2026-03-28 — LAN deployment runs as one container with same-origin frontend and API
The repo now ships with a root `Dockerfile` and `compose.yaml` that build the Vite client and TypeScript server together, persist runtime data under `./data`, and serve the built client from Express on port `4001`.
Reason: DevPilot deploys LAN-ready projects most simply when the app can run as a single Dockerized service with one origin for frontend assets, API calls and image paths.

## 2026-03-28 — Live LAN runtime reads env from the persisted data directory
The deployed VM now expects the runtime env file under `data/.env`, followed by a container restart so Docker Compose picks the values up.
Reason: The current DevPilot LAN deployment for `kistenscanner` is already live under `http://kistenscanner.local`, and the persisted data directory is the stable place for runtime environment values on the VM.

## 2026-03-28 — Bottom-nav route changes force a page remount
The main routed content in `client/src/App.tsx` is keyed by `location.pathname` so switching between bottom-nav destinations remounts the active page component.
Reason: This is the smallest robust fix for intermittent blank screens caused by stale per-page runtime state during route changes, especially around camera and scanner pages.

## 2026-03-28 — Desktop keeps a constrained mobile-first reading width
Large-screen rendering now uses route-specific max widths: default app screens stay narrow, the boxes overview widens into a 2-3 column grid, and box detail gets a medium desktop width instead of stretching edge to edge.
Reason: The product is still mobile-first, but it should remain comfortable and intentional on desktop instead of scaling the phone layout across the entire viewport.

## 2026-03-28 — Thumbnail rendering falls back to the best available stored image
Client thumbnail rendering now normalizes relative asset paths and falls back from crop thumbnails to stored source images when no crop path is available.
Reason: Production showed that some analyzed items legitimately have no saved crop path, so the UI should still render the best available image instead of collapsing straight to a placeholder icon.

## 2026-03-28 — Box detail must not fall back to the whole box photo for item thumbnails
`BoxDetail` now renders only the item's stored crop or explicit item image and no longer falls back to the box-level source photo.
Reason: Falling back to the full Kistenfoto makes items look wrong and hides the real persistence state when no crop was saved for that item. Add Box review may still show the source image before saving, but saved item views must not pretend the box photo is an item crop.

## 2026-03-29 — Mobile bottom nav stays one-row, search uses a dedicated icon wrapper
The bottom navigation now reserves five mobile columns for the five app sections, and the Search page wraps the input plus icon in a dedicated field container instead of positioning the icon against the whole search block.
Reason: A live browser pass on `kistenscanner.local` showed the fifth nav item wrapping onto a second row and the search icon drifting between input and action button on small screens.

## 2026-03-29 — BoxDetail item actions use equal-width quiet buttons
The item action strip in the box detail cards now uses three equally sized subtle buttons for edit, photo upload and move instead of loose left-aligned icon glyphs.
Reason: The previous layout looked visually uneven and made the action area feel accidental instead of intentional.

## 2026-03-29 — BoxDetail editing uses a stacked in-card form, not a compressed grid
Editing an item in BoxDetail now swaps the card body into a simple single-column form with dedicated save/cancel buttons and hides the normal icon action strip until editing ends.
Reason: The old inline grid collapsed badly inside narrow item cards and created a visibly broken editing state on real data.

## 2026-03-29 — Missing item thumbnails need an explicit placeholder state
Items without a saved thumbnail in BoxDetail now render a dedicated placeholder with icon plus `Kein Vorschaubild` messaging instead of a thin dark strip with a tiny centered icon.
Reason: The previous fallback looked like a rendering bug rather than an intentional empty state and made the Kisteninhalt feel broken.

## 2026-03-29 — The whole missing-thumbnail state should act as the upload affordance
When an item has no preview image in BoxDetail, the entire placeholder is now the upload trigger, and the move state uses the same expanded card treatment as editing.
Reason: Users naturally click the preview area itself when they want to add a missing photo, and the narrow move card repeated the same cramped pattern that editing had before.
