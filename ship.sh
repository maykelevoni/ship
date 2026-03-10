#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# ship.sh - Spec-Driven TDD Feature Development Orchestrator for Claude Code
#
# Multi-phase workflow with TDD, smart model selection, and agent learning:
# requirements → planning → breakdown → implementation (TDD) → verifying → complete
#
# Features:
# - Smart model selection (opus/sonnet/haiku per task complexity)
# - Test-driven development (red-green cycle per task)
# - Agent learning system (persistent project knowledge base)
#
# Usage: ./ship.sh <command> [args]
# Run ./ship.sh help for all commands.
# =============================================================================

# --- Configuration ---
SHIP_DIR=".ship"
STATE_FILE="$SHIP_DIR/state.json"
CONTEXT_FILE="$SHIP_DIR/context.md"
TASKS_DIR="$SHIP_DIR/tasks"
LOGS_DIR="$SHIP_DIR/logs"
BLOCKERS_DIR="$SHIP_DIR/blockers"
SPEC_FILE="$SHIP_DIR/spec.md"
PLAN_FILE="$SHIP_DIR/plan.md"
MASTER_TASKS="$SHIP_DIR/tasks.md"
LEARNINGS_FILE="$SHIP_DIR/learnings.md"

# Override all tiers with a single model (backwards compatible)
SHIP_MODEL="${SHIP_MODEL:-}"

# Model tiers: opus for thinking, sonnet for coding, haiku for simple content
SHIP_MODEL_PLAN="${SHIP_MODEL_PLAN:-opus}"
SHIP_MODEL_CODE="${SHIP_MODEL_CODE:-sonnet}"
SHIP_MODEL_DOCS="${SHIP_MODEL_DOCS:-haiku}"

# Budget per tier (USD)
SHIP_BUDGET_PLAN="${SHIP_BUDGET_PLAN:-5.00}"
SHIP_BUDGET_CODE="${SHIP_BUDGET_CODE:-2.00}"
SHIP_BUDGET_DOCS="${SHIP_BUDGET_DOCS:-0.50}"

# Legacy single budget override
SHIP_MAX_BUDGET="${SHIP_MAX_BUDGET:-}"

# Test command override
SHIP_TEST_CMD="${SHIP_TEST_CMD:-}"

# Additional claude CLI flags (e.g., --verbose)
SHIP_CLAUDE_FLAGS="${SHIP_CLAUDE_FLAGS:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# --- Helpers ---

now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
pad() { printf '%03d' "$1"; }

die() {
  echo -e "${RED}Error: $1${NC}" >&2
  exit 1
}

check_deps() {
  command -v jq &>/dev/null || die "jq is required. Install: sudo apt install jq"
  command -v claude &>/dev/null || die "claude CLI not found. Install Claude Code first."
}

check_init() {
  [ -f "$STATE_FILE" ] || die "Not initialized. Run: ./ship.sh init"
}

get_state() {
  jq -r ".$1" "$STATE_FILE"
}

set_state() {
  local tmp
  tmp=$(mktemp)
  if [[ "$2" =~ ^-?[0-9]+$ ]]; then
    jq ".$1 = $2 | .updated_at = \"$(now)\"" "$STATE_FILE" > "$tmp"
  elif [[ "$2" == "["* || "$2" == "{"* || "$2" == "true" || "$2" == "false" ]]; then
    jq ".$1 = $2 | .updated_at = \"$(now)\"" "$STATE_FILE" > "$tmp"
  else
    jq ".$1 = \"$2\" | .updated_at = \"$(now)\"" "$STATE_FILE" > "$tmp"
  fi
  mv "$tmp" "$STATE_FILE"
}

array_push() {
  local tmp
  tmp=$(mktemp)
  jq ".$1 += [$2] | .updated_at = \"$(now)\"" "$STATE_FILE" > "$tmp"
  mv "$tmp" "$STATE_FILE"
}

array_contains() {
  jq -e ".$1 | index($2)" "$STATE_FILE" &>/dev/null
}

get_model_for_task() {
  local task_num=$1
  local padded
  padded=$(pad "$task_num")
  local task_file="$TASKS_DIR/task-${padded}.md"

  # If global override is set, use it
  [ -n "$SHIP_MODEL" ] && { echo "$SHIP_MODEL"; return; }

  # Check task file for ## Model tier
  local tier
  tier=$(grep -oP '##\s*Model:\s*\K(tier-[123])' "$task_file" 2>/dev/null || echo "")

  case "$tier" in
    tier-1) echo "$SHIP_MODEL_PLAN" ;;
    tier-3) echo "$SHIP_MODEL_DOCS" ;;
    *)      echo "$SHIP_MODEL_CODE" ;;
  esac
}

get_budget_for_task() {
  local task_num=$1

  # If global override is set, use it
  [ -n "$SHIP_MAX_BUDGET" ] && { echo "$SHIP_MAX_BUDGET"; return; }

  local padded
  padded=$(pad "$task_num")
  local task_file="$TASKS_DIR/task-${padded}.md"

  local tier
  tier=$(grep -oP '##\s*Model:\s*\K(tier-[123])' "$task_file" 2>/dev/null || echo "")

  case "$tier" in
    tier-1) echo "$SHIP_BUDGET_PLAN" ;;
    tier-3) echo "$SHIP_BUDGET_DOCS" ;;
    *)      echo "$SHIP_BUDGET_CODE" ;;
  esac
}

get_tier_label() {
  local task_num=$1
  local padded
  padded=$(pad "$task_num")
  local task_file="$TASKS_DIR/task-${padded}.md"

  local tier
  tier=$(grep -oP '##\s*Model:\s*\K(tier-[123])' "$task_file" 2>/dev/null || echo "tier-2")

  case "$tier" in
    tier-1) echo "plan/complex" ;;
    tier-3) echo "docs/simple" ;;
    *)      echo "code/standard" ;;
  esac
}

# --- Commands ---

cmd_init() {
  local feature_name="${1:-}"

  echo -e "${CYAN}${BOLD}Initializing Ship${NC}"

  mkdir -p "$TASKS_DIR" "$LOGS_DIR" "$BLOCKERS_DIR"

  if [ -f "$STATE_FILE" ]; then
    echo -e "${YELLOW}State file already exists. Use './ship.sh reset' to start over.${NC}"
    cmd_status
    return 0
  fi

  if [ -z "$feature_name" ]; then
    echo -n "Feature name (short, e.g. 'user-profiles'): "
    read -r feature_name
    [ -z "$feature_name" ] && die "Feature name required"
  fi

  cat > "$STATE_FILE" << EOF
{
  "project": "ship",
  "feature": "$feature_name",
  "phase": "requirements",
  "current_task": 0,
  "total_tasks": 0,
  "completed_tasks": [],
  "skipped_tasks": [],
  "failed_tasks": [],
  "test_command": "",
  "verified": false,
  "created_at": "$(now)",
  "updated_at": "$(now)"
}
EOF

  cat > "$CONTEXT_FILE" << 'EOF'
# Ship Context Log

## Key Decisions
<!-- Important decisions from spec/planning phases -->

## Constraints
<!-- Technical or business constraints -->

## Notes
<!-- Important notes for sub-agents -->
EOF

  # Create learnings file only if it doesn't exist (persists across features)
  if [ ! -f "$LEARNINGS_FILE" ]; then
    cat > "$LEARNINGS_FILE" << 'EOF'
# Project Learnings

> Persistent knowledge base. Agents read this before every task and append discoveries.
> This file survives resets — it's project-lifetime knowledge.

## Bugs & Fixes

## Gotchas

## Patterns
EOF
  fi

  cat > "$SHIP_DIR/.gitignore" << 'EOF'
logs/
blockers/
EOF

  echo ""
  echo -e "${GREEN}Initialized .ship/ for feature: ${BOLD}$feature_name${NC}"
  echo -e "  Models: ${CYAN}opus${NC} (plan) → ${CYAN}sonnet${NC} (code) → ${CYAN}haiku${NC} (docs)"
  echo ""
  echo -e "Next steps:"
  echo -e "  ${BOLD}Option A:${NC} Run ${CYAN}./ship.sh spec${NC} to start requirements gathering"
  echo -e "  ${BOLD}Option B:${NC} Open Claude Code and type ${CYAN}/ship${NC}"
}

cmd_status() {
  check_init

  local phase current total completed skipped failed feature test_cmd verified
  phase=$(get_state "phase")
  current=$(get_state "current_task")
  total=$(get_state "total_tasks")
  completed=$(jq '.completed_tasks | length' "$STATE_FILE")
  skipped=$(jq '.skipped_tasks | length' "$STATE_FILE")
  failed=$(jq '.failed_tasks | length' "$STATE_FILE")
  feature=$(get_state "feature")
  test_cmd=$(get_state "test_command")
  verified=$(get_state "verified")

  echo ""
  echo -e "${BOLD}  Ship Status${NC}"
  echo -e "  Feature: ${CYAN}$feature${NC}"
  echo ""

  # Phase display
  local phases=("requirements" "planning" "breakdown" "implementation" "verifying" "complete")
  echo -n "  "
  for p in "${phases[@]}"; do
    if [ "$p" = "$phase" ]; then
      echo -ne "${GREEN}${BOLD}[$p]${NC} "
    else
      echo -ne "${DIM}$p${NC} "
    fi
    [ "$p" != "complete" ] && echo -ne "${DIM}→${NC} "
  done
  echo ""

  # Models
  echo ""
  if [ -n "$SHIP_MODEL" ]; then
    echo -e "  Models: ${CYAN}$SHIP_MODEL${NC} (override)"
  else
    echo -e "  Models: ${CYAN}$SHIP_MODEL_PLAN${NC} (plan) → ${CYAN}$SHIP_MODEL_CODE${NC} (code) → ${CYAN}$SHIP_MODEL_DOCS${NC} (docs)"
  fi

  # Test command
  if [ -n "$test_cmd" ] && [ "$test_cmd" != "null" ] && [ "$test_cmd" != "" ]; then
    echo -e "  Tests:  ${CYAN}$test_cmd${NC}"
    [ "$verified" = "true" ] && echo -e "  Verified: ${GREEN}yes${NC}" || echo -e "  Verified: ${YELLOW}no${NC}"
  fi

  # Learnings
  if [ -f "$LEARNINGS_FILE" ]; then
    local learn_count
    learn_count=$(grep -c "^### " "$LEARNINGS_FILE" 2>/dev/null || echo "0")
    echo -e "  Learnings: ${BOLD}$learn_count${NC} entries"
  fi

  # Progress (only in implementation+)
  if [ "$total" -gt 0 ]; then
    echo ""
    local pct=0
    [ "$total" -gt 0 ] && pct=$((completed * 100 / total))

    echo -e "  Tasks: ${BOLD}$completed${NC}/$total completed ($pct%)"
    [ "$phase" = "implementation" ] && echo -e "  Current: Task $current"
    [ "$skipped" -gt 0 ] && echo -e "  Skipped: ${YELLOW}$skipped${NC}"
    [ "$failed" -gt 0 ] && echo -e "  Failed:  ${RED}$failed${NC}"

    # Progress bar
    local bar_w=30
    local filled=$((pct * bar_w / 100))
    local empty=$((bar_w - filled))
    echo -n "  ["
    [ "$filled" -gt 0 ] && printf "${GREEN}%0.s█${NC}" $(seq 1 "$filled")
    [ "$empty" -gt 0 ] && printf "%0.s░" $(seq 1 "$empty")
    echo -e "] $pct%"
  fi

  # Files
  echo ""
  echo -e "  ${BOLD}Files:${NC}"
  [ -f "$SPEC_FILE" ] && echo -e "    ${GREEN}✓${NC} spec.md" || echo -e "    ${DIM}○${NC} spec.md"
  [ -f "$PLAN_FILE" ] && echo -e "    ${GREEN}✓${NC} plan.md" || echo -e "    ${DIM}○${NC} plan.md"
  [ -f "$MASTER_TASKS" ] && echo -e "    ${GREEN}✓${NC} tasks.md" || echo -e "    ${DIM}○${NC} tasks.md"
  [ -f "$LEARNINGS_FILE" ] && echo -e "    ${GREEN}✓${NC} learnings.md" || echo -e "    ${DIM}○${NC} learnings.md"
  local task_count
  task_count=$(find "$TASKS_DIR" -name 'task-*.md' 2>/dev/null | wc -l || true)
  [ "$task_count" -gt 0 ] && echo -e "    ${GREEN}✓${NC} $task_count task files"

  # Blockers
  local blocker_count
  blocker_count=$(find "$BLOCKERS_DIR" -name '*.md' 2>/dev/null | wc -l || true)
  if [ "$blocker_count" -gt 0 ]; then
    echo ""
    echo -e "  ${RED}Blockers ($blocker_count):${NC}"
    for f in "$BLOCKERS_DIR"/*.md; do
      echo -e "    - $(basename "$f")"
    done
  fi
  echo ""
}

cmd_spec() {
  check_init
  set_state "phase" "requirements"

  local model="${SHIP_MODEL:-$SHIP_MODEL_PLAN}"
  local budget="${SHIP_MAX_BUDGET:-$SHIP_BUDGET_PLAN}"

  echo -e "${CYAN}Launching requirements gathering session...${NC}"
  echo -e "${DIM}Model: $model | Budget: \$$budget${NC}"
  echo ""

  claude --model "$model" --max-budget-usd "$budget" \
    "I'm starting the Ship requirements gathering phase.

Please read these files first:
1. .ship/state.json
2. .ship/context.md
3. .ship/learnings.md (for known project issues)
4. .ship/spec.md (if it exists - means we're revising)
5. .claude/CLAUDE.md (for project conventions)

Then ask me structured questions about the feature I want to build, ONE CATEGORY AT A TIME:
1. Feature overview (what, why, for whom)
2. User stories and flows
3. Technical constraints and integrations with existing services
4. UI/UX requirements
5. Scope boundaries

After gathering all answers, create .ship/spec.md with structured sections.
Ask me to review and approve it.
After approval, update .ship/state.json: set phase to 'planning'.
Log key decisions to .ship/context.md."
}

cmd_plan() {
  check_init
  [ -f "$SPEC_FILE" ] || die "spec.md not found. Run './ship.sh spec' first."
  set_state "phase" "planning"

  local model="${SHIP_MODEL:-$SHIP_MODEL_PLAN}"
  local budget="${SHIP_MAX_BUDGET:-$SHIP_BUDGET_PLAN}"

  echo -e "${CYAN}Launching technical planning session...${NC}"
  echo -e "${DIM}Model: $model | Budget: \$$budget${NC}"
  echo ""

  claude --model "$model" --max-budget-usd "$budget" \
    "I'm starting the Ship technical planning phase.

Read these files:
1. .ship/state.json
2. .ship/spec.md (approved feature spec)
3. .ship/context.md
4. .ship/learnings.md (known issues and patterns — apply relevant lessons)
5. .claude/CLAUDE.md (project conventions and stack)

Based on the feature spec, create .ship/plan.md covering:
1. Architecture integration (how it fits the existing project structure)
2. Database changes (if applicable)
3. API design (new routes with auth requirements)
4. Frontend components (pages, components, UI library)
5. Service integrations (as needed)
6. Complete file map (every file to create or modify)
7. Testing strategy:
   - Test framework to use (detect from package.json/config or recommend)
   - Test command (e.g., npx vitest run, npm test, pytest)
   - Test file naming convention (e.g., *.test.ts, *.spec.ts)
   - Test file location convention (co-located __tests__/ or top-level tests/)
   - Types of tests needed: unit, integration, e2e
   - Shared test utilities or fixtures needed

Read existing relevant files to understand current patterns before planning.
Check .ship/learnings.md for known gotchas with the technologies involved.
Present the plan section by section, checking for feedback.

After approval:
- Update .ship/state.json: set phase to 'breakdown'
- Update .ship/state.json: set test_command to the detected/chosen test command
- Log technical decisions to .ship/context.md."
}

cmd_breakdown() {
  check_init
  [ -f "$PLAN_FILE" ] || die "plan.md not found. Run './ship.sh plan' first."
  set_state "phase" "breakdown"

  local model="${SHIP_MODEL:-$SHIP_MODEL_PLAN}"
  local budget="${SHIP_MAX_BUDGET:-$SHIP_BUDGET_PLAN}"

  echo -e "${CYAN}Launching task breakdown session...${NC}"
  echo -e "${DIM}Model: $model | Budget: \$$budget${NC}"
  echo ""

  claude --model "$model" --max-budget-usd "$budget" \
    "I'm starting the Ship task breakdown phase.

Read these files:
1. .ship/state.json
2. .ship/spec.md
3. .ship/plan.md
4. .ship/context.md
5. .ship/learnings.md (known issues — warn relevant tasks about these)

Break the technical plan into small, sequential, independently-implementable tasks.

TASK SIZING: 20-50 min each, 1-5 files each, one clear purpose (includes TDD test writing time).

ORDERING:
0. Shared test utilities/fixtures (if needed)
1. Database schema/migrations (+ schema validation tests)
2. Backend API routes (+ API tests)
3. Frontend components and pages (+ component tests)
4. Wiring (connecting frontend to backend)
5. Integration with existing services
6. Polish, edge cases, error handling

For EACH task, create .ship/tasks/task-NNN.md with this template:

\`\`\`
# Task NNN: [Title]

## Model: tier-1|tier-2|tier-3

## Description
[What to implement and why, with reference to the plan]

## Test
- **Test file:** \`path/to/test-file.test.ts\` (create)
- **What to test:**
  1. [Assertion derived from acceptance criteria 1]
  2. [Assertion derived from acceptance criteria 2]
- **Test type:** unit|integration|e2e
- **Setup needed:** [any fixtures, mocks, or test data]

## Files
- \`path/to/file.ts\` (create|modify)

## Requirements
1. [Specific requirement]

## Existing Code to Reference
- \`path/to/existing.ts\` (pattern to follow)

## Acceptance Criteria
- [ ] [Criterion]

## Dependencies
- Task NNN (if any)

## Commit Message
type: description
\`\`\`

MODEL TIER ASSIGNMENT — assign a tier to each task:
- **tier-1** (opus): Complex logic, architecture, debugging, multi-file refactors
- **tier-2** (sonnet): Standard implementation — DEFAULT for most tasks
- **tier-3** (haiku): Documentation, config files, boilerplate, simple content
When in doubt, use tier-2. Only tier-1 for genuinely complex tasks. Only tier-3 for zero-logic content.

Also create .ship/tasks.md with a master checklist showing tier per task.

After creating all tasks, update .ship/state.json:
- phase = 'implementation'
- total_tasks = [count]
- current_task = 1

Show me the task list with assigned tiers for review before finalizing.
Tell me to run './ship.sh run all' for automated TDD execution."
}

# --- Implementation Phase ---

find_next_task() {
  local total
  total=$(get_state "total_tasks")
  [ "$total" -eq 0 ] && { echo "0"; return; }

  for i in $(seq 1 "$total"); do
    if ! array_contains "completed_tasks" "$i" && ! array_contains "skipped_tasks" "$i"; then
      echo "$i"
      return
    fi
  done
  echo "0"
}

run_single_task() {
  local task_num=$1
  local padded
  padded=$(pad "$task_num")
  local task_file="$TASKS_DIR/task-${padded}.md"

  [ -f "$task_file" ] || die "Task file not found: $task_file"

  if array_contains "completed_tasks" "$task_num"; then
    echo -e "${YELLOW}Task $task_num already completed.${NC}"
    return 0
  fi

  local total
  total=$(get_state "total_tasks")
  local task_title
  task_title=$(head -1 "$task_file" | sed 's/^# //')

  # Get model and budget for this task
  local task_model task_budget tier_label
  task_model=$(get_model_for_task "$task_num")
  task_budget=$(get_budget_for_task "$task_num")
  tier_label=$(get_tier_label "$task_num")

  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
  echo -e "  ${CYAN}Task $task_num / $total${NC}: $task_title"
  echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
  echo ""

  set_state "current_task" "$task_num"

  # Get test command
  local test_cmd="${SHIP_TEST_CMD:-}"
  if [ -z "$test_cmd" ]; then
    test_cmd=$(get_state "test_command")
    [ "$test_cmd" = "null" ] && test_cmd=""
  fi

  # Build the system prompt
  local system_prompt
  system_prompt=$(cat << 'SYSPROMPT'
You are a Ship sub-agent. You execute ONE task using Test-Driven Development (TDD).

CRITICAL RULES:
1. Implement ONLY the task assigned to you - nothing else
2. Follow the existing codebase patterns and conventions
3. Create/modify ONLY the files specified in the task (plus the test file)
4. Write clean, production-quality code - no placeholders or TODOs
5. After implementation, commit with EXACTLY the commit message from the task
6. Use: git commit --no-attribution -m "message"
7. Do NOT read other task files in .ship/tasks/
8. Do NOT modify .ship/state.json or .ship/context.md
9. Do NOT add features, optimizations, or improvements beyond the task
10. Do NOT add unnecessary comments or docstrings
11. If blocked by an issue you cannot resolve, create a blocker file explaining why
12. Read .ship/learnings.md before starting — apply relevant lessons to avoid known issues
13. If you discover a non-obvious bug, gotcha, or important pattern, append it to .ship/learnings.md

TDD WORKFLOW:
1. Read .ship/learnings.md for known issues and patterns
2. Read your task file to understand what to do
3. Read the feature spec and technical plan for context
4. Read existing code files referenced in the task
5. WRITE THE TEST FIRST based on the ## Test section of your task
6. RUN THE TEST — confirm it fails (red). If it passes already, investigate why
7. Implement the code changes specified in the task
8. RUN THE TEST AGAIN — confirm it passes (green)
9. If the test still fails, debug and fix your implementation (not the test, unless the test has a genuine bug)
10. Commit both test and implementation files with the exact commit message
11. If you discovered something non-obvious, append to .ship/learnings.md

TDD RULES:
- ALWAYS write the test file BEFORE the implementation code
- The test MUST fail before implementation (red phase)
- The test MUST pass after implementation (green phase)
- Run ONLY your specific test file, not the entire test suite
- Each acceptance criterion should map to at least one test assertion
- Do NOT write trivial tests that test nothing meaningful
- If you cannot make the test pass after reasonable effort, create a blocker file

LEARNING RULES:
- Only log genuinely useful discoveries — NOT routine coding
- Do NOT duplicate entries already in learnings.md
- Use this format when appending to the appropriate section (Bugs & Fixes, Gotchas, or Patterns):
  ### [YYYY-MM-DD] Short title
  - **Problem:** What went wrong or was confusing
  - **Solution:** How you fixed it or worked around it
  - **Files:** Which files were involved
  - **Tags:** comma-separated keywords
SYSPROMPT
)

  # Build the user prompt
  local user_prompt
  user_prompt=$(cat << USERPROMPT
You are executing Task $task_num of $total for the ship project.

Read these files in order:
1. .ship/learnings.md (known issues — apply relevant lessons)
2. .ship/tasks/task-${padded}.md (YOUR task)
3. .ship/spec.md (feature specification)
4. .ship/plan.md (technical plan)
5. .ship/context.md (key decisions)

Then read any existing code files referenced in the task's "Existing Code to Reference" section.

TDD CYCLE:
1. Write the test file specified in the ## Test section
2. Run it: ${test_cmd:-(detect test command from project)} — expect FAIL (red)
3. Implement the code
4. Run the test again — expect PASS (green)
5. Commit both test and implementation files

Start now by reading .ship/learnings.md, then your task file.
USERPROMPT
)

  local log_file="$LOGS_DIR/task-${padded}.log"

  echo -e "  Model:  ${BOLD}${task_model}${NC} (${tier_label})"
  echo -e "  Budget: \$${task_budget}"
  echo -e "  Log:    $log_file"
  [ -n "$test_cmd" ] && echo -e "  Tests:  ${CYAN}$test_cmd${NC}"
  echo -e "${DIM}───────────────────────────────────────────────${NC}"

  # Spawn isolated sub-agent
  local exit_code=0
  claude -p "$user_prompt" \
    --append-system-prompt "$system_prompt" \
    --allowedTools "Read,Write,Edit,Bash,Glob,Grep" \
    --model "$task_model" \
    --max-budget-usd "$task_budget" \
    --permission-mode "bypassPermissions" \
    $SHIP_CLAUDE_FLAGS \
    2>&1 | tee "$log_file" || exit_code=$?

  echo -e "${DIM}───────────────────────────────────────────────${NC}"

  if [ "$exit_code" -eq 0 ]; then
    # Post-task test verification (safety net)
    if [ -n "$test_cmd" ]; then
      echo -e "  ${CYAN}Running post-task test verification...${NC}"
      local test_exit=0
      eval "$test_cmd" 2>&1 | tail -20 || test_exit=$?

      if [ "$test_exit" -ne 0 ]; then
        array_push "failed_tasks" "$task_num"
        echo -e "${RED}  ✗ Task $task_num: tests failed after implementation${NC}"
        echo -e "  Check: $log_file"
        echo ""
        return 1
      fi
      echo -e "  ${GREEN}Tests passed${NC}"
    fi

    array_push "completed_tasks" "$task_num"

    # Update master checklist
    if [ -f "$MASTER_TASKS" ]; then
      sed -i "s/- \[ \] ${padded}:/- [x] ${padded}:/" "$MASTER_TASKS" 2>/dev/null || true
    fi

    echo -e "${GREEN}  ✓ Task $task_num completed${NC}"
  else
    array_push "failed_tasks" "$task_num"
    echo -e "${RED}  ✗ Task $task_num failed (exit: $exit_code)${NC}"
    echo -e "  Check: $log_file"

    # Check for blocker file
    if [ -f "$BLOCKERS_DIR/task-${padded}.md" ]; then
      echo -e "${YELLOW}  Blocker report:${NC}"
      head -5 "$BLOCKERS_DIR/task-${padded}.md" | sed 's/^/    /'
    fi
  fi
  echo ""

  return $exit_code
}

cmd_run() {
  check_init

  local phase
  phase=$(get_state "phase")
  [ "$phase" = "implementation" ] || die "Not in implementation phase (current: $phase). Complete previous phases first."

  local target="${1:-next}"

  case "$target" in
    all)
      echo -e "${BOLD}Running all remaining tasks (TDD mode)...${NC}"
      local start_time
      start_time=$(date +%s)

      while true; do
        local next
        next=$(find_next_task)
        [ "$next" -eq 0 ] && break

        run_single_task "$next" || {
          echo -e "${RED}Task $next failed. Stopping.${NC}"
          echo -e "Fix the issue then run: ./ship.sh run"
          exit 1
        }
      done

      local elapsed=$(( $(date +%s) - start_time ))

      echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
      echo -e "${GREEN}  All tasks implemented! (${elapsed}s)${NC}"
      echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
      echo ""

      # Auto-trigger verification
      echo -e "${CYAN}Running final test verification...${NC}"
      cmd_verify
      ;;

    next)
      local next
      next=$(find_next_task)
      if [ "$next" -eq 0 ]; then
        echo -e "${GREEN}All tasks implemented. Running verification...${NC}"
        cmd_verify
        return $?
      fi
      run_single_task "$next"
      ;;

    *)
      if [[ "$target" =~ ^[0-9]+$ ]]; then
        run_single_task "$target"
      else
        die "Invalid argument: $target. Use: run [next|all|N]"
      fi
      ;;
  esac
}

cmd_verify() {
  check_init

  local test_cmd="${SHIP_TEST_CMD:-}"
  if [ -z "$test_cmd" ]; then
    test_cmd=$(get_state "test_command")
    [ "$test_cmd" = "null" ] && test_cmd=""
  fi

  [ -n "$test_cmd" ] || die "No test_command configured. Set it in state.json during planning or use SHIP_TEST_CMD env var."

  echo -e "${CYAN}${BOLD}Running full test suite verification...${NC}"
  echo -e "${DIM}Command: $test_cmd${NC}"
  echo ""

  set_state "phase" "verifying"

  local exit_code=0
  eval "$test_cmd" 2>&1 | tee "$LOGS_DIR/verify.log" || exit_code=$?

  echo ""
  if [ "$exit_code" -eq 0 ]; then
    set_state "verified" true
    set_state "phase" "complete"
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  All tests pass. Feature verified!${NC}"
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
  else
    set_state "verified" false
    echo -e "${RED}${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "${RED}  Tests failed. Feature NOT verified.${NC}"
    echo -e "${RED}${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "  Review: $LOGS_DIR/verify.log"
    echo -e "  Fix issues, then run: ${CYAN}./ship.sh verify${NC}"
  fi
  echo ""
}

cmd_skip() {
  check_init
  local task_num="${1:-}"
  [ -n "$task_num" ] || die "Usage: ./ship.sh skip <task-number>"

  array_push "skipped_tasks" "$task_num"

  if [ -f "$MASTER_TASKS" ]; then
    local padded
    padded=$(pad "$task_num")
    sed -i "s/- \[ \] ${padded}:/- [~] ${padded}: (skipped)/" "$MASTER_TASKS" 2>/dev/null || true
  fi

  echo -e "${YELLOW}Skipped task $task_num${NC}"
}

cmd_retry() {
  check_init
  local task_num="${1:-}"
  [ -n "$task_num" ] || die "Usage: ./ship.sh retry <task-number>"

  # Remove from failed list
  local tmp
  tmp=$(mktemp)
  jq ".failed_tasks -= [$task_num] | .updated_at = \"$(now)\"" "$STATE_FILE" > "$tmp"
  mv "$tmp" "$STATE_FILE"

  # Remove blocker if exists
  rm -f "$BLOCKERS_DIR/task-$(pad "$task_num").md"

  echo -e "${CYAN}Retrying task $task_num...${NC}"
  run_single_task "$task_num"
}

cmd_reset() {
  check_init
  local target="${1:-all}"

  case "$target" in
    all|requirements)
      echo -e "${YELLOW}Resetting to: requirements${NC}"
      rm -f "$SPEC_FILE" "$PLAN_FILE" "$MASTER_TASKS"
      rm -f "$TASKS_DIR"/task-*.md "$LOGS_DIR"/*.log "$BLOCKERS_DIR"/*.md
      local tmp
      tmp=$(mktemp)
      jq '.phase = "requirements" | .current_task = 0 | .total_tasks = 0 | .completed_tasks = [] | .skipped_tasks = [] | .failed_tasks = [] | .test_command = "" | .verified = false' "$STATE_FILE" > "$tmp"
      mv "$tmp" "$STATE_FILE"
      ;;
    planning)
      echo -e "${YELLOW}Resetting to: planning${NC}"
      rm -f "$PLAN_FILE" "$MASTER_TASKS"
      rm -f "$TASKS_DIR"/task-*.md "$LOGS_DIR"/*.log "$BLOCKERS_DIR"/*.md
      local tmp2
      tmp2=$(mktemp)
      jq '.phase = "planning" | .current_task = 0 | .total_tasks = 0 | .completed_tasks = [] | .skipped_tasks = [] | .failed_tasks = [] | .test_command = "" | .verified = false' "$STATE_FILE" > "$tmp2"
      mv "$tmp2" "$STATE_FILE"
      ;;
    breakdown)
      echo -e "${YELLOW}Resetting to: breakdown${NC}"
      rm -f "$MASTER_TASKS"
      rm -f "$TASKS_DIR"/task-*.md "$LOGS_DIR"/*.log "$BLOCKERS_DIR"/*.md
      local tmp3
      tmp3=$(mktemp)
      jq '.phase = "breakdown" | .current_task = 0 | .total_tasks = 0 | .completed_tasks = [] | .skipped_tasks = [] | .failed_tasks = [] | .verified = false' "$STATE_FILE" > "$tmp3"
      mv "$tmp3" "$STATE_FILE"
      ;;
    implementation|tasks)
      echo -e "${YELLOW}Resetting implementation progress${NC}"
      rm -f "$LOGS_DIR"/*.log "$BLOCKERS_DIR"/*.md
      local tmp4
      tmp4=$(mktemp)
      jq '.phase = "implementation" | .current_task = 1 | .completed_tasks = [] | .skipped_tasks = [] | .failed_tasks = [] | .verified = false' "$STATE_FILE" > "$tmp4"
      mv "$tmp4" "$STATE_FILE"
      if [ -f "$MASTER_TASKS" ]; then
        sed -i 's/- \[x\]/- [ ]/g; s/- \[~\]/- [ ]/g' "$MASTER_TASKS" 2>/dev/null || true
      fi
      ;;
    verifying)
      echo -e "${YELLOW}Resetting to: verifying${NC}"
      rm -f "$LOGS_DIR/verify.log"
      local tmp5
      tmp5=$(mktemp)
      jq '.phase = "verifying" | .verified = false' "$STATE_FILE" > "$tmp5"
      mv "$tmp5" "$STATE_FILE"
      ;;
    *)
      die "Unknown phase: $target. Use: requirements|planning|breakdown|implementation|verifying"
      ;;
  esac

  echo -e "${GREEN}✓ Reset complete${NC}"
  echo -e "${DIM}Note: learnings.md preserved (project knowledge)${NC}"
}

cmd_log() {
  check_init
  local task_num="${1:-}"

  if [ -z "$task_num" ]; then
    echo -e "${BOLD}Task Logs:${NC}"
    if ls "$LOGS_DIR"/*.log &>/dev/null; then
      for f in "$LOGS_DIR"/*.log; do
        local size
        size=$(wc -c < "$f")
        local name
        name=$(basename "$f" .log)
        echo -e "  $name  (${size} bytes)"
      done
    else
      echo "  No logs yet."
    fi
    return
  fi

  local log_file="$LOGS_DIR/task-$(pad "$task_num").log"
  if [ -f "$log_file" ]; then
    less "$log_file"
  else
    echo -e "${YELLOW}No log for task $task_num${NC}"
  fi
}

cmd_learnings() {
  local action="${1:-view}"

  case "$action" in
    view)
      if [ -f "$LEARNINGS_FILE" ]; then
        cat "$LEARNINGS_FILE"
      else
        echo -e "${YELLOW}No learnings file yet. Run './ship.sh init' first.${NC}"
      fi
      ;;
    count)
      if [ -f "$LEARNINGS_FILE" ]; then
        local count
        count=$(grep -c "^### " "$LEARNINGS_FILE" 2>/dev/null || echo "0")
        echo -e "  ${BOLD}$count${NC} learnings recorded"
      else
        echo "0"
      fi
      ;;
    search)
      local term="${2:-}"
      [ -n "$term" ] || die "Usage: ./ship.sh learnings search <term>"
      if [ -f "$LEARNINGS_FILE" ]; then
        grep -i -A 4 "$term" "$LEARNINGS_FILE" || echo -e "${YELLOW}No matches for '$term'${NC}"
      fi
      ;;
    *)
      die "Usage: ./ship.sh learnings [view|count|search <term>]"
      ;;
  esac
}

cmd_context() {
  check_init

  if [ $# -eq 0 ]; then
    cat "$CONTEXT_FILE"
    return
  fi

  echo "- $(now): $*" >> "$CONTEXT_FILE"
  echo -e "${GREEN}✓ Added to context.md${NC}"
}

cmd_clean() {
  echo -e "${YELLOW}This will delete the .ship/ directory.${NC}"

  local tmp_learn=""
  if [ -f "$LEARNINGS_FILE" ]; then
    local learn_count
    learn_count=$(grep -c "^### " "$LEARNINGS_FILE" 2>/dev/null || echo "0")
    if [ "$learn_count" -gt 0 ]; then
      echo -e "${CYAN}learnings.md has $learn_count entries of project knowledge.${NC}"
      echo -n "Preserve learnings.md? (Y/n): "
      read -r keep_learnings
      if [ "$keep_learnings" != "n" ] && [ "$keep_learnings" != "N" ]; then
        tmp_learn=$(mktemp)
        cp "$LEARNINGS_FILE" "$tmp_learn"
      fi
    fi
  fi

  echo -n "Delete .ship/? (y/N): "
  read -r confirm
  if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    rm -rf "$SHIP_DIR"
    echo -e "${GREEN}✓ Cleaned up .ship/${NC}"

    # Restore learnings if preserved
    if [ -n "$tmp_learn" ] && [ -f "$tmp_learn" ]; then
      mkdir -p "$SHIP_DIR"
      mv "$tmp_learn" "$LEARNINGS_FILE"
      echo -e "${GREEN}✓ Preserved learnings.md${NC}"
    fi
  else
    echo "Cancelled."
    [ -n "$tmp_learn" ] && [ -f "$tmp_learn" ] && rm -f "$tmp_learn"
  fi
}

cmd_help() {
  cat << 'HELPEOF'

  Ship - Spec-Driven TDD Feature Development

  SETUP
    init [name]          Initialize ship for a new feature
    status               Show current phase and progress
    clean                Remove .ship/ (preserves learnings)
    reset [phase]        Reset to a phase (requirements|planning|breakdown|implementation|verifying)

  INTERACTIVE PHASES (launches Claude Code session)
    spec                 Phase 1: Requirements gathering → spec.md         [opus]
    plan                 Phase 2: Technical planning → plan.md             [opus]
    breakdown            Phase 3: Task breakdown → task files              [opus]

  AUTOMATED IMPLEMENTATION — TDD (isolated sub-agents)
    run [next]           Execute next task (write test → red → code → green)
    run <N>              Execute specific task
    run all              Execute all remaining, then verify
    retry <N>            Retry a failed task
    skip <N>             Skip a task

  TESTING & VERIFICATION
    verify               Run full test suite (final gate to complete)

  KNOWLEDGE BASE
    learnings            View all project learnings
    learnings count      Count total learnings
    learnings search X   Search learnings for keyword

  UTILITIES
    log [N]              List logs or view log for task N
    context [note]       View or append to context.md
    help                 Show this help

  MODEL TIERS (auto-assigned per task)
    tier-1 (opus)    → Planning, complex logic, architecture
    tier-2 (sonnet)  → Standard implementation (default)
    tier-3 (haiku)   → Docs, config, boilerplate

  ENVIRONMENT VARIABLES
    SHIP_MODEL          Override all tiers with single model
    SHIP_MODEL_PLAN     Model for planning (default: opus)
    SHIP_MODEL_CODE     Model for implementation (default: sonnet)
    SHIP_MODEL_DOCS     Model for docs/config (default: haiku)
    SHIP_BUDGET_PLAN    Max USD for planning tasks (default: 5.00)
    SHIP_BUDGET_CODE    Max USD for coding tasks (default: 2.00)
    SHIP_BUDGET_DOCS    Max USD for docs tasks (default: 0.50)
    SHIP_MAX_BUDGET     Override all budgets
    SHIP_TEST_CMD       Override test command
    SHIP_CLAUDE_FLAGS   Extra claude CLI flags

  EXAMPLES
    ./ship.sh init user-profiles
    ./ship.sh spec
    ./ship.sh plan
    ./ship.sh breakdown
    ./ship.sh run                     # next task (TDD)
    ./ship.sh run all                 # all tasks + verify
    ./ship.sh verify                  # re-run test suite
    ./ship.sh learnings search auth   # search known issues
    SHIP_MODEL=opus ./ship.sh run 5   # force opus on task 5

HELPEOF
}

# --- Main ---

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Interrupted. State saved in .ship/state.json${NC}"; exit 130' INT

check_deps

case "${1:-help}" in
  init)       cmd_init "${2:-}" ;;
  status|st)  cmd_status ;;
  spec)       cmd_spec ;;
  plan)       cmd_plan ;;
  breakdown)  cmd_breakdown ;;
  run)        cmd_run "${2:-next}" ;;
  verify)     cmd_verify ;;
  retry)      cmd_retry "${2:-}" ;;
  skip)       cmd_skip "${2:-}" ;;
  reset)      cmd_reset "${2:-all}" ;;
  log|logs)   cmd_log "${2:-}" ;;
  learnings)  shift; cmd_learnings "$@" ;;
  context)    shift; cmd_context "$@" ;;
  clean)      cmd_clean ;;
  help|-h|--help) cmd_help ;;
  *)          echo -e "${RED}Unknown: $1${NC}"; cmd_help; exit 1 ;;
esac
