# Current Task

## Status:
🟢 Design System Refactor Phase 1-2 Abgeschlossen. Nav-Refactor, Button-Grid-System und BoxDetail Toolbar implementiert.

## Current Goal
Den gesamten Kistenscanner konsistent auf das strikte Design System umstellen. Die Buttons, Toolbars und Navigationsleisten sind konform.

## Next Action
- §3 Search-Bar Spacing: Suchleiste und Such-Screen fixen.
- §4 Content-Container: `max-width: 768px` global durchsetzen.

## Open Questions
- Keine.

## Done Recently
- Bottom-Nav auf Mobile in einer Zeile gezwungen, Icons ohne Text-Labels. Toolbar Sidebar für Desktop.
- Rigide Button-Symmetrieregeln durchgesetzt (1 Button = 100%, 2 Buttons = 50% / 50%).
- Alle Primary-/Secondary- und Ghost-Buttons auf 48px Mindesthöhe gesetzt (`border-box`).
- Toolbar in `BoxDetail.tsx` zu `flex: none; 48x48px` Icon-Squares umgebaut (`page-header__actions`).
- "Empty state" und "Page-Header" Buttons konsistent full-width (bzw. context-width) angepasst.
