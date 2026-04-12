# PostForge

> AI-powered content engine that turns a single promotion into scheduled posts across every major platform — automatically.

PostForge is an open-source, self-hosted tool that generates platform-specific content from your product or service description, then distributes it across Twitter, LinkedIn, Reddit, Instagram, TikTok, and email on a configurable schedule. It uses Claude (with Gemini as fallback) for text generation, generates images via Gemini, and posts everything through the post-bridge API.

---

## Features

- **Multi-platform content generation** — One promotion → Twitter thread, LinkedIn post, Reddit post, Instagram caption, TikTok script, email newsletter
- **AI provider fallback** — Tries Claude first; falls back to Gemini automatically on rate limits or failures
- **Configurable templates** — Per-platform character limits, image/video flags, tone instructions
- **Flexible scheduling** — Set posting times and days of week per platform
- **Gate mode** — Approve generated content before it goes live
- **Image generation** — Auto-generates post images via Gemini API
- **Research pipeline** — Daily research from YouTube, Reddit, and NewsAPI; topics scored by engagement and relevance
- **Blog generation** — Writes a long-form SEO blog post from top research and publishes it to Ghost automatically
- **Social repurposing** — All social formats generated from the blog post for content-driven days
- **Email drafts** — Drafts a newsletter from each blog post; editable from the dashboard; export for Systeme.io
- **Opportunities analysis** — AI scans research for affiliate deals, ghost-writing offers, digital product ideas, and market gaps
- **Calendar & queue** — Visual calendar, content queue, detailed engine logs
- **Research Products tab** — AI-powered affiliate product search from research topics; add products to own-products
- **Media Studio** — Asset library for generated images; browse, filter, regenerate
- **Own Products** — Generate outlines and write chapters for digital products; cover image generation; publish to Ghost
- **Posts library** — All generated content pieces across all platforms; filter by status, preview, manually publish
- **Autopilot** — Rule-based automation engine; schedule recurring actions on a custom timetable
- **Systeme.io integration** — Funnel URLs, product IDs, and UTM tracking on promotions and own products
- **Real-time updates** — Dashboard updates via Server-Sent Events
- **Self-hosted** — Docker support, runs on any VPS

---

## Stack

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | Next.js 14 (App Router)                |
| Language         | TypeScript 5                           |
| Styling          | Inline styles (no CSS framework)       |
| Auth             | Auth.js — credentials + Google OAuth   |
| Database         | PostgreSQL via Prisma ORM              |
| AI (primary)     | Anthropic Claude API (`claude-sonnet-4-6`) |
| AI (fallback)    | Google Gemini API                      |
| Image generation | Gemini API (`gemini-3.1-flash-image-preview`) |
| Social posting   | post-bridge API                        |
| Background jobs  | node-cron (worker process)             |
| Testing          | Playwright E2E                         |
| Package manager  | pnpm                                   |

---

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (local or [Neon](https://neon.tech))
- Accounts and API keys for the services you want to use (see Configuration)

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/postforge.git
cd postforge

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values (see Configuration section below)

# 4. Run database migrations
pnpm exec prisma migrate dev

# 5. Create your login account
pnpm exec prisma studio
# Or use the register page at http://localhost:3000/register

# 6. Start the app (Next.js + worker in parallel)
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication (Auth.js)
AUTH_SECRET=                   # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=              # From Google Cloud Console (optional)
GOOGLE_CLIENT_SECRET=          # From Google Cloud Console (optional)

# Database
DATABASE_URL=                  # postgres://user:pass@host/dbname?sslmode=require

# AI
ANTHROPIC_API_KEY=             # From console.anthropic.com
```

### In-app settings

Additional settings are stored in the database and configured via the Settings page:

| Setting                      | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `timezone`                   | Posting timezone (e.g. `America/New_York`)        |
| `gate_mode`                  | `true` to require manual approval before posting  |
| `enabled_platforms`          | JSON array of active platforms                    |
| `anthropic_api_key`          | Claude API key for content generation             |
| `gemini_api_key`             | Gemini API key for image generation + AI fallback |
| `openrouter_api_key`         | OpenRouter API key (alternative AI provider)      |
| `postbridge_api_key`         | post-bridge API key for social posting            |
| `youtube_api_key`            | YouTube Data API v3 key (research pipeline)       |
| `newsapi_key`                | NewsAPI.org key (research pipeline)               |
| `ghost_url`                  | Ghost instance URL (e.g. `http://localhost:2368`) |
| `ghost_admin_api_key`        | Ghost Admin API key for publishing                |
| `elevenlabs_api_key`         | ElevenLabs API key (audio generation)             |
| `systeme_domain`             | Your Systeme.io subdomain                         |
| `systeme_default_funnel_url` | Default funnel landing page URL                   |
| `systeme_api_key`            | Systeme.io API key                                |

---

## Usage

### 1. Create an account

Go to `http://localhost:3000/register` and create your account with email + password, or sign in with Google OAuth if configured.

### 2. Add a promotion

A **promotion** is a product or service you want to generate content for. Go to **Promote** → **Add Promotion** and fill in:

- **Name** — e.g. "My SaaS tool"
- **Type** — `saas`, `ebook`, `service`, `affiliate`, etc.
- **URL** — Landing page or product URL
- **Description** — The full pitch (benefits, target audience, use cases)
- **Priority** — Rotation priority if you have multiple promotions

### 3. Configure templates (optional)

Default templates are seeded automatically for all platforms. Go to **Settings → Templates** to customize:

- Character limits
- Whether to include an image or video
- AI tone instructions per platform

### 4. Set your schedule (optional)

Default schedule is seeded on startup:

| Platform  | Default time |
| --------- | ------------ |
| Twitter   | 9:00 AM      |
| LinkedIn  | 10:00 AM     |
| Reddit    | 12:00 PM     |
| Instagram | 2:00 PM      |
| Email     | 5:00 PM      |

Go to **Settings → Schedule** to change times and days of week.

### 5. Let it run

The worker process runs on startup and triggers content generation + posting on your configured schedule. You can also trigger a manual run from **Settings** → **Run Engine Now**.

### 6. Monitor

The app has 9 navigation destinations:

- **Today** (`/`) — Command center: today's pipeline status, engine control, platform grid
- **Research** (`/research`) — Research hub: Content tab (trending topics → blog generation) and Products tab (affiliate product search)
- **Content** (`/content`) — Blog posts with their social pieces, email drafts, and opportunities
- **Posts** (`/posts`) — All platform content pieces: filter by status, preview, manually publish
- **Media** (`/media-studio`) — Image asset library; generate and regenerate images
- **Calendar** (`/calendar`) — Monthly calendar showing scheduled content by day
- **Products** (`/products`) — Own digital products: outline generation, chapter writing, cover images, publishing
- **Autopilot** (`/autopilot`) — Rule-based automation: Full Autopilot mode and Custom Schedule tab
- **Settings** (`/settings`) — General, API Keys, Templates, Schedule, Logs

---

## Architecture

```
launch/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Main app pages (9 nav destinations)
│   │   ├── page.tsx        # Today — command center
│   │   ├── research/       # Research hub — Content + Products tabs
│   │   ├── content/        # Content — blog posts, social pieces, email drafts, opps
│   │   ├── posts/          # Posts library — all platform pieces, filter + preview
│   │   ├── media-studio/   # Media Studio — image asset library
│   │   ├── calendar/       # Calendar — scheduled content by day
│   │   ├── products/       # Own Products — outlines, chapters, cover images, publishing
│   │   ├── autopilot/      # Autopilot — rule engine + custom schedule
│   │   └── settings/       # Settings — General, API Keys, Templates, Schedule, Logs
│   ├── (auth)/             # Sign in / sign up / register
│   ├── (marketing)/        # Landing pages
│   └── api/                # REST API routes
│
├── worker/                 # Background job process
│   ├── index.ts            # Worker entry (registers crons, loads autopilot rules)
│   ├── engine/             # Content generation
│   │   ├── run.ts          # Daily orchestrator
│   │   ├── generate.ts     # Multi-platform content gen
│   │   └── rotation.ts     # Promotion rotation logic
│   ├── research/           # Research pipeline
│   │   ├── youtube.ts      # YouTube Data API fetcher
│   │   ├── reddit.ts       # Reddit JSON fetcher
│   │   ├── newsapi.ts      # NewsAPI fetcher
│   │   ├── score.ts        # Engagement scoring + dedup
│   │   └── products.ts     # AI affiliate product search
│   ├── blog/               # Blog pipeline
│   │   ├── generate.ts     # Long-form post generation
│   │   └── ghost.ts        # Ghost Admin API publisher
│   ├── repurpose/          # Blog → social formats
│   ├── email/              # Email draft generation
│   ├── opportunities/      # Opportunity analysis
│   ├── posting/            # Distribution
│   │   ├── scheduler.ts    # Per-platform posting
│   │   └── post-bridge.ts  # post-bridge API client
│   └── media/              # Media generation
│       ├── image.ts        # PNG generation via Gemini
│       ├── video.ts        # MP4 rendering (disabled by default)
│       └── studio.ts       # Media asset library management
│
├── lib/                    # Shared utilities
│   ├── ai.ts               # Claude → Gemini fallback wrapper
│   ├── claude.ts           # Anthropic SDK wrapper
│   ├── db.ts               # Prisma client singleton
│   ├── settings.ts         # DB settings helpers
│   ├── utm.ts              # UTM URL builder for Systeme.io
│   └── seeds.ts            # Default templates + schedule
│
├── components/             # React components
├── prisma/                 # Database schema + migrations
└── tests/                  # Playwright E2E tests
```

### How content generation works

**Promotion pipeline** (runs daily from a scheduled promotion):

```
Promotion
    │
    ▼
Master piece (long-form email draft via Claude)
    │
    ├── Twitter thread
    ├── LinkedIn post
    ├── Reddit post
    ├── Instagram caption
    ├── TikTok script
    └── Email newsletter
         │
         └── (Optional) Image generation via Gemini
                  │
                  ▼
             post-bridge API → each platform
```

**Research → Blog pipeline** (runs on a separate daily schedule):

```
Research sources (YouTube + Reddit + NewsAPI)
    │
    ▼
Score & deduplicate → ResearchTopic records
    │
    ▼
Top topic → Long-form SEO blog post (Claude) → Ghost CMS
    │
    ├── Repurpose into all social formats → Queue
    ├── Email draft (Claude) → Email Drafts dashboard
    └── Opportunities analysis (Claude) → Opportunities dashboard
```

### AI fallback

`lib/ai.ts` wraps both providers with automatic fallback:

1. Call Claude with the prompt
2. On HTTP 429 (rate limit), 5xx, or 30s timeout → switch to Gemini
3. Store provider used (`claude` or `gemini`) on each `ContentPiece`
4. Dashboard shows a badge when Gemini was used

---

## Database Schema

Key models:

| Model                  | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `Promotion`            | Product/service being promoted (with Systeme.io fields)          |
| `ContentPiece`         | Generated post for a specific platform                           |
| `Template`             | Platform-specific generation instructions                        |
| `ScheduleEntry`        | When to post on each platform                                    |
| `AutopilotRule`        | Rule-based automation configuration                              |
| `EngineRun`            | Log of each engine execution                                     |
| `Setting`              | Key-value app configuration                                      |
| `User`                 | Auth user (email + password or Google OAuth)                     |
| `ResearchTopic`        | Daily research topic with engagement score and source            |
| `BlogPost`             | AI-generated blog post with Ghost publish status                 |
| `EmailDraft`           | Newsletter draft generated from a blog post                      |
| `PromotionOpportunity` | Affiliate/product opportunity found in research                  |
| `MediaAsset`           | Generated image file with metadata                               |
| `OwnProduct`           | Digital product the user is building (with cover image + Systeme.io fields) |

---

## Development

```bash
# Run dev server + worker
pnpm dev

# Run Playwright E2E tests
# First, create the test user (once):
pnpm tsx scripts/create-test-user.ts
# Then run:
npx playwright test

# Run Prisma Studio (DB browser)
pnpm exec prisma studio

# Generate Prisma client after schema changes
pnpm exec prisma generate

# Create a migration
pnpm exec prisma migrate dev --name your-migration-name

# Lint
pnpm lint

# Format
pnpm format
```

---

## Docker

```bash
# Build and start with Docker Compose
docker-compose up

# Or build manually
docker build -t postforge .
docker run -p 3000:3000 --env-file .env postforge
```

The Dockerfile uses a multi-stage build. The worker process runs alongside the Next.js server via `concurrently`.

---

## Deployment

See **[docs/production-deployment.md](./docs/production-deployment.md)** for the full guide to self-hosting PostForge on a Hetzner VPS with HTTPS and 24/7 uptime — including Docker setup, Caddy SSL, Google OAuth, and update workflow.

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `feat:`, `fix:`, `chore:`, etc.
4. Open a pull request against `main`

For large changes, open an issue first to discuss the approach.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
