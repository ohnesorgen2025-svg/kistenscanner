# Deployment

## Online Status: Active
- **URL:** https://kistenscanner.ohnesorgen.net
- **Platform:** Coolify
- **Source:** GitHub `main` branch (github.com:ohnesorgen2025-svg/kistenscanner.git)
- **Container:** Docker via compose.yaml
- **Ports:** 3008 → 4001 (HTTP), 3443 → 4443 (HTTPS)

## Environment Variables (set in Coolify)
- `AI_HUB_URL` — ai-hub base URL (default: https://ai-hub.ohnesorgen.net)
- `AI_HUB_TOKEN` — Bearer token for ai-hub API
- `AI_HUB_APP_ID` — App identifier (e.g. "kistenscanner")

## Re-Deploy
Push to `main` branch, then trigger Redeploy in Coolify dashboard.

## Verify Deploy
```bash
curl https://kistenscanner.ohnesorgen.net/api/health
```
Check the `version` field to confirm the deployed code matches.

## Important
- Always test changes locally before deploying
- Build must pass (`npm run build --workspace server`) before pushing
- The app serves the built Vite client from Express (same-origin)

## Legacy (decommissioned)
~~LAN deployment via DevPilot to `kistenscanner.local` / `192.168.44.106:3008`~~
