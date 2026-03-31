# Current Task

## Status:
🟢 LAN deployment confirmed, Box Detail UI fixed

## Current Goal
Keep the deployed LAN version stable and refine the live UI plus print workflow against real usage.

## Next Action
Continue the real-world label workflow:
- add more real sticker profiles beyond `No. 5028`
- validate the clickable sheet-position workflow against a real printed test page
- keep checking the live UI on desktop and mobile for remaining broken layouts

## Open Questions
- Which additional bought label packages should become built-in print profiles after `No. 5028`?

## Done Recently
- Fixed Box Detail mobile overlapping layout (forced responsive 2-column grid in `.box-detail-header__identity`).
- Restructured `.review-card` CSS from grid to flex-column to fix edge-to-edge buttons.
- Monorepo scaffolded with `client/` and `server/`
- Vite + React + strict TypeScript set up on port `5174`
