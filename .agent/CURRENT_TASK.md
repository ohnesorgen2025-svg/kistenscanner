# Current Task

## Status
- ai-hub Integration ist funktionsfähig; der Lazy-Env-Fix in `server/src/lib/ai-hub.ts` ist eingebaut und verifiziert.
- UI-Redesign nach Linear + Apple Blue Design System ist umgesetzt, dokumentiert, committed und nach `origin/main` gepusht.

## Current Goal
Sauberen Ausgangszustand für die nächsten Produktänderungen halten: ai-hub-gestützte Modellauflösung muss lokal und im LAN stabil bleiben; neue UI-Arbeit muss auf dem dokumentierten Design System in `.agent/DESIGN.md` und `.agent/PROJECT_RULES.md` aufbauen.

## Next Action
- Nächste Feature- oder Bugfix-Arbeit auf dem jetzt stabilen ai-hub-Stand aufbauen.
- Bei UI-Änderungen zuerst `.agent/DESIGN.md` und `.agent/PROJECT_RULES.md` lesen; Desktop-Navigation ist eine fixed Top Bar (`48px`, icons only), Content nutzt `padding-top: 64px` und `margin-left: 0`.
- Für lokale ai-hub-Verifikation `http://127.0.0.1:3008/api/models` verwenden.
- Für LAN-Deploys weiter den Host `192.168.44.106` per SSH + `docker compose` benutzen.

## Open Questions
- Soll `kistenscanner.local` dauerhaft auf den LAN-Host zeigen, oder brauchen lokale Tests einen separaten Hostnamen / lokales TLS-Setup?

## Done Recently
- Komplettes UI-Redesign nach Linear + Apple Blue umgesetzt: Tokens, Inter, Navigation, Box Grid, Box Detail, Search, Scanner und Add Box Screens.
- Desktop-Navigation von Left Sidebar auf fixed Top Bar (`48px`, icons only) umgestellt; Content-Offset auf `padding-top: 64px` und `margin-left: 0` dokumentiert.
- `.agent/DESIGN.md` und `.agent/PROJECT_RULES.md` entsprechend aktualisiert.
- UI-Redesign commit `74acd9e` (`feat: complete UI redesign (Linear + Apple Blue)`) und Design-System-Doku commit `32dff82` (`docs: update design system to top bar navigation`) nach `origin/main` gepusht.
- `server/src/lib/ai-hub.ts` auf Lazy-Env-Lookup via `getAiHubConfig()` umgestellt; `AI_HUB_*` werden nicht mehr beim Import eingefroren.
- Lokale Compose-Umgebung mit `AI_HUB_URL`, `AI_HUB_TOKEN` und `AI_HUB_APP_ID` in der Root-`.env` verifiziert.
- Direkter ai-hub-Call aus dem Container liefert `200 OK`.
- `http://127.0.0.1:3008/api/models` liefert lokal erfolgreich die Modellliste.
- `kistenscanner.local` zeigt auf diesem Mac aktuell auf `192.168.44.106` und ist damit kein lokaler Loopback-Testpfad.
