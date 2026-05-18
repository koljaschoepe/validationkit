# Plan — Refactor zu minimalem Kontext-System

> Erstellt: 2026-05-18
> Status: ✅ Done — 2026-05-18 (Branch `refactor/minimal-context`, Tag `archive/pre-refactor` für Rollback)
> Reversibility: **Hoch** — `git checkout main` = voller Rollback. Tag `archive/pre-refactor` zeigt auf den Pre-Refactor-Stand.

---

## 1. Ziel (eine Sache, kein Co-Goal)

Das Repo soll als langlebige Single-Developer-Web-App tragbar werden. Aktuell schleppen wir Sprint-Pipeline, ContextForge-Strategie, ADRs, PRD, Research, OSS-Pitch, Customer-Onboarding, Build-in-Public-Outreach, Sprint-Screenshots und 14 Skill-Templates mit — alles aus Phasen, die du jetzt nicht mehr fortführst.

**Endzustand:**
- Die Web-App (`apps/web` + die 12 von ihr genutzten Packages) bleibt funktional unverändert.
- Markdown-Kontext schrumpft von 119 docs-Files + Sprint/Status/CHANGELOG-Stack auf **3 Files an der Repo-Wurzel** (CLAUDE.md, README.md, TODO.md) plus `docs/plans/` für aktive + erledigte Pläne.
- `.claude/` enthält **nur noch zwei Commands**: `/plan <slug>` und `/execute <slug>`. Keine Agents, keine alten Strategie-Commands.
- Der App-Name "ValidationKit" bleibt als Working-Title; Stripe-Tier-Namen + DB-Schema bleiben unverändert.

**Was nicht passiert:**
- Kein App-Code wird geändert (außer Marketing-Strings, siehe §3.6).
- Kein DB-Migrationen.
- Kein npm publish, kein Vercel-Env-Touch, kein Stripe-Touch.

---

## 2. Endzustand — Repo-Tree

```
rohan/
├── apps/web/                       # unverändert
├── packages/                       # 13 von 14 bleiben (cli weg)
│   ├── audit/  auth/  billing/  bip-generator/
│   ├── core/  db/  drift/  fixes/  github-app/
│   ├── inngest/  llm/  parser/  pr-workflow/
├── .claude/
│   ├── CLAUDE.md                   # neu, ≤200 Zeilen
│   └── commands/
│       ├── plan.md                 # neu
│       └── execute.md              # neu
├── docs/
│   └── plans/                      # neu — leer am Start
│       └── refactor-minimal-context.md   # dieser Plan (wird nach Ausführung nach done/)
├── eval/                           # bleibt (CI-Gate)
├── scripts/                        # bleibt (Build-Helpers)
├── examples/sample-bad/  sample-good/   # bleibt (Eval-Fixtures)
├── README.md                       # neu, kurz
├── TODO.md                         # bleibt, optional schmaler
├── LICENSE  SECURITY.md  CONTRIBUTING.md       # bleiben
├── package.json  pnpm-workspace.yaml  turbo.json  tsconfig.base.json
├── docker-compose.yml  .env.example  .nvmrc  .gitignore  vercel.json  vitest.config.ts
└── .github/workflows/ci.yml        # bleibt
```

---

## 3. Schritte

### 3.1 — `docs/` ausräumen (große Massaker-Phase)

**Komplett löschen:**
```
docs/PRD.md
docs/STATUS.md → existiert nicht, ist im Root (siehe §3.2)
docs/archive/                       # 404KB Vorgänger-PRDs
docs/assets/                        # 768KB
docs/bip-posts/
docs/customer-onboarding/
docs/decisions/                     # 6 ADRs — Strategie-Layer, weg
docs/demo-script.md
docs/handbook/
docs/handbook-extras/
docs/legal/
docs/outreach/
docs/playbook/
docs/research/                      # 71 Research-Files aus v2–v5
docs/roadmap/
docs/setup/
docs/status/
```

**Anlegen:**
```
docs/plans/                         # leer, mit .gitkeep
docs/plans/done/                    # leer, mit .gitkeep
```

**Verschieben:**
```
docs/plans/refactor-minimal-context.md   # dieser Plan, schon angelegt
```

**Begründung:** Du hast „Brutal-Minimum: 3 Files" gewählt. Jeglicher Doc-Layer außerhalb von Plan-Files lebt jetzt im einen CLAUDE.md.

### 3.2 — Repo-Root entrümpeln

**Löschen:**
```
CHANGELOG.md                        # 42KB Sprint-Log
STATUS.md                           # 11KB Live-Tracking, kommt zu TODO
recruitment.md
docker-compose.yml? → bleibt, weil lokale Dev davon abhängt
sprint-0.1-*.png  sprint-0.2-*.png  sprint-0.3-*.png  sprint-0.4-*.png  sprint-0.5-*.png  sprint-0.7-*.png
live-01-*.png  live-02-*.png  live-03-*.png
real-execution-01-*.png  real-execution-02-*.png  real-execution-03-*.png  real-execution-04-*.png
```

**Bleibt:**
```
README.md                           # wird neu geschrieben (§3.5)
TODO.md                             # bleibt; optional aufräumen — du entscheidest beim Schreiben
LICENSE  SECURITY.md  CONTRIBUTING.md
.env.example  .env.local            # .local ist gitignored, sicher
.gitignore  .nvmrc  vercel.json  vitest.config.ts
package.json  pnpm-workspace.yaml  turbo.json  tsconfig.base.json  pnpm-lock.yaml
docker-compose.yml
```

### 3.3 — `templates/` + `skills/` löschen

```
templates/                          # 7 ADR/RFC/Sprint-Templates, alle obsolet
skills/                             # validationkit-agent-file-audit — OSS-Ausliefer-Skill, intern nicht benutzt
```

`packages/cli` (validationkit-cli) wurde mal als publishable OSS-CLI gebaut. Da du keinen OSS-Track mehr verfolgst, kann es weg — aber: `package.json :: scripts.audit` ruft sie auf. Beim Löschen den Script-Eintrag ebenfalls raus.

```
packages/cli/                       # weg
package.json   "audit": "pnpm --filter validationkit-cli exec validationkit audit"  → Script-Zeile entfernen
```

**Quick-Check vor Delete:** `grep -r "validationkit-cli" --include="*.ts" --include="*.tsx" --include="*.json"` — wenn nur in package.json + cli/ → safe.

### 3.4 — `.claude/` neu aufsetzen

**Löschen:**
```
.claude/CLAUDE.md                   # alt, 172 Zeilen ValidationKit-Strategie
.claude/agents/                     # 5 Agents: brand-voice, compete-recon, decision-logger, prd-iterator, strategy-challenger
.claude/commands/                   # 6 alte Commands: compete-check, decision, dogfood, dogfood-repo, iterate-prd, launch-check
```

**Anlegen — `.claude/CLAUDE.md`** (Inhalt unten in §4.1):
- Was die App ist (2 Sätze)
- Tech-Stack-Tabelle (10 Zeilen)
- Wo finde ich was (Tabelle)
- Workflow (3 Sätze: /plan → review → /execute)
- Konkrete Constraints (5–7 Bulletpoints)
- Was nicht passiert

**Anlegen — `.claude/commands/plan.md`** (Inhalt unten in §4.2):
- Nimmt einen Slug als Argument
- Schreibt `docs/plans/<slug>.md` mit Sektionen: Ziel, Endzustand, Schritte, Files-to-Change, Test-Plan, Risiken, Open Questions
- Nutzt AskUserQuestion proaktiv bei Unklarheiten
- Liest vorher den Repo-Kontext aus CLAUDE.md
- Übergibt **nicht** an Execute — User reviewt erst

**Anlegen — `.claude/commands/execute.md`** (Inhalt unten in §4.3):
- Nimmt einen Slug als Argument
- Liest `docs/plans/<slug>.md`
- Führt Schritt-für-Schritt aus, hakt im Plan-File ab (Markdown-Checkboxen)
- Nutzt TaskCreate für Multi-Step-Tracking
- Wenn fertig: verschiebt `docs/plans/<slug>.md` nach `docs/plans/done/<slug>.md`

### 3.5 — Neuer `README.md`

Ziele:
- ≤80 Zeilen
- Was ist die App (1 Absatz)
- Lokal starten (5 Befehle)
- Deploy-Target (1 Zeile: Vercel)
- Workflow-Hinweis (1 Zeile: siehe `.claude/CLAUDE.md`)

Aktuelles README ist 7KB Phase-1-Pitch — weg.

### 3.6 — App-Code: ContextForge-/OSS-Strings entfernen

**Suchen + ersetzen:**
```bash
grep -rn "ContextForge\|Cross-Vendor Agent-File-Trust\|Dual-Wedge\|Sprint-to-Hosted-App\|Skeptic-Mentor\|Pivot E\|Phase-0-Gate" \
    apps/web/src/ --include="*.tsx" --include="*.ts"
```

Erwartet: Marketing-Strings in `app/page.tsx`, `app/pricing/page.tsx`, evtl. Tagline in `layout.tsx`. **Manuell entscheiden:** generisches Wording einsetzen oder Strings ganz raus. Keine Logik anfassen.

Trust-Page: CCA-Stub bleibt, Sub-Processor-Feed bleibt, DPA-Flow bleibt — sind Compliance-Surfaces, keine Marketing-Strings.

### 3.7 — `eval/`, `scripts/`, `examples/`

Alle bleiben:
- `eval/golden-set/`, `eval/conflicts/`, `eval/smoke.ts`, `eval/promptfoo.yaml` — laufen in CI (`pnpm eval`)
- `scripts/anonymize.ts`, `scripts/docker-e2e-smoke.sh` — Dev-Helpers
- `scripts/bip-counter.ts` — falls BIP-Feature im App-Code bleibt (es bleibt), bleibt das Script auch
- `examples/sample-bad/`, `examples/sample-good/` — Eval-Fixtures

### 3.8 — `.github/workflows/ci.yml`

Bleibt unverändert. Greift nur auf typecheck + test + eval + build — alle laufen weiter.

---

## 4. File-Contents — Drafts (vom User vor `/execute` reviewen)

### 4.1 — `.claude/CLAUDE.md` (Draft)

```markdown
# Projekt-Kontext

Eine Next.js-Web-App (Working-Title: ValidationKit) für AI-Consultancies, die
Multi-Customer-Repo-Operations managen wollen — Audit, Drift-Detection,
Skills-Registry, Customer-Workspaces, Billing.

Solo-Developer-Projekt, deployed auf Vercel.

## Tech-Stack

| Layer       | Wahl                                       |
|-------------|--------------------------------------------|
| Monorepo    | Turborepo + pnpm                           |
| Web         | Next.js 16 + App Router + Cache Components |
| Auth        | Better-Auth 1.6 + Magic-Link (Resend)      |
| DB          | Neon Postgres + Drizzle + pgvector         |
| Cache       | Vercel Runtime Cache + Redis (dev)         |
| Billing     | Stripe direkt + Stripe Tax                 |
| Background  | Inngest Cloud + Cron                       |
| LLM         | @ai-sdk/anthropic (direct), OpenAI Fallback|
| Email       | Resend (prod), Mailpit (dev)               |
| Deploy      | Vercel Fluid Compute                       |

## Wo finde ich was

| Pfad                          | Inhalt                                   |
|-------------------------------|------------------------------------------|
| `apps/web/src/app/`           | App-Router-Routen (UI + API)             |
| `apps/web/src/lib/`           | Server-Actions + Business-Logik          |
| `packages/db/`                | Drizzle-Schema + Migrationen             |
| `packages/audit/`             | Audit-Rules (5 deterministisch + 1 LLM)  |
| `packages/parser/`            | AGENTS.md / CLAUDE.md / SKILL.md Parser  |
| `packages/billing/`           | Stripe-Tier-Definitionen                 |
| `packages/inngest/`           | Background-Jobs + Cron                   |
| `eval/`                       | Golden-Set + Conflict-Eval (CI-Gate)     |
| `docs/plans/`                 | Aktive Feature-Pläne                     |
| `docs/plans/done/`            | Archivierte erledigte Pläne              |

## Workflow

1. Neues Feature / Bug / Refactor: User sagt was, Claude ruft `/plan <slug>`
   und schreibt einen detaillierten Plan nach `docs/plans/<slug>.md`.
2. User reviewt das Plan-File, bessert ggf. nach.
3. User sagt `/execute <slug>` → Claude führt Schritt-für-Schritt aus,
   hakt Boxen im Plan ab, verschiebt das File am Ende nach `done/`.

**Bei Unklarheiten in beiden Phasen: AskUserQuestion mit max. 4 Optionen.
Nicht raten.**

## Constraints (load-bearing)

- Sprache: User schreibt + denkt auf Deutsch. Claude antwortet auf Deutsch,
  Code-Kommentare auf Englisch.
- Keine neuen Markdown-Files außerhalb `docs/plans/` ohne explizite Anfrage.
- Keine neuen Skills, Agents, Commands ohne explizite Anfrage.
- Keine Tier-/Schema-Änderungen ohne Plan-File mit DB-Migration-Sektion.
- AI-Calls: nur Anthropic direkt, kein Vercel AI Gateway (PRD-Erbe-Konstante,
  Vendor-Lock-in-Vermeidung).
- Deploy nur auf User-Request. Nie selbst `vercel deploy` o.ä. anstoßen.
- Severity-Bänder {Kill, Weak, Mid, Strong, Exceptional} statt Fake-Scores —
  Konvention für alle Audit-Outputs.
```

### 4.2 — `.claude/commands/plan.md` (Draft)

```markdown
---
description: Erstelle einen detaillierten Plan für ein Feature, einen Bug oder ein Refactor und schreibe ihn nach docs/plans/<slug>.md.
---

Du planst eine konkrete Änderung am Projekt. Argument vom User: `$ARGUMENTS`
(typischerweise ein Kebab-Case-Slug wie `magic-link-rate-limit` oder
`fix-drift-pagination`; ggf. mit Freitext-Beschreibung dahinter).

## Vorgehen

1. **Lies `.claude/CLAUDE.md`** um den Repo-Kontext aufzufrischen.
2. **Lies relevante Code-Bereiche** (Explore-Agent oder gezielt Grep/Read),
   abhängig vom Slug. Spar dir Repo-Wide-Scans, wenn der Slug eindeutig ist.
3. **Wenn die Anforderung unklar ist:** AskUserQuestion mit max. 4 Optionen,
   bevor du den Plan schreibst. Lieber 1 gute Frage als 5 falsche Annahmen.
4. **Schreibe** `docs/plans/<slug>.md` mit dieser Struktur:

   ```markdown
   # Plan — <Titel>

   > Erstellt: <Datum>
   > Status: 🟡 In Review

   ## 1. Ziel
   Eine Sache, ein Satz. Was ist nach Execute anders?

   ## 2. Endzustand
   Konkret: welcher Code-Pfad, welches UI-Verhalten, welcher Test grün?

   ## 3. Schritte
   - [ ] Schritt 1 (Datei: …)
   - [ ] Schritt 2 (Datei: …)
   - [ ] Test-Schritt
   - [ ] Build + Typecheck

   ## 4. Files-to-Change
   | Datei | Was passiert                              |
   |-------|-------------------------------------------|
   | …     | Neue Funktion / Anpassung / Delete        |

   ## 5. Test-Plan
   - Manuell: …
   - Automatisch: `pnpm test` / `pnpm eval` / spezifisches `vitest <file>`

   ## 6. Risiken + Rollback
   - Risiko: …
   - Rollback: `git checkout <branch>` reicht / DB-Migration nötig: …

   ## 7. Open Questions
   - (leer, wenn alles klar; sonst hier listen)
   ```

5. **Schreibe nichts weiter als das Plan-File.** Keine Code-Edits in dieser Phase.
6. Antwort an den User: Pfad zum Plan-File + 2-3 Sätze Zusammenfassung +
   Hinweis: "review + ruf `/execute <slug>` wenn ok."

## Anti-Patterns

- Kein Code schreiben. Nur Plan-File.
- Keinen Plan ohne Test-Sektion.
- Keine vagen Schritte ("API verbessern") — immer Datei + konkrete Änderung.
- Wenn der Slug eine Datei nennt, die nicht existiert — Frag nach, nicht raten.
```

### 4.3 — `.claude/commands/execute.md` (Draft)

```markdown
---
description: Führe einen Plan aus docs/plans/<slug>.md Schritt-für-Schritt aus und verschiebe ihn nach Abschluss in done/.
---

Du führst einen bereits geschriebenen Plan aus. Argument: `$ARGUMENTS` (Slug).

## Vorgehen

1. **Lies `docs/plans/$ARGUMENTS.md`.** Wenn die Datei nicht existiert: Fehler
   melden + die naheliegendsten Slugs aus `docs/plans/` listen.
2. **Lies `.claude/CLAUDE.md`** um den Repo-Kontext aufzufrischen.
3. **TaskCreate** für jeden Schritt aus dem Plan §3. Setze Status auf
   `in_progress`, sobald du einen Schritt startest.
4. **Arbeite die Schritte sequentiell ab.** Nach jedem Schritt:
   - Markiere die Markdown-Checkbox im Plan-File: `- [ ]` → `- [x]`.
   - TaskUpdate auf `completed`.
5. **Test-Schritt:** führe den Test-Plan aus §5 des Plan-Files aus.
   Build + Typecheck + ggf. spezifische Tests. Wenn etwas rot ist: STOP,
   updaten und nachfragen.
6. **Wenn alle Schritte grün:**
   - Aktualisiere `Status:` im Plan-File auf `✅ Done — <Datum>`.
   - Verschiebe `docs/plans/$ARGUMENTS.md` → `docs/plans/done/$ARGUMENTS.md`
     mittels `git mv` falls Git, sonst Bash `mv`.
7. **Antwort an den User:** Was wurde geändert (kurze Liste), wo der Plan jetzt
   liegt, Test-Status.

## Wenn ein Schritt blockiert ist

- Plan-File **nicht löschen**.
- Im Plan §7 (Open Questions) die Blocker dokumentieren.
- AskUserQuestion mit max. 4 Optionen, wie weiter.

## Anti-Patterns

- Keinen Plan-Schritt skippen.
- Keinen neuen Schritt erfinden, ohne den Plan vorher zu updaten.
- Keine Commits ohne User-Aufforderung.
- Kein Deploy.
```

---

## 5. Test-Plan (nach Execute)

- [ ] `pnpm install` läuft sauber (keine workspace-resolve-Fehler nach cli-Delete)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm test` grün (84/84 oder Drift dokumentiert)
- [ ] `pnpm eval` grün
- [ ] `pnpm build` grün
- [ ] `pnpm dev` startet, `http://localhost:3000/` lädt
- [ ] Smoke: `/login`, `/dashboard`, `/customers`, `/trust`, `/pricing` rendern ohne 500
- [ ] `find docs -type f -name "*.md" | wc -l` ≤ 3 (refactor-plan + 2 .gitkeep)
- [ ] `find .claude -type f | wc -l` = 3 (CLAUDE.md + 2 Commands)
- [ ] `ls templates/ skills/ packages/cli/ 2>/dev/null` → leer
- [ ] Keine `ContextForge`-Strings mehr in `apps/web/src/`
- [ ] Keine `Sprint`-PNGs im Root

---

## 6. Risiken + Rollback

| Risiko                                                 | Wahrscheinlichkeit | Mitigation                                       |
|--------------------------------------------------------|--------------------|--------------------------------------------------|
| `packages/cli` wird transitive irgendwo importiert     | Niedrig            | Pre-Delete `grep -r validationkit-cli` (§3.3)    |
| Marketing-Strings in App brechen UI nach Wort-Cut      | Mittel             | §3.6 manuell, jede Änderung visual prüfen        |
| CI bricht weil `package.json :: scripts.audit` weg ist | Niedrig            | Script-Zeile + Workflow-Step (falls vorhanden) gemeinsam entfernen |
| TODO.md verliert Inhalte, die du noch brauchst         | Mittel             | Vor Execute: TODO.md selber durchgehen + kürzen  |
| Du willst später einen ADR/Research nachschauen        | Mittel             | Vor Execute: separaten Branch `archive/pre-refactor` taggen — Inhalte bleiben in der Git-Historie zugreifbar |

**Rollback:** Branch heißt `refactor/minimal-context`. `git checkout main` =
voller Rollback. DB unverändert. Vercel unverändert.

---

## 7. Open Questions (vom User vor `/execute` beantworten)

1. **TODO.md** (142 Zeilen): selbst aufräumen vor Execute, oder so lassen und später iterieren?
2. **`archive/pre-refactor` Tag** anlegen, bevor wir löschen? (1 Befehl, kein Aufwand)
3. **`docker-compose.yml`** behalten? Nutzt du noch lokal die Postgres+Redis+Mailpit-Stack? (Default: ja, bleibt)
4. **`scripts/bip-counter.ts`** und alles BIP-related: wenn du das BIP-Feature im UI nicht mehr nutzen willst, sag Bescheid — kann separater Plan werden (`drop-bip-feature.md`), nicht in diesem Refactor.

---

## 8. Reihenfolge der Ausführung

`/execute refactor-minimal-context` würde dann ungefähr so laufen:

1. Pre-Check: `git status` clean? (Sonst stop.)
2. Branch erstellen: `git checkout -b refactor/minimal-context` (optional, du sagst).
3. (Optional) `git tag archive/pre-refactor` für Sicherheits-Anker.
4. §3.1 — docs/ ausräumen (großer Block, in einem Commit).
5. §3.2 — Root entrümpeln.
6. §3.3 — templates/, skills/, packages/cli/ weg + package.json-Script raus.
7. §3.4 — .claude/ neu aufsetzen (3 neue Files).
8. §3.5 — README.md neu schreiben.
9. §3.6 — App-Code-Strings durchgehen (grep + manuelle Edits).
10. Test-Plan §5 durchlaufen.
11. Plan-File nach `docs/plans/done/` verschieben.
12. Single Commit oder mehrere — du entscheidest am Ende.

Geschätzter Aufwand: **30–60 min** real-time, davon ~20 min mechanisches Löschen + 10 min App-Code-Strings + 10–20 min Build + Smoke-Test.
