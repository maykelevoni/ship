# Project Rules

## Testing

- Playwright test files ALWAYS go in the `tests/` folder — never in the project root.

## Project Overview

- PostForge: single-user content automation platform
- Stack: Next.js 14 (App Router) + TypeScript + Prisma + Neon (PostgreSQL)
- Worker: separate Node.js process (`worker/index.ts`) runs alongside Next.js via `concurrently`
- UI: all inline styles (no Tailwind classes in JSX) + shadcn/ui primitives
- Package manager: **pnpm** — never use npm (260-char path limit on WSL2+OneDrive)

## Architecture

- `app/(dashboard)/` — all authenticated dashboard pages
- `app/api/` — Next.js API routes (auth, content, media, research, settings, webhooks)
- `worker/` — background jobs: `engine/` (generate), `media/` (image/video/audio), `posting/` (scheduler, brevo, postbridge), `research/` (products, trends, HN, Reddit, YouTube, news), `blog/` (ghost), `email/` (drafts), `opportunities/` (analysis), `social/` (repurposing)
- `lib/` — shared utilities: `db.ts` (Prisma), `ai.ts` (AI providers), `settings.ts` (DB key-value), `claude.ts`, `email.ts`, `postbridge.ts`
- `components/dashboard/` — all dashboard UI components (inline styles, "use client")
- `prisma/schema.prisma` — 13 models: User, Account, Session, BlogPost, ResearchTopic, ContentPiece, EmailDraft, Promotion, PromotionOpportunity, Template, ScheduleEntry, EngineRun, Setting, OwnProduct, MediaAsset

## API Keys — All Stored in Setting Table (DB), Not .env

Keys are stored as key-value pairs in the `Setting` table. Read them with `getSetting(key)` from `lib/settings.ts`. The `.env` only holds infra-level secrets (DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY for worker bootstrap).
Settings keys: `anthropic_api_key`, `gemini_api_key`, `openrouter_api_key`, `openrouter_model`, `postbridge_api_key`, `enabled_platforms`, `systeme_domain`, `systeme_default_funnel_url`, `systeme_api_key`, `video_generation_enabled`, `timezone`, `gate_mode`, `daily_run_hour`, `youtube_api_key`, `newsapi_key`, `ghost_url`, `ghost_admin_api_key`, `research_subreddits`, `research_youtube_region`, `research_news_categories`, `blog_author_name`, `elevenlabs_api_key`, `elevenlabs_voice_id`, `clickbank_api_key`, `clickbank_account`, `ai_fallback_enabled`

## Critical Notes

- **Gemini image model: `gemini-3.1-flash-image-preview`** — NEVER change this name, it was confirmed working
- **No Puppeteer** — image generation uses Gemini API exclusively
- **Remotion WSL2 bug** — `isPortAvailableOnHost` timeout treated as "available" (patch in learnings.md)
- **Video content**: `worker/templates/video/index.tsx` at `process.cwd()` path (not `__dirname`)
- Content generation: `claude-sonnet-4-6` for all text

## Worker Patterns

- Cron jobs in `worker/index.ts` use `node-cron` with timezone from `getSetting('timezone')`
- Real-time dashboard updates via SSE (Server-Sent Events), no WebSockets
- Content generation uses `Promise.allSettled` for parallel platform pieces
- Failed posts retry once after 30 minutes (scheduler.ts)

## Deployment

- `docker-compose up` starts everything
- VPS: Hetzner $10/mo
- DB: Neon (external PostgreSQL) — DATABASE_URL must be set in .env
- `pnpm build` then `pnpm start` for production (Next.js + Worker via concurrently)

## Testing

- Playwright test files ALWAYS go in `tests/` folder — never in project root
- Run tests: `npx playwright test`
- Pipeline tests (headed Chrome): `npx playwright test --config=playwright.pipeline.config.ts`
