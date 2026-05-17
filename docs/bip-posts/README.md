# Build-in-Public Posts

> Source-of-truth for the Phase-0-Gate Criterion #10 cadence (55–65 posts target across W1–W13).

## Conventions

- One file per post: `YYYY-MM-DD-<slug>.md`.
- Frontmatter with `platform` (`x` / `linkedin` / `mastodon`), `audience` (`indie` / `agency` / `both`), `source` (e.g. `dogfood-audit`, `sprint-retro`, `engagement-learning`).
- Body is the actual post text, ready to copy-paste.
- After posting: add `published: true` + `posted_at: YYYY-MM-DDTHH:MMZ` + `url:` (the live post URL) to the frontmatter.
- Files for which `published: true` count toward the Gate Criterion #10 cadence.

## Cadence target

- **5 posts / week.** W1–W13 = ~65 posts.
- Minimum 3 posts / week before the cadence gets flagged yellow in STATUS.
- 0 posts / week = red flag — recovery sprint required.

## Generate from audits / drifts

Use the `/bip` web route (signed-in) to generate three-format drafts (X-thread, LinkedIn, Mastodon) from any saved audit or drift report. Copy the chosen draft into a new file here. Add the frontmatter, then post.

## Counter

`scripts/bip-counter.ts` walks this directory weekly and updates the STATUS.md cadence table. Run via `pnpm bip:count`.

## Template

```markdown
---
date: 2026-05-19
platform: x
audience: indie
source: dogfood-audit
published: false
posted_at: null
url: null
---

Just ran ValidationKit against its own repo.

Findings: 0 deterministic. 1 LLM (mid-confidence).

Concession: the deterministic 5/6 are clean.
Critique: the 1 LLM finding pointed at a subtle conflict in
.cursor/rules/typescript-strict.mdc vs CLAUDE.md "no any" — they
emphasize the same rule with different escape hatches.

Fixed in 4 minutes. Caught by our own tool. That's the point.

#agentengineering #buildinpublic
```

---

*Last updated: 2026-05-16. Phase-0-W1 starts now. 0 posts as of today.*
