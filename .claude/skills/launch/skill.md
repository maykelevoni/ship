---
name: launch
description: Validate-then-build buyer traffic system. 8-phase pipeline: idealization, research, pre-sell validation, intake, SEO, content creation (parallel agents), distribution, outreach, and monitoring. Use /launch to validate an idea before building, then drive buyer traffic.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Task, AskUserQuestion, WebSearch, WebFetch
---

# Launch: Validate-Then-Build Buyer Traffic System

> Validates demand before building. Only build when buyers say yes.
> Then turns a finished product into buyer traffic across all channels.
> Agents run in parallel — not one by one.
> State persisted in `.launch/`. Reads `.ship/spec.md` if product was built with `/ship`.

---

## STEP 0: Read State (ALWAYS DO THIS FIRST)

Read `.launch/state.json`. Based on `phase`, jump to the matching section.

If file doesn't exist: start at **Phase 0 (idealize)**.

Also read:
- `.launch/context.md` — decisions from previous sessions (if it exists)
- `.launch/research.md` — market research (if it exists)
- `.launch/concept.md` — refined concept (if it exists)
- `.launch/brief.md` — product brief (if it exists)
- `.ship/spec.md` — if present, product already built — skip to Phase 1 (intake)

---

## Phase 0: Idealization & Research (`phase: "idealize"`)

### Goal
Take a raw idea and turn it into a validated concept worth preselling. Output: `.launch/research.md` + `.launch/concept.md`.

### Process

Ask the user ONE group at a time:

**Group 1: The Raw Idea**
- What's the idea in one sentence?
- What problem does it solve — be specific, not generic?
- Who has this problem? (role, company size, industry)

**Group 2: Your Angle**
- Why would you be the one to build this?
- Any unfair advantage? (domain knowledge, audience, access, experience)
- What's your instinct on pricing? (one-time, subscription, per-seat)

Then fire a **Research Agent** in background:

```
Read .launch/concept-draft.md (the user's raw idea notes saved from group questions above).

Research the following and save findings to .launch/research.md:

## Competitors
- Find 5-8 direct competitors (Google, Product Hunt, AppSumo searches)
- For each: name, URL, price, what they do well, what they lack
- Identify the gap — what are they NOT solving?

## Demand Signals
- Search Reddit, Twitter, Indie Hackers for complaints about this problem
- Find 5-10 real quotes from people expressing the pain
- Note: how often is this discussed? Is it growing or shrinking?

## Target Communities
- Where does the target buyer hang out? (subreddits, Slack groups, forums, newsletters)
- Who are the influential voices in this space?

## Pricing Signals
- What do people currently pay to solve this (tools, agencies, DIY time)?
- What price points exist in the market?

## Verdict
- Is there clear demand signal? (yes/no + evidence)
- What's the strongest positioning angle based on competitor gaps?
- Who is the most specific ideal buyer (not broad, be precise)?

Save to .launch/research.md
```

After research agent completes, read `.launch/research.md` and create `.launch/concept.md`:

```markdown
# Refined Concept

## Idea
[One-line refined description based on research]

## The Gap
[What competitors miss that this product solves]

## Strongest Positioning
[The single clearest angle — problem-first]

## Target Buyer (Specific)
[Not "founders" — be precise: "B2B SaaS founders with 1-10 employees running outbound sales"]

## Where They Are
[Top 3 communities/platforms to reach them]

## Pricing Hypothesis
[Based on market signals: price point and model]

## Demand Score
Strong / Medium / Weak — [one sentence why]
```

Show the concept to the user and confirm. Then:
- Update `phase` → `"validate"`
- Log to `.launch/context.md`

---

## Phase 0.5: Pre-sell Validation (`phase: "validate"`)

### Goal
Prove people will pay before a single line of code is written.

### Step 1: Set the Threshold

Ask the user:
> "What's your green light to build?"
>
> Default suggestions:
> - Paid product → **3 pre-sales** (or deposits)
> - Free/waitlist → **50 signups**
> - Enterprise → **2 discovery calls booked**
>
> You can set your own number.

Save threshold to `state.json` as `validation_threshold` and `validation_type` (`presales|signups|calls`).

### Step 2: Create Validation Assets

Fire these **2 agents in parallel**:

**Landing Page Copy Agent** → `.launch/validation/landing.md`
```
Read .launch/concept.md — this is the product concept.
Read .launch/research.md — use real pain quotes and competitor gaps.

Write landing page copy for a minimal presell page:

1. Headline (≤ 10 words): describe the outcome, not the product
2. Subheadline (1 sentence): who it's for + what it does
3. Problem section (3 bullets): real pains from research quotes
4. Solution section (3 bullets): what this product does differently
5. Pricing block: [price] — [what they get] — [payment note: "charge only when built" or "join waitlist"]
6. CTA button text (≤ 5 words)
7. FAQ (3 questions): address top objections from research

Save to .launch/validation/landing.md
Note: suggest using Carrd, Framer, or Notion for quick deployment.
```

**Validation Outreach Agent** → `.launch/validation/outreach.md`
```
Read .launch/concept.md — this is the product concept.
Read .launch/research.md — use communities and buyer profile.

Write validation outreach copy:

1. Cold DM (Twitter/LinkedIn, ≤ 100 words):
   - Reference their specific situation
   - Name the problem
   - Ask if it's real for them (NOT selling yet)
   - Example: "I'm building X for [specific buyer]. Does [problem] affect you?"

2. Community post (Reddit/Indie Hackers):
   - Title: describe the problem, ask if others face it
   - Body: explain you're researching before building
   - Link to waitlist/presell at the end
   - This is a RESEARCH post, not a sales post

3. Email subject lines (5 options): for cold outreach

Save to .launch/validation/outreach.md
```

### Step 3: Run Validation

Tell the user:
> **Your validation kit is ready.**
>
> 1. Deploy `.launch/validation/landing.md` copy to a quick page (Carrd/Framer/Notion)
> 2. Post `.launch/validation/outreach.md` in the target communities
> 3. Send DMs from the outreach copy to 20-30 people in target communities
> 4. Come back and tell me the results: how many [presales/signups/calls]?
>
> Target: **[threshold]** [validation_type] to green light the build.

Update `state.json`: `phase` → `"validate_results"`. Wait for user to return with results.

---

## Phase 0.6: Validation Results (`phase: "validate_results"`)

Ask the user: "What were the results? How many [presales/signups/calls] did you get?"

**If threshold MET or exceeded:**
> Green light. Time to build.
> Update `state.json`: `validation_passed: true`, `phase` → `"intake"`
> Tell user: "Run `/ship` to build the product. Come back to `/launch` when it's live."

**If threshold NOT met:**
> Don't give up yet — let's understand why.

Ask:
- Did people engage but not buy? (messaging problem)
- Did people not respond at all? (targeting or channel problem)
- Did people say it's not a real problem? (idea problem)

Based on answer, suggest a pivot:

```
Messaging problem → reframe the positioning angle, retry validation
Targeting problem → test a different community or buyer segment
Idea problem      → go back to Phase 0, start with a different idea
```

Ask: "Want to pivot and retry, or kill this idea and start fresh?"

- **Pivot** → update `.launch/concept.md`, reset `phase` → `"validate"`, log pivot to `.launch/learnings.md`
- **Kill** → save full learnings to `.launch/learnings.md`, reset `phase` → `"idealize"`

`.launch/learnings.md` format:
```markdown
# Validation Learnings — [idea name] — [date]

## What We Tested
[concept summary]

## Results
[numbers: signups, responses, presales]

## What We Learned
[what worked, what didn't, objections heard]

## Pivot Tried (if any)
[description]

## Why Killed (if killed)
[honest assessment]
```

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

Update `state.json`: `phase` → `"cron"`

---

## Phase 7: Cron Automation Setup (`phase: "cron"`)

> Generate a VPS-ready automation schedule so distribution runs on autopilot.
> This runs after monitoring setup, before marking complete.

### Goal
Produce two files:
- `.launch/cron/crontab.txt` — ready to paste into `crontab -e`
- `.launch/cron/run.sh` — the runner script Claude Code executes headlessly

### Step 1: Ask for Launch Date

Ask the user:
> "What date and time do you want Day 1 (Twitter + LinkedIn) to go live?"
> Format: YYYY-MM-DD HH:MM (your local timezone)

Save as `launch_datetime` in `state.json`.

### Step 2: Generate `.launch/cron/run.sh`

```bash
#!/bin/bash
# Launch automation runner
# Called by cron — executes Claude Code headlessly for each phase

PROJECT_DIR="[absolute path to project]"
LOG_DIR="$PROJECT_DIR/.launch/logs"
mkdir -p "$LOG_DIR"

PHASE=$1

case "$PHASE" in
  content)
    cd "$PROJECT_DIR"
    claude --print "Run /launch — state.json phase is content. Execute Phase 3 content creation now." \
      >> "$LOG_DIR/content.log" 2>&1
    ;;
  post-day1)
    cd "$PROJECT_DIR"
    claude --print "Run /launch — state.json phase is distribute. Post Twitter and LinkedIn content now (Day 1)." \
      >> "$LOG_DIR/post-day1.log" 2>&1
    ;;
  post-day2)
    cd "$PROJECT_DIR"
    claude --print "Run /launch — Post Reddit content now (Day 2 of launch schedule)." \
      >> "$LOG_DIR/post-day2.log" 2>&1
    ;;
  post-day3)
    cd "$PROJECT_DIR"
    claude --print "Run /launch — Post Product Hunt launch now (Day 3 of launch schedule)." \
      >> "$LOG_DIR/post-day3.log" 2>&1
    ;;
  post-day7)
    cd "$PROJECT_DIR"
    claude --print "Run /launch — Post Day 7 follow-up from .launch/content/followup.md now." \
      >> "$LOG_DIR/post-day7.log" 2>&1
    ;;
  outreach)
    cd "$PROJECT_DIR"
    claude --print "Run /launch — state.json phase is outreach. Execute Phase 5 lead research and email writing now." \
      >> "$LOG_DIR/outreach.log" 2>&1
    ;;
esac
```

Replace `[absolute path to project]` with the real project path.
Save and `chmod +x .launch/cron/run.sh`.

### Step 3: Generate `.launch/cron/crontab.txt`

Calculate cron times from `launch_datetime`. Each entry = `MM HH DD month *`.

```
# Launch automation — generated by /launch
# Install with: crontab -e (paste these lines)

# Day 0 -6h: Generate all content (6 hours before Day 1 posts)
[cron time = launch_datetime - 6h]  /bin/bash [project_path]/.launch/cron/run.sh content

# Day 1: Twitter + LinkedIn
[cron time = launch_datetime]       /bin/bash [project_path]/.launch/cron/run.sh post-day1

# Day 2 +24h: Reddit
[cron time = launch_datetime + 24h] /bin/bash [project_path]/.launch/cron/run.sh post-day2

# Day 3 +48h: Product Hunt
[cron time = launch_datetime + 48h] /bin/bash [project_path]/.launch/cron/run.sh post-day3

# Day 7 +168h: Follow-up post
[cron time = launch_datetime + 168h] /bin/bash [project_path]/.launch/cron/run.sh post-day7

# Outreach (runs Day 1 +2h — after first posts are live)
[cron time = launch_datetime + 2h]  /bin/bash [project_path]/.launch/cron/run.sh outreach
```

Fill in the actual computed cron times based on `launch_datetime`.

### Step 4: Print VPS Setup Instructions

Tell the user:

```
Cron files saved to .launch/cron/

To activate on your VPS:

1. Copy project to VPS (or pull from git)
2. Install Claude Code on VPS:
   npm install -g @anthropic-ai/claude-code
3. Set your API key:
   export ANTHROPIC_API_KEY=your-key
   (add to ~/.bashrc or ~/.zshrc)
4. Make the runner executable:
   chmod +x .launch/cron/run.sh
5. Install the cron schedule:
   crontab -e
   (paste the contents of .launch/cron/crontab.txt)
6. Verify cron is installed:
   crontab -l

Logs will appear in .launch/logs/ as each phase runs.
Phases that need human input (idealize, validate, intake) still run interactively.
Everything after content creation is fully automated.
```

Update `state.json`: `phase` → `"complete"`

Tell user:
> Done. PostHog snippet, UTM links, and cron automation are all set.
> Day 7 follow-up is in `.launch/content/followup.md` — fill in real numbers before it posts.

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
  "idea": "raw idea slug",
  "product": "product-name",
  "product_url": "",
  "phase": "idealize|validate|validate_results|intake|seo|content|distribute|outreach|monitor|complete",
  "validation_threshold": 3,
  "validation_type": "presales|signups|calls",
  "validation_passed": false,
  "validation_results": 0,
  "pivot_count": 0,
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
  concept-draft.md     ← raw idea notes from Phase 0 questions
  research.md          ← market/competitor/demand research
  concept.md           ← refined concept after research
  learnings.md         ← accumulated pivot/kill learnings
  brief.md             ← product brief (Phase 1+)
  validation/
    landing.md         ← presell landing page copy
    outreach.md        ← validation DM + community post copy
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
  cron/
    run.sh             ← headless runner script for VPS
    crontab.txt        ← ready to paste into crontab -e
  logs/
    content.log
    post-day1.log
    post-day2.log
    post-day3.log
    post-day7.log
    outreach.log
```

---

## Context Recovery

1. Read `.launch/state.json` → current phase
2. Read `.launch/context.md` → key decisions
3. Based on phase: read the relevant files for that phase
