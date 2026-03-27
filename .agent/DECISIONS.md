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