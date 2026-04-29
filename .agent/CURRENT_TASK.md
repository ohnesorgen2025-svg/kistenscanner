# Current Task

## Status
- Mockup-A-Redesign ist visuell ausgerollt (AppBar + SubNav, 1240 px, JetBrains Mono für Codes, Page-Scope-Klassen pro Route).
- IA bereinigt: `/dashboard` ist entfernt, Smart-Reorganisation lebt unter `/settings` → Werkzeuge. SubNav-Tabs sind Behälter / Suchen / (disabled) Aktivität.
- `.agent/DESIGN.md` und `.agent/PROJECT_RULES.md` reflektieren den neuen Stand.
- ai-hub-Integration weiterhin stabil; `getAiHubConfig()` bleibt der lazy Lookup.

## Current Goal
Phase 2 — Funktion hinter den neuen Look bringen, ohne die Mockup-A-Tokens / Layout-Shell zu kippen.

## Next Action
- Echte Standort-Filter-Chips auf `/boxes` (statt der Demo-Liste) und Sortierung im List-View (Letzte Änderung / Items / Name).
- ⌘K-Palette mit Quick-Find verdrahten (aktuell springt sie nur auf `/`).
- Aktivität-Tab funktional anbinden — Audit-Log oder Recent-Activity, danach `disabled` entfernen.
- Bei jedem UI-Touch zuerst `.agent/DESIGN.md` lesen; neue CSS-Regeln immer scoped über die Page-Class einführen.
- Lokale Verifikation: `node screenshot_desktop.js`; ai-hub via `http://127.0.0.1:3008/api/models`.

## Open Questions
- Soll `kistenscanner.local` dauerhaft auf den LAN-Host zeigen, oder brauchen lokale Tests einen separaten Hostnamen / lokales TLS-Setup?
- CSV/JSON-Export: ersatzlos gestrichen oder als zweite Werkzeug-Karte unter Settings zurückholen, wenn jemand das wirklich braucht?
- „Verliehen“ als Filter-Chip auf `/boxes` einführen, sobald Loans aktiver genutzt werden?

## Done Recently
- Mockup-A-Redesign über alle Routen ausgerollt: AppBar, SubNav, MobileBottomNav, neue Tokens in `client/src/index.css`, Page-Scope-Klassen in allen Pages.
- BoxDetail-Toolbar auf horizontale Chip-Buttons mit `::after`-Labels umgestellt.
- `/dashboard` entfernt, `Dashboard.tsx` gelöscht, Route + SubNav-Tab „Übersicht“ aus `App.tsx` raus.
- Smart-Reorganisation als eigene Werkzeug-Sektion in `Settings.tsx` integriert (mit kurzem Hinweis-Text und vorhandener Suggestion-Liste).
- `screenshot_desktop.js` PAGES-Liste ohne Dashboard, alle 7 Screenshots laufen sauber gegen `localhost:5175`.
- Layout zentriert auf 1240 px (`appbar__inner`, `subnav__inner`, beide page-shells).
- ai-hub: `getAiHubConfig()` Lazy-Lookup verifiziert; lokale Compose-Umgebung liefert `200 OK` an `/api/models`.
