# Feature Tasks: SaaS Multi-Tenancy

Generated: 2026-04-02
Total: 11 tasks

## Checklist

- [ ] 001: Prisma Schema — userId on all models + User billing fields
- [ ] 002: lib/settings.ts userId param + auth.ts plan/onboardingDone in session
- [ ] 003: API Routes — Promotions, Posts, Queue, Engine (userId filter + plan gate)
- [ ] 004: API Routes — Research, BlogPosts, EmailDrafts, Opportunities
- [ ] 005: API Routes — Templates, Schedule, Settings, OwnProducts, Media, Others
- [ ] 006: New routes — user/plan, user/onboarding, webhooks/polar
- [ ] 007: Worker — Research, Blog, Social, Email, Opportunities, Posting (userId param)
- [ ] 008: Worker — Engine functions (userId param)
- [ ] 009: Worker — Orchestrator multi-user loop (worker/index.ts)
- [ ] 010: Onboarding Wizard UI (4-step, /onboarding)
- [ ] 011: Middleware onboarding redirect + Settings plan badge
