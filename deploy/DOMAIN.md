# Production domain — ESMS

| | |
|---|---|
| **Production URL** | https://esms.essprmsc.com |
| **VM IP** | `115.186.164.190` |
| **Platform ops** | [essprmsc-platform](https://github.com/YOUR_ORG/essprmsc-platform) |

DNS, TLS, and rollout checklists live in the **platform repo**, not here.

## Start here

→ **[Master checklist](https://github.com/YOUR_ORG/essprmsc-platform/blob/main/runbooks/MASTER-CHECKLIST.md)**

ESMS-specific HTTPS steps:

→ **[04-https-esms.md](https://github.com/YOUR_ORG/essprmsc-platform/blob/main/runbooks/04-https-esms.md)**

## App-specific config (production)

Host Nginx terminates TLS; Docker edge binds to localhost:

```env
# .env
WEB_HTTP_PORT=127.0.0.1:8080
```

Install site config from this repo:

```bash
sudo cp deploy/host-nginx/esms.essprmsc.com.conf /etc/nginx/sites-available/
```

No `CORS_ORIGINS` change needed — API is same-origin at `/api`.

**Mobile app** — set in `Mobile/.env` (rebuild APK after changing):

```env
# Until certbot/TLS is live on the VM:
API_BASE_URL=http://esms.essprmsc.com/api

# After HTTPS (port 443) is working:
# API_BASE_URL=https://esms.essprmsc.com/api
```

Verify TLS before switching mobile to `https://`:

```bash
curl -sS https://esms.essprmsc.com/api/health
```

Replace `YOUR_ORG` with your GitHub organization after pushing `essprmsc-platform`.
