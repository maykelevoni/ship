# PostForge — Production Deployment Guide

> How to self-host PostForge on a Hetzner VPS with HTTPS, 24/7 uptime, and zero downtime updates.

---

## Feature Overview

| Feature | Route | What It Does |
|---|---|---|
| **Dashboard** | `/` | Command center: today's pipeline, engine control, platform status grid |
| **Research** | `/research` | Scans Reddit, HN, YouTube, Google Trends, NewsAPI for content ideas |
| **Content Hub** | `/content` | Blog posts → social pieces, email drafts, opportunities |
| **Posts Library** | `/posts` | All generated pieces across platforms; filter, preview, manually publish |
| **Media Studio** | `/media-studio` | Generate images (Gemini) and render videos (Remotion); asset library |
| **Calendar** | `/calendar` | Monthly view of scheduled content by day and platform |
| **Products** | `/products` | Own products catalog; outline + chapter generation; Ghost publish |
| **Promotions** | `/promote` | Manage offers/products being promoted; geo score, opportunity analysis |
| **Settings** | `/settings` | General, API keys, templates, schedule, engine logs |
| **Worker (background)** | — | Cron: research, engine runs, scheduler, posting, blog, email drafts |

---

## What You Need Before Deploying

### Required (app won't start without these)

| Variable | Where to Get It |
|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) → new project → connection string |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your domain, e.g. `https://postforge.yourdomain.com` |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 |

### Required for core features

| Variable | Used For |
|---|---|
| `ANTHROPIC_API_KEY` | All text content generation (Claude) |
| `GEMINI_API_KEY` | Image generation + AI fallback |

### Optional integrations

| Variable | Used For |
|---|---|
| `POSTBRIDGE_API_KEY` | Social posting (Twitter, LinkedIn, Instagram, TikTok) |
| `BREVO_API_KEY` + SMTP key | Email newsletters |
| `ELEVENLABS_API_KEY` | Voiceover for videos |
| `YOUTUBE_API_KEY` | YouTube research source |
| `NEWSAPI_KEY` | NewsAPI research source |
| `GHOST_URL` + `GHOST_ADMIN_API_KEY` | Blog publishing to Ghost CMS |

---

## Step 1 — Set Up Hetzner VPS

Create a **CX22** ($6/mo, 2 vCPU, 4GB RAM) with Ubuntu 22.04 LTS. Add your SSH key during creation.

```bash
# SSH into the VPS
ssh root@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin
```

---

## Step 2 — Deploy the App

```bash
# Clone your repo onto the VPS
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /opt/postforge
cd /opt/postforge

# Create the environment file
cp .env.example .env
nano .env
```

Minimum `.env` to fill in:

```env
NEXT_PUBLIC_APP_URL=https://postforge.yourdomain.com
AUTH_SECRET=<run: openssl rand -base64 32>
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

---

## Step 3 — Configure HTTPS with Caddy

Edit `Caddyfile` (already in the repo root) and replace the domain:

```
postforge.yourdomain.com {
    reverse_proxy app:3000
}
```

Point your domain's **A record** → your VPS IP. Wait 5–30 minutes for DNS propagation.

---

## Step 4 — First Launch

```bash
cd /opt/postforge

# Build and start (first build ~5 minutes)
docker compose -f docker-compose.prod.yml up -d --build

# Follow logs
docker compose -f docker-compose.prod.yml logs -f app

# Verify healthy
curl https://postforge.yourdomain.com/api/health
# Expected: {"ok":true,"db":"connected"}
```

---

## Step 5 — First-Time Setup (in the browser)

1. Visit your domain → sign in with Google
2. Complete the **4-step onboarding wizard**
3. Go to **Settings → API Keys** and fill in:
   - Anthropic API key
   - Gemini API key
   - Enabled platforms (check the ones you want)
   - Your timezone
   - PostBridge key (if posting to social)
4. Go to **Products** → add your product
5. Go to **Promotions** → create a promotion for your product
6. Go to **Settings → Schedule** → verify posting times
7. Go to **Research** → click **Run Research** to populate topics
8. Go to **Dashboard** → click **Run Engine** → watch first content batch generate

---

## Keeping It Running 24/7

The Docker `restart: unless-stopped` policy means the container automatically restarts after VPS reboots. No additional setup required.

### Update after a code push

```bash
cd /opt/postforge
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Useful commands

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Shell into container
docker compose -f docker-compose.prod.yml exec app sh

# Stop everything
docker compose -f docker-compose.prod.yml down
```

### Free uptime monitoring

Sign up at [UptimeRobot](https://uptimerobot.com) (free) → add HTTP monitor for:
```
https://postforge.yourdomain.com/api/health
```
Check interval: 5 minutes. You'll get email/SMS if it goes down.

---

## Google OAuth Setup

In [Google Cloud Console](https://console.cloud.google.com):

1. Create a project → Enable **Google+ API**
2. **Credentials** → Create **OAuth 2.0 Client ID** (Web application)
3. Authorized redirect URIs:
   ```
   https://postforge.yourdomain.com/api/auth/callback/google
   ```
4. Copy Client ID + Secret into `.env`

---

## Important Notes

| Item | Note |
|---|---|
| **Remotion WSL2 bug** | Does NOT apply on a real Linux VPS — only affects local WSL2 dev |
| **Media files** | Stored in `./media/` Docker volume — persists across deploys |
| **DB migrations** | Run automatically at container start (`prisma migrate deploy`) |
| **Worker cron** | Runs inside the same container as Next.js via `concurrently` |
| **Gate mode** | Enable in Settings if you want to approve content before it posts |
| **API keys** | Set via Settings UI (stored in DB) — no container restart needed after changing them |
| **pnpm** | Always use `pnpm` locally, not `npm` (260-char path limit on WSL2+OneDrive) |

---

## Architecture Reference

```
docker-compose.prod.yml
  ├── app       — Next.js 14 + Worker (concurrently), port 3000
  └── caddy     — Reverse proxy + automatic HTTPS, ports 80/443

External services:
  ├── Neon      — PostgreSQL database
  ├── Anthropic — Claude text generation
  ├── Gemini    — Image generation + AI fallback
  ├── PostBridge — Social platform posting
  ├── Brevo     — Email newsletter delivery
  └── Ghost     — Blog CMS (optional, self-hosted)
```
