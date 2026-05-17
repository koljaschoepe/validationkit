# Anonymized-Customer Fixtures

> **Status:** v0 — bucket scaffolded, 0/9 slots filled. Unlocks per LOI signed (PRD §6.5 Phase-0-Gate Criterion #3).

> **Privacy:** This bucket is the *only* one that may contain identifiable customer-derived content. Strict process below.

## Why this bucket exists

The Golden-Set has 5 bucket-categories. The other 4 (synthetic fixtures, dogfood, adversarial, real-world-like) require zero customer data. This 9-slot bucket lives in the eval pipeline precisely because **synthetic fixtures don't catch real-world failure modes** — bilingual frontmatter, accidental customer-name leaks, oddly-cased rule names, multi-vendor mid-migration messes.

We can't grow this without real engagements. Hence the LOI-gating.

## The privacy process (load-bearing — do not skip)

Before any customer snapshot lands here, every box must be checked:

1. **DPA signed.** Use `docs/legal/dpa-template.md`. M8-Anwalts-pre-read for the first 3 customers.
2. **24h re-review window.** After anonymization, the file sits in `.local/pending-anonymize/` for 24h. A second pass by Kolja confirms zero PII before commit.
3. **Anonymization run.** Use `scripts/anonymize.ts` (see below). Strip emails, names, GitHub handles, internal URLs, repo names.
4. **Customer name swap.** Substitute `acme-NN` for the customer's name in every file path AND every body mention.
5. **Git-blame strip.** Files are committed without their original git history (we're vendoring snapshots, not history).
6. **Final sweep.** `grep -RIn "[a-z]+\.[a-z]+@[a-z]+\.[a-z]+" .` over the proposed vendor-tree returns 0 matches.
7. **Customer sign-off.** Customer-Admin signs off on the anonymized version, in writing, before it lands in git.

Skipping any of these = pushed-back review by the lawyer (M8) = no merge.

## Slot-locking

The 9 slots are intentionally locked. They unlock per LOI signed (PRD §6.5 #3, target 5 LOIs by M3, +4 by M6):

| Slot | Status | Unlocks at |
|---|---|---|
| `acme-01` | LOCKED | LOI #1 |
| `acme-02` | LOCKED | LOI #2 |
| `acme-03` | LOCKED | LOI #3 |
| `acme-04` | LOCKED | LOI #4 |
| `acme-05` | LOCKED | LOI #5 |
| `acme-06` | LOCKED | LOI #6 |
| `acme-07` | LOCKED | LOI #7 |
| `acme-08` | LOCKED | LOI #8 |
| `acme-09` | LOCKED | LOI #9 |

Currently: 0/9 unlocked. Bucket-fill happens post-LOI, not before.

## How to add a slot (template)

Once an LOI is signed and the customer agrees to fixture-contribution:

```bash
# 1. Snapshot the customer-relevant subtree
cp -r /path/to/customer-repo/.claude /path/to/customer-repo/AGENTS.md \
  .local/pending-anonymize/acme-NN-raw/

# 2. Run anonymization (strips PII, swaps names)
pnpm tsx scripts/anonymize.ts \
  --in .local/pending-anonymize/acme-NN-raw \
  --out .local/pending-anonymize/acme-NN-clean \
  --slug acme-NN

# 3. 24h pause. Review.

# 4. Sweep for residual PII (must return 0 hits)
grep -RIn -E "[a-z]+\.[a-z]+@[a-z]+\.[a-z]+|github\.com/[^/]+/[^/]+" \
  .local/pending-anonymize/acme-NN-clean

# 5. Customer sign-off (out-of-band, written).

# 6. Move into golden-set
mv .local/pending-anonymize/acme-NN-clean eval/golden-set/anonymized-customer/acme-NN

# 7. Add manifest entry pointing to it.
```

## .gitignore for this bucket

Until an `acme-NN` slot is filled, the bucket-root should be empty (this README + .gitignore). Raw snapshots go in `.local/pending-anonymize/`, which is git-ignored.

---

*Last updated: 2026-05-16. Owner: Kolja Schöpe. Next unlock-trigger: first LOI signed.*
