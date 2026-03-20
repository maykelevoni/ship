---
name: launch
description: Parallel buyer traffic system for digital products/services. 6-phase pipeline: intake, SEO, content creation (parallel agents), distribution, outreach, and monitoring. Use /launch to turn a finished product into buyer traffic.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Task, AskUserQuestion
---

# Launch: Parallel Buyer Traffic System

> Turns a finished product into buyer traffic across all channels.
> Agents run in parallel — not one by one.
> State persisted in `.launch/`. Reads `.ship/spec.md` if product was built with `/ship`.

---

## STEP 0: Read State (ALWAYS DO THIS FIRST)

Read `.launch/state.json`. Based on `phase`, jump to the matching section.

If file doesn't exist: start at Phase 1 (intake).

Also read:
- `.launch/context.md` — decisions from previous sessions (if it exists)
- `.launch/brief.md` — product brief (if it exists)
- `.ship/spec.md` — if present, the product is already described here — use it

---

## Phase 1: Product Intake (`phase: "intake"`)

### Goal
Build `.launch/brief.md` — everything agents need to know about the product and target buyer.

### Process

**If `.ship/spec.md` exists:** read it and extract: product name, problem solved, target user, key features. Skip directly to creating the brief.

**If no spec exists**, ask these questions ONE GROUP AT A TIME:

**Group 1: The Product**
- What's the product name and one-line description?
- What URL is the landing page / product live at?
- What problem does it solve — specifically?

**Group 2: The Buyer**
- Who is the ideal buyer? (startup founder, SaaS operator, agency, etc.)
- Where do they hang out online? (communities, subreddits, platforms)
- What do they care about most — time saved, money made, pain removed?

**Group 3: Proof**
- Any early results, metrics, or case studies to show?
- Screenshots, demos, or before/after available?
- Any testimonials or beta user feedback?

**Group 4: Scope**
- Which platforms to target? (default: Twitter, LinkedIn, Reddit, Product Hunt)
- Enable outreach? (cold email to leads) — if yes: who's the target?

Create `.launch/brief.md`:

```markdown
# Product Brief

## Product
Name: [name]
URL: [url]
Description: [one-line description]

## Problem Statement
[The specific problem it solves — not vague]

## Target Buyer
Who: [role/type]
Where they are: [communities, platforms, subreddits]
What they care about: [primary pain or goal]

## Proof Points
[Metrics, results, demos, testimonials available]

## Platforms
[List of selected platforms]

## Outreach
Enabled: [yes/no]
Target profile: [if enabled — who to find and contact]
```

Confirm with user. Then:
- Create `.launch/state.json`
- Update `phase` → `"seo"`
- Log key decisions to `.launch/context.md`

---

## Phase 2: SEO Foundation (`phase: "seo"`)

> Run once. Makes the product findable when buyers search AI tools (ChatGPT, Perplexity, Google AI Overviews).

### Process

1. Read `.launch/brief.md` for the product URL
2. Check if geo-seo skill exists: `.claude/skills/geo-seo/`
3. If installed: run `/geo audit` on the landing page. Target: `llms.txt`, GEO score, citability fixes
4. If NOT installed: skip and note — "Install geo-seo-claude from: https://github.com/zubara-trabzada/geo-seo-claude"

Update `state.json`: `phase` → `"content"`

---

## Phase 3: Content Creation (`phase: "content"`) — PARALLEL AGENTS

> Fire ALL platform agents at the same time. Do NOT write them one by one.

### Agent Roster

| Agent | Platform | Output file |
|---|---|---|
| Twitter thread writer | Twitter/X | `.launch/content/twitter.md` |
| LinkedIn post writer | LinkedIn | `.launch/content/linkedin.md` |
| Reddit value post writer | Reddit | `.launch/content/reddit.md` |
| Product Hunt launch copy | Product Hunt | `.launch/content/producthunt.md` |

### How to fire them

Use the Agent tool with `run_in_background: true` for ALL agents simultaneously.
Send one message with ALL 4 Agent tool calls — they run in parallel.

**Base prompt for each agent:**
```
Read .launch/brief.md — this is the product you're writing content for.
Read docs/STRATEGY.md if it exists — this is the targeting and tone strategy.
[Platform-specific instructions below]
Save your output to [output file].
Do NOT post anything. Write only.
If the content directory doesn't exist, create it.
```

### Platform Instructions

**Twitter Thread Agent** → `.launch/content/twitter.md`
```
Write an 8-12 tweet thread structured as:
- Tweet 1: Hook — describe the painful problem (NOT the product)
- Tweets 2-4: Insight — why this is hard, what people get wrong
- Tweets 5-8: Reveal the product as the solution, show proof points from the brief
- Tweet 9-10: Social proof or result (use brief's proof points)
- Tweet 11-12: CTA with URL

Rules:
- Each tweet ≤ 280 characters
- Conversational, not corporate
- Lead with the problem, not features
- Minimal emojis — only if natural
```

**LinkedIn Post Agent** → `.launch/content/linkedin.md`
```
Write a 150-300 word LinkedIn post structured as:
- Open with a bold statement or surprising insight (NOT "I'm excited to announce")
- 3-5 short paragraphs with blank lines between them
- ROI angle: what does the buyer gain? (time saved, money made, pain removed)
- End with a question to invite comments
- 2-3 hashtags max at the end

Rules:
- Professional but human
- No buzzwords
- Founder/builder voice
```

**Reddit Post Agent** → `.launch/content/reddit.md`
```
Write a Reddit post for the best subreddit based on the target buyer in brief.md.
Choose from: r/entrepreneur, r/SaaS, r/startups, r/smallbusiness, r/webdev.

Structure:
- Title: describe the PROBLEM, not the product
- Body: tell the story — what problem you faced, what you tried, what you built
- Mention the product with its URL naturally near the end
- Close by inviting discussion

Rules:
- NO hard sell — community-first
- Honest and specific, not marketing copy
- Include: Subreddit: [chosen subreddit] at the top of the file
```

**Product Hunt Agent** → `.launch/content/producthunt.md`
```
Write Product Hunt launch copy:
1. Tagline (≤ 60 characters): problem-first, specific, no buzzwords
2. Description (3 sentences): problem → solution → who it's for
3. First comment (2-3 paragraphs): personal story of why you built it,
   early results if any, what you're looking for from the community
4. Topics/tags: 3-5 relevant tags
```

### After all agents complete

Create `.launch/content/manifest.md`:
```markdown
# Content Manifest
Generated: [timestamp]

## Files
- [x] twitter.md
- [x] linkedin.md
- [x] reddit.md
- [x] producthunt.md

## Status
[ ] Posted to Twitter
[ ] Posted to LinkedIn
[ ] Posted to Reddit
[ ] Launched on Product Hunt
```

Update `state.json`: `phase` → `"distribute"`

---

## Phase 4: Distribution (`phase: "distribute"`) — PARALLEL AGENTS

> Post content via post-bridge MCP. Staggered schedule.

### Distribution Schedule

```
Day 1 (now):    Twitter thread + LinkedIn post
Day 2 (+24h):   Reddit post
Day 3 (+48h):   Product Hunt launch
Day 7 (+168h):  Follow-up post with early results
```

### Process

**If post-bridge MCP is available:**
Fire posting agents in parallel — one per platform. Each reads the content file and posts/schedules via post-bridge tools.

**If not available:**
Print all content clean and tell user to post manually with the schedule above.

### Day 7 Follow-up

Write now, fill in numbers later:
```
"It's been 7 days since I launched [product].

Here's what happened:
→ [metric placeholder]
→ [metric placeholder]

The most surprising thing: [placeholder]

If you're building [problem space]: [product URL]"
```

Save to `.launch/content/followup.md`.

Update `state.json`: `phase` → `"outreach"`

---

## Phase 5: Outreach (`phase: "outreach"`)

> Find leads and write personalized cold emails.
> Only runs if `outreach_enabled: true` in state.json.

If disabled: skip to Phase 6.

### Process

**Step 1: Lead Research Agent** (sequential)

```
Read .launch/brief.md → get the outreach target profile.
Read docs/STRATEGY.md → understand who NOT to target.

Find 15-20 leads from:
- Indie Hackers — founders discussing the target problem
- Product Hunt — recently launched products in adjacent space
- Reddit — threads where the problem is discussed
- AngelList/Wellfound — funded startups matching the profile

For each lead: Name | Company | URL | Specific problem | Contact method

Save to .launch/outreach/leads.md
```

**Step 2: Email Writing Agents** (parallel, 5 leads per agent)

```
For each lead:
1. Visit their URL
2. Write a 4-sentence cold email:
   Line 1: Reference their specific situation
   Line 2: Name the problem they probably face
   Line 3: Brief proof you solve it
   Line 4: CTA — "Worth a quick call?"

Output to .launch/outreach/emails.md
```

Update `state.json`: `phase` → `"monitor"`

---

## Phase 6: Monitoring (`phase: "monitor"`)

> Set up PostHog. Measures which channel actually converts.

### Process

1. Read `.launch/brief.md` for product URL
2. Generate UTM links for each platform:
```
Twitter:      [url]?utm_source=twitter&utm_campaign=launch
LinkedIn:     [url]?utm_source=linkedin&utm_campaign=launch
Reddit:       [url]?utm_source=reddit&utm_campaign=launch
Product Hunt: [url]?utm_source=producthunt&utm_campaign=launch
```

3. Generate PostHog setup checklist → save to `.launch/monitoring/posthog-setup.md`:
```markdown
# PostHog Setup

- [ ] Add PostHog snippet to product landing page
- [ ] Replace URLs in content files with UTM links below
- [ ] Add posthog.capture('conversion') to signup/purchase flow
- [ ] Create alert in PostHog for first conversion event

## UTM Links
[generated links]
```

Update `state.json`: `phase` → `"complete"`

Tell user:
> Done. Add PostHog snippet, swap in UTM links, post on schedule.
> Day 7 follow-up is in `.launch/content/followup.md` — fill in real PostHog numbers.

---

## Parallel Execution Model

**Phases that run in parallel:**
- Phase 3 (content): all 4 platform agents fire simultaneously
- Phase 4 (distribution): all posting agents fire simultaneously
- Phase 5 (outreach): email writing in batches of 5, in parallel

Fire with `Agent tool + run_in_background: true`. All in one message.

---

## State File Format

```json
{
  "product": "product-name",
  "product_url": "",
  "phase": "intake|seo|content|distribute|outreach|monitor|complete",
  "platforms": ["twitter", "linkedin", "reddit", "producthunt"],
  "outreach_enabled": false,
  "outreach_target": "",
  "content_complete": [],
  "posts_scheduled": [],
  "leads_found": 0,
  "emails_written": 0,
  "created_at": "ISO-timestamp",
  "updated_at": "ISO-timestamp",
  "completed_at": ""
}
```

---

## Directory Structure

```
.launch/
  state.json
  context.md
  brief.md
  content/
    twitter.md
    linkedin.md
    reddit.md
    producthunt.md
    followup.md
    utm-links.md
    manifest.md
  outreach/
    leads.md
    emails.md
  monitoring/
    posthog-setup.md
  logs/
    distribution.md
```

---

## Context Recovery

1. Read `.launch/state.json` → current phase
2. Read `.launch/context.md` → key decisions
3. Based on phase: read the relevant files for that phase
