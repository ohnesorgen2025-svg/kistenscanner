# Current Task

## Status
- ai-hub Integration ist funktionsfähig; der Lazy-Env-Fix in `server/src/lib/ai-hub.ts` ist eingebaut und verifiziert.

## Current Goal
Sauberen Ausgangszustand für die nächsten Produktänderungen halten: ai-hub-gestützte Modellauflösung muss lokal und im LAN stabil bleiben.

## Next Action
- Nächste Feature- oder Bugfix-Arbeit auf dem jetzt stabilen ai-hub-Stand aufbauen.
- Für lokale ai-hub-Verifikation `http://127.0.0.1:3008/api/models` verwenden.
- Für LAN-Deploys weiter den Host `192.168.44.106` per SSH + `docker compose` benutzen.

## Open Questions
- Soll `kistenscanner.local` dauerhaft auf den LAN-Host zeigen, oder brauchen lokale Tests einen separaten Hostnamen / lokales TLS-Setup?

## Done Recently
- `server/src/lib/ai-hub.ts` auf Lazy-Env-Lookup via `getAiHubConfig()` umgestellt; `AI_HUB_*` werden nicht mehr beim Import eingefroren.
- Lokale Compose-Umgebung mit `AI_HUB_URL`, `AI_HUB_TOKEN` und `AI_HUB_APP_ID` in der Root-`.env` verifiziert.
- Direkter ai-hub-Call aus dem Container liefert `200 OK`.
- `http://127.0.0.1:3008/api/models` liefert lokal erfolgreich die Modellliste.
- `kistenscanner.local` zeigt auf diesem Mac aktuell auf `192.168.44.106` und ist damit kein lokaler Loopback-Testpfad.
