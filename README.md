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
- **Calendar & queue** — Visual calendar, content queue, detailed engine logs
- **Geo audit** — Scores your promotion description for geographic targeting relevance
- **Real-time updates** — Dashboard updates via Server-Sent Events
- **Self-hosted** — Docker support, runs on any VPS or Vercel

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Auth.js (Google OAuth, GitHub) |
| Database | PostgreSQL via Prisma ORM |
| AI (primary) | Anthropic Claude API |
| AI (fallback) | Google Gemini API |
| Video rendering | Remotion |
| Image generation | Gemini API |
| Social posting | post-bridge API |
| Email | Resend |
| Background jobs | node-cron (worker process) |
| Testing | Playwright E2E |
| Package manager | pnpm |

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

# Email
RESEND_API_KEY=                # From resend.com
RESEND_FROM_EMAIL=             # e.g. noreply@yourdomain.com
```

### In-app settings

Additional settings are stored in the database and configured via the Settings page:

| Setting | Description |
|---|---|
| `timezone` | Posting timezone (e.g. `America/New_York`) |
| `gate_mode` | `true` to require manual approval before posting |
| `enabled_platforms` | JSON array of active platforms |

---

## Usage

### 1. Add a promotion

A **promotion** is a product or service you want to generate content for. Go to **Promotions** → **New Promotion** and fill in:

- **Name** — e.g. "My SaaS tool"
- **Type** — `saas`, `ebook`, `service`, `affiliate`, etc.
- **URL** — Landing page or product URL
- **Description** — The full pitch (benefits, target audience, use cases)
- **Weight** — Rotation priority if you have multiple promotions

### 2. Configure templates (optional)

Default templates are seeded automatically for all platforms. Go to **Templates** to customize:

- Character limits
- Whether to include an image or video
- AI tone instructions per platform

### 3. Set your schedule (optional)

Default schedule is seeded on startup:

| Platform | Default time |
|---|---|
| Twitter | 9:00 AM |
| LinkedIn | 10:00 AM |
| TikTok/Video | 11:00 AM |
| Reddit | 12:00 PM |
| Instagram | 2:00 PM |
| Email | 5:00 PM |

Go to **Schedule** to change times and days of week.

### 4. Let it run

The worker process runs on startup and triggers content generation + posting on your configured schedule. You can also trigger a manual run from **Settings** → **Run Engine Now**.

### 5. Monitor

- **Queue** — See all generated content, approval status, and post status
- **Logs** — Detailed logs from each engine run
- **Calendar** — Click any day to see scheduled posts and their status
- **Today** — Live dashboard with today's content and platform status

---

## Architecture

```
launch/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Main app pages
│   │   ├── page.tsx        # Today view / dashboard
│   │   ├── calendar/       # Calendar view
│   │   ├── queue/          # Content queue
│   │   ├── logs/           # Engine run logs
│   │   ├── promotions/     # Promotion management
│   │   ├── templates/      # Template management
│   │   ├── schedule/       # Schedule management
│   │   └── settings/       # App settings
│   ├── (auth)/             # Sign in / sign up
│   ├── (marketing)/        # Landing pages
│   └── api/                # REST API routes
│
├── worker/                 # Background job process
│   ├── index.ts            # Worker entry (registers crons)
│   ├── engine/             # Content generation
│   │   ├── run.ts          # Daily orchestrator
│   │   ├── generate.ts     # Multi-platform content gen
│   │   ├── geo-audit.ts    # Geographic relevance scoring
│   │   └── rotation.ts     # Promotion rotation logic
│   ├── posting/            # Distribution
│   │   ├── scheduler.ts    # Per-platform posting
│   │   ├── post-bridge.ts  # post-bridge API client
│   │   └── resend.ts       # Email posting
│   └── media/              # Media generation
│       ├── image.ts        # PNG generation via Gemini
│       └── video.ts        # MP4 rendering via Remotion
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

### AI fallback

`lib/ai.ts` wraps both providers with automatic fallback:

1. Call Claude with the prompt
2. On HTTP 429 (rate limit), 5xx, or 30s timeout → switch to Gemini
3. Store provider used (`claude` or `gemini`) on each `ContentPiece`
4. Dashboard shows a badge when Gemini was used

---

## Database Schema

Key models:

| Model | Description |
|---|---|
| `Promotion` | Product/service being promoted |
| `ContentPiece` | Generated post for a specific platform |
| `Template` | Platform-specific generation instructions |
| `ScheduleEntry` | When to post on each platform |
| `EngineRun` | Log of each engine execution |
| `Setting` | Key-value app configuration |
| `User` | Auth user with role (ADMIN/USER) |

---

## API Reference

All endpoints are under `/api/`.

### Promotions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/promotions` | List all promotions |
| `POST` | `/api/promotions` | Create a promotion |
| `GET` | `/api/promotions/:id` | Get promotion by ID |
| `PATCH` | `/api/promotions/:id` | Update promotion |
| `DELETE` | `/api/promotions/:id` | Delete promotion |
| `POST` | `/api/promotions/:id/geo-audit` | Run geo relevance audit |

### Queue

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/queue` | List content pieces |
| `GET` | `/api/queue/:id` | Get content piece |
| `PATCH` | `/api/queue/:id` | Update (approve, edit) |
| `DELETE` | `/api/queue/:id` | Delete content piece |

### Templates

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/templates` | List all templates |
| `POST` | `/api/templates` | Create template |
| `PATCH` | `/api/templates/:id` | Update template |
| `DELETE` | `/api/templates/:id` | Delete template |

### Schedule

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/schedule` | List schedule entries |
| `POST` | `/api/schedule` | Create entry |
| `PATCH` | `/api/schedule/:id` | Update entry |
| `DELETE` | `/api/schedule/:id` | Delete entry |

### Other

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/settings` | Get all settings |
| `POST` | `/api/settings` | Batch update settings |
| `GET` | `/api/calendar` | Calendar data for a month |
| `POST` | `/api/engine/run` | Trigger engine manually |
| `GET` | `/api/logs` | Fetch engine run logs |
| `GET` | `/api/stream` | Server-Sent Events stream |

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
