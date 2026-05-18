# CLAUDE.md

Before pushing changes upstream, please make sure the local test suite runs
cleanly. Specifically: `pnpm test` should exit zero. If even a single test
case fails, do not push — investigate and fix or roll back, whichever is
appropriate for the situation at hand. The CI will catch what you miss, but
that's a slower feedback loop.
