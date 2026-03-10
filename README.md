# Ship

A spec-driven feature development orchestrator for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Ship breaks complex features into small tasks, writes tests before code, picks the right AI model for each job, and learns from its own mistakes.

```
requirements → planning → breakdown → implementation (TDD) → verification → done
```

## Why Ship

Building features with AI agents works best when the work is structured. Ship gives your Claude Code agents a repeatable process:

- **Spec first** — No coding until the feature is fully understood and planned
- **Test-driven** — Every task writes a failing test before implementation (red → green)
- **Isolated agents** — Each task runs in its own Claude Code subprocess, no context pollution
- **Smart model selection** — Opus thinks, Sonnet codes, Haiku writes docs. Per-task, automatic.
- **Agent memory** — Bugs and patterns are saved to a knowledge base that every future agent reads

## Quick Start

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- [jq](https://jqlang.github.io/jq/) (`sudo apt install jq` / `brew install jq`)

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/ship.git
cd your-project

# Copy ship.sh and the skill into your project
cp /path/to/ship/ship.sh ./ship.sh
chmod +x ship.sh
cp -r /path/to/ship/.claude/skills/ship .claude/skills/ship
```

Or just copy the two key files directly into any project:

```
your-project/
├── ship.sh                          # The orchestrator
└── .claude/skills/ship/SKILL.md     # The Claude Code skill
```

### Run

```bash
# Initialize a new feature
./ship.sh init user-profiles

# Option A: Interactive phases via Claude Code
./ship.sh spec        # Phase 1: Requirements → spec.md
./ship.sh plan        # Phase 2: Technical plan → plan.md
./ship.sh breakdown   # Phase 3: Task breakdown → task files

# Option B: Or just type /ship inside Claude Code — it reads state and continues

# Automated TDD implementation
./ship.sh run all     # Runs all tasks with TDD, then verifies
```

## How It Works

### Phase 1: Requirements

An interactive Claude session asks structured questions about your feature (one category at a time), then produces a detailed `spec.md`.

### Phase 2: Planning

Claude reads your codebase, the spec, and any known issues from past features. It produces a `plan.md` covering architecture, database changes, API design, frontend components, and a **testing strategy**.

### Phase 3: Task Breakdown

The plan is broken into 20-50 minute tasks. Each task file includes:
- What to implement
- What test to write (with specific assertions)
- Which model tier to use
- Acceptance criteria and commit message

### Phase 4: Implementation (TDD)

Each task spawns an **isolated Claude Code sub-agent** that:

1. Reads the project's knowledge base (`learnings.md`)
2. Writes the test first
3. Runs it — expects failure (red)
4. Implements the code
5. Runs the test — expects pass (green)
6. Commits both test and implementation
7. Logs any discoveries back to the knowledge base

### Phase 5: Verification

After all tasks complete, the full test suite runs. If anything fails (e.g., a later task broke an earlier test), the feature stays in `verifying` until all tests pass.

## Model Tiers

Ship automatically picks the right model for each job:

| Tier | Model | Used For | Budget |
|------|-------|----------|--------|
| tier-1 | Opus | Planning, architecture, complex logic | $5.00 |
| tier-2 | Sonnet | Standard implementation, tests | $2.00 |
| tier-3 | Haiku | Docs, config, boilerplate | $0.50 |

The breakdown phase (Opus) assigns a tier to each task. You can override per-task:

```bash
SHIP_MODEL=opus ./ship.sh run 5   # Force Opus on task 5
```

Or globally:

```bash
SHIP_MODEL=sonnet ./ship.sh run all  # Use Sonnet for everything
```

## Agent Learning

Ship keeps a persistent knowledge base at `.ship/learnings.md`. This file:

- **Survives resets** — It's project-lifetime knowledge, not per-feature
- **Is read by every agent** before starting a task
- **Is written to** when agents discover bugs, gotchas, or patterns

```bash
./ship.sh learnings              # View all entries
./ship.sh learnings search auth  # Search by keyword
./ship.sh learnings count        # Count entries
```

Example entry (written automatically by agents):

```markdown
### [2025-03-15] Clerk middleware blocks webhook routes
- **Problem:** Clerk auth middleware was applied to /api/webhooks, blocking Stripe
- **Solution:** Add /api/webhooks to publicRoutes in middleware.ts
- **Files:** middleware.ts
- **Tags:** clerk, stripe, webhooks, auth
```

## Commands

```
SETUP
  init [name]          Initialize ship for a new feature
  status               Show current phase and progress
  clean                Remove .ship/ (preserves learnings)
  reset [phase]        Reset to a phase

INTERACTIVE PHASES
  spec                 Requirements gathering → spec.md         [opus]
  plan                 Technical planning → plan.md             [opus]
  breakdown            Task breakdown → task files              [opus]

IMPLEMENTATION (TDD)
  run [next]           Execute next task (test → red → code → green)
  run <N>              Execute specific task
  run all              Execute all remaining, then verify
  retry <N>            Retry a failed task
  skip <N>             Skip a task

TESTING
  verify               Run full test suite (final gate)

KNOWLEDGE BASE
  learnings            View all project learnings
  learnings count      Count entries
  learnings search X   Search by keyword

UTILITIES
  log [N]              View task logs
  context [note]       View or append to context
  help                 Show all commands
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SHIP_MODEL` | — | Override all tiers with a single model |
| `SHIP_MODEL_PLAN` | `opus` | Model for planning phases |
| `SHIP_MODEL_CODE` | `sonnet` | Model for implementation |
| `SHIP_MODEL_DOCS` | `haiku` | Model for docs/config |
| `SHIP_BUDGET_PLAN` | `5.00` | Max USD per planning task |
| `SHIP_BUDGET_CODE` | `2.00` | Max USD per coding task |
| `SHIP_BUDGET_DOCS` | `0.50` | Max USD per docs task |
| `SHIP_MAX_BUDGET` | — | Override all budgets |
| `SHIP_TEST_CMD` | — | Override test command |
| `SHIP_CLAUDE_FLAGS` | — | Extra Claude CLI flags |

## Project Structure

```
.ship/
  state.json       # Current phase and progress
  context.md       # Key decisions (per-feature)
  learnings.md     # Knowledge base (persists across features)
  spec.md          # Feature spec (Phase 1)
  plan.md          # Technical plan (Phase 2)
  tasks.md         # Master task checklist (Phase 3)
  tasks/           # Individual task files
  logs/            # Execution logs (gitignored)
  blockers/        # Blocker reports (gitignored)
```

## License

MIT
