# Deployment

## Shared LAN Runtime
- **Hostname:** http://kistenscanner.local
- **LAN URL (HTTP):** http://192.168.44.106:3008
- **LAN URL (HTTPS):** https://192.168.44.106:3443
- **Host:** 192.168.44.106
- **Deploy Path:** /home/stefan/apps/kistenscanner
- **Last Deploy:** 2026-04-10T09:14:58.024Z
- **Note:** On the current dev Mac, `kistenscanner.local` resolves to `192.168.44.106`, not to localhost.

## Local Compose Runtime
- **HTTP:** http://127.0.0.1:3008
- **HTTPS Port:** https://127.0.0.1:3443
- **Note:** Local HTTPS only works if certificates exist under `data/certs/`; otherwise the HTTP endpoint is the reliable local verification path.
- **ai-hub Check:** `http://127.0.0.1:3008/api/models`
- **Compose Env Source:** root `.env` next to `compose.yaml`

## Re-Deploy LAN
After pushing changes to `main`, re-deploy the shared LAN host with:
```bash
ssh -i ~/.ssh/id_ed25519 stefan@192.168.44.106 "cd /home/stefan/apps/kistenscanner && git pull --ff-only && docker compose down --remove-orphans && docker compose up -d --build"
```

## Re-Deploy Local
For local verification on the dev machine:
```bash
cd /Users/stefansorgenfrey/dev/kistenscanner
docker compose down --remove-orphans
docker compose up -d --build
```

## Important
- Test changes locally before LAN deploys.
- After ai-hub or env changes, verify with `curl -sS http://127.0.0.1:3008/api/models`.
- Check LAN logs with `ssh -i ~/.ssh/id_ed25519 stefan@192.168.44.106 "cd /home/stefan/apps/kistenscanner && docker compose logs --tail 30"`.
