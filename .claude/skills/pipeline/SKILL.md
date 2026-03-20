---
name: pipeline
description: Weekly client acquisition engine. Generates content from recent work, finds 10 leads, writes personalized outreach emails, and sends follow-ups. Run every Monday. Use /pipeline to start.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebSearch, AskUserQuestion
---

# Pipeline: Weekly Acquisition Engine

> Runs every week. Keeps leads and content flowing between product launches.
> State in `.pipeline/`. Each week is a new entry.

---

## STEP 0: Read State (ALWAYS DO THIS FIRST)

Read `.pipeline/state.json`.

If it doesn't exist, create it:
```json
{
  "week": 1,
  "started_at": "[ISO timestamp]",
  "updated_at": "[ISO timestamp]",
  "phase": "content",
  "leads_total": 0,
  "emails_sent": 0,
  "follow_ups_due": []
}
```

Read `.pipeline/leads.md` if it exists — this is the running lead tracker across all weeks.

---

## Step 1: Content Generation — PARALLEL AGENTS

> Two posts per week. Based on what was actually built or shipped recently.

### Find source material

Check these in order:
1. `.ship/spec.md` — what was last built
2. `.ship/learnings.md` — interesting technical discoveries
3. Recent git commits — `git log --oneline -10`
4. Ask the user: "What did you work on or ship this week?" if nothing is found

### Fire two content agents in parallel

**Agent 1 — LinkedIn post** → save to `.pipeline/week-[N]/linkedin.md`
```
You are writing a LinkedIn post for a digital product builder.

Source material: [paste what was found above]
Read docs/STRATEGY.md for tone and audience.

Write a 150-250 word post:
- Open with a specific observation or result (not "I'm excited to share")
- 3-4 short paragraphs, blank lines between them
- Shows expertise or proof of work — not generic
- Ends with a question or soft CTA
- 2 hashtags max

Target reader: startup founder or operator who might need something built.
```

**Agent 2 — Twitter/X thread** → save to `.pipeline/week-[N]/twitter.md`
```
You are writing a Twitter thread for a developer / digital product builder.

Source material: [paste what was found above]
Read docs/STRATEGY.md for tone and audience.

Write a 5-7 tweet thread:
- Tweet 1: hook — specific insight or result, not clickbait
- Tweets 2-5: expand the idea, show the work, share what you learned
- Tweet 6-7: takeaway + soft CTA (what you build, link to product if relevant)

Each tweet ≤ 280 chars. Conversational. No buzzwords. No emojis unless natural.
```

### After both complete

If post-bridge MCP is available: schedule both posts for Tuesday at 10am.
If not: print both posts clean and tell user to post manually.

---

## Step 2: Lead Research

> Find 10 new leads this week. Quality over quantity.

### Run one research agent

```
Read docs/STRATEGY.md — understand the ideal client profile.
Read .pipeline/leads.md if it exists — do NOT find leads already in the list.

Find 10 new leads from these sources:
- Indie Hackers (indiehackers.com) — look for founders posting about problems you solve
  Search: people asking "does anyone know a dev who...", "looking for someone to build..."
- Reddit: r/entrepreneur, r/SaaS, r/startups — same pattern
- Product Hunt: recently launched products that would benefit from your services
- LinkedIn: search "[role] looking for developer" or "[role] MVP"

For each lead:
- Name
- Company / project
- URL
- What specific problem they have (be precise — not "needs a developer")
- Contact method (LinkedIn DM, email if findable, IH message)
- Week found: [current week number]

Output: append to .pipeline/leads.md as a markdown table.
Do not output leads you cannot verify exist.
```

---

## Step 3: Write Outreach Emails

> One email per lead. Personalized, short, one CTA.

### Run email writing agents — parallel, 5 leads per agent

For each batch of 5 leads:
```
Read .pipeline/leads.md — focus on the 5 leads assigned to you (leads [N] to [N+4]).
Read docs/STRATEGY.md — outreach rules.

For each lead, visit their URL and write a cold email:

Line 1: One sentence referencing their specific project or situation
Line 2: Name the exact problem they probably face right now
Line 3: One proof point — what you've built that's relevant (from .ship/spec.md or learnings)
Line 4: CTA — "Worth a quick call?" or "Reply if relevant."

Rules:
- 4 sentences max. No exceptions.
- Lead with THEIR situation, not your skills
- Never mention being a freelancer or agency upfront
- No attachments, no portfolios in the first email

Save to .pipeline/week-[N]/emails.md
```

---

## Step 4: Follow-ups

> Check who needs a follow-up this week. Day 4 and Day 7, then stop.

### Process

1. Read `.pipeline/leads.md`
2. Find any leads where:
   - `first_email_sent` was 4 days ago → write Day 4 follow-up
   - `first_email_sent` was 7 days ago → write Day 7 follow-up (last touch)
   - `day7_sent` is true → mark as `closed_no_response`, stop

**Day 4 follow-up template:**
```
Hey [name], just following up on my note from [day].
Did this land at a bad time, or is [problem] not a priority right now?
```

**Day 7 follow-up template:**
```
Last note from me — if building [X] becomes relevant, happy to chat.
[one line about something they shipped or posted recently]
```

Save follow-ups to `.pipeline/week-[N]/followups.md`
Update lead status in `.pipeline/leads.md`

---

## Step 5: Weekly Summary

Print a clean summary:

```
Week [N] — [date]

CONTENT
  LinkedIn post → [scheduled / needs manual post]
  Twitter thread → [scheduled / needs manual post]

LEADS
  New leads found: [N]
  Emails written: [N]
  Follow-ups sent: [N]

PIPELINE STATUS
  Active leads (awaiting reply): [N]
  Follow-up due Day 4: [names]
  Follow-up due Day 7: [names]
  Closed (no response): [N]
```

Update `.pipeline/state.json`:
- `week` → increment
- `leads_total` → running total
- `emails_sent` → running total
- `follow_ups_due` → leads needing follow-up next week

---

## Lead Tracker Format (`.pipeline/leads.md`)

```markdown
# Lead Pipeline

| # | Name | Company | Problem | Contact | Week | Status | First Email | D4 | D7 |
|---|------|---------|---------|---------|------|--------|------------|----|----|
| 1 | ... | ... | ... | ... | 1 | active | 2026-03-20 | - | - |
```

Status values: `active` | `replied` | `call_booked` | `closed_won` | `closed_no_response`

Update status manually as conversations happen.

---

## Context Recovery

When `/pipeline` is invoked:
1. Read `.pipeline/state.json` → current week
2. Read `.pipeline/leads.md` → pipeline status
3. Check what follow-ups are due this week
4. Ask if there's anything new to use for content, or find it from git/ship

---

## Directory Structure

```
.pipeline/
  state.json          # Week counter + running totals
  leads.md            # All leads across all weeks
  week-001/
    linkedin.md
    twitter.md
    emails.md
    followups.md
  week-002/
    ...
```
