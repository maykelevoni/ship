#!/usr/bin/env bash
# launch.sh — Parallel buyer traffic pipeline orchestrator
# Usage: ./launch.sh [command] [args]
# Triggered by: ./launch.sh run all  (or /launch inside Claude Code)

set -euo pipefail

LAUNCH_DIR=".launch"
STATE_FILE="$LAUNCH_DIR/state.json"
SKILL_FILE=".claude/skills/launch/skill.md"

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
log()     { echo -e "${CYAN}[launch]${NC} $*"; }
success() { echo -e "${GREEN}[launch]${NC} $*"; }
warn()    { echo -e "${YELLOW}[launch]${NC} $*"; }
error()   { echo -e "${RED}[launch]${NC} $*" >&2; }
header()  { echo -e "\n${BOLD}${BLUE}── $* ──${NC}"; }

now_iso() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

state_get() { cat "$STATE_FILE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))" 2>/dev/null || echo ""; }
state_set() {
  local key="$1" val="$2"
  python3 - <<EOF
import json, sys
with open('$STATE_FILE', 'r') as f:
    d = json.load(f)
d['$key'] = '$val'
d['updated_at'] = '$(now_iso)'
with open('$STATE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
EOF
}

require_state() {
  if [[ ! -f "$STATE_FILE" ]]; then
    error "No .launch/state.json found. Run: ./launch.sh init [product-name]"
    exit 1
  fi
}

require_claude() {
  if ! command -v claude &>/dev/null; then
    error "Claude Code CLI not found. Install: npm install -g @anthropic-ai/claude-code"
    exit 1
  fi
}

# ─── Commands ─────────────────────────────────────────────────────────────────

cmd_help() {
  echo ""
  echo -e "${BOLD}launch.sh${NC} — Parallel buyer traffic pipeline"
  echo ""
  echo "Commands:"
  echo "  init [name]        Initialize a new launch for a product"
  echo "  run                Run the next phase"
  echo "  run [phase]        Run a specific phase (seo|content|video|distribute|outreach|monitor)"
  echo "  run all            Run all remaining phases"
  echo "  status             Show current phase and progress"
  echo "  content            Show generated content (Phase 3 output)"
  echo "  leads              Show found leads (Phase 6 output)"
  echo "  reset [phase]      Reset back to a specific phase"
  echo ""
  echo "Phases:"
  echo "  1. intake          Product brief (reads .ship/spec.md if available)"
  echo "  2. seo             AI search visibility (geo-seo-claude)"
  echo "  3. content         Write for all platforms in parallel"
  echo "  4. distribute      Post via post-bridge MCP"
  echo "  5. distribute      Post via post-bridge MCP"
  echo "  6. outreach        Find leads + write cold emails"
  echo "  7. monitor         PostHog setup + UTM links"
  echo ""
}

cmd_init() {
  local product="${1:-untitled}"

  mkdir -p "$LAUNCH_DIR/content" "$LAUNCH_DIR/outreach" "$LAUNCH_DIR/logs"

  # Don't overwrite existing state
  if [[ -f "$STATE_FILE" ]]; then
    warn "State file already exists. Current phase: $(state_get phase)"
    warn "Use './launch.sh reset intake' to restart."
    return
  fi

  cat > "$STATE_FILE" <<EOF
{
  "product": "$product",
  "product_url": "",
  "phase": "intake",
  "platforms": ["twitter", "linkedin", "reddit", "producthunt"],
  "outreach_enabled": false,
  "outreach_target": "",
  "content_complete": [],
  "posts_scheduled": [],
  "leads_found": 0,
  "emails_written": 0,
  "created_at": "$(now_iso)",
  "updated_at": "$(now_iso)",
  "completed_at": ""
}
EOF

  cat > "$LAUNCH_DIR/context.md" <<'EOF'
# Launch Context Log

## Key Decisions
<!-- Populated during intake phase -->

## Product Notes
<!-- Non-obvious things about this product -->
EOF

  success "Initialized launch for: $product"
  log "Run '/launch' in Claude Code to start the intake phase."
  log "Or run: ./launch.sh run"
}

cmd_status() {
  require_state

  local phase product url
  phase=$(state_get phase)
  product=$(state_get product)
  url=$(state_get product_url)

  header "Launch Status"
  echo -e "  Product:  ${BOLD}$product${NC}"
  [[ -n "$url" ]] && echo -e "  URL:      $url"
  echo -e "  Phase:    ${BOLD}${CYAN}$phase${NC}"
  echo ""

  # Phase progress
  local phases=("intake" "seo" "content" "video" "distribute" "outreach" "monitor" "complete")
  local current_idx=0
  for i in "${!phases[@]}"; do
    [[ "${phases[$i]}" == "$phase" ]] && current_idx=$i
  done

  for i in "${!phases[@]}"; do
    local p="${phases[$i]}"
    if [[ $i -lt $current_idx ]]; then
      echo -e "  ${GREEN}✓${NC} $((i+1)). $p"
    elif [[ $i -eq $current_idx ]]; then
      echo -e "  ${CYAN}→${NC} $((i+1)). $p  ${BOLD}← current${NC}"
    else
      echo -e "  ${NC}○ $((i+1)). $p"
    fi
  done
  echo ""

  # Content files
  if [[ -d "$LAUNCH_DIR/content" ]]; then
    local content_count
    content_count=$(ls "$LAUNCH_DIR/content/"*.md 2>/dev/null | wc -l)
    [[ $content_count -gt 0 ]] && echo -e "  Content files: ${GREEN}$content_count${NC} created"
  fi

  # Outreach
  local leads emails
  leads=$(state_get leads_found)
  emails=$(state_get emails_written)
  [[ "$leads" != "0" ]] && echo -e "  Leads found: ${GREEN}$leads${NC}"
  [[ "$emails" != "0" ]] && echo -e "  Emails written: ${GREEN}$emails${NC}"
  echo ""
}

cmd_content() {
  require_state

  if [[ ! -d "$LAUNCH_DIR/content" ]]; then
    warn "No content yet. Run: ./launch.sh run content"
    return
  fi

  header "Generated Content"
  for f in "$LAUNCH_DIR/content/"*.md; do
    [[ -f "$f" ]] || continue
    local name
    name=$(basename "$f" .md)
    local lines
    lines=$(wc -l < "$f")
    echo -e "  ${GREEN}✓${NC} $name  (${lines} lines) → $f"
  done
  echo ""
  log "Run 'cat .launch/content/twitter.md' to view any file."
}

cmd_leads() {
  require_state

  local leads_file="$LAUNCH_DIR/outreach/leads.md"
  if [[ ! -f "$leads_file" ]]; then
    warn "No leads yet. Run: ./launch.sh run outreach"
    return
  fi

  header "Found Leads"
  cat "$leads_file"
}

cmd_run_phase() {
  local target_phase="${1:-}"
  require_state
  require_claude

  local current_phase
  current_phase=$(state_get phase)

  if [[ -z "$target_phase" ]]; then
    target_phase="$current_phase"
  fi

  if [[ "$target_phase" == "complete" ]]; then
    success "Launch complete!"
    echo ""
    log "Assets:     .launch/content/"
    log "Monitoring: .launch/monitoring/posthog-setup.md"
    log "Outreach:   .launch/outreach/emails.md"
    return
  fi

  header "Running phase: $target_phase"

  # Build the prompt for Claude
  local prompt
  prompt="You are running the /launch skill.

Read .claude/skills/launch/skill.md for full instructions.
Read .launch/state.json — current phase is: $target_phase
Read .launch/brief.md if it exists.
Read docs/STRATEGY.md if it exists.

Execute ONLY the phase: $target_phase

For phase 'content': fire ALL 5 platform agents in parallel using the Agent tool with run_in_background: true. Do not write them one by one.

When done: update .launch/state.json phase to the next phase.
"

  log "Invoking Claude Code for phase: $target_phase"
  echo ""

  claude --print "$prompt"

  echo ""
  success "Phase $target_phase complete."
  log "Run './launch.sh status' to check progress."
}

cmd_run_all() {
  require_state
  require_claude

  local phases=("seo" "content" "video" "distribute" "outreach" "monitor")
  local current_phase
  current_phase=$(state_get phase)

  # Skip already-completed phases
  local started=false
  for phase in "${phases[@]}"; do
    if [[ "$phase" == "$current_phase" ]]; then
      started=true
    fi
    if [[ "$started" == true ]]; then
      cmd_run_phase "$phase"
      echo ""
    fi
  done

  success "All phases complete."
  cmd_status
}

cmd_reset() {
  local target="${1:-intake}"
  require_state

  warn "Resetting phase to: $target"
  state_set phase "$target"
  success "Phase reset to: $target"
  log "Run './launch.sh run' to continue from $target."
}

# ─── Router ───────────────────────────────────────────────────────────────────

COMMAND="${1:-help}"
ARG2="${2:-}"

case "$COMMAND" in
  init)         cmd_init "$ARG2" ;;
  status)       cmd_status ;;
  content)      cmd_content ;;
  leads)        cmd_leads ;;
  run)
    if [[ "$ARG2" == "all" ]]; then
      cmd_run_all
    elif [[ -n "$ARG2" ]]; then
      cmd_run_phase "$ARG2"
    else
      cmd_run_phase
    fi
    ;;
  reset)        cmd_reset "$ARG2" ;;
  help|--help)  cmd_help ;;
  *)
    error "Unknown command: $COMMAND"
    cmd_help
    exit 1
    ;;
esac
