# Deployment

## Production: Coolify (online)
- **Trigger:** Manuell. Nach `git push origin main` auf der Coolify-Oberfläche „Redeploy" klicken.
- **Quelle:** GitHub `main`. Was nicht gepusht ist, geht nicht live.
- **Webhook:** bewusst nicht eingerichtet — Halbfertiges darf auf `main` liegen, ohne sofort online zu gehen.

## Local Compose Runtime (Verifikation)
- **HTTP:** http://127.0.0.1:3008
- **HTTPS Port:** https://127.0.0.1:3443 (nur wenn Zertifikate unter `data/certs/` liegen; sonst HTTP nutzen)
- **ai-hub Check:** `curl -sS http://127.0.0.1:3008/api/models`
- **Compose Env Source:** root `.env` neben `compose.yaml`

```bash
cd /Users/stefansorgenfrey/dev/kistenscanner
docker compose down --remove-orphans
docker compose up -d --build
```

## Workflow für Änderungen
1. Lokal in den Dev-Servern (Vite + Node) arbeiten.
2. Optional: `node screenshot_desktop.js` für visuelle Checks.
3. Optional: Compose-Run starten und `curl` gegen `/api/models`.
4. `git commit` (Conventional Commits) und `git push origin main`.
5. In Coolify auf „Redeploy" klicken, sobald der Stand veröffentlicht werden soll.

## Später (nicht aktiv)
Eine LAN-Runtime auf `192.168.44.106` (`kistenscanner.local`) ist denkbar, aber aktuell nicht in Betrieb. Wird bei Bedarf separat wieder aufgesetzt.
