# Feature Tasks: Systeme.io Integration + Core Cleanup
Generated: 2026-04-10
Total: 17 tasks

## Phase A — Remove (do these first, no new dependencies)
- [x] 001: Delete dead files (stripe/polar/clickbank webhooks + geo-audit + brevo)
- [x] 002: Comment out worker/media/video.ts (stub export, preserve code)
- [x] 003: Update worker/index.ts — remove plan tier filter
- [x] 004: Update worker/engine/run.ts — rename video setting key
- [x] 005: Prisma schema — remove deprecated columns + migrate
- [x] 006: Settings UI — remove Brevo + Polar sections
- [x] 007: Remove geo score badges from UI
- [ ] 008: Remove email draft Send button
- [ ] 009: Clean up .env.example + CLAUDE.md

## Phase B — Add Systeme.io (after Phase A is clean)
- [ ] 010: Create lib/utm.ts (UTM builder utility)
- [ ] 011: Prisma schema — add Systeme.io columns + migrate
- [ ] 012: Add Systeme.io settings section (types + UI + API)
- [ ] 013: Add Systeme.io fields to Promotion (form + API)
- [ ] 014: Add Systeme.io fields to OwnProduct (form + API)
- [ ] 015: Create email draft export endpoint (POST /api/email-drafts/[id]/export)
- [ ] 016: Add "Copy for Systeme.io" button to email draft page
- [ ] 017: Update worker/engine/generate.ts — gate video + inject UTM

## Key Dependencies
- 005 must run before 006, 007, 008, 011, 013, 014
- 010 must run before 017
- 011 must run before 012, 013, 014, 015, 016
- 015 must run before 016
