# Project Learnings

> Persistent knowledge base. Agents read this before every task and append discoveries.
> This file survives resets — it's project-lifetime knowledge.

## Bugs & Fixes

## Gotchas

## Task 004 Notes (Spec: SaaS Multi-Tenancy — API Routes)

- Prisma v5 `update` where clause accepts non-unique fields combined with a unique field (e.g. `{ id, userId }`) — the unique `id` satisfies Prisma's uniqueness requirement; `userId` is ANDed in as a filter, preventing cross-user updates without a separate 404-check step.
- `EmailDraft.update where: { id, userId }` works even though `userId` is not part of a unique constraint on `EmailDraft`, because `id` is the primary key. The same applies to `BlogPost.update` and `PromotionOpportunity.update`.
- The `generate-pieces` route (`POST /api/blog-posts/[id]/generate-pieces`) delegates entirely to `generatePiecesForBlogPost(id)` which does not yet accept a `userId` parameter. userId isolation at the route level is limited to the auth check; full worker-level isolation requires the worker function signature update planned in the worker tasks.
- The `research/refresh` and `research/topics/[id]/generate` routes similarly delegate to worker functions (`runResearch`, `runBlogGenerationForTopic`) that don't yet accept `userId`. Route-level auth is enforced; worker-level userId propagation is deferred to the worker tasks.
- Plan gate for blog publish and email send: `db.user.findUnique` runs before the resource lookup so free-plan users get a clear 403 immediately, without wasting a DB round-trip on the resource query.

## Patterns

## Task 002 Notes

- `db.template.createMany` with a `const` array typed via `as const` requires mapping to plain objects; TypeScript infers readonly tuples from `as const` which are incompatible with Prisma's mutable input type — mapping resolves this cleanly.
- The seed function uses a name-to-id Map built from a `findMany` after template insertion, so it works whether templates were just seeded in the same run or already existed from a prior run (fully idempotent).

## Task 004 Notes

- `generateAllFormats` now iterates over `platforms` as a const tuple and maps to `Promise.allSettled` — this keeps the platform-to-result index mapping explicit and avoids the implicit index approach from the original code, which would break if platforms were reordered.
- Task 004 spec says template.aiInstructions REPLACES (not appends to) the base system prompt. The `buildPlatformSystem` helper reflects this: it falls back to the base only when no template is provided.
- The `email` platform is special-cased: it never calls Gemini because it's derived from the master piece locally via `formatEmail`. Its `provider` field is set to `'claude'` (matching the master piece, even though no separate LLM call is made).

## Task 003 Notes

- `isFallbackWorthy` checks both `error.status` and `error.statusCode` because the Anthropic SDK uses `status` while some HTTP clients use `statusCode`; checking both keeps it robust without coupling to a specific SDK version.
- The fallback logic reads `ai_fallback_enabled` only AFTER confirming the error is fallback-worthy — this avoids an unnecessary DB lookup on auth errors.

## Tasks 005–008 Notes

- Task 005: The `loadSchedule` count-check intentionally runs AFTER `loadSchedule` (not before), so the warning fires even when entries were just seeded in the same run but `active: false` — it checks total count, not active count, to catch the "truly empty table" case. This matches the spec wording "after seedDefaults runs".
- Task 006: The templates DELETE route uses `db.scheduleEntry.count` (not `findMany`) for the in-use check — one round trip vs. potentially many rows, and we only need a boolean result.
- Task 007: The schedule POST validates templateId existence with a `findUnique` before creation to return a clean 404 rather than a cryptic Prisma foreign-key error.
- Task 008: The settings GET merges stored DB values with a defaults map so the response always contains all known keys; extra keys stored in DB (outside the defaults map) are preserved and appended, maintaining forward compatibility.

## Task 001 Notes

- `pnpm prisma migrate dev` automatically runs `prisma generate` at the end; running `pnpm prisma generate` again afterwards is a no-op but confirms the client is synced.
- The migration timestamp uses UTC time when run inside WSL2 even if the Windows host is in a different timezone — migration folder was `20260321183426_templates_schedule_provider`.
- Prisma v5.17.0 is installed; an update to v7 is available but should not be upgraded without following the major-version guide (`https://pris.ly/d/major-version-upgrade`).

## Tasks 009–011 Notes

- Task 009 (Settings): Each settings section uses a local `saveSection` helper that takes the payload, a loading setter, and a feedback setter — this avoids repeating the fetch + error-handling boilerplate four times.
- Task 009: The enabled-platforms checkbox grid uses hidden `<input type="checkbox">` elements and a visible label wrapper styled with a border + background; this gives full click-area coverage without JS-only click handlers.
- Task 010 (Templates): The template card list is sorted in a fixed PLATFORM_ORDER array rather than relying on the API's `orderBy: [{ platform: 'asc' }]` — this makes the UI order predictable regardless of locale-dependent string sorting at the DB level.
- Task 010: When the delete modal surfaces the "template is used in schedule" error from the API (HTTP 409), the modal stays open so the user can read the message — the confirm button only closes on a successful (2xx) response.
- Task 011 (Schedule): The Template `<select>` in the form auto-selects the first matching template via a `useEffect` that fires when `platformTemplates` changes. This prevents the form from being submitted with an empty `templateId` when switching platforms.
- Task 011: `<input type="time">` with `colorScheme: "dark"` (inline style) renders the native time picker in dark mode on Chromium; without it the picker shell defaults to the OS light theme even inside a dark page.

## Task 002 (Sidebar Simplification) Notes

- The `isActive` logic for the old sidebar used `pathname.startsWith(href)` which would cause `/settings` to match `/settings-anything`. Switching to `pathname === href || pathname.startsWith(href + "/")` prevents false positives while keeping sub-route matching for `/promote/new`, `/promote/[id]`, etc.
- Removing the `useEffect` for `queueCount` also allowed removing the `useState` import entirely — the component no longer has any state, only reads from `usePathname`. The `badge` field was also removable from the `NavItem` interface since the only consumer (queue badge) was eliminated.
- The `bottomNavItems` removal required removing the associated `<div>` with `borderTop` styling from the JSX. The "Settings" item now sits naturally at the bottom of the `<nav>` since it's the last item in `mainNavItems`.

## Task 001 (Redirects) Notes

- `next.config.js` uses a two-object pattern: `nextConfig` holds config options, then `configWithWebpack` spreads `nextConfig` and adds a `webpack` key. Placing `redirects()` directly on `nextConfig` is sufficient — the object spread `...nextConfig` copies async methods as own enumerable properties, so `redirects` is visible on the exported `configWithWebpack` without any additional wiring.

## Tasks 012–014 Notes

- Task 012 (Sidebar): Templates and Schedule links were already added to sidebar.tsx in the task 009 commit — the prior agent bundled task 012 into task 009. Verify the git log when a task spec says "should already be there" to avoid double-committing the same change.
- Task 013 (Calendar DayPanel): The existing CalendarGrid has its own internal DetailPanel (for promotion/content-piece info + override). Adding the new DayPanel via the parent's `onDayClick` prop means both panels open when a day is clicked — they show complementary data (schedule entries vs. promotion content) so the overlap is intentional. The internal `selectedDate` in CalendarGrid was kept for `isSelected` highlighting without lifting that state up.
- Task 013: When parsing a "YYYY-MM-DD" string to a JS `Date` for day-of-week calculation, use `Date.UTC(year, month-1, day)` and `.getUTCDay()` to avoid local-timezone offset that would shift the date by one day in negative UTC offsets.
- Task 013: `daysOfWeek` is stored as a JSON string (e.g. `"[0,1,2,3,4,5,6]"`) in the ScheduleEntry table — `JSON.parse` it client-side; entries where `daysOfWeek` fails to parse are excluded from the panel rather than crashing.
- Task 014 (Provider badge): The queue page delegates rendering to the `QueueItem` component — the `provider` field belongs on the `QueueItemData` interface in `queue-item.tsx`, not in `queue/page.tsx`. Adding it to the interface as optional (`provider?: string`) keeps backward compatibility with API responses that don't yet include it.

## Task 003 (Promote Route Group) Notes

- `PromotionForm` (`components/dashboard/promotion-form.tsx`) has hardcoded `router.push("/promotions")` calls after save and delete. Pages under `/promote/...` that use this form will therefore redirect back to `/promotions` (the old route) after submission. This is acceptable because task-001 added a redirect from `/promotions` → `/promote`, so the user still ends up at the right place — but a future cleanup task should accept a `returnPath` prop on `PromotionForm` to make it route-agnostic.

## Task 007 (Brevo) Notes

- spec.md mentions installing the `@getbrevo/brevo` SDK, but task-007.md explicitly requires raw `fetch` (no SDK). The task file takes precedence — raw fetch keeps the worker dependency-light and avoids an SDK install step.
- Brevo returns `messageId` (not `id`) in the transactional email response. The fallback `'sent'` handles the case where Brevo's response body omits `messageId` (e.g. on some plan tiers).
- `brevo_to_email` is a required setting (unlike Resend which used a `list_id` for broadcast). This means Brevo transactional sending in this implementation targets a single recipient stored in settings.

## Task 009 (Cleanup — resend.ts + README) Notes

- `lib/email.ts` and `auth.config.ts` still import from the `resend` npm package — these are Auth.js magic-link email provider references (not newsletter sending). They are completely separate from `worker/posting/resend.ts` which was the newsletter/broadcast sender. Deleting `worker/posting/resend.ts` does not affect auth email delivery; the `resend` package itself remains as a dependency for Auth.js.
- The README architecture diagram listed `resend.ts` under `worker/posting/` — this must be updated whenever a posting module is renamed/deleted, as it's the primary developer reference for the file structure.

## Tasks 001–003 (Spec: Content CMS + Publishing + Media Fix)

- Task 001: `pnpm prisma migrate dev` also runs `prisma generate` automatically; the explicit `pnpm prisma generate` afterwards is a no-op but confirms the client is synced (same pattern as noted in prior Task 001 entry).
- Task 002: The `@google/genai` SDK config for Gemini native image generation takes only `responseModalities: ['IMAGE']` at the top-level `config`; `imageConfig: { aspectRatio }` is an Imagen-specific option and causes errors when passed to a Gemini model.
- Task 003: When splitting a `Promise.allSettled` that previously included video into a separate sequential block, the `existingVideoId` variable (`savedPieces['video']?.id`) must be declared before the `if (videoRenderingEnabled)` branch so both branches (enabled + disabled) can reference it without repetition. The script-piece fallback on render error (`!existingVideoId` guard inside the catch) prevents creating a duplicate piece if `generateAllFormats` already saved one in step 6.

## Tasks 004–005 Notes (Spec: Content CMS + Publishing + Media Fix)

- Task 004: The `GET /api/posts` list route uses `platform: { not: "master" }` in the Prisma `where` clause to exclude master pieces. The `status` filter only applies when the param is provided AND is not `'all'` AND is in the valid-statuses list — invalid status values are silently ignored (no 400) to keep the filter permissive for future statuses.
- Task 004: The `PATCH /api/posts/[id]` route handles `scheduledAt: null` (explicit null in JSON body) vs `scheduledAt: undefined` (field absent) by checking `scheduledAt !== undefined` before writing — this allows a caller to explicitly clear the schedule by passing `null`.
- Task 005: `postScheduledPieces()` in `scheduler.ts` duplicates the try/catch dispatch pattern from `attemptPost()` inline rather than exporting `attemptPost`. This avoids exposing `attemptPost` as part of the module's public API while keeping the scheduler logic self-contained. The duplicate is intentional per spec.
- Task 005: The `POST /api/posts/[id]/publish` route imports worker modules (`post-bridge`, `brevo`) directly via `@/worker/...` path aliases. This works because Next.js API routes run in Node.js and the worker modules only use Node.js APIs (fs, fetch) — no browser-only dependencies are pulled in.
- Task 005: For the `video` platform, the publish-now route dispatches only to TikTok (as the "primary"), unlike the scheduler's `dispatch()` which posts to TikTok + YouTube + Instagram Reels in parallel. This matches the task spec ("use tiktok as primary") and avoids triple-posting from a single UI click.

## Tasks 006–008 Notes (Spec: Content CMS + Publishing + Media Fix)

- Task 006: Filter tabs on the Posts list page use server-side filtering (status param in GET /api/posts) rather than client-side filtering — this means the tab counts only reflect the loaded page slice, not total across all pages. This is acceptable for the 50-item default limit, and consistent with the posts list being server-paginated.
- Task 006: Row `onMouseEnter`/`onMouseLeave` on `<Link>` elements override the `background` inline style to simulate hover — Tailwind hover: classes are not used since the entire app uses inline styles exclusively.
- Task 007: TipTap's `useEditor` initializes with empty content; the piece content is set via `editor.commands.setContent(piece.content)` in a separate `useEffect` that fires once both `editor` (truthy after hydration) and `piece` (fetched) are available. Setting content in the `useEditor` config would require the piece to be available synchronously, which is not possible with an async fetch.
- Task 007: `editor.getHTML()` is used for Save (not `getText()`) to preserve TipTap's rich formatting (bold, bullet lists, etc.) as HTML in the DB. The `PATCH /api/posts/[id]` route stores whatever string is passed as `content`, so HTML is valid.
- Task 007: The `colorScheme: "dark"` inline style on `<input type="datetime-local">` renders the native time picker in dark mode on Chromium — the same pattern noted for Task 011 in Schedule learnings.
- Task 008: The `isActive` check for the `/posts` nav item in the sidebar uses `pathname.startsWith(href + "/")` which correctly highlights the sidebar link when the user is on `/posts/[id]` sub-routes.

## Task 001 Notes (Spec: Media Studio)

- The self-referential `MediaAsset` relation (`parent`/`variations` via `parentId`) is named `"variations"` — Prisma requires the same relation name string on both sides; omitting or mismatching it causes a schema validation error.
- Migration ran without conflict; `pnpm prisma migrate dev` auto-ran `prisma generate` (client updated to v5.17.0) — no separate generate step needed.

## Tasks 001–004 Notes (Spec: Image + Video Creation)

- `__dirname` inside a Next.js API route resolves to the `.next/server/app/...` compiled output path, NOT the source directory. Use `process.cwd()` to build absolute paths to source files (e.g. Remotion templates): `path.join(process.cwd(), 'worker/templates/video/index.tsx')`.
- Video script content is stored with a markdown code fence (` ```json ... ``` `). Strip it before `JSON.parse`: `.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()`.
- When `generate-images` creates `image_card`/`image_quote` pieces with `blogPostId`, and `video` was created with only `date` (no blogPostId), the GET route must merge BOTH blogPostId pieces AND date-range pieces (deduped by id) — otherwise `video` disappears from the response after images are generated. Same fix applies to render-video route.
- **WSL2 port scan bug**: On WSL2, connecting to a free port on `127.0.0.1` TIMES OUT (502ms+) instead of returning ECONNREFUSED. Remotion's `get-port.js` treats timeout as "unavailable", so it can never find a free port and throws "No available ports found" after scanning all 101 ports (3000–3100) × 3s = ~5 min. Fix: patch `node_modules/@remotion/renderer/dist/get-port.js` — in the `isPortAvailableOnHost` function, change timeout handler to `status = 'available'` (timeout means nothing is listening). Also reduce `socket.setTimeout(3000)` to `socket.setTimeout(50)`. Apply same patch to `dist/esm/index.mjs`. `::1` (IPv6) correctly returns ECONNREFUSED immediately on WSL2.
- Remotion's `getPortConfig` result is module-level cached (`var cached`). Killing stale dev servers before calling `renderMedia` is important — stale servers on ports 3000–3100 don't cause the "no ports" error directly, but running multiple Next.js instances simultaneously can consume all ports in the scan range.

## Task 001 Notes (Spec: Content Kit + Calendar + Navigation)

- The `promotion-card.tsx` GeoScoreBar component uses a 0–100 scale (`score >= 70` / `score >= 40`) because promotions store geoScore as a 0–100 integer. The blog post detail view uses a 0–10 scale (`geoScore >= 7` / `geoScore >= 4`) per the task spec — the scales are intentionally different because the blog-post API surfaces geoScore directly from the promotion (same raw value), but the UI display format differs between the two views. Always check the task spec for threshold values rather than copying from another component.
- Renaming a lucide-react export with `import { Image as ImageIcon }` (alias at the import site) is cleaner than renaming the variable everywhere — a single-line change covers both the import and all usages simultaneously via the local alias.
- When computing derived values (geoColor, geoBg) from a nullable prop in a function component, it's cleaner to compute them as local `const` above the `return` and guard the JSX block with `post.geoScore != null && geoColor && geoBg` rather than nesting ternaries inside JSX attributes — the TypeScript narrowing from `!= null` means the computed strings are non-null inside the guard.

## Task 001 Notes (Spec: Performance + Dashboard Redesign)

- Next.js App Router's `loading.tsx` convention works at the route-segment level — a single `loading.tsx` at `app/(dashboard)/loading.tsx` acts as the fallback for the index route only, not for every child route. Each child route (`/research`, `/posts`, etc.) needs its own `loading.tsx` to get a skeleton during navigation to that specific page.
- The `<style>` tag with `@keyframes` inside a server component renders fine; there is no need for `"use client"` just to apply CSS animations — the browser handles the keyframe execution client-side regardless.
- Palette used: skeleton/header bg `#1a1a1a`, card bg `#111111`, border `#1e1e1e`, borderRadius `6px`–`8px`.

## Task 006 Notes (Spec: Content Hub)

- `GET /api/blog-posts` did not include `ghostId` in its response map even though the Prisma model has the field. The Publish button requires `ghostId` to know whether a post was ever pushed to Ghost — always verify API response shapes against the actual Prisma fields when adding UI that depends on specific fields.
- The `GET /api/posts` route already had `platform` filter support (added in task 004) — a preliminary check confirmed this so no API modification was needed for the social tabs.
- The `GET /api/email-drafts` route returns the full Prisma object (no explicit map), which includes the nested `blogPost` relation. The UI can access `draft.blogPost.title` and `draft.blogPost.ghostUrl` directly from the response without any API change.
- Social row click-to-navigate uses `useRouter().push()` on the outer div, with `e.stopPropagation()` on the inner action column to prevent clicks on buttons from also triggering row navigation. This pattern avoids wrapping the entire row in `<Link>` (which would make action buttons nested inside an anchor, which is invalid HTML).
- The lazy-fetch pattern (`fetchedTabs` Set + `loadingTabs` Record) requires guarding the initial blog fetch with a check on both sets; without the `!loadingTabs["blog"]` guard the fetch fires on every render until the Set is updated, causing multiple concurrent requests before state is set.

## Task 002 Notes (Spec: Performance + Dashboard Redesign)

- `unstable_cache` wraps the async function as the first argument; the cache key array is the second argument; `{ revalidate }` options are the third. The wrapped result replaces the original `async function` declaration — callers use it identically, so the `TodayContent` `Promise.all` call site needs no changes beyond destructuring the new `lastEngineRun` entry.
- `getLastEngineRun` is intentionally NOT wrapped in `unstable_cache` because it is always dynamic (we want the freshest EngineRun record to decide "last run time"), unlike the three stable helpers which cache for 30–60s.
- Adding a new prop to a "use client" component's `TodayViewProps` interface requires updating both the interface and the function's destructuring parameter list; omitting either causes a TypeScript error even when the prop is not yet consumed in JSX.

## Task 003 Notes (Spec: Performance + Dashboard Redesign)

- Setting both `border` and `borderLeft` on the same element requires care: the shorthand `border` sets all four sides including left, so placing `borderLeft` AFTER `border` in the style object correctly overrides just the left side. If placed before, the shorthand `border` would overwrite it.
- The `PipelineStage` component wraps in an `<a>` when `href` is provided; the outer `<a>` must carry `flex: 1` and `minWidth: 0` itself (not just the inner div) so the flex layout is maintained — a flex child that is an anchor collapses to content width without those constraints.
- Pipeline arrow `→` is a plain Unicode character inside a `<span>` — no icon library needed, and it naturally inherits muted color without additional style overhead.
- The `@keyframes pulse` animation was already in `platform-status-card.tsx`'s `<style>` tag and only moved to `today-view.tsx`'s `<style>` tag as a bonus consolidation; the pulse animation still renders correctly because the style tag is injected globally into the document head regardless of which component renders it.

## Task 003 Notes (Spec: SaaS Multi-Tenancy — API Routes)

- The promotions `GET` handler previously set `where = undefined` for the `status === "all"` case. After userId isolation, the where clause must always include `userId`; `undefined` would bypass the user filter. The fix is `where = status === "all" ? { userId } : { userId, status }`.
- `runEngine(userId)` in the engine/run route produces a TypeScript error because `runEngine()` still has a 0-argument signature — this is intentional and tracked for resolution in Task 008. The route passes `userId` now so Task 008 only needs to update the worker signature, not the route.
- The `DELETE` handler for promotions soft-deletes (archives) rather than hard-deletes — the ownership check via `findFirst({ where: { id, userId } })` happens before the `update`, so the subsequent `update({ where: { id } })` is safe: the record is confirmed to belong to the user already.
- Plan gating in `POST /api/posts/[id]/publish` follows the same pattern as the engine route (look up `user.plan`, return 403 with `upgrade: true` for free users) — this keeps the client-side upgrade-prompt logic uniform across all gated routes.

## Task 006 Notes (Spec: SaaS Multi-Tenancy — new API routes)

- The Polar webhook PRODUCT_PLAN_MAP is built at module load time from `process.env.*`. If both `POLAR_STARTER_PRODUCT_ID` and `POLAR_PRO_PRODUCT_ID` are unset, both default to `""` — the second key overwrites the first in the map (both resolve to `"pro"`). This is safe because an unknown `productId` always falls back to `"starter"` via `?? "starter"`, but operators should set both env vars to avoid the silent collision.
- `crypto.timingSafeEqual` throws a `RangeError` if the two Buffers differ in byte length. The `?? ""` fallback on the missing `webhook-signature` header ensures a comparison always occurs; it returns false (not throws) because `"v1=<hex>"` (66 chars) is never equal in length to `""`. If a malformed header with a different length arrives, `timingSafeEqual` will throw — a production hardening step is to wrap the comparison in a try/catch and return 401 on error.
- `/api/webhooks/polar` is added via `startsWith`, which would also match `/api/webhooks/polar/anything`. No sub-routes exist today so this is fine; if future sub-routes need auth, narrow to an exact match (`pathname === "/api/webhooks/polar"`).

## Task 005 Notes (Spec: SaaS Multi-Tenancy — API userId isolation)

- The `/api/stream` SSE route uses a process-level in-memory event bus (`bus` from `@/lib/events`), not DB queries — there is no Prisma call to add `where: { userId }` to. Multi-user isolation here would require tagging bus events with userId and filtering in the `onEngineEvent` listener; that is a future concern.
- `findUnique` → `findFirst` is required everywhere a `userId` filter is added alongside `id` for a lookup. Prisma's `findUnique` only accepts fields that form a declared unique index; composing `{ id, userId }` without a `@@unique([id, userId])` directive causes a TypeScript type error. `findFirst` accepts any `where` filter.
- The `own-products/[id]/publish` route creates a `Promotion` record inline — this also needed `userId` added to its `create` data to satisfy the multi-tenant schema constraint, even though Promotion is not the primary model of the own-products routes.

## Task 011 Notes (Spec: SaaS Multi-Tenancy — Middleware + Settings Plan Badge)

- The onboarding redirect block must come AFTER the unauthenticated redirect block in middleware, not inside the `!isLoggedIn` branch — both guards (`isLoggedIn && !pathname.startsWith('/onboarding') && !isPublic`) must be true before checking `onboardingDone`.
- `/api/webhooks/polar` was already present in the `isPublic` list from Task 006 — no change needed there.
- The plan card's `checkoutUrl` uses `process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL` (a `NEXT_PUBLIC_` env var, accessible in client components at build time) with a `"https://polar.sh"` fallback via `??`. Do NOT use a server-only env var here since the settings page is `"use client"`.
- `planInfo` state is initialized to `null` and the plan card derives `plan` via `planInfo?.plan ?? "free"` — this means the card immediately renders as "FREE" (gray) while the fetch is in-flight, then updates if a different plan is returned. No separate loading state is needed for the plan card since the main `pageLoading` gate already covers the initial render.
- The `loadPlan` fetch runs in parallel with `loadSettings` (both called inside the same `useEffect`) — no await chain needed.

## Task 009 Notes (Spec: SaaS Multi-Tenancy — Worker Orchestrator)

- `runResearch` has signature `(userId: string, keyword?: string) => Promise<void>` (optional second param). TypeScript correctly accepts this as assignable to `(userId: string) => Promise<void>` because a function with optional extra parameters is structurally compatible with a stricter signature — no wrapper needed.
- The old `start()` read `daily_run_hour` from settings to compute dynamic cron expressions (e.g. `0 ${hour} * * *`). The new approach uses fixed UTC times and delegates per-user hour preferences to be handled inside each job function. This means the global pipeline always fires at 06:00–09:00 UTC; per-user `daily_run_hour` is a guide for internal logic, not a cron offset.
- `loadSchedule()` now takes no arguments (timezone is fetched per-user inside the function). The old single-user version accepted `timezone: string` as a parameter — callers that previously passed a value should be updated if `loadSchedule` is ever called from more than one place.
- The "no schedule entries" warning (`db.scheduleEntry.count()`) was removed from `start()` because in the multi-user model there is no single global count that is meaningful — each user's entries are seeded independently via `seedDefaults(userId)`.

## TypeScript userId Refactor Fix Notes

- When adding `userId` to `getSetting(key, userId)` in shared lib functions (`lib/ai.ts`, `lib/claude.ts`, `lib/postbridge.ts`), every function that calls those libs must propagate userId through its own signature — the change is viral across the call graph.
- `lib/ai.ts::generateText` and `lib/claude.ts::generateText` were given `userId: string = ''` as a default-parameter so worker utilities that lack a user context (research scoring, opportunity analysis, blog generation helpers) compile cleanly without threading userId through every layer. Callers that do have userId (engine/generate.ts, studio.ts) pass it explicitly.
- `app/(dashboard)/page.tsx` used `db.setting.findUnique({ where: { key } })` inside an `unstable_cache` block that has no userId context. After the Setting model moved to composite unique `userId_key`, this becomes a type error. Fix: change to `findFirst({ where: { key } })` — Prisma accepts non-unique where clauses on `findFirst`, and for a single-user dashboard cache it is an acceptable approximation.
- Webhook routes (`/api/webhooks/stripe`, `/api/webhooks/clickbank`) have no user session — they receive server-to-server calls. Replacing `getSetting('stripe_secret_key')` with `process.env.STRIPE_SECRET_KEY` is the correct pattern: webhook secrets are infrastructure-level secrets, not per-user settings, and belong in `.env`.
- `req.auth.user.id` in Next-Auth auth handlers is typed `string | undefined`. After narrowing with `if (!req.auth) return 401`, the `.auth` field is still `AuthSession | null` internally, so TypeScript does not narrow `user.id` to `string`. Use `req.auth!.user!.id as string` to satisfy the type system after the null guard.
- `worker/posting/post-bridge.ts::postToPlatform` and `worker/posting/brevo.ts::sendEmail` changed from 1-arg to 2-arg (added `userId` as second positional param). All callers in `scheduler.ts` and `app/api/posts/[id]/publish/route.ts` must be updated simultaneously or the TS check will fail in one direction or the other depending on which file was compiled first.
