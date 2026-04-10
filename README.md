# PostForge

> AI-powered content engine that turns a single promotion into scheduled posts across every major platform — automatically.

Launch is an open-source, self-hosted tool that generates platform-specific content from your product or service description, then distributes it across Twitter, LinkedIn, Reddit, Instagram, TikTok, and email on a configurable schedule. It uses Claude (with Gemini as fallback) for text generation, generates images via Gemini, renders short-form videos with Remotion, and posts everything through the post-bridge API.

---

## Features

- **Multi-platform content generation** — One promotion → Twitter thread, LinkedIn post, Reddit post, Instagram caption, TikTok script, email newsletter
- **AI provider fallback** — Tries Claude first; falls back to Gemini automatically on rate limits or failures
- **Configurable templates** — Per-platform character limits, image/video flags, tone instructions
- **Flexible scheduling** — Set posting times and days of week per platform
- **Gate mode** — Approve generated content before it goes live
- **Media generation** — Auto-generates post images (Gemini) and short-form videos (Remotion, 1080×1920 MP4)
- **Research pipeline** — Daily research from YouTube, Reddit, and NewsAPI; topics scored by engagement and relevance
- **Blog generation** — Writes a long-form SEO blog post from top research and publishes it to Ghost automatically
- **Social repurposing** — All social formats generated from the blog post (not the promotion) for content-driven days
- **Email drafts** — Drafts a newsletter from each blog post; editable and sendable via Brevo from the dashboard
- **Opportunities analysis** — AI scans research for affiliate deals, ghost-writing offers, digital product ideas, and market gaps
- **Calendar & queue** — Visual calendar, content queue, detailed engine logs
- **Research Products tab** — AI-powered affiliate product search from research topics; add products to own-products
- **Media Studio** — Asset library for generated images and videos; browse, filter, regenerate
- **Own Products** — Generate outlines and write chapters for digital products; publish to Ghost
- **Posts library** — All generated content pieces across all platforms; filter by status, preview, manually publish
- **Geo audit** — Scores your promotion description for geographic targeting relevance
- **Real-time updates** — Dashboard updates via Server-Sent Events
- **Self-hosted** — Docker support, runs on any VPS or Vercel

---

## Stack

| Layer            | Technology                       | /   |
| ---------------- | -------------------------------- | --- |
| Framework        | Next.js 14 (App Router)          |
| Language         | TypeScript 5                     |
| Styling          | Inline styles (no CSS framework) |
| Auth             | Auth.js (Google OAuth, GitHub)   |
| Database         | PostgreSQL via Prisma ORM        |
| AI (primary)     | Anthropic Claude API             |
| AI (fallback)    | Google Gemini API                |
| Video rendering  | Remotion                         |
| Image generation | Gemini API                       |
| Social posting   | post-bridge API                  |
| Email            | Brevo                            |
| Background jobs  | node-cron (worker process)       |
| Testing          | Playwright E2E                   |
| Package manager  | pnpm                             |

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

# 5. Start the app (Next.js + worker in parallel)
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
GOOGLE_CLIENT_ID=              # From Google Cloud Console
GOOGLE_CLIENT_SECRET=
GITHUB_OAUTH_TOKEN=            # Optional: GitHub OAuth app secret

# Database
DATABASE_URL=                  # postgres://user:pass@host/dbname?sslmode=require

# AI
ANTHROPIC_API_KEY=             # From console.anthropic.com
GEMINI_API_KEY=                # From aistudio.google.com (also used as fallback)

# Social posting (https://postbridge.io)
POSTBRIDGE_API_KEY=
```

### In-app settings

Additional settings are stored in the database and configured via the Settings page:

| Setting               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `timezone`            | Posting timezone (e.g. `America/New_York`)        |
| `gate_mode`           | `true` to require manual approval before posting  |
| `enabled_platforms`   | JSON array of active platforms                    |
| `youtube_api_key`     | YouTube Data API v3 key (research pipeline)       |
| `newsapi_key`         | NewsAPI.org key (research pipeline)               |
| `ghost_url`           | Ghost instance URL (e.g. `http://localhost:2368`) |
| `ghost_admin_api_key` | Ghost Admin API key for publishing                |
| `gemini_api_key`      | Gemini API key for image generation               |
| `brevo_api_key`       | Brevo API key for email sending                   |
| `brevo_sender_email`  | Sender email address for Brevo                    |
| `brevo_sender_name`   | Sender display name for Brevo                     |
| `brevo_to_email`      | Recipient email address for newsletters           |

---

## Usage

### 1. Add a promotion

A **promotion** is a product or service you want to generate content for. Go to **Promote** → **Add Promotion** and fill in:

- **Name** — e.g. "My SaaS tool"
- **Type** — `saas`, `ebook`, `service`, `affiliate`, etc.
- **URL** — Landing page or product URL
- **Description** — The full pitch (benefits, target audience, use cases)
- **Weight** — Rotation priority if you have multiple promotions

### 2. Configure templates (optional)

Default templates are seeded automatically for all platforms. Go to **Settings → Templates** to customize:

- Character limits
- Whether to include an image or video
- AI tone instructions per platform

### 3. Set your schedule (optional)

Default schedule is seeded on startup:

| Platform     | Default time |
| ------------ | ------------ |
| Twitter      | 9:00 AM      |
| LinkedIn     | 10:00 AM     |
| TikTok/Video | 11:00 AM     |
| Reddit       | 12:00 PM     |
| Instagram    | 2:00 PM      |
| Email        | 5:00 PM      |

Go to **Settings → Schedule** to change times and days of week.

### 4. Let it run

The worker process runs on startup and triggers content generation + posting on your configured schedule. You can also trigger a manual run from **Settings** → **Run Engine Now**.

### 5. Monitor

The app has 8 navigation destinations:

- **Today** (`/`) — Command center: today's pipeline status, engine control, platform grid
- **Research** (`/research`) — Research hub: Content tab (trending topics → blog generation) and Products tab (affiliate product search)
- **Content** (`/content`) — Blog posts with their social pieces, email drafts, and opportunities
- **Posts** (`/posts`) — All platform content pieces: filter by status, preview, manually publish
- **Media** (`/media-studio`) — Image and video asset library; generate images and render videos
- **Calendar** (`/calendar`) — Monthly calendar showing scheduled content by day
- **Products** (`/products`) — Own digital products: outline generation, chapter writing, publishing
- **Settings** (`/settings`) — General, API Keys, Templates, Schedule, Logs

---

## Architecture

```
launch/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Main app pages (8 nav destinations)
│   │   ├── page.tsx        # Today — command center
│   │   ├── research/       # Research hub — Content + Products tabs
│   │   ├── content/        # Content — blog posts, social pieces, email drafts, opps
│   │   ├── posts/          # Posts library — all platform pieces, filter + preview
│   │   ├── media-studio/   # Media Studio — image and video asset library
│   │   ├── calendar/       # Calendar — scheduled content by day
│   │   ├── products/       # Own Products — outlines, chapters, publishing
│   │   └── settings/       # Settings — General, API Keys, Templates, Schedule, Logs
│   ├── (auth)/             # Sign in / sign up
│   ├── (marketing)/        # Landing pages
│   └── api/                # REST API routes
│       ├── research/
│       │   └── products/   # AI affiliate product search
│       └── ...             # (promotions, blog, email, queue, etc.)
│
├── worker/                 # Background job process
│   ├── index.ts            # Worker entry (registers crons)
│   ├── engine/             # Content generation
│   │   ├── run.ts          # Daily orchestrator
│   │   ├── generate.ts     # Multi-platform content gen
│   │   ├── geo-audit.ts    # Geographic relevance scoring
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
│   │   └── from-blog.ts    # Repurpose blog into all platforms
│   ├── email/              # Email draft generation
│   │   └── draft.ts        # Draft from blog post via Claude
│   ├── opportunities/      # Opportunity analysis
│   │   └── analyze.ts      # Scan research for monetisation signals
│   ├── posting/            # Distribution
│   │   ├── scheduler.ts    # Per-platform posting
│   │   ├── post-bridge.ts  # post-bridge API client
│   │   └── brevo.ts        # Email posting via Brevo
│   └── media/              # Media generation
│       ├── image.ts        # PNG generation via Gemini
│       ├── video.ts        # MP4 rendering via Remotion
│       └── studio.ts       # Media asset library management
│
├── lib/                    # Shared utilities
│   ├── ai.ts               # Claude → Gemini fallback wrapper
│   ├── claude.ts           # Anthropic SDK wrapper
│   ├── db.ts               # Prisma client singleton
│   ├── settings.ts         # DB settings helpers
│   └── seeds.ts            # Default templates + schedule
│
├── components/             # React components
├── prisma/                 # Database schema + migrations
├── content/                # MDX docs + blog content
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
         └── (Optional) Image + Video generation
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
| `Promotion`            | Product/service being promoted                                   |
| `ContentPiece`         | Generated post for a specific platform                           |
| `Template`             | Platform-specific generation instructions                        |
| `ScheduleEntry`        | When to post on each platform                                    |
| `EngineRun`            | Log of each engine execution                                     |
| `Setting`              | Key-value app configuration                                      |
| `User`                 | Auth user with role (ADMIN/USER)                                 |
| `ResearchTopic`        | Daily research topic with engagement score and source            |
| `BlogPost`             | AI-generated blog post with Ghost publish status                 |
| `EmailDraft`           | Newsletter draft generated from a blog post                      |
| `Opportunity`          | Monetisation signal (affiliate, product gap, etc.) from research |
| `MediaAsset`           | Generated image or video file with metadata                      |
| `PromotionOpportunity` | Affiliate/product opportunity found in research                  |
| `OwnProduct`           | Digital product the user is building                             |
| `OwnProductChapter`    | Individual chapter of an own product                             |

---

## API Reference

All endpoints are under `/api/`.

### Promotions

| Method   | Path                            | Description             |
| -------- | ------------------------------- | ----------------------- |
| `GET`    | `/api/promotions`               | List all promotions     |
| `POST`   | `/api/promotions`               | Create a promotion      |
| `GET`    | `/api/promotions/:id`           | Get promotion by ID     |
| `PATCH`  | `/api/promotions/:id`           | Update promotion        |
| `DELETE` | `/api/promotions/:id`           | Delete promotion        |
| `POST`   | `/api/promotions/:id/geo-audit` | Run geo relevance audit |

### Queue

| Method   | Path             | Description            |
| -------- | ---------------- | ---------------------- |
| `GET`    | `/api/queue`     | List content pieces    |
| `GET`    | `/api/queue/:id` | Get content piece      |
| `PATCH`  | `/api/queue/:id` | Update (approve, edit) |
| `DELETE` | `/api/queue/:id` | Delete content piece   |

### Templates

| Method   | Path                 | Description        |
| -------- | -------------------- | ------------------ |
| `GET`    | `/api/templates`     | List all templates |
| `POST`   | `/api/templates`     | Create template    |
| `PATCH`  | `/api/templates/:id` | Update template    |
| `DELETE` | `/api/templates/:id` | Delete template    |

### Schedule

| Method   | Path                | Description           |
| -------- | ------------------- | --------------------- |
| `GET`    | `/api/schedule`     | List schedule entries |
| `POST`   | `/api/schedule`     | Create entry          |
| `PATCH`  | `/api/schedule/:id` | Update entry          |
| `DELETE` | `/api/schedule/:id` | Delete entry          |

### Research

| Method | Path                    | Description              |
| ------ | ----------------------- | ------------------------ |
| `GET`  | `/api/research`         | Today's research topics  |
| `POST` | `/api/research/refresh` | Re-run research pipeline |

### Blog

| Method | Path                   | Description                  |
| ------ | ---------------------- | ---------------------------- |
| `GET`  | `/api/blog`            | Today's blog post            |
| `POST` | `/api/blog/regenerate` | Regenerate today's blog post |

### Email Drafts

| Method  | Path                         | Description         |
| ------- | ---------------------------- | ------------------- |
| `GET`   | `/api/email-drafts`          | List email drafts   |
| `PATCH` | `/api/email-drafts/:id`      | Update subject/body |
| `POST`  | `/api/email-drafts/:id/send` | Send via Brevo      |

### Opportunities

| Method  | Path                     | Description                 |
| ------- | ------------------------ | --------------------------- |
| `GET`   | `/api/opportunities`     | List opportunities          |
| `PATCH` | `/api/opportunities/:id` | Update status (act/dismiss) |

### Other

| Method | Path              | Description               |
| ------ | ----------------- | ------------------------- |
| `GET`  | `/api/settings`   | Get all settings          |
| `POST` | `/api/settings`   | Batch update settings     |
| `GET`  | `/api/calendar`   | Calendar data for a month |
| `POST` | `/api/engine/run` | Trigger engine manually   |
| `GET`  | `/api/logs`       | Fetch engine run logs     |
| `GET`  | `/api/stream`     | Server-Sent Events stream |

---

## Docker

```bash
# Build and start with Docker Compose
docker-compose up

# Or build manually
docker build -t launch .
docker run -p 3000:3000 --env-file .env launch
```

The Dockerfile uses a multi-stage build. The worker process runs alongside the Next.js server via `concurrently`.

---

## Development

```bash
# Run dev server + worker
pnpm dev

# Run tests (Playwright E2E)
pnpm test

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
