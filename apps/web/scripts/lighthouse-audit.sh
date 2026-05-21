#!/usr/bin/env bash
# Lighthouse audit wrapper.
#
# Runs against a locally-running build server. Outputs JSON + HTML to
# apps/web/lighthouse-*.{json,html} (gitignored).
#
# Usage:
#   pnpm --filter @vk/web build
#   pnpm --filter @vk/web start &
#   bash scripts/lighthouse-audit.sh / /login /pricing
#
# Override server URL via env: BASE_URL=http://localhost:3001 bash …
#
# Phase Nova-2 P7 beta-launch gate: separate thresholds per category.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
# Backwards-compat: `LIGHTHOUSE_TARGET` still works as the perf threshold.
TARGET_PERF="${LIGHTHOUSE_TARGET_PERF:-${LIGHTHOUSE_TARGET:-85}}"
TARGET_A11Y="${LIGHTHOUSE_TARGET_A11Y:-95}"
TARGET_BP="${LIGHTHOUSE_TARGET_BP:-95}"

if command -v lighthouse >/dev/null 2>&1; then
  LH_CMD=(lighthouse)
else
  echo "lighthouse CLI not found globally — falling back to npx." >&2
  LH_CMD=(npx --yes lighthouse@latest)
fi

# Default to the 5 beta-launch critical routes if no paths given.
PATHS=("$@")
if [ "${#PATHS[@]}" -eq 0 ]; then
  PATHS=("/" "/login" "/pricing" "/trust" "/status")
fi

OVERALL_EXIT=0

for PATH_TO_AUDIT in "${PATHS[@]}"; do
  STAMP="$(date +%Y%m%d-%H%M%S)"
  SLUG="$(echo "$PATH_TO_AUDIT" | tr '/' '_' | sed 's/^_//; s/_$//')"
  SLUG="${SLUG:-root}"
  OUT="lighthouse-${STAMP}-${SLUG}"

  echo "→ ${BASE_URL}${PATH_TO_AUDIT}"

  "${LH_CMD[@]}" "${BASE_URL}${PATH_TO_AUDIT}" \
    --quiet \
    --chrome-flags="--headless --disable-gpu --no-sandbox" \
    --preset=desktop \
    --output=json --output=html \
    --output-path="${OUT}"

  PERF="$(node -e "console.log(Math.round(require('./${OUT}.report.json').categories.performance.score * 100))")"
  A11Y="$(node -e "console.log(Math.round(require('./${OUT}.report.json').categories.accessibility.score * 100))")"
  BP="$(node -e   "console.log(Math.round(require('./${OUT}.report.json').categories['best-practices'].score * 100))")"

  printf "  Perf %3s/%-3s · A11y %3s/%-3s · BestPrac %3s/%-3s  →  %s.report.html\n" \
    "$PERF" "$TARGET_PERF" "$A11Y" "$TARGET_A11Y" "$BP" "$TARGET_BP" "$OUT"

  if [ "${PERF}" -lt "${TARGET_PERF}" ] \
     || [ "${A11Y}" -lt "${TARGET_A11Y}" ] \
     || [ "${BP}" -lt "${TARGET_BP}" ]; then
    echo "  ✗ Below threshold. Inspect the HTML report for top opportunities." >&2
    OVERALL_EXIT=2
  fi
done

exit ${OVERALL_EXIT}
