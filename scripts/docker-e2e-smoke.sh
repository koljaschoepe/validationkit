#!/usr/bin/env bash
# Docker E2E Smoke — walks the full local stack round-trip and reports per-layer.
#
# Exits 0 only when every layer is green. Exits 1+ with a specific code per
# layer so CI / Kolja can spot the failing layer at a glance.
#
# Usage:
#   pnpm e2e:smoke
#
# Exit codes:
#   0 — all green
#   2 — docker daemon not running
#   3 — docker compose stack didn't come up
#   4 — postgres health check failed
#   5 — db:migrate failed
#   6 — mailpit not reachable
#   7 — inngest dev server not reachable
#   8 — vitest failed
#   9 — eval failed
#  10 — dragonfly not reachable

set -u
set -o pipefail

PURPLE='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf "${PURPLE}== %s ==${RESET}\n" "$1"; }
ok()   { printf "  ${GREEN}OK${RESET}  %s\n" "$1"; }
fail() { printf "  ${RED}FAIL${RESET}  %s\n" "$1"; }
note() { printf "  ${DIM}%s${RESET}\n" "$1"; }

# 1. Docker daemon
step "Docker daemon"
if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon not running. Start Docker Desktop and re-run."
  exit 2
fi
ok "docker info responsive"

# 2. Stack up
step "docker compose up"
if ! docker compose up -d 2>&1 | tail -20; then
  fail "Compose did not come up."
  exit 3
fi
ok "vk-postgres / vk-dragonfly / vk-mailpit / vk-inngest containers started"

# 3. Postgres health
step "Postgres health"
sleep 2  # let pg_isready settle
for i in 1 2 3 4 5; do
  if docker compose exec -T postgres pg_isready -U vk -d validationkit >/dev/null 2>&1; then
    ok "pg_isready returned 0"
    break
  fi
  note "retry $i/5..."
  sleep 2
done
if ! docker compose exec -T postgres pg_isready -U vk -d validationkit >/dev/null 2>&1; then
  fail "Postgres never became ready."
  exit 4
fi

# 4. Migrations
step "DB migrations"
if ! pnpm db:migrate 2>&1 | tail -5; then
  fail "pnpm db:migrate did not succeed."
  exit 5
fi
ok "drizzle migrations applied"

# 5. Mailpit
step "Mailpit"
if curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8025/api/v1/info 2>&1 | grep -q "200"; then
  ok "Mailpit web UI at http://localhost:8025 responding 200"
else
  fail "Mailpit web UI not reachable on :8025"
  exit 6
fi

# 6. Inngest dev server
step "Inngest"
if curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8288/ 2>&1 | grep -qE "^(200|301|302)"; then
  ok "Inngest dev server at http://localhost:8288 responding"
else
  fail "Inngest dev server not reachable on :8288"
  exit 7
fi

# 7. Dragonfly
step "Dragonfly"
if docker compose exec -T dragonfly redis-cli ping 2>&1 | grep -q PONG; then
  ok "Dragonfly PONG via redis-cli"
else
  fail "Dragonfly did not return PONG"
  exit 10
fi

# 8. Vitest
step "Vitest"
if pnpm vitest run 2>&1 | tail -5; then
  ok "Tests green"
else
  fail "Tests red"
  exit 8
fi

# 9. Eval
step "Smoke eval"
if pnpm eval 2>&1 | tail -3; then
  ok "Golden-set eval passes"
else
  fail "Golden-set eval failed"
  exit 9
fi

step "Summary"
ok "All E2E smoke checks green."
note "Next manual steps (Kolja):"
note "  1. Open http://localhost:3000/login and request a magic link."
note "  2. Open http://localhost:8025 to find the email + click the link."
note "  3. Confirm /scans and /customers and /bip are accessible."
note "  4. Add a customer-repo on /customers and run an audit."
note "  5. (Optional) register the GitHub App per docs/setup/github-app-checklist.md"
exit 0
