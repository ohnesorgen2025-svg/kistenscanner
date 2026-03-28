# Deployment

## LAN Status: Active
- **URL:** http://kistenscanner.local
- **LAN URL (IP):** http://192.168.44.106:3008
- **Host:** 192.168.44.106
- **Port:** 3008
- **Local Domain:** kistenscanner.local
- **Deploy Path:** /home/stefan/apps/kistenscanner
- **Last Deploy:** 2026-03-28T15:56:10.757Z

## Status
- Confirmed live via DevPilot on `2026-03-28`
- Verified `GET /api/health` returns `200 OK`
- Verified `GET /` serves the app via Caddy + Express

## Runtime
- Container app port: `4001`
- Published LAN port: `3008`
- Re-deploy: DevPilot
- VM env file consumed by container: `data/.env`

## Persistence
- Data directory: `./data`
- Docker volume: `./data:/app/data`

## Re-Deploy
After pushing changes to main, re-deploy with:
```bash
ssh -i ~/.ssh/id_ed25519 stefan@192.168.44.106 "cd /home/stefan/apps/kistenscanner && git checkout -- . && git clean -fd && git pull --ff-only && docker compose down --remove-orphans && docker compose up -d --build"
```

## Important
- Always test changes locally before deploying
- Check container logs after deploy: `ssh -i ~/.ssh/id_ed25519 stefan@192.168.44.106 "cd /home/stefan/apps/kistenscanner && docker compose logs --tail 30"`
- The app is accessible in the LAN at the URL above
