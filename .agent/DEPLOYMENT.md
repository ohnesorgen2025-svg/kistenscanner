# Deployment

## LAN Status: Active
- **URL:** http://kistenscanner.local
- **LAN URL (IP):** http://192.168.44.106:3008
- **Host:** 192.168.44.106
- **Port:** 3008
- **Local Domain:** kistenscanner.local
- **Deploy Path:** /home/stefan/apps/kistenscanner
- **Last Deploy:** 2026-03-31T12:43:30.848Z

## Re-Deploy
After pushing changes to main, re-deploy with:
```bash
ssh -i ~/.ssh/id_ed25519 stefan@192.168.44.106 "cd /home/stefan/apps/kistenscanner && git checkout -- . && git clean -fd && git pull --ff-only && docker compose down --remove-orphans && docker compose up -d --build"
```

## Important
- Always test changes locally before deploying
- Check container logs after deploy: `ssh -i ~/.ssh/id_ed25519 stefan@192.168.44.106 "cd /home/stefan/apps/kistenscanner && docker compose logs --tail 30"`
- The app is accessible in the LAN at the URL above
