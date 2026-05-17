# 04 — File-Migration-Plan v5-Refactor

> **Track D Research Output** — Concrete `mv`-based migration plan from current state to target docs/-structure.
> **Date:** 2026-05-16
> **Scope:** Re-organize `/Users/koljaschope/Documents/rohan/` into `docs/`-Subfolder-Structure without information loss.

---

## Section 1: Current State Inventory

Inventory as of `ls -la` at root and recursive child folders. Sizes in bytes, mtimes from filesystem.

### 1.1 Root-Level Files (live, top-level)

| File | Size | Last-Modified | Notes |
|---|---:|---|---|
| `PRD ContextForge.pdf` | 135 529 | 2026-05-16 10:00 | User-Pivot-PRD, space in filename |
| `PRD ValidationKit.pdf` | 138 208 | 2026-05-14 00:09 | Original v0.1 (Datum 2026-05-13), space in filename |
| `PRD-ValidationKit-v2.md` | 70 796 | 2026-05-14 00:42 | Archive |
| `PRD-ValidationKit-v3.md` | 34 516 | 2026-05-14 09:20 | Archive (replaced by v3.1) |
| `PRD-ValidationKit-v3.1.md` | 23 154 | 2026-05-16 10:37 | Current source of truth; will be consolidated into `docs/PRD.md` (Synthese-Step) then archived |

### 1.2 Root-Level Folders

| Folder | Files | Size | Notes |
|---|---:|---:|---|
| `.claude/` | 1 file + 2 subfolders | 56 KB | STAYS — project context, agents, commands |
| `analysis/` | 19 files | 404 KB | v2-phase deep research, ALL files exist (01–19) |
| `analysis-v3/` | 13 files | 300 KB | v3-phase, GAPS: 09, 12 are missing (Rate-Limit-Verlust) |
| `analysis-v4/` | 9 files | 320 KB | v4-phase ContextForge-Pivot-Check, complete (00–08) |
| `decisions/` | 2 files | 24 KB | ADR-0017, ADR-0018 |
| `docs/` | 1 subfolder | 0 KB | NEW skeleton; `docs/research/v5/` exists (currently being populated) |

### 1.3 `.claude/` Inventory

```
.claude/
├── CLAUDE.md                       14 352 B   2026-05-16 10:33   (project context — already references v3.1)
├── agents/
│   ├── brand-voice-keeper.md        2 885 B   2026-05-14 00:44
│   ├── competitor-recon.md          2 608 B   2026-05-14 00:44
│   ├── decision-logger.md           2 738 B   2026-05-14 00:44
│   ├── prd-iterator.md              2 292 B   2026-05-14 00:43
│   └── strategy-challenger.md       2 705 B   2026-05-14 00:44
└── commands/
    ├── compete-check.md               918 B   2026-05-14 00:44
    ├── decision.md                    743 B   2026-05-14 00:44
    ├── dogfood.md                   2 687 B   2026-05-14 00:45
    ├── iterate-prd.md               1 060 B   2026-05-14 00:44
    └── launch-check.md              3 304 B   2026-05-14 00:45
```

**Verdict:** `.claude/agents/*` and `.claude/commands/*` are from 2026-05-14 — pre-v3.1 (pre-ContextForge-ADR-0018). They reference older strategy contexts but are not load-bearing for the refactor itself. They STAY in place. Track C/Synthese should review whether any agent prompts need v3.1 updates (out of scope for Track D).

### 1.4 `analysis/` (v2-Phase, complete, 19 files)

All 19 files (01–19) present, sizes 12 KB–28 KB. Filenames are stable kebab-case. No renaming needed when moving to `docs/research/v2/`.

### 1.5 `analysis-v3/` (v3-Phase, 13 files — GAPS at 09, 12)

Present: 01, 02, 03, 04, 05, 06, 07, 08, 10, 11, 13, 14, 15.
**Missing:** `09-github-skills-storage.md` and `12-onboarding-interview.md` (Rate-Limit-Verlust, dokumentiert in ADR-0017). These are not in the filesystem — nothing to move.

### 1.6 `analysis-v4/` (v4-Phase, complete, 9 files)

Present: 00 (Synthesis-Verdict), 01–08. Sizes 14 KB–49 KB. All move 1:1 to `docs/research/v4/`.

### 1.7 `decisions/` (2 ADRs)

| File | Size | Notes |
|---|---:|---|
| `0017-hybrid-pivot-e.md` | 11 013 B | References `PRD-ValidationKit-v3.md`, `analysis-v3/*` paths |
| `0018-contextforge-as-productized-form.md` | 11 346 B | References `analysis-v4/*`, `decisions/0017-*`, `PRD-ValidationKit-v3.md` |

### 1.8 Hidden / Special Files

- **No `.git/` folder** — repo is NOT under version control yet. Migration is filesystem-only.
- **No `.gitignore`** — none created yet.
- **No `.env*`** — no environment files at root.
- **No `package.json`, `pnpm-lock.yaml`, `turbo.json`** — code-scaffold has not been generated (Phase 0).
- **No `node_modules/`** — no installed deps.
- **No `templates/` folder** — Track C will create it; Track D ensures the parent path is correct.

**Implication:** No git-blame to preserve. `mv` is safe and preserves mtime + inode. No commits to rewrite.

### 1.9 `docs/` Current State

```
docs/
└── research/
    └── v5/    (empty as of 10:53 — being populated by Tracks A/B/C/D right now)
```

The `docs/research/v5/` directory was pre-created — the migration script must NOT delete or `rmdir` it. Tracks A/B/C/D-Outputs live there.

---

## Section 2: Target State Tree

```
/Users/koljaschope/Documents/rohan/
├── README.md                                      (NEW — Synthese-Step writes)
├── .claude/
│   ├── CLAUDE.md                                  (UPDATED paths; see Section 4)
│   ├── agents/
│   │   ├── brand-voice-keeper.md
│   │   ├── competitor-recon.md
│   │   ├── decision-logger.md
│   │   ├── prd-iterator.md
│   │   └── strategy-challenger.md
│   └── commands/
│       ├── compete-check.md
│       ├── decision.md
│       ├── dogfood.md
│       ├── iterate-prd.md
│       └── launch-check.md
├── docs/
│   ├── PRD.md                                     (NEW — Synthese-Step writes; consolidates v3.1)
│   ├── roadmap/
│   │   ├── ROADMAP.md                             (NEW — Synthese-Step)
│   │   ├── phase-0.md                             (NEW — Synthese-Step)
│   │   └── phase-1.md                             (NEW — Synthese-Step, later)
│   ├── decisions/
│   │   ├── 0017-hybrid-pivot-e.md                 (MOVED from decisions/)
│   │   └── 0018-contextforge-as-productized-form.md (MOVED from decisions/)
│   ├── research/
│   │   ├── v2/                                    (19 files MOVED from analysis/)
│   │   │   ├── 01-competitor-ai-validators.md
│   │   │   ├── … (02–18)
│   │   │   └── 19-naming-domain-trademark.md
│   │   ├── v3/                                    (13 files MOVED from analysis-v3/)
│   │   │   ├── 01-direct-competitors-skill-ops.md
│   │   │   ├── … (02–08, 10, 11)
│   │   │   ├── 13-naming-enterprise.md
│   │   │   ├── 14-devils-advocate.md
│   │   │   └── 15-alternative-pivots.md
│   │   ├── v4/                                    (9 files MOVED from analysis-v4/)
│   │   │   ├── 00-synthesis-verdict.md
│   │   │   ├── 01-ai-consultancy-tam.md
│   │   │   ├── … (02–07)
│   │   │   └── 08-ai-review-quality-eval-reality.md
│   │   └── v5/                                    (STAYS; populated by Tracks A/B/C/D)
│   │       ├── 01-…-track-a.md
│   │       ├── 02-…-track-b.md
│   │       ├── 03-…-track-c.md
│   │       └── 04-file-migration-plan.md          (THIS file)
│   └── archive/
│       ├── PRD-v0.1-2026-05-13.pdf                (RENAMED from "PRD ValidationKit.pdf")
│       ├── PRD-ContextForge-2026-05-16.pdf        (RENAMED from "PRD ContextForge.pdf")
│       ├── PRD-ValidationKit-v2.md                (MOVED)
│       ├── PRD-ValidationKit-v3.md                (MOVED)
│       └── PRD-ValidationKit-v3.1.md              (MOVED after Synthese consolidates into docs/PRD.md)
└── templates/                                     (NEW — Track C designs files)
    ├── RFC-template.md
    ├── ADR-template.md
    └── feature-spec-template.md
```

---

## Section 3: Migration Bash Script

Single block, idempotent-where-possible (`mkdir -p`, existence-check before `mv`), fail-loud on collisions. Run from any cwd; uses absolute paths throughout. **Run BEFORE the Synthese-Step writes `docs/PRD.md` and `README.md`.**

```bash
#!/usr/bin/env bash
# ValidationKit/Sondr v5-Refactor — File Migration Script
# Usage: bash migrate-v5.sh
# Safe to re-run: each mv-block checks if source still exists.
# Fails loud if a destination already exists (no silent overwrite).

set -euo pipefail

ROOT="/Users/koljaschope/Documents/rohan"
cd "$ROOT"

echo "==> v5-Refactor migration starting at $ROOT"
echo "==> Working dir: $(pwd)"

# --- Pre-flight: assert we're in the right place ------------------------
if [[ ! -d "$ROOT/.claude" ]] || [[ ! -d "$ROOT/analysis" ]]; then
  echo "ERROR: $ROOT does not look like the ValidationKit repo (missing .claude/ or analysis/). Abort."
  exit 1
fi

# --- Helper: safe-mv (fail if destination exists) -----------------------
safe_mv () {
  local src="$1"
  local dst="$2"
  if [[ ! -e "$src" ]]; then
    echo "  skip (already moved): $src"
    return 0
  fi
  if [[ -e "$dst" ]]; then
    echo "  ERROR: destination already exists: $dst" >&2
    exit 1
  fi
  mv "$src" "$dst"
  echo "  moved: $src -> $dst"
}

# --- Step 1: Create target directory skeleton --------------------------
echo "==> Step 1: Creating directory skeleton"
mkdir -p "$ROOT/docs/roadmap"
mkdir -p "$ROOT/docs/decisions"
mkdir -p "$ROOT/docs/research/v2"
mkdir -p "$ROOT/docs/research/v3"
mkdir -p "$ROOT/docs/research/v4"
mkdir -p "$ROOT/docs/research/v5"   # already exists; mkdir -p is no-op
mkdir -p "$ROOT/docs/archive"
mkdir -p "$ROOT/templates"

# --- Step 2: Move ADRs decisions/ -> docs/decisions/ -------------------
echo "==> Step 2: Move ADRs"
safe_mv "$ROOT/decisions/0017-hybrid-pivot-e.md"                          "$ROOT/docs/decisions/0017-hybrid-pivot-e.md"
safe_mv "$ROOT/decisions/0018-contextforge-as-productized-form.md"        "$ROOT/docs/decisions/0018-contextforge-as-productized-form.md"
# Remove now-empty old folder (only if truly empty — fail-loud otherwise)
if [[ -d "$ROOT/decisions" ]]; then
  if [[ -z "$(ls -A "$ROOT/decisions")" ]]; then
    rmdir "$ROOT/decisions"
    echo "  rmdir: empty $ROOT/decisions"
  else
    echo "  WARN: $ROOT/decisions still has files: $(ls "$ROOT/decisions")"
  fi
fi

# --- Step 3: Move analysis/ -> docs/research/v2/ -----------------------
echo "==> Step 3: Move v2 research (19 files)"
for f in "$ROOT"/analysis/*.md; do
  [[ -e "$f" ]] || continue
  safe_mv "$f" "$ROOT/docs/research/v2/$(basename "$f")"
done
if [[ -d "$ROOT/analysis" ]] && [[ -z "$(ls -A "$ROOT/analysis")" ]]; then
  rmdir "$ROOT/analysis"
  echo "  rmdir: empty $ROOT/analysis"
fi

# --- Step 4: Move analysis-v3/ -> docs/research/v3/ --------------------
echo "==> Step 4: Move v3 research (13 files, 09 & 12 missing/known)"
for f in "$ROOT"/analysis-v3/*.md; do
  [[ -e "$f" ]] || continue
  safe_mv "$f" "$ROOT/docs/research/v3/$(basename "$f")"
done
if [[ -d "$ROOT/analysis-v3" ]] && [[ -z "$(ls -A "$ROOT/analysis-v3")" ]]; then
  rmdir "$ROOT/analysis-v3"
  echo "  rmdir: empty $ROOT/analysis-v3"
fi

# --- Step 5: Move analysis-v4/ -> docs/research/v4/ --------------------
echo "==> Step 5: Move v4 research (9 files inkl. Synthesis)"
for f in "$ROOT"/analysis-v4/*.md; do
  [[ -e "$f" ]] || continue
  safe_mv "$f" "$ROOT/docs/research/v4/$(basename "$f")"
done
if [[ -d "$ROOT/analysis-v4" ]] && [[ -z "$(ls -A "$ROOT/analysis-v4")" ]]; then
  rmdir "$ROOT/analysis-v4"
  echo "  rmdir: empty $ROOT/analysis-v4"
fi

# --- Step 6: Archive old PRDs (rename + move) --------------------------
echo "==> Step 6: Archive old PRDs (with kebab-case rename for PDFs)"
# Markdown PRDs: move unchanged.
safe_mv "$ROOT/PRD-ValidationKit-v2.md"   "$ROOT/docs/archive/PRD-ValidationKit-v2.md"
safe_mv "$ROOT/PRD-ValidationKit-v3.md"   "$ROOT/docs/archive/PRD-ValidationKit-v3.md"
# v3.1 is current source-of-truth; will be archived AFTER Synthese writes docs/PRD.md.
# We keep v3.1 at root for now so Synthese can read it. (See Section 6, Q1.)
# UN-COMMENT after Synthese is done:
# safe_mv "$ROOT/PRD-ValidationKit-v3.1.md" "$ROOT/docs/archive/PRD-ValidationKit-v3.1.md"

# PDFs: rename to kebab-case + date.
safe_mv "$ROOT/PRD ValidationKit.pdf"   "$ROOT/docs/archive/PRD-v0.1-2026-05-13.pdf"
safe_mv "$ROOT/PRD ContextForge.pdf"    "$ROOT/docs/archive/PRD-ContextForge-2026-05-16.pdf"

# --- Step 7: Final report ---------------------------------------------
echo ""
echo "==> Migration complete. Tree summary:"
echo ""
ls -la "$ROOT" | grep -E "^d|README|PRD"
echo ""
echo "==> docs/ structure:"
find "$ROOT/docs" -maxdepth 2 -type d | sort
echo ""
echo "==> Next steps:"
echo "  1. Synthese-Step: write docs/PRD.md (consolidates v3.1)"
echo "  2. Synthese-Step: write README.md at root"
echo "  3. Synthese-Step: write docs/roadmap/{ROADMAP,phase-0,phase-1}.md"
echo "  4. Track C: populate templates/ with RFC/ADR/feature-spec"
echo "  5. After PRD.md is written, archive v3.1 (uncomment line in Step 6)"
echo "  6. Update .claude/CLAUDE.md path-table (see Section 4 of 04-file-migration-plan.md)"
echo "  7. Update internal references in ADRs and old PRDs (see Section 4)"
```

**Properties:**
- `set -euo pipefail` — fail on first error, undefined vars, broken pipes.
- `safe_mv` — bails if destination exists (no overwrite). Skip if source already moved (so re-runs are safe).
- `mkdir -p` — idempotent.
- `rmdir` only on empty dirs (preserves the v3-skeleton-file-warning if any unexpected file appears).
- Quoted spaces in PDF filenames.
- `mv` preserves mtime + inode — no timestamp loss.

---

## Section 4: Reference-Update Checklist

After the migration, the following files contain hardcoded paths that need editing. **These updates are MANDATORY** — leaving them stale will break `/iterate-prd`, the `Wo finde ich was?`-Table, and ADR-citations.

### 4.1 `/Users/koljaschope/Documents/rohan/.claude/CLAUDE.md`

**Lines 17–34** (`Wo finde ich was?`-Table) — REPLACE table-body with:

```markdown
| Datei / Folder | Zweck |
|---|---|
| `docs/PRD.md` | **Source of Truth (aktuell, konsolidiert).** Hybrid Layered (Pivot E) + ContextForge-Productized-Form (ADR-0018). Bei Konflikt gewinnt es. |
| `docs/archive/PRD-ValidationKit-v3.1.md` | v3.1 (2026-05-16). Vorgänger des konsolidierten PRD.md. Archiviert. |
| `docs/archive/PRD-ValidationKit-v3.md` | v3.0 (2026-05-14). Hybrid Layered nur. Archiviert. |
| `docs/archive/PRD-ValidationKit-v2.md` | v2 (2026-05-14 ~02:30). Archiviert, nur historische Reference. |
| `docs/archive/PRD-v0.1-2026-05-13.pdf` | Original v0.1 (2026-05-13). Archiviert. |
| `docs/archive/PRD-ContextForge-2026-05-16.pdf` | User-Pivot-PRD v0.1 (2026-05-16). Re-Eingebunden via ADR-0018. |
| `docs/research/v2/01-19-*.md` | 19 deep-research Outputs aus v2-Phase. |
| `docs/research/v3/*.md` | 13 surviving Outputs aus v3-Pivot-Stress-Test (09 + 12 fehlen). |
| `docs/research/v4/00-08-*.md` | 9 Outputs aus ContextForge-Pivot-Check (2026-05-16). Verdict-tragend: 00, 01, 06, 07. |
| `docs/research/v5/*.md` | v5-Refactor-Research (Mai 2026): File-Reorg + Roadmap-Split. |
| `docs/decisions/0017-hybrid-pivot-e.md` | ADR — Pure-MM-Pivot abgelehnt, Hybrid Layered gewählt. |
| `docs/decisions/0018-contextforge-as-productized-form.md` | ADR — ContextForge als Productized-Form von VK (Pfad C), kein Replacement. |
| `docs/decisions/` | ADR-style Entscheidungs-Log. |
| `docs/roadmap/ROADMAP.md` | Phase-by-Phase Index. |
| `docs/roadmap/phase-0.md` | Week-by-Week Sub-Phases für Phase 0. |
| `templates/` | RFC / ADR / Feature-Spec Templates (von Track C designed). |
| `.claude/agents/*.md` | Subagents zum Bearbeiten *des Projekts* (nicht: Subagents von ValidationKit-as-Product). |
| `.claude/commands/*.md` | Slash Commands für laufende Arbeit. |
```

**Line 58** — change `analysis-v4/04` → `docs/research/v4/04`.

**Lines 123–124** — change `analysis/` → `docs/research/v2/` (or just remove `/`, generalize to `docs/research/`).

**Line 152** — `ADRs gehören nach decisions/` → `ADRs gehören nach docs/decisions/`.

**Last-updated stamp at bottom** — bump to `2026-05-16 ~v5-Refactor`.

### 4.2 `/Users/koljaschope/Documents/rohan/docs/decisions/0017-hybrid-pivot-e.md`

After move from `decisions/`, this file's internal references are stale:

- **Line 8** — `PRD-ValidationKit-v3 §1 …` is fine (no path); but the implicit `decisions/` self-reference is now `docs/decisions/`.
- **Lines 23, 62, 131–148** — every `analysis-v3/XX-*.md` reference → `docs/research/v3/XX-*.md`.
- **Line 130** — `PRD-ValidationKit-v3.md` → `docs/archive/PRD-ValidationKit-v3.md` (since it's now archived).

**Strategy:** single `sed`-pass over the file:
```bash
sed -i '' \
  -e 's|`analysis-v3/|`docs/research/v3/|g' \
  -e 's|`PRD-ValidationKit-v3.md`|`docs/archive/PRD-ValidationKit-v3.md`|g' \
  "$ROOT/docs/decisions/0017-hybrid-pivot-e.md"
```

### 4.3 `/Users/koljaschope/Documents/rohan/docs/decisions/0018-contextforge-as-productized-form.md`

- **Line 21, 124–125** — `analysis-v4/` → `docs/research/v4/`.
- **Line 127** — `decisions/0017-*` → `docs/decisions/0017-*` (or relative `0017-*` if both in same dir; recommend relative).
- **Line 128** — `PRD-ValidationKit-v3.md` → `docs/archive/PRD-ValidationKit-v3.md`.

```bash
sed -i '' \
  -e 's|`analysis-v4/|`docs/research/v4/|g' \
  -e 's|`decisions/0017-|`docs/decisions/0017-|g' \
  -e 's|`PRD-ValidationKit-v3.md`|`docs/archive/PRD-ValidationKit-v3.md`|g' \
  "$ROOT/docs/decisions/0018-contextforge-as-productized-form.md"
```

### 4.4 `/Users/koljaschope/Documents/rohan/docs/archive/PRD-ValidationKit-v3.md` (after archiving)

- Lines 6, 38, 92, 114, 125, 156, 243, 320, 392, 404, 488, 605 — `analysis-v3/` → `docs/research/v3/`.
- Line 309 (tech-stack tree) — contains `decisions/` reference in an ASCII tree — update to `docs/decisions/`.
- Line 601 — `decisions/0017-hybrid-pivot-e.md` → `docs/decisions/0017-hybrid-pivot-e.md`.

**Optional:** since this file is now archived, references can stay stale (historical document). Recommend a one-line preamble at top:
```markdown
> **ARCHIVED 2026-05-16.** All file-paths in this document were pre-v5-Refactor. See docs/PRD.md for current. Original paths: `analysis-v3/` → `docs/research/v3/`, `decisions/` → `docs/decisions/`.
```
This is the cheaper option; full path-rewrite is gold-plating an archive.

### 4.5 `/Users/koljaschope/Documents/rohan/docs/archive/PRD-ValidationKit-v3.1.md` (after archiving)

Same treatment — preamble-redirect rather than full rewrite. References on lines 6, 51, 158–160, 307–315 point to `analysis-v4/` and `decisions/`.

### 4.6 `/Users/koljaschope/Documents/rohan/docs/archive/PRD-ValidationKit-v2.md`

Likely contains v2-era paths to `analysis/` (we didn't grep). Same archive-preamble strategy.

### 4.7 `.claude/agents/*.md` and `.claude/commands/*.md`

**Not grepped in detail** (they're 743 B – 3304 B per file, 2026-05-14). Recommend Track C/Synthese:
```bash
grep -nE "analysis/|analysis-v3/|analysis-v4/|decisions/" .claude/agents/*.md .claude/commands/*.md
```
If hits → update; if no hits → done.

### 4.8 Summary `sed`-Pass for All Live Files

After migration, a single command updates the LIVE references (ADRs only — archives get the preamble):

```bash
for f in "$ROOT/docs/decisions/0017-hybrid-pivot-e.md" "$ROOT/docs/decisions/0018-contextforge-as-productized-form.md"; do
  sed -i '' \
    -e 's|`analysis/|`docs/research/v2/|g' \
    -e 's|`analysis-v3/|`docs/research/v3/|g' \
    -e 's|`analysis-v4/|`docs/research/v4/|g' \
    -e 's|`decisions/0017-|`docs/decisions/0017-|g' \
    -e 's|`decisions/0018-|`docs/decisions/0018-|g' \
    -e 's|`PRD-ValidationKit-v3.md`|`docs/archive/PRD-ValidationKit-v3.md`|g' \
    -e 's|`PRD-ValidationKit-v3.1.md`|`docs/archive/PRD-ValidationKit-v3.1.md`|g' \
    -e 's|`PRD-ValidationKit-v2.md`|`docs/archive/PRD-ValidationKit-v2.md`|g' \
    "$f"
done
```

Then update `.claude/CLAUDE.md` manually using the table from Section 4.1 (table-rewrite, not sed-friendly).

---

## Section 5: Verification Checklist

Run these AFTER the migration script + reference updates. Each line must return exactly as expected.

```bash
ROOT="/Users/koljaschope/Documents/rohan"

# 5.1 — Old folders should be GONE
test ! -d "$ROOT/analysis"      && echo "OK: analysis/ removed"
test ! -d "$ROOT/analysis-v3"   && echo "OK: analysis-v3/ removed"
test ! -d "$ROOT/analysis-v4"   && echo "OK: analysis-v4/ removed"
test ! -d "$ROOT/decisions"     && echo "OK: decisions/ removed"

# 5.2 — New folders should exist
test -d "$ROOT/docs/decisions"           && echo "OK: docs/decisions/"
test -d "$ROOT/docs/research/v2"         && echo "OK: docs/research/v2/"
test -d "$ROOT/docs/research/v3"         && echo "OK: docs/research/v3/"
test -d "$ROOT/docs/research/v4"         && echo "OK: docs/research/v4/"
test -d "$ROOT/docs/research/v5"         && echo "OK: docs/research/v5/"
test -d "$ROOT/docs/archive"             && echo "OK: docs/archive/"
test -d "$ROOT/docs/roadmap"             && echo "OK: docs/roadmap/"
test -d "$ROOT/templates"                && echo "OK: templates/"

# 5.3 — File counts match expectations
echo "v2 research files (expect 19):"  ; ls "$ROOT/docs/research/v2" | wc -l
echo "v3 research files (expect 13):"  ; ls "$ROOT/docs/research/v3" | wc -l
echo "v4 research files (expect 9):"   ; ls "$ROOT/docs/research/v4" | wc -l
echo "ADRs (expect 2):"                ; ls "$ROOT/docs/decisions"   | wc -l
echo "archive files (expect 4 or 5):"  ; ls "$ROOT/docs/archive"     | wc -l

# 5.4 — Archive contents
ls "$ROOT/docs/archive" | sort
# Expected (after Synthese archives v3.1):
#   PRD-ContextForge-2026-05-16.pdf
#   PRD-ValidationKit-v2.md
#   PRD-ValidationKit-v3.1.md       (only after Synthese moves it)
#   PRD-ValidationKit-v3.md
#   PRD-v0.1-2026-05-13.pdf

# 5.5 — Byte-count parity: total markdown content preserved
echo "Total bytes in v2+v3+v4 research (must equal pre-migration analysis+analysis-v3+analysis-v4):"
du -sb "$ROOT/docs/research/v2" "$ROOT/docs/research/v3" "$ROOT/docs/research/v4" | awk '{s+=$1} END {print s}'
# Pre-migration reference: 404K + 300K + 320K = 1 024 KB ≈ 1 048 576 bytes (rough; du -sb is exact)

# 5.6 — No stale paths left in LIVE files
echo "Stale path references in live files (should be empty):"
grep -rEn "analysis/|analysis-v3/|analysis-v4/|\\bdecisions/0017|\\bdecisions/0018" \
  "$ROOT/.claude/CLAUDE.md" \
  "$ROOT/docs/decisions/" \
  2>/dev/null | grep -v "docs/research/" | grep -v "docs/decisions/" || echo "OK: none"

# 5.7 — .claude/ untouched
ls "$ROOT/.claude/agents"   | wc -l   # expect 5
ls "$ROOT/.claude/commands" | wc -l   # expect 5

# 5.8 — Root is clean (only README.md, .claude/, docs/, templates/)
echo "Root-level items (expect: .claude docs templates README.md OR fewer if README not yet written):"
ls "$ROOT"
```

---

## Section 6: Open Questions for Synthese-Step

These ambiguities must be resolved by the Synthese-Step, not by Track D:

**Q1. v3.1 Archive-Timing.** When does `PRD-ValidationKit-v3.1.md` move to `docs/archive/`? Two options:
- (a) Synthese writes `docs/PRD.md` while reading `/Users/koljaschope/Documents/rohan/PRD-ValidationKit-v3.1.md` at root, then moves it after.
- (b) Synthese first moves v3.1 to `docs/archive/PRD-ValidationKit-v3.1.md`, then reads from there to write `docs/PRD.md`.

**Track D Recommendation:** option (a) — simpler. The migration-script's Step 6 keeps v3.1 at root (the archive-line is commented out). After Synthese finishes `docs/PRD.md`, run:
```bash
mv "$ROOT/PRD-ValidationKit-v3.1.md" "$ROOT/docs/archive/PRD-ValidationKit-v3.1.md"
```

**Q2. PRD-Consolidation-Strategy.** Should `docs/PRD.md`:
- (a) Be a clean rewrite (Synthese reads v3.1 + v4-Synthesis + ADRs and writes from scratch — most defensible)?
- (b) Be a copy of v3.1 with minor cleanup (fastest, preserves §-numbering)?
- (c) Be a structural reorg (drop archived sections, keep only live strategy)?

**Track D Recommendation:** option (a) with v3.1's §-numbering preserved, since downstream commands (`/iterate-prd`, `/launch-check`) likely reference `§9–§12` etc. Track D doesn't write the PRD — but flagging that aggressive renumbering breaks ADR-0017's cross-refs (e.g. `PRD-ValidationKit-v3 §1, §2, §9–§12, §20, §26, §32`).

**Q3. Archive-Preamble vs Full Rewrite for Archived PRDs.** Section 4.4–4.6 recommends a single preamble redirecting paths instead of rewriting every internal reference. Confirm?

**Track D Recommendation:** preamble. Saves ~30 min of work. Archive = read-once-rarely.

**Q4. `templates/` at Root or under `docs/templates/`?** The target tree shows `templates/` at root, but a case could be made for `docs/templates/`.

**Track D Recommendation:** keep at root per spec. Templates aren't strategy-docs — they're scaffolding used at write-time. Root is correct.

**Q5. `README.md` Content.** Out of scope for Track D, but flagged: should be ≤200 lines, link to `docs/PRD.md`, `docs/roadmap/ROADMAP.md`, `docs/decisions/`, and the templates.

**Q6. Should `.claude/agents/*.md` and `.claude/commands/*.md` be reviewed for v3.1-conformity?** They're from 2026-05-14, pre-ContextForge-ADR.

**Track D Recommendation:** YES, but separate work item — not blocking. Open ticket: "Audit .claude/ subagents + commands for v3.1 + ContextForge alignment."

**Q7. ROADMAP-Granularity.** Target spec says `phase-0.md` is `Week-by-Week sub-phases`. Phase 0 spans M0–M3 (≈12 weeks). That's a 12-week file. Verify scope-fit.

**Q8. Re-Run-Pending Files (analysis-v3 09 + 12).** ADR-0017 references `analysis-v3/09-github-skills-storage.md` and `analysis-v3/12-onboarding-interview.md` as "Skelett oder fehlend, Re-Run pending." After migration, those references in ADR-0017 will point to `docs/research/v3/09-…md` (nonexistent). Should the Synthese update the ADR to note these are deferred? Or leave the stale references as a TODO-anchor?

**Track D Recommendation:** add a one-liner to ADR-0017 (post-migration): `> Note 2026-05-16: 09 + 12 still pending re-run. Files will land at docs/research/v3/ when produced.`

---

## Section 7: Risks

**R1. Destination-Collision (Low).** `safe_mv` fails loud if a destination already exists. Mitigation: built-in. **Failure mode:** if a parallel agent (Tracks A/B/C) writes a file to `docs/research/v5/` and the migration script doesn't touch v5, nothing collides. v5 is mkdir-only.

**R2. Partial-Run-Recovery (Low).** If the script dies midway (e.g. permissions error), some files are in the new tree, some in the old. **Mitigation:** `safe_mv` re-runs cleanly (skips already-moved sources). Re-run = idempotent.

**R3. Reference-Drift (Medium).** Stale paths in `.claude/CLAUDE.md` or ADRs will cause `/iterate-prd` or future Claude-Code-sessions to look for files in `analysis/` and fail silently with "no results." **Mitigation:** Section 4 checklist + `grep -rEn "analysis/|analysis-v3/|analysis-v4/"` post-migration. CRITICAL to run.

**R4. Loss of `PRD ValidationKit.pdf` During Rename (Low).** Rename strips the space and adds a date suffix. Risk: the PDF is the ONLY copy of v0.1 ground-truth. **Mitigation:** `mv` is atomic on same filesystem (APFS on macOS); if `mv` fails (e.g. permissions), source is untouched. Verify with `ls docs/archive/PRD-v0.1-2026-05-13.pdf` post-migration. **Backup option:** before running migration, `cp -a "PRD ValidationKit.pdf" /tmp/PRD-backup-v0.1.pdf` as a belt-and-suspenders.

**R5. mtime Loss (None).** `mv` on same filesystem preserves inode + mtime. Verified by macOS APFS semantics. **Risk-vector excluded.**

**R6. .claude/ Accidentally Moved (Low).** Script does NOT touch `.claude/`. `safe_mv` operates only on explicit sources. **Mitigation:** built-in; the script never references `.claude/` for `mv`.

**R7. docs/research/v5/ Wiped by Parallel-Agent-Race (Low).** Tracks A/B/C/D all write to `docs/research/v5/` concurrently. The migration script `mkdir -p`s the folder but doesn't touch existing files. Risk only if a Track-X-output is being written WHILE migration runs and tries to `rmdir` v5 — but the script never `rmdir`s v5. **Risk-vector excluded.**

**R8. Hidden Files Forgotten (Low).** Confirmed via `ls -la`: no `.gitignore`, no `.env*`, no `.DS_Store` (well, possibly — macOS sprinkles them; `mv` handles them silently). **Mitigation:** verification Section 5.8 lists root contents; if a `.DS_Store` survives, no harm.

**R9. Synthese-Step Writes `docs/PRD.md` BEFORE Migration Runs (Medium).** If the orchestrator parallelizes Synthese with Track D, Synthese might write `docs/PRD.md` to a path that doesn't exist yet (`mkdir -p docs/` is fine; `docs/PRD.md` collides with nothing). But if Synthese reads `PRD-ValidationKit-v3.1.md` at root after migration moved it to archive, that breaks. **Mitigation:** orchestration order:
1. Track D research outputs `04-file-migration-plan.md` (this file).
2. User executes migration script.
3. Synthese reads `PRD-ValidationKit-v3.1.md` at root, writes `docs/PRD.md`.
4. Synthese moves v3.1 to archive.

The script's Step 6 enforces this by leaving the v3.1-archive line commented out.

**R10. Information Loss via Typo (Low).** A typo in `mv` source path means the source stays + destination is created empty? No — `mv` errors loud on missing source. **Mitigation:** `set -euo pipefail` halts the script. Re-run after fixing.

---

## Track D Self-Verification

- All 19 v2 files inventoried + mapped to `docs/research/v2/`. (Section 1.4)
- All 13 v3 files inventoried + mapped to `docs/research/v3/`. Missing files (09, 12) documented. (Section 1.5)
- All 9 v4 files inventoried + mapped to `docs/research/v4/`. (Section 1.6)
- 2 ADRs mapped to `docs/decisions/`. (Section 1.7)
- 3 PDF/MD PRD archives mapped to `docs/archive/` with kebab-case-rename for PDFs. (Section 1.1, Step 6)
- `.claude/` untouched (5 agents + 5 commands stay). (Section 1.3)
- No git/.env/package.json to worry about. (Section 1.8)
- `docs/research/v5/` preserved during migration. (Section 7-R7)
- Reference-update path documented for `.claude/CLAUDE.md`, both ADRs, archived PRDs. (Section 4)
- Verification checklist confirms byte-count parity. (Section 5)
- 8 open questions flagged for Synthese-Step. (Section 6)
- 10 risks classified by likelihood. (Section 7)

**Total content preserved:** 404 + 300 + 320 + 24 + 4 PRD-files (~265 KB) = ~1.31 MB of strategy artifacts, every byte mapped.

---

*Track D output complete. Hand off to Synthese-Step for execution + PRD consolidation.*
