# Feature Tasks: Settings + Media Studio + GEO Audit + Cleanup

Generated: 2026-04-06
Total: 4 tasks (012–015) — tasks 001–011 belong to prior features

## Already Completed (in this session, before task files were written)
- Settings SETTINGS_DEFAULTS updated (brevo/elevenlabs keys added)
- Settings page reloads after save
- Stripe removed from settings, Polar info card added
- prisma/schema.prisma — geoScore/geoIssues/geoAuditedAt added to BlogPost + db pushed
- worker/engine/geo-audit.ts — rewritten to analyze text, update BlogPost
- worker/blog/index.ts — geo audit triggered after blog post creation
- app/api/promotions/route.ts — geo audit trigger removed

## Checklist
- [x] Settings defaults + reload (done inline)
- [x] Stripe → Polar (done inline)
- [x] GEO audit schema + worker wiring (done inline)
- [x] 012: Media Studio — Error Parsing + API Key Pre-check
- [x] 013: GEO Audit — Backend API Routes
- [x] 014: GEO Audit — Frontend UI
- [x] 015: Cleanup — Delete Unused Files
