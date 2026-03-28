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
