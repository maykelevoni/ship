---
name: ship
description: Spec-driven TDD feature development with smart model selection and agent learning. 5 phases - requirements, planning, task breakdown, TDD implementation, verification. Use /ship to start or resume a feature build.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion
---

# Ship: Spec-Driven TDD Feature Development

> This workflow is designed for adding features to the **existing ship codebase**.
> Each feature goes through 5 phases with state persisted in `.ship/`.
> Agents learn from past mistakes and use the right model for each job.

**Key features:**
- **TDD** — Tests are written before code (red → green cycle)
- **Smart models** — opus for planning, sonnet for coding, haiku for docs
- **Agent learning** — Bugs and patterns are saved to a persistent knowledge base

---

## STEP 0: Read State (ALWAYS DO THIS FIRST)

Read `.ship/state.json`. Based on the `phase` field, jump to the matching section below.

If the file doesn't exist:
```
Run: ./ship.sh init
```

Also read:
- `.ship/context.md` for key decisions from previous sessions
- `.ship/learnings.md` for known bugs, gotchas, and patterns

---

## Phase 1: Requirements Gathering (`phase: "requirements"`)

### Goal
Understand what feature the user wants and create `.ship/spec.md`.

### Process

1. If `.ship/spec.md` exists, read it and ask if revisions are needed
2. Otherwise, ask structured questions ONE CATEGORY AT A TIME:

**Category 1: Feature Overview**
- What feature are you building? One-sentence description
- What problem does it solve for the user?
- What is the MVP scope vs nice-to-have?

**Category 2: User Stories**
- Who uses this feature? (end user, admin, both?)
- Walk through the user flow step by step
- What happens on success? On error?
- Any edge cases to handle?

**Category 3: Technical Constraints**
- Does this need new database tables or modify existing ones?
- Does this integrate with existing services?
- Any new external APIs or services needed?
- Performance requirements?

**Category 4: UI/UX**
- Where does this live in the app? (dashboard, public page, new route?)
- What components are needed? (forms, tables, modals, etc.)
- Mobile considerations?
- Any design references?

**Category 5: Scope Boundaries**
- What is explicitly OUT of scope?
- Any known limitations to accept for MVP?

3. Create `.ship/spec.md` with these sections:
   - Feature Summary
   - Problem Statement
   - User Stories (with acceptance criteria per story)
   - Technical Requirements
   - UI/UX Requirements
   - Integration Points (with existing services)
   - Out of Scope
   - Success Criteria

4. Ask user to review and approve

5. After approval:
   - Update `.ship/state.json`: set `phase` to `"planning"`
   - Log key decisions to `.ship/context.md`

---

## Phase 2: Technical Planning (`phase: "planning"`)

### Goal
Design how the feature integrates with the existing architecture. Create `.ship/plan.md`.

### Process

1. Read these files to understand existing architecture:
   - `.ship/spec.md` (approved feature spec)
   - `.ship/context.md` (decisions log)
   - `.ship/learnings.md` (known gotchas — check for relevant issues)
   - `CLAUDE.md` or `.claude/CLAUDE.md` (project conventions)
   - Any existing files related to the feature area

2. Create `.ship/plan.md` covering:

**Section 1: Architecture Integration**
- How this feature fits into the existing project structure
- Which existing patterns to follow
- New routes, API endpoints, or components needed

**Section 2: Database Changes**
- New tables/columns (schema format)
- Migrations needed
- Relationship to existing tables

**Section 3: API Design**
- New API routes (method, path, request/response shape)
- Auth requirements per endpoint
- Which existing utilities to reuse

**Section 4: Frontend Components**
- New pages and their routes
- Components to create (using existing UI library)
- State management approach
- How it connects to existing layouts/navigation

**Section 5: Service Integration**
- Auth hooks needed
- Payment integration (if applicable)
- Email notifications (if applicable)
- Analytics events to track

**Section 6: File Map**
- Complete list of files to create or modify
- Purpose of each file

**Section 7: Testing Strategy**
- Test framework to use (detect from project config or recommend)
- Test command (e.g., `npx vitest run`, `npm test`, `pytest`)
- Test file naming convention (e.g., `*.test.ts`, `*.spec.ts`)
- Test file location convention (co-located `__tests__/` or top-level `tests/`)
- Types of tests needed: unit, integration, e2e
- Shared test utilities or fixtures needed

3. Present plan and ask for approval

4. After approval:
   - Update `.ship/state.json`: set `phase` to `"breakdown"`
   - Update `.ship/state.json`: set `test_command` to the chosen test command
   - Log technical decisions to `.ship/context.md`

---

## Phase 3: Task Breakdown (`phase: "breakdown"`)

### Goal
Break the plan into small, sequential tasks with TDD test specs and model tier assignments.

### Process

1. Read `.ship/spec.md`, `.ship/plan.md`, and `.ship/learnings.md`

2. Break into tasks following these rules:

**Sizing:** Each task = 20-50 min of work (includes test writing), touches 1-5 files, has one clear purpose

**Ordering:**
0. Shared test utilities/fixtures (if needed)
1. Database schema/migrations (+ schema validation tests)
2. Backend API routes (+ API tests)
3. Frontend components and pages (+ component tests)
4. Wiring (connecting frontend to backend)
5. Integration with existing services
6. Polish, edge cases, error handling

3. For EACH task, create `.ship/tasks/task-NNN.md`:

```markdown
# Task NNN: [Title]

## Model: tier-1|tier-2|tier-3

## Description
[What to implement and why, with reference to the plan]

## Test
- **Test file:** `path/to/test-file.test.ts` (create)
- **What to test:**
  1. [Assertion derived from acceptance criteria 1]
  2. [Assertion derived from acceptance criteria 2]
- **Test type:** unit|integration|e2e
- **Setup needed:** [any fixtures, mocks, or test data]

## Files
- `path/to/file.ts` (create|modify)

## Requirements
1. [Specific, implementable requirement]
2. [Another requirement]

## Existing Code to Reference
- `path/to/existing/file.ts` (pattern to follow)

## Acceptance Criteria
- [ ] [Testable criterion]

## Dependencies
- Task NNN (if any)

## Commit Message
type: description
```

**Model Tier Assignment** — assign a tier to each task:
- **tier-1** (opus): Complex logic, architecture decisions, debugging, multi-file refactors
- **tier-2** (sonnet): Standard implementation — DEFAULT for most tasks
- **tier-3** (haiku): Documentation, config files, boilerplate, simple content

When in doubt, use tier-2. Only tier-1 for genuinely complex tasks. Only tier-3 for zero-logic content.

4. Create `.ship/tasks.md` (master checklist):
```markdown
# Feature Tasks: [Feature Name]
Generated: [timestamp]
Total: [N] tasks

## Checklist
- [ ] 001: [Title] [tier-2]
- [ ] 002: [Title] [tier-1]
- [ ] 003: [Title] [tier-3]
```

5. Update `.ship/state.json`:
   - Set `phase` to `"implementation"`
   - Set `total_tasks` to the count
   - Set `current_task` to 1

6. Tell the user:
   > Tasks are ready. Exit this session and run `./ship.sh run` for isolated
   > TDD sub-agent execution, or `./ship.sh run all` for fully automated mode.

---

## Phase 4: Implementation (`phase: "implementation"`)

### Sub-agent execution is handled by `ship.sh` with TDD

Each sub-agent follows the **red-green TDD cycle**:
1. Read `.ship/learnings.md` for known issues
2. Read the task file
3. **Write the test first** (based on `## Test` section)
4. **Run the test** — confirm it fails (red)
5. Implement the code
6. **Run the test again** — confirm it passes (green)
7. Commit both test and implementation files
8. Log any discoveries to `.ship/learnings.md`

**Smart model selection:** Each task runs on the model matching its tier.

```bash
./ship.sh run          # Run next task (TDD)
./ship.sh run 5        # Run specific task
./ship.sh run all      # Run all remaining tasks, then verify
./ship.sh verify       # Run full test suite
./ship.sh status       # Check progress
./ship.sh skip 5       # Skip a task
```

### If user wants to run tasks in THIS session:

You CAN implement tasks here, but warn about context pollution between tasks.
For each task:
1. Read `.ship/learnings.md` first
2. Read ONLY the current task file
3. Write the test first (red), then implement (green)
4. Commit with the exact message from the task
5. Update `.ship/state.json` (increment current_task, add to completed_tasks)
6. Log any discoveries to `.ship/learnings.md`

Prefer using the Task tool with `subagent_type: "general-purpose"` for partial isolation:
```
Task tool → subagent_type: "general-purpose"
prompt: "Read .ship/learnings.md, then .ship/tasks/task-005.md and .ship/plan.md. Follow TDD: write test first (red), implement (green). Commit with the message specified. Log discoveries to learnings.md."
```

---

## Phase 5: Verification (`phase: "verifying"`)

### Goal
Confirm all tests pass as a complete suite. Catch regressions where later tasks broke earlier ones.

### Process
1. `ship.sh` runs the full test command from state.json
2. If all tests pass: phase moves to `complete`, `verified` set to `true`
3. If tests fail: review the verify.log, fix issues, run `./ship.sh verify` again

### Handling failures
- Check `.ship/logs/verify.log` for which tests failed
- Common causes: later task modified a file that breaks an earlier task's test
- Fix the regression, commit, run `./ship.sh verify` again
- If a test itself is wrong, update it and document why in `.ship/context.md`

---

## Agent Learning System

### How it works
- `.ship/learnings.md` is a **persistent knowledge base** that survives resets
- Every sub-agent **reads it before starting** to avoid known issues
- When agents discover non-obvious bugs, gotchas, or patterns, they **append to it**
- Entries are structured with Problem, Solution, Files, and Tags

### Format for new entries
Agents append to the appropriate section (Bugs & Fixes, Gotchas, or Patterns):
```markdown
### [YYYY-MM-DD] Short descriptive title
- **Problem:** What went wrong or was confusing
- **Solution:** How it was fixed or worked around
- **Files:** Which files were involved
- **Tags:** comma-separated keywords
```

### Commands
```bash
./ship.sh learnings              # View all
./ship.sh learnings count        # Count entries
./ship.sh learnings search auth  # Search by keyword
```

---

## Context Recovery

Every time `/ship` is invoked (new session, after compaction, etc.):

1. Read `.ship/state.json` → know the current phase
2. Read `.ship/context.md` → know key decisions
3. Read `.ship/learnings.md` → know project-wide issues and patterns
4. Based on phase:
   - `requirements` → Read `.ship/spec.md` if it exists
   - `planning` → Read `.ship/spec.md`
   - `breakdown` → Read `.ship/spec.md` + `.ship/plan.md`
   - `implementation` → Read `.ship/tasks.md` + current task file
   - `verifying` → Read `.ship/tasks.md` + `.ship/logs/verify.log`

This ensures full recovery without needing prior conversation history.

---

## State File Format

```json
{
  "project": "ship",
  "feature": "feature-name",
  "phase": "requirements|planning|breakdown|implementation|verifying|complete",
  "current_task": 0,
  "total_tasks": 0,
  "completed_tasks": [],
  "skipped_tasks": [],
  "failed_tasks": [],
  "test_command": "",
  "verified": false,
  "created_at": "ISO-timestamp",
  "updated_at": "ISO-timestamp"
}
```

## Model Tiers

| Tier | Model | Use For | Budget |
|------|-------|---------|--------|
| tier-1 | opus | Planning, architecture, complex debugging | $5.00 |
| tier-2 | sonnet | Standard implementation, tests | $2.00 |
| tier-3 | haiku | Docs, config, boilerplate | $0.50 |

## Directory Structure

```
.ship/
  state.json          # Phase tracking and progress
  context.md          # Key decisions log (persists across sessions)
  learnings.md        # Persistent knowledge base (survives reset)
  spec.md             # Feature specification (Phase 1 output)
  plan.md             # Technical plan (Phase 2 output)
  tasks.md            # Master task checklist (Phase 3 output)
  tasks/              # Individual task files for sub-agents
    task-001.md
    task-002.md
    ...
  logs/               # Sub-agent execution logs
    task-001.log
    verify.log
    ...
  blockers/           # Blocker reports from sub-agents
    ...
  .gitignore          # Excludes logs and blockers
```
