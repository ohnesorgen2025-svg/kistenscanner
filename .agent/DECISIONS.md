# Decisions — kistenscanner

## 2026-04-06 — Ollama now uses direct online API access with one stored key
The Ollama integration no longer defaults to a fixed LAN host. All Ollama models now target the direct Ollama API and use one stored `OLLAMA_API_KEY`, while legacy env names (`OLLAMA_CLOUD_API_KEY`, `GLM_API_KEY`) are accepted as migration fallbacks.
Reason: The app must work online without depending on a private LAN Ollama instance, and the settings flow should match the single official Ollama API key model.

## 2026-04-06 — Direct Ollama API uses different model tags than the old LAN/cloud bridge
The active Ollama registry now uses the direct online model tags exposed by `https://ollama.com/api`, for example `qwen3.5:397b`, `qwen3-vl:235b`, and `glm-4.6`, and the old local-only `qwen3.5:9b` entry has been removed from the active online list.
Reason: A live test with the stored Ollama key showed the direct API works, but the older `*-cloud` and `:cloud` model tags return server errors because they belonged to the previous bridge setup, not the direct Ollama API surface.

## 2026-04-05 — Active AI provider scope reduced to Ollama + Gemini AI Studio
OpenAI, Anthropic and Vertex have been removed from the active model registry, Settings UI and Settings backend. The `openai-compatible` adapter remains because Gemini AI Studio uses that protocol surface.
Reason: The user wants a deliberately simple AI setup with low billing complexity, while keeping Ollama and Gemini AI Studio as the only active providers.

## 2026-04-05 — Design system consolidation (P1-P12)
Full CSS audit and fix pass across App.css and index.css:
- Unified 3 competing blue tones (#378ADD, #3B82F6, #00DAF3) to single `--accent: #3B82F6`
- Consolidated 12+ border-radius values to 3 tokens: 0.25rem, 0.5rem, 0.75rem
- Consolidated 19 font-sizes to 5-step type scale: 0.7/0.75/0.85/0.95/1.05rem
- Consolidated 8 letter-spacing values to 2: 0.08em and 0.12em
- All touch targets raised to 48px minimum (inputs, nav-links)
- All interactive elements now have :hover and :active states
- Spacing normalized to 12px grid multiples
- Removed !important overrides on dashboard cards
- Font changed from Inter to Space Grotesk (previous session)
Reason: Comprehensive design skill audit revealed systematic inconsistencies. All tokens now documented in PROJECT_RULES.md.

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

## 2026-03-29 — Box number outranks QR in hero and print label
The BoxDetail hero and the print label now treat the running box number as the primary visual anchor, while the QR code is present but intentionally smaller.
Reason: In real use the human-readable number is the first identifier someone looks for on a box, and the QR code is a secondary scan affordance for deeper interaction.

## 2026-03-29 — Mobile BoxDetail never edits or moves inside a two-column item grid
On small screens, the BoxDetail item grid collapses to one column, and edit/move action buttons stack vertically instead of sharing cramped horizontal space.
Reason: Real mobile screenshots showed the item cards becoming unreadable when edit or move states opened inside a multi-column layout.

## 2026-03-29 — BoxDetail item grid uses fixed 1/2/4 breakpoints
The item grid in BoxDetail no longer relies on `auto-fill`; it now uses one column on small screens, two columns on medium screens and a maximum of four columns on large screens.
Reason: The auto-fill layout produced inconsistent breakpoints and visually broken card widths depending on the remaining viewport space.

## 2026-03-29 — Bottom-nav active states are route-specific, not prefix-based
The navigation now treats `/boxes/add` as its own destination and marks `Kisten` active only for the overview and detail routes, not for every `/boxes/*` path.
Reason: Prefix matching made both `Kisten` and `Hinzufügen` appear active on the add flow, which visually broke navigation state.

## 2026-03-29 — Scanner teardown must wait for startup before cleanup
`ScanPage` now tracks pending scanner startup and waits for it to settle before calling `stop()` and `clear()` during route changes.
Reason: Leaving the scan route while the scanner was still starting was the most fragile runtime path and a plausible source of the reported black follow-up screen.

## 2026-03-29 — Add Box save form uses its own vertical spacing context
The save section in the Add Box flow now uses an explicit stacked layout so the final save button keeps a visible gap below the input fields.
Reason: Without its own layout gap, the call-to-action looked glued to the form row and made the saving step feel cramped.

## 2026-03-29 — Add Box no longer repeats the workflow as top summary cards
The top-of-page three-step summary cards have been removed from the Add Box screen.
Reason: They repeated information the real sections already communicate and pushed the useful capture UI unnecessarily far down the page.

## 2026-03-29 — Main app routes share one desktop content width
The top-level app routes now use one shared shell width on desktop, while only the box detail route keeps its own layout treatment.
Reason: Route-specific width caps made the app visually jump when switching between `Suchen`, `Scannen`, `Hinzufügen`, `Kisten` and `Einstellungen`.

## 2026-03-29 — Desktop keeps a stable scrollbar gutter across routes
The app now reserves the browser scrollbar gutter globally instead of letting it appear only on longer pages.
Reason: Even with unified content widths, switching between short and long views still caused a horizontal jump when the scrollbar appeared or disappeared.

## 2026-03-29 — Main pages use one calm header pattern
The top-level app pages now use one shared page header with a small kicker, one title, and optional right-aligned actions, without explanatory paragraph copy.
Reason: The previous mix of hero text, floating buttons and inconsistent spacing made the app feel noisy and structurally inconsistent.

## 2026-03-29 — Box detail prioritizes number, name, location and item count
The box detail header now presents `Kiste #`, then the box name, then a muted metadata row for `Standort` and `Items`, while the QR code remains available but clearly secondary.
Reason: The box number, name, location and item count are the information humans need first; the earlier header used too many competing sizes, colors and visual weights at once.

## 2026-03-29 — Print label should fill the A6 area, not sit tiny in one corner
The print label now uses tighter print margins, a defined A6 content height, a larger human-readable box number and a compact fixed QR block.
Reason: The previous print preview produced a tiny fragment in the top-left corner instead of a deliberate label layout that uses the printable area well.

## 2026-03-29 — Sticker print contains only number and QR code
The box print output is now limited to the human-readable box number and the QR code, with the number first and no leading `#`.
Reason: Item names, locations and other metadata can change over time, but the physical sticker should remain stable and quickly legible from a distance.

## 2026-03-29 — Sticker printing is template-based on DIN A4
Printing now assumes a DIN-A4 sheet and uses selectable sticker format templates instead of a single fixed label size.
Reason: The real use case involves different sticker sizes on A4 sheets, so the print system must choose between templates rather than baking one label layout into CSS.

## 2026-03-29 — Sticker printing starts from real bought label profiles
The first built-in label profile is `No. 5028` with `83,82 × 50,80 mm` labels on a `2 × 5` A4 sheet, using measured margins and gaps.
Reason: Print placement must match actual bought sticker packs, so the system should be grounded in real package dimensions instead of placeholder example sizes.

## 2026-03-29 — Sticker printing targets one chosen field on the A4 sheet
The print flow now lets the user choose the exact label field on the sheet and renders only that sticker with the large running number plus QR code.
Reason: One box should not waste a whole DIN-A4 page; the real workflow needs reusing partially used sticker sheets by placing the next box into a free slot.

## 2026-03-29 — Sticker configuration stays collapsed until requested
The BoxDetail page now keeps the sticker-print configuration closed by default and opens it from the header action.
Reason: The sheet configuration is important when printing, but it should not dominate the box-detail layout every time the page opens.

## 2026-03-29 — Sticker preview should mimic paper with fine guide lines
The sheet preview now uses a bright paper-like background and subtle guide outlines for every label position, and the printed page keeps similarly fine slot borders.
Reason: The previous dark mock-style preview made it hard to judge whether the real label grid was aligned correctly.

## 2026-03-31 — No. 5028 uses symmetric A4 margins with a 5 mm center gap
The `No. 5028` label profile now assumes `83,8 × 50,8 mm` labels on A4 with a `5 mm` center gap, `0 mm` vertical gap, `18,7 mm` left/right margins and `21,5 mm` top/bottom margins.
Reason: The earlier asymmetric margin values did not match the real-world expectation for this bought sheet, while the measured center gap plus equal outer margins produce a consistent printable grid.

## 2026-03-31 — Sticker number and QR code share the label width side by side
The sticker now prints the large box number next to the QR code instead of stacking them vertically.
Reason: A horizontal layout uses the available width better and lets the human-readable number grow without making the QR code unreadably small.

## 2026-03-31 — One print can fill multiple selected fields with the same sticker
The sheet preview now supports selecting multiple free label fields, and the print output repeats the same box number plus QR code into every selected slot.
Reason: In practice the same sticker may be needed more than once for the same box, for example on the box body and separately on the lid.

## 2026-03-31 — Sticker content uses a strict 50/50 label split with inner padding
Inside each label, the usable area now keeps roughly 10% padding to the outer edges and splits the remaining space into two equal halves: the number on the left and the QR code on the right, both horizontally and vertically centered.
Reason: A strict geometric split uses the label area more predictably and makes both the number and the QR code feel deliberate instead of loosely arranged.

## 2026-03-31 — Preview and print share one SVG sticker artwork
The sticker content is now rendered from the same SVG artwork in both the on-screen sheet preview and the actual print layout.
Reason: Separate CSS layouts for preview and print drifted apart, so the print dialog no longer matched what the user saw before printing.

## 2026-03-31 — Sticker content uses a small optical downward offset
The shared sticker artwork now nudges the number and QR code slightly downward inside the label.
Reason: Pure mathematical centering still looked a touch too high in practice, so a small shared optical offset makes the sticker feel visually centered in both preview and print.

## 2026-03-31 — QR code may need its own optical Y correction
The sticker geometry now allows the QR code to sit slightly higher than the number while keeping both on the same shared artwork.
Reason: The QR code's visual mass does not always read as centered when it shares the exact same Y center as a large numeral.

## 2026-03-31 — Multi-photo dedupe uses conservative heuristics, not just exact text
The analysis parser now merges likely duplicates with normalized names, description token overlap, generic-name safeguards, source-image awareness and conservative quantity handling.
Reason: Exact `name + description` matching left obvious duplicate items in multi-photo box analyses, but blindly aggressive merging would risk collapsing truly separate objects.

## 2026-03-31 — Quantity should not grow just because the same object appears in another photo
When duplicate detections are merged across photos, quantity now keeps the safer maximum value instead of blindly summing.
Reason: In multi-photo analysis the same physical object is often seen more than once, so summing duplicate quantities tends to overcount.

## 2026-03-31 — Box detail header should act like one calm tool panel
The box detail page now places the QR block on the left, the location as the dominant headline beside it, and the remaining facts (`Kiste`, `Name`, `Items`) in one uniform fact strip below.
Reason: The previous hero mixed too many sizes, colors and scattered buttons, which made the most important box information harder to scan.

## 2026-03-31 — Box actions belong in one equal action bar
The box detail header now uses one equal-width action bar, and on smaller screens the same actions collapse to icon-only buttons instead of wrapping text labels.
Reason: Header actions should feel like one stable toolset across desktop and mobile, not like separate floating buttons with inconsistent widths.

## 2026-03-31 — Box deletion is available directly in the detail header
Deleting a box is now exposed from the box detail action bar and confirms before calling `DELETE /api/boxes/:id`.
Reason: The backend already supported box deletion, but without a visible UI the action was effectively inaccessible in day-to-day use.

## 2026-03-31 — Review Card Item Actions span edge-to-edge
The `.review-card__actions` und `.move-panel` in BoxDetail have been moved out of the padded `.review-card__content` container. The `.review-card` container itself was switched from grid to a flex column.
Reason: To keep the action bar at the very bottom of the card spanning full-width seamlessly, the actions can't sit inside the parent content's left/right padding. The flex column also ensures cards in lists share uniform height without breaking content layouts when `flex: 1` stretches the content node.
## Architecture Decisions

- Used raw CSS over Tailwind to minimize payload overhead.
- Layout switched to `flex-direction: column` for `.review-card` to allow full-width action buttons.
- Box Detail header grid forced into 2-column layout to prevent mobile overlap.
## Box Detail UI Adjustments

- Switched `.box-detail-toolbar` to `flex-wrap` and added placeholder buttons for further features (Edit, Add Photo).
- Refined `.box-detail-header__fact` with `flex: 1` to ensure responsive equal-width scaling.
## Dynamic QR Layout

- Switched `.box-detail-header__identity` from a fixed grid with start alignment to `display: flex` with `align-items: stretch`.
- Removed max-width limits for the left column so the QR square organically scales its height exactly to the dynamically generated height of the right-hand text summary block (`flex: 1`), while preserving a perfect 1:1 aspect ratio.

## 2026-04-05 — UI Overhaul: Icon-only Navigation
The bottom navigation on mobile now forces 7 icons into a single line without text labels. On desktop, the navigation is a vertical sidebar with icons and labels.
Reason: To enforce a high-density, professional design system and avoid broken wrapping on narrow mobile screens.

## 2026-04-05 — UI Overhaul: Button Symmetry
Rigid button symmetry rules established: 1 Button takes 100% width, 2 Buttons take 50/50 equal width (`flex: 1`).
Reason: Consistent, predictable actions that match modern dashboard aesthetics. Form buttons and panel headers now behave identically.

## 2026-04-05 — UI Overhaul: Button Sizing and Styling
All buttons enforce a strict `48px` min-height for touch-targets. Primary buttons use a solid blue background (`#378ADD`), secondary/ghost buttons use transparent backgrounds with a `1.5px solid rgba(255,255,255,0.3)` border.
Reason: Premium look, distinct visual hierarchy, and accessible touch target sizes.

## 2026-04-05 — UI Overhaul: BoxDetail Toolbar Layout
The BoxDetail toolbar and panel header action bars use icon-only square buttons (`48x48px`) without stretching, housed in a scrolling Row on narrow screens.
Reason: Design System §2 dictates companion actions and toolbars must not stretch to 100%, keeping them visually distinct from primary container actions.
