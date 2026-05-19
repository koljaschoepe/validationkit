#!/usr/bin/env bash
# Sprint G6 — Lighthouse audit wrapper.
# Runs against a locally-running dev or build server. Outputs JSON + HTML
# to apps/web/lighthouse-*.{json,html} (gitignored).
#
# Usage:
#   pnpm exec next dev -p 3000 &        # or `next start`
#   bash scripts/lighthouse-audit.sh /
#   bash scripts/lighthouse-audit.sh /galaxie-dev
set -euo pipefail

PATH_TO_AUDIT="${1:-/}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
STAMP="$(date +%Y%m%d-%H%M%S)"
SLUG="$(echo "$PATH_TO_AUDIT" | tr '/' '_' | sed 's/^_//; s/_$//')"
SLUG="${SLUG:-root}"
OUT="lighthouse-${STAMP}-${SLUG}"

if ! command -v lighthouse >/dev/null 2>&1; then
  echo "lighthouse CLI not found. Install: npm i -g lighthouse" >&2
  exit 1
fi

lighthouse "${BASE_URL}${PATH_TO_AUDIT}" \
  --quiet \
  --chrome-flags="--headless --disable-gpu --no-sandbox" \
  --preset=desktop \
  --output=json --output=html \
  --output-path="${OUT}"

PERF="$(node -e "console.log(Math.round(require('./${OUT}.report.json').categories.performance.score * 100))")"
echo "Performance: ${PERF}/100  →  ${OUT}.report.html"

if [ "${PERF}" -lt 85 ]; then
  echo "Below G6 target of 85. Inspect the HTML report for top opportunities." >&2
  exit 2
fi
