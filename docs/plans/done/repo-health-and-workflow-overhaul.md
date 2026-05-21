# Plan — Repo-Health & Plan/Execute-Workflow Overhaul

> Erstellt: 2026-05-21
> Letztes Update: 2026-05-21 (alle 8 Audit-Reports konsolidiert + Phase 0–4 abgearbeitet)
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: High, Phase 0/1/2/3/4 alle ✓, Phase 4.5 Stretch deferred, Phase 0.4/0.5 deferred auf nächsten echten /plan-Call, Customer-Route-Rename als Sub-Plan-Stub für späteren User-Trigger)
> Slug: `repo-health-and-workflow-overhaul`
> Confidence: **High** — Plan basiert auf 8 Subagent-Audits (Kontext-Files, /plan-Workflow, ADR↔Code, Tech-Stack, Tests/CI, packages/-Health, Settings-Backend, Dead-Code) + Direkt-Probes.
> Voraussetzung: keine. Dieser Plan war Master.

---

## 1. Ziel

Das Repo dauerhaft so aufstellen, dass (a) der Plan/Execute-Workflow systematisch **Discovery-First mit Recommended-Optionen + Freitext** statt Rate-und-Schreib arbeitet, (b) Kontext-Files (CLAUDE.md, vision.md, ADRs, Roadmap) **mit dem Code synchron** sind und auch synchron bleiben, und (c) Repo-Hygiene (Dead-Code, Plans-Archivierung, Doku-Lücken) auf einem Niveau ist, mit dem Kolja in 12 Monaten noch produktiv arbeitet.

---

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Quelle | Frage | Antwort |
|----|--------|-------|---------|
| Q1 | User-Prompt | Subagent-Anzahl für Recherche | 5–10 → tatsächlich 8 gestartet, 2 erfolgreich |
| Q2 | User-Prompt | Plan-Workflow-Ziel | "unendlich viele Rückfragen", leicht formuliert, Recommended-Vorschlag, Freitext |
| Q3 | User-Prompt | Plan-Format | "ultra detaillierter Plan mit mehreren Phasen" |
| Q4 | User-Prompt | Sprache | Deutsch (User), Englisch (Code-Kommentare) — Konvention aus CLAUDE.md |
| Q5 | Memory: pivot-pattern | Severity-Bänder | {Kill, Weak, Mid, Strong, Exceptional} — durchgängig |
| Q6 | Audit-Reality | Datum heute | 2026-05-21 |
| Q7 | User (2026-05-21) | Phasen-Reihenfolge | **Phase 0 zuerst** (Workflow), dann nutzt Phase 1 sich selbst |
| Q8 | User (2026-05-21) | 6 ausgefallene Audits | **Jetzt erneut parallel** feuern (Session-Limit-Risiko akzeptiert) |
| Q9 | User (2026-05-21) | R3F-Plans Archivierung | **Komplett löschen** — git history reicht für Pivot-Kontext |
| Q10 | User (2026-05-21) | OpenAI-Branch in `packages/llm/select.ts` | **`@ai-sdk/openai` jetzt installieren** — CLAUDE.md-Constraint muss angepasst werden + ADR-0005 |

---

## 3. Existing-Patterns im Repo (Vorbild)

- **Discovery-First Pattern bereits einmal erfolgreich gelaufen:** `docs/plans/done/landing-refactor-v3-static-mockup.md:38–49` zeigt 2 Runden AskUserQuestion vor dem Schreiben — Pattern, das funktioniert, ist aber nicht im Command kodifiziert. → Codifizieren in Phase 0.
- **Saubere Severity-Tabelle:** `docs/plans/done/galaxie-sprint-6-polish.md:185–194` + `docs/plans/nova-2-live-audit-flow.md:92–100` haben Severity-Spalte durchgehend. → Als Pflicht in neues Plan-Skelett übernehmen.
- **User-Entscheidungen-Audit-Trail (retroaktiv) bereits getan:** `docs/plans/done/nova-2-full-product.md:18–29`. → Pflicht-Sektion §2 in jedem neuen Plan, aber proaktiv beim Discovery.
- **Existing-Patterns-Sektion vorhanden:** `docs/plans/done/workspace-route-consolidation.md:26–32` macht es richtig. → Standardisieren.
- **Multi-PR-Schnitt:** Selbiger Plan §206–237 für Multi-Session-Refactors.
- **3 ADRs mit vollständigem Format** (Context/Optionen/Decision/Consequences/Re-Open-Trigger) als Qualitäts-Vorbild → für ADR-0004, 0005, 0006 übernehmen.
- **DAL-Schicht als Vorbild für ARCHITECTURE.md (Phase 3.1):** `apps/web/src/lib/dal/galaxie.ts:264–295` (`getGalaxieDataForWorkspace`) ist exemplarisch — Membership-Gate (mit Legacy-`ownerId`-Fallback) + Role-Resolve + lazy-snooze-Expiry + bulk-loading + `unstable_cache` mit `revalidateTag(galaxieWorkspaceTag(id))`. Eine Funktion, vier Concerns sauber geschichtet.
- **Migration-Atomarität:** `packages/db/drizzle/0011_lame_speedball.sql` ist eine Zeile (`DROP TABLE "drift_run" CASCADE;`) — Vorbild für `0012_drop_canonical_repo_id.sql` in Phase 1.14a.
- **Webhook-Triple als Production-Härte-Vorbild:** `api/install-webhook`, `api/notify-update`, `api/stripe/webhook` haben alle raw-body + HMAC/timingSafeEqual + idempotency + Rate-Limit (notify-update) + Inngest-Dispatch. → für zukünftige Webhook-Routen kopieren.
- **`SiteNavLinks.tsx`-Split (Server-Parent + Client-Child für active-state):** exemplarisch für App-Router-Boundary, die viele Teams falsch ziehen. → wird in ARCHITECTURE.md erwähnt.
- **`middleware-redirects.ts`:** Tests + Mapping-Tabelle für legacy bookmarks — Vorbild für 3.8 (Customer-Route-Rename) und Phase 1.12 (R3F-Plans-Löschung wenn doch wer linkt).

---

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A:** Vercel AI Gateway / OpenAI als gleichwertiger Provider in `packages/llm/` ausbauen → Verworfen wegen CLAUDE.md-Constraint "AI-Calls nur Anthropic direkt" (Vendor-Lock-in-Vermeidung). OpenAI-Branch bekommt Status `// FUTURE: requires @ai-sdk/openai install` oder wird entfernt (Q10).
- **Alt-B:** Plan-Workflow durch Linear/Github-Issues ersetzen → Verworfen, Solo-Dev braucht Datei-basierte Plans-im-Repo (git-historisch, im Code-Review-Flow, von Claude lesbar).
- **Alt-C:** PixiJS aus apps/web sofort raus (komplette Migration auf SVG) → Verworfen, [workspace]/galaxie nutzt Pixi noch aktiv. Pixi bleibt für /[workspace], SVG für Landing. Migration auf einheitliche Render-Engine = separater Nova-3-Plan, nicht hier.
- **Alt-D:** ADR-0002 komplett ersetzen → Verworfen, ADR-0002 ist nur für Landing supersedet. Neues ADR-0004 mit `Supersedes-Partial: ADR-0002` ist sauberer.
- **Alt-E:** Alle 6 ausgefallenen Audits parallel re-run → Verworfen, wäre wieder Session-Limit-Risiko. Stattdessen serialisierte Sub-Audits in Phase 2, je 1-2 pro Execute-Session.
- **Alt-F:** Workflow erst (Phase 0) UND danach Plan komplett ausführen ohne Phasen-Cherry-Pick → Verworfen, User soll nach Phase 0 reviewen können (Plan-Workflow nutzt ab dann sich selbst).

---

## 5. Endzustand (nach allen 5 Phasen)

**Workflow:**
- `.claude/commands/plan.md` + `execute.md` enthalten den Discovery-First-Workflow mit 2–4 Runden AskUserQuestion (Recommended-Suffix + automatischer Other-Freitext), Confidence-Schwelle, Audit-Trail-Section, Block-Resolver, Dev-Server-Auto-Start bei UI-Plänen.

**Doku-Reality-Pass:**
- `.claude/CLAUDE.md`, `docs/vision.md`, `docs/adrs/0002`, `docs/design/linear-aesthetic.md`, `docs/roadmap/phase-galaxie.md` sind synchronisiert mit Code-Realität (PixiJS für /[workspace] + SVG für Landing; kein R3F; Better-Auth ohne Organization-Plugin, eigene `workspace`+`membership`-Tables; OpenAI ist opt-in Fallback).
- 3 neue ADRs: **0004** `landing-svg-stack.md` (Supersedes-Partial ADR-0002), **0005** `llm-multi-provider.md` (Anthropic primär, OpenAI opt-in), **0006** `workspace-tables-vs-betterauth-org.md` (Build-vs-Buy-Doku).
- `docs/plans/done/` ist in Sub-Ordner pro Phase (`galaxie/`, `nova/`, `homepage-relaunch/`) reorganisiert; 3 superseded R3F-Plans **komplett gelöscht** (Q9); 3 abgeschlossene Master-Pläne (`master-vision-galaxie.md`, `homepage-relaunch.md`, `frontend-relaunch-v2.md`) sind in done/.
- `TODO.md` ist auf ≤40 Zeilen Parking-Lot reduziert; Phase-0-Sprint-History in `docs/plans/done/phase-0-history.md`.

**Drift-Cleanup (KILL):**
- ADR-0003 ist final aufgeräumt: 7 Code-Stellen bereinigt (canonicalRepoId-Spalte gedroppt, dead DRIFT_*-exports raus, Pricing-Page-Bullet weg, Trust-Page-Liste korrekt, NotificationMatrix ohne drift.detected, Demo-Daten umtextiert, Tombstone-Kommentar weg). ADR-0003 Annex dokumentiert Final-Cleanup.

**Beta-Launch Mis-Selling-Risiken behoben:**
- Pricing-Page verkauft kein gedropptes Feature mehr.
- Settings-Danger-Zone zeigt keine Placeholder-Workspace-Delete-UI mehr (entweder Backend live aus `nova-2-settings-backend.md` oder EmptyState).
- 13 Settings-Shell-Sections sind im Audit-Bericht inventarisiert und in `nova-2-settings-backend.md` priorisiert.

**Repo-Hygiene:**
- 2 dead deps weg (`@react-spring/web`, `@xyflow/react`), shadcn korrekt in devDeps, gray-matter explizit deklariert, packages/auth React in peerDeps, zod auf v4.
- ~400 LOC dead code in apps/web entfernt (AuditForm, 5 ui-vk-Komponenten, OnboardingBanner-Body, dashboard/loading, settings/user/page).
- `packages/*/dist/` aus Git raus (.gitignore).
- `@vk/core/types.ts` hat JSDoc auf allen 8 Type-Exports.

**Tests + CI:**
- `vitest.config.ts` schließt apps/web-Tests mit ein (14 Tests laufen jetzt in CI).
- `pnpm lint` ist CI-Step, `turbo.json` hat lint-Task definiert.
- Conflict-Eval läuft als optionaler CI-Job (mit ANTHROPIC_API_KEY).
- husky + lint-staged Pre-Commit-Hooks aktiv.
- `scripts/doc-consistency.ts` läuft in CI und failt, wenn CLAUDE.md/vision.md Tech-Stack-Listen einen Dep nennen, der nicht in package.json existiert.

**Onboarding-Doku:**
- `docs/architecture.md` (1–2 Seiten DAL/Cache/Tenant/Parser/Audit-Pipeline).
- `docs/operations/deploy.md` + `secrets-rotation.md`.
- `docs/changelog.md` als Phasen-Log.
- README.md erwähnt Inngest-UI/Mailpit-UI/eval:conflicts.

**Audit-Trail:**
- 6 Audit-Reports in `docs/audits/2026-05/` mit Index, KILL/STRONG-Findings auf Sub-Pläne gemappt.

**Optional (Phase 4.5 Stretch):**
- `/docs`-Public-Route in apps/web rendert `docs/*.md`. ADR-Supersession-Chain im Frontmatter.

---

## 6. Schritte (Phasen-Map mit Checkboxen)

### Phase 0 — Plan/Execute-Workflow Overhaul (KILL-Priorität, Kernanliegen)

- [x] **0.1** `.claude/commands/plan.md` durch neuen Discovery-First-Body ersetzen.
- [x] **0.2** `.claude/commands/execute.md` durch neuen Pre-Flight + Block-Resolver + Dev-Server-Auto-Start-Body ersetzen.
- [x] **0.3** `.claude/CLAUDE.md` `## Workflow` Section ergänzt mit Discovery-First-Beschreibung, Klarheits-Schwelle, Frage-Taxonomie, Verweis auf Command-Files.
- [x] **0.4** Live-Test deferred — User-Entscheidung 2026-05-21: implizite Validierung beim nächsten echten `/plan`-Call (z.B. Phase 3.8 Customer-Route-Rename oder ein zukünftiger Sub-Plan aus Audit-Findings).
- [x] **0.5** Iteration deferred — wird durch Phase-0.4-Deferral mit-aufgeschoben. Sobald erste echte `/plan`-Discovery suboptimal wirkt → Iteration auf plan.md/execute.md.

**Out:** Workflow ist verfügbar und einmal validiert.

### Phase 1 — Kontext-Reality-Pass (KILL-Priorität)

- [x] **1.1** `.claude/CLAUDE.md:36` Galaxie-Zeile auf SVG+Pixi-Hybrid + KEIN R3F angepasst.
- [x] **1.2** `.claude/CLAUDE.md:42` LLM-Zeile + Constraint-Block auf Anthropic+OpenAI Multi-Provider angepasst, Verweis auf ADR-0005.
- [x] **1.3** `docs/vision.md:102` Render-Stack-Zeile aufgeteilt in Landing-SVG + Workspace-Pixi.
- [x] **1.4** `docs/vision.md:105, :119` Better-Auth-Org-Plugin-Behauptung entfernt, eigene workspace/membership-Tabellen dokumentiert, Verweis auf ADR-0006.
- [x] **1.5** ADR-0004 `docs/adrs/0004-landing-svg-stack.md` neu geschrieben — Supersedes-Partial ADR-0002.
- [x] **1.6** ADR-0002 Status-Header + Re-Open-Trigger annotiert.
- [x] **1.7** linear-aesthetic.md §8 mit superseded-Warning oben markiert; §12 als "parked, ohne Sprint-Slot" umformuliert.
- [x] **1.8** `phase-galaxie.md` Header ✅ + nach `roadmap/done/` verschoben.
- [x] **1.9** Neue `docs/roadmap/phase-nova-2.md` synthetisiert.
- [x] **1.10** TODO.md auf ≤40 Zeilen reduziert; Phase-0-History nach `done/phase-0-history.md` extrahiert.
- [x] **1.11** 3 Master-Pläne nach `done/` (master-vision-galaxie via `git mv`, andere 2 via `mv` weil untracked).
- [x] **1.12** 3 R3F-Plans gelöscht (Q9 — komplett, kein superseded/-Ordner).
- [x] **1.13a** `@ai-sdk/openai@^3.0.64` in `packages/llm/package.json` installiert via pnpm.
- [x] **1.13b** `select.ts` Helper `providerModel(selection)` ergänzt; `conflicting-rules.ts` + `context-bloat-llm.ts` auf provider-agnostisches Pattern umgestellt — OpenAI-Branch jetzt echt funktional. `@vk/llm typecheck` grün.
- [x] **1.13c** ADR-0005 `docs/adrs/0005-llm-multi-provider.md` geschrieben.
- [x] **1.14 — Drift-Cleanup-Sweep (KILL, 7 Stellen, ADR-0003 final-cleanup):**
  - [x] **1.14a** `canonicalRepoId` Spalte + veralteter Kommentar aus `schema.ts` entfernt. Migration `0012_drop_canonical_repo_id.sql` neu (`ALTER TABLE "repo" DROP COLUMN IF EXISTS "canonical_repo_id"`). `AnyPgColumn`-Import auch entfernt (war nur dafür da).
  - [x] **1.14b** DRIFT_KINDS / DriftKind / DriftItem / DriftReport aus `core/types.ts` gelöscht; Tombstone-Kommentar dokumentiert.
  - [x] **1.14c** `pricing/page.tsx:175` Drift-Bullet entfernt (Mis-Selling-Risk weg).
  - [x] **1.14d** `trust/page.tsx:342` "drifts" aus Audit-Trail-Liste entfernt.
  - [x] **1.14e** NotificationMatrix `drift.detected` Event + Default-Channel-Logik entfernt.
  - [x] **1.14f** demo-data.ts:139,142 Drift-Texte auf Audit-Wording umgeschrieben.
  - [x] **1.14g** audit-requested.ts Tombstone-Kommentar entfernt.
  - [x] **1.14h** ADR-0003 Final-Cleanup-Annex mit allen 7 Stellen + Status `✅ Final-Cleanup completed 2026-05-21`.

- [x] **1.15** Customer-Route Naming-Drift als Sub-Plan-Marker dokumentiert (Phase 3.8 + Parking-Lot in TODO.md). Kein Inline-Code in dieser Phase — wird via `/plan customer-route-rename` separat aufgesetzt.

- [x] **1.16** `vitest.config.ts:28` Include-Pattern erweitert auf `apps/web/src/**/*.test.{ts,tsx}`. Verifikation in Phase 1 Test-Step (Task #11).

- [x] **1.17** CONTRIBUTING.md:16 auf `.claude/CLAUDE.md` umgestellt. CLAUDE.md Email-Zeile bereits in Phase 1.1/1.2 angepasst.

- [x] **1.18** Settings-Danger-Zone Mis-Selling-Block: Placeholder-Mounts durch ehrlichen EmptyState ersetzt mit Disclaimer + Verweis auf `nova-2-settings-backend.md`.

### Phase 2 — Hygiene-Sweep mit konkreten Audit-Findings (WEAK→STRONG)

**Stand 2026-05-21:** Alle 6 vorher offenen Audits sind durchgelaufen, Findings konsolidiert. Diese Phase setzt die KILL/STRONG-Findings um. Audit-Reports werden als Markdown-Files persistiert für Audit-Trail und spätere Vergleichbarkeit.

- [x] **2.0** Audit-Reports persistiert: 8 individuelle Markdown-Files (context-files, workflow, adr-vs-code, tech-stack-drift, tests-eval-ci, packages-health, settings-backend, dead-code-apps-web) + Index `README.md` in `docs/audits/2026-05/`. Pro File: Severity-Bänder, file:line-Findings, "Adressiert in"-Mapping zu Plan-Phasen.

- [x] **2.1 — Tech-Stack-Cleanup (KILL):**
  - [x] **2.1a** `@react-spring/web` + `@xyflow/react` entfernt (0 Imports).
  - [x] **2.1b** `shadcn` von dep → devDep verschoben.
  - [x] **2.1c** `gray-matter` explizit in `apps/web/package.json` deklariert.
  - [x] **2.1d** `lucide-react@1.16.0` ist die echte aktuelle Version (Lucide hat Major-Sprung 0.x → 1.x gemacht). Audit-Finding war False-Positive — kein Change nötig.
  - [x] **2.1e** zod auf `^4.0.0` in `@vk/llm` gezogen. Typecheck grün.
  - [x] **2.1f** `packages/auth`: React + @types/react aus deps → peerDeps + devDeps. Typecheck grün.

- [x] **2.2 — apps/web Dead-Code-Cleanup (WEAK, ~400 LOC + Bundle-Slim):**
  - [x] **2.2a** AuditForm.tsx gelöscht.
  - [x] **2.2b** 5 ui-vk-Komponenten gelöscht (Card, SectionHeader, StatTile, Hairline, KeyboardHint). Barrel auf 4 real-genutzte Exports gekürzt + Doku-Header.
  - [x] **2.2c** OnboardingBanner Function-Body raus, nur `OnboardingState`-Type behalten. 3 Importer (GalaxieScene/StaticGalaxieSVG/GalaxieRoot) bleiben kompatibel (importieren denselben Pfad).
  - [x] **2.2d** dashboard/loading.tsx gelöscht.
  - [x] **2.2e** [workspace]/settings/user/page.tsx gelöscht. `.next/` Cache geleert (Validator referenzierte alte Route).
  - [x] **2.2f** CLAUDE.md-Constraint "UI-Library-Split (shadcn vs ui-vk)" ergänzt. `pnpm --filter @vk/web typecheck` grün.

- [x] **2.3 — packages/-Health-Cleanup:**
  - [x] **2.3a** NOOP — `dist/` ist bereits in `.gitignore` als top-level Pattern; `git ls-files packages/*/dist/` zeigt 0 getrackte Files. Audit-Finding war False-Positive.
  - [ ] **2.3b** OPTIONAL `@vk/fixes` → `@vk/audit/fixes` Merge — **deferred** in Phase Future (zu klein für Wert).
  - [x] **2.3c** JSDoc-Sweep für `@vk/core/src/types.ts` — alle 8 Type-Exports + AGENT_FILE_KINDS + MUST_KINDS + FINDING_CATEGORIES + Citation + ParserWarning + CursorActivationMode + ParsedAgentFile + ParserResult + AuditFinding + AuditReport mit klarem JSDoc.
  - [x] **2.3d** Cross-Check — keine OpenAI-Dead-Branches mehr in `packages/llm/src/` (Phase 1.13b hat sie alle provider-agnostisch gemacht).

- [x] **2.4 — Settings-Backend-Gap dokumentieren:**
  - [x] **2.4a** Settings-Inventar liegt in `docs/audits/2026-05/settings-backend.md` (16-Routes-Tabelle, 13 als KILL/WEAK markiert).
  - [x] **2.4b** `nova-2-settings-backend.md` Header erweitert um Priorisierungs-Update aus Audit (Danger-Zone + Notifications zuerst, Mis-Selling-getriebene Reihenfolge).
  - [x] **2.4c** ADR-0006 `docs/adrs/0006-workspace-tables-vs-betterauth-org.md` neu geschrieben (post-hoc Doku Build-vs-Buy).

- [x] **2.5 — Tests/CI-Härten (siehe Audit-Findings):**
  - [x] **2.5a** Phase 1.16 vitest.config-Fix bereits verifiziert (169/169 Tests grün, inkl. 12 neue apps/web-Tests).
  - [x] **2.5b** `pnpm lint` als CI-Step in `ci.yml` ergänzt (nach typecheck, vor unit tests).
  - [x] **2.5c** `turbo.json` `lint`-Task mit `inputs` + `outputs: []` definiert.
  - [x] **2.5d** Conflict-eval als optionaler CI-Job ergänzt (separater Job, läuft nur auf push to main, no-op ohne ANTHROPIC_API_KEY, persistiert results als Artifact).
  - [x] **2.5e** Lighthouse-Output-Files in `.gitignore`.
  - [x] **2.5f** `"lighthouse"`-Script in `apps/web/package.json` ergänzt.
  - [x] **2.5g** README-Update mit Dev-Service-URLs (Mailpit `:8025`, Inngest `:8288`) + `eval:conflicts` + `lint` + `lighthouse`-Befehlen.

- [x] **2.6** turbo.json Cache-Optimierung: `inputs` pro Task + `globalDependencies` (tsconfig.base, .env.example, pnpm-lock) + explizite `outputs` für lint/typecheck/test. Erledigt im selben Edit wie 2.5c.

- [x] **2.7** Husky + lint-staged installiert (root devDeps). `.husky/pre-commit` ruft `pnpm exec lint-staged`. `lint-staged`-Config in root `package.json`: staged apps/web `.ts/.tsx` → `next lint --fix --file`. `prepare: "husky"`-Script automatisch via Install. (Packages-Cross-cutting lint-staged ist minimal — typecheck läuft via CI.)

### Phase 3 — Struktur-Doku, Onboarding & Route-IA (MID, mittelfristiger Value)

- [x] **3.1** `docs/architecture.md` neu (5 Sektionen + Webhook-Härte-Pattern + App-Router-Boundaries).
- [x] **3.2** `docs/operations/deploy.md` neu.
- [x] **3.3** `docs/operations/secrets-rotation.md` neu (8 Secret-Gruppen mit Quelle/Rotation/Permissions).
- [x] **3.4** `docs/plans/done/` reorganisiert: 4 Sub-Ordner (`galaxie/`, `nova/`, `homepage-relaunch/`, `landing/`) + README pro Sub-Ordner.
- [x] **3.5** `docs/changelog.md` als Phasen-Log mit 6 Phasen.
- [x] **3.6** README.md Tech-Stack/Dev-Services bereits in Phase 2.5g aktualisiert.
- [x] **3.7** CLAUDE.md "Wo finde ich was" um architecture.md, changelog.md, audits/, operations/ erweitert.
- [x] **3.8** Customer-Route-Rename Sub-Plan-Stub `docs/plans/customer-route-rename.md` mit Problem-Statement + Discovery-Slot-Markern. Volle Implementation startet via User-Trigger `/plan customer-route-rename`.
- [x] **3.9** `<PageSkeleton variant="list|detail|settings">` Helper neu + `[workspace]/error.tsx` Boundary + `[workspace]/loading.tsx`. Flächendeckende Settings-Loading-States deferred (zu groß für jetzt, eigener Sub-Plan wenn nötig).

### Phase 4 — Closing-the-Loop & Quality-Gates (EXCEPTIONAL, langlebiger Value)

- [x] **4.1** `scripts/doc-consistency.ts` neu. Parst CLAUDE.md + vision.md gegen 13 tracked Libs, grept alle package.json. Warning-only mode default, `--strict` für Hard-Fail. `pnpm doc:check`-Script in root.
- [x] **4.2** `ci.yml` "Doc-consistency check (warning-only)"-Step ergänzt (zwischen eval und build).
- [x] **4.3** ADR-Frontmatter-Convention auf alle 6 ADRs angewandt (`id`, `title`, `status`, `date`, plus `supersedes-partial` / `superseded-by-partial` für 0002 ↔ 0004).
- [x] **4.4** `scripts/plan-lint.ts` neu. Checkt Status-Header, Confidence-Header, Severity-Spalte in §9. `pnpm plan:lint`. Warning-only. 3 Pre-Workflow-Plans (nova-2-*) haben WARN — erwarteter Marker für späteres Refactor.
- [ ] **4.5** Stretch `/docs`-Public-Route — **skipped, Phase Future** (Plan markiert als optional).

---

## 7. Files-to-Change (vollständig, Sektion-zu-Schritt-Mapping)

| Datei | Aktion | Phase | Was passiert |
|-------|--------|-------|--------------|
| `.claude/commands/plan.md` | OVERWRITE | 0.1 | Discovery-First-Workflow (Markdown-Body in §10) |
| `.claude/commands/execute.md` | OVERWRITE | 0.2 | Pre-Flight + Block-Resolver + Dev-Server-Auto-Start (Markdown-Body in §10) |
| `.claude/CLAUDE.md` | EDIT | 0.3, 1.1, 1.2, 3.7 | Workflow-Sektion + Tech-Stack-Zeile + Wo-finde-ich-was-Tabelle |
| `docs/vision.md` | EDIT | 1.3, 1.4 | Render-Stack + Better-Auth-Behauptung synchronisieren |
| `docs/adrs/0002-ui-render-stack.md` | EDIT | 1.6, 4.3 | Status-Header + Re-Open-Trigger + YAML-Frontmatter Supersedes |
| `docs/adrs/0004-landing-svg-stack.md` | NEW | 1.5 | Neuer ADR für SVG-Stack-Pivot (Landing) |
| `docs/design/linear-aesthetic.md` | EDIT | 1.7 | §8 R3F-Aesthetic markieren/löschen, §12 schließen |
| `docs/roadmap/phase-galaxie.md` | MOVE | 1.8 | `git mv` → `docs/roadmap/done/` |
| `docs/roadmap/phase-nova-2.md` | NEW | 1.9 | Phase-Übersicht aus done-Master-Plan |
| `TODO.md` | EDIT | 1.10 | Phase-0-History raus, Parking-Lot rein |
| `docs/plans/done/phase-0-history.md` | NEW | 1.10 | Extrahierte Phase-0-Sprint-History |
| `docs/plans/master-vision-galaxie.md` | MOVE | 1.11 | → done/ |
| `docs/plans/homepage-relaunch.md` | MOVE | 1.11 | → done/ |
| `docs/plans/frontend-relaunch-v2.md` | MOVE | 1.11 | → done/ |
| `docs/plans/nova-1-r3f-engine.md` | DELETE | 1.12 | `git rm` — Pivot in git log + done/repo-galaxie-mvp.md |
| `docs/plans/nova-2-landing-hero.md` | DELETE | 1.12 | `git rm` |
| `docs/plans/phase-nova-r3f-uplevel.md` | DELETE | 1.12 | `git rm` |
| `packages/llm/package.json` | EDIT | 1.13a | `@ai-sdk/openai` als dep ergänzen |
| `packages/llm/src/select.ts` | EDIT | 1.13b | OpenAI-Branch echt-funktional (import openai-provider, init, model-id) |
| `docs/adrs/0005-llm-multi-provider.md` | NEW | 1.13c | Decision: Anthropic primary, OpenAI opt-in, kein AI Gateway |
| `packages/db/src/schema.ts` | EDIT | 1.14a | `canonicalRepoId`-Spalte droppen + Migration 0012 |
| `packages/db/drizzle/0012_drop_canonical_repo_id.sql` | NEW | 1.14a | DB-Migration für Spalten-Drop |
| `packages/core/src/types.ts` | EDIT | 1.14b | DRIFT_KINDS/DriftKind/DriftItem/DriftReport exports löschen |
| `apps/web/src/app/pricing/page.tsx` | EDIT | 1.14c | "Drift detection across repo pairs" Bullet löschen (Bait-and-Switch-Risk) |
| `apps/web/src/app/trust/page.tsx` | EDIT | 1.14d | Audit-Trail-Export-Liste: "drifts" entfernen |
| `apps/web/src/components/settings/NotificationMatrix.tsx` | EDIT | 1.14e | drift.detected Event entfernen |
| `apps/web/src/lib/repo-galaxie/demo-data.ts` | EDIT | 1.14f | Drift-Texte umschreiben |
| `packages/inngest/src/functions/audit-requested.ts` | EDIT | 1.14g | Tombstone-Kommentar entfernen |
| `docs/adrs/0003-drop-compare-feature.md` | EDIT | 1.14h | Final-Cleanup-Annex |
| `vitest.config.ts` | EDIT | 1.16 | Include apps/web/src/**/*.test.{ts,tsx} |
| `apps/web/src/app/[workspace]/settings/danger/page.tsx` | EDIT | 1.18 | Placeholder-Danger-Zone durch EmptyState ersetzen |
| `CONTRIBUTING.md` | EDIT | 1.17 | Active-Phase-Link |
| `docs/audits/2026-05/*.md` | NEW (6 Files + README) | 2.0 | Persistierte Audit-Reports |
| `apps/web/package.json` | EDIT | 2.1a–c | Remove @react-spring/web + @xyflow/react; shadcn dep→devDep; gray-matter add |
| `packages/llm/package.json` | EDIT | 2.1e | zod ^4.0.0 |
| `packages/auth/package.json` | EDIT | 2.1f | React aus deps → peerDeps + devDeps |
| `apps/web/src/components/AuditForm.tsx` | DELETE | 2.2a | 0 Mounts |
| `apps/web/src/components/ui-vk/{Card,SectionHeader,StatTile,Hairline,KeyboardHint}.tsx` | DELETE | 2.2b | 0 externe Consumer |
| `apps/web/src/components/ui-vk/index.ts` | EDIT | 2.2b | Barrel auf real-genutzten Set kürzen |
| `apps/web/src/components/galaxie/OnboardingBanner.tsx` | EDIT | 2.2c | Function-Export raus, nur Type behalten/extrahieren |
| `apps/web/src/app/dashboard/loading.tsx` | DELETE | 2.2d | nie reachable |
| `apps/web/src/app/[workspace]/settings/user/page.tsx` | DELETE | 2.2e | edge-redirect shadowt |
| `.gitignore` | EDIT | 2.3a + 2.5e | `packages/*/dist/` + `lighthouse-*.{html,json,report.html}` |
| `packages/core/src/types.ts` | EDIT | 2.3c | JSDoc-Sweep für 8 Type-Exports |
| `docs/adrs/0006-workspace-tables-vs-betterauth-org.md` | NEW | 2.4c | Build-vs-Buy Workspace-System |
| `.github/workflows/ci.yml` | EDIT | 2.5b + 2.5d | pnpm lint Step + conflict-eval optional Job |
| `turbo.json` | EDIT | 2.5c + 2.6 | lint-Task + inputs/globalDependencies |
| `apps/web/package.json` | EDIT | 2.5f | `"lighthouse"`-Alias |
| `README.md` | EDIT | 2.5g + 3.6 | Inngest-UI/Mailpit-UI/eval:conflicts ergänzen |
| `.husky/pre-commit` + `package.json` lint-staged config | NEW | 2.7 | husky + lint-staged setup |
| `docs/plans/<sub-plans>.md` | NEW (var) | 2.5a, 3.8 | Sub-Pläne nach neuem Workflow |
| `docs/architecture.md` | NEW | 3.1 | DAL/Cache/Tenant/Parser-Doku |
| `docs/operations/deploy.md` | NEW | 3.2 | Deploy-Cheatsheet |
| `docs/operations/secrets-rotation.md` | NEW | 3.3 | Secrets-Inventar |
| `docs/plans/done/galaxie/` (+others) | NEW DIRS | 3.4 | Sub-Ordner + READMEs |
| `docs/changelog.md` | NEW | 3.5 | Phasen-Log |
| `README.md` | EDIT | 3.6 | Tech-Stack-Tabelle verifizieren |
| `scripts/doc-consistency.ts` | NEW | 4.1 | CLAUDE↔package-json Linter |
| `scripts/plan-lint.ts` | NEW | 4.4 | Plan-File-Linter |
| `package.json` (root) | EDIT | 4.1 | `"doc:check"`-Script ergänzen |
| `.github/workflows/ci.yml` | EDIT | 4.2 | `pnpm doc:check` Step |
| `docs/adrs/0001-customer-schema.md` | EDIT | 4.3 | YAML-Frontmatter |
| `docs/adrs/0003-drop-compare-feature.md` | EDIT | 4.3 | YAML-Frontmatter |

---

## 8. Test-Plan

**Automatisch:**
- [ ] `pnpm typecheck` grün (besonders nach 1.13–1.15 Code-Edits)
- [ ] `pnpm test` grün (keine Test bricht durch Plan-File-Moves)
- [ ] `pnpm eval` grün (Audit-Rules unverändert)
- [ ] `pnpm build` grün
- [ ] **Neu nach Phase 4:** `pnpm doc:check` grün
- [ ] **Neu nach Phase 4 (optional):** `pnpm plan:lint` grün

**Manuell pro Phase:**

Phase 0:
- [ ] Plan-Command testen: `/plan dev-server-readme-pin` (Mini-Slug) — fragt Discovery-Runden mit Recommended + Other?
- [ ] Plan-File-Output entspricht neuem 13-Sektionen-Skelett?
- [ ] Execute-Command auf einen Trivial-Plan getestet (kein Risiko): Pre-Flight-Check läuft, Block-Resolver wird angezeigt wenn File nicht existiert?

Phase 1:
- [ ] Alle Verweise zwischen `.claude/CLAUDE.md`, `docs/vision.md`, ADR-0002/0004, `linear-aesthetic.md` funktionieren (kein Toter Link)
- [ ] `git status` clean nach Renames? Keine ungewollten Diffs?
- [ ] `packages/llm/src/select.ts` nach Edit: `pnpm --filter @vk/llm typecheck`

Phase 2:
- [ ] 6 Audit-Reports existieren in `docs/audits/2026-05/`
- [ ] Pro KILL-Finding gibt es einen neuen Plan-File in `docs/plans/`

Phase 3:
- [ ] `docs/architecture.md` lesbar in &lt;5 min für jemanden, der das Repo nicht kennt (Self-Test)
- [ ] `docs/operations/deploy.md` — alle Env-Vars aus `.env.example` adressiert
- [ ] `docs/plans/done/<sub-ordner>/README.md` pro Sub-Ordner vorhanden

Phase 4:
- [ ] `scripts/doc-consistency.ts` failt absichtlich, wenn ich `dummy-dep` in CLAUDE.md erwähne → wieder grün nach revert
- [ ] CI Step "doc:check" sichtbar in nächstem PR-Run
- [ ] Wenn Stretch Phase 4.5: `/docs` Public-Route rendert mindestens ein Markdown-File

---

## 9. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| Discovery-First-Workflow nervt User durch zu viele Fragen | **Strong** | Klarheits-Schwelle pro Sektion (§A.3 im neuen plan.md). Hard-Cap 4 Runden. User kann via Other-Freitext jederzeit "weniger Fragen bitte" sagen → wird im Audit-Trail mitprotokolliert. |
| Plan-File-Move (1.11, 1.12) bricht Backlinks aus anderen Files | **Mid** | Vor jedem `git mv`/`git rm`: `grep -rn "<old-path>"` ausführen. Backlinks updaten. Re-Read in 1.17 als Gate. |
| `canonicalRepoId`-Drop (Phase 1.14a) bricht Production-DB | **Kill** | Migration 0012 muss **revertible** sein. Pre-Deploy: `pg_dump`-Backup der `repo`-Tabelle. Migration ist `DROP COLUMN` ohne Daten-Verlust für andere Spalten. Production-Daten in der Spalte sind laut Audit `null` (Feature war nie live). Verifikation via Drizzle-Studio: `SELECT count(*) FROM repo WHERE canonical_repo_id IS NOT NULL` → wenn >0, STOP + User fragen. |
| Drift-Cleanup (1.14c) löscht Pricing-Page-Bullet ohne Marketing-Replacement | **Mid** | Bullet ist bereits ein Bait-and-Switch — Risiko ist *nicht* zu löschen größer als das Risiko zu löschen. Wenn Marketing-Slot wichtig: Sub-Plan für "Pricing-Page Beta-Update" als Folge-Item. |
| vitest-Config-Erweiterung (1.16) macht bisher unsichtbare apps/web-Test-Fails sichtbar | **Mid** | Erwartet. Falls Tests rot: Sub-Plan `apps-web-vitest-bitrot-fix` mit neuem Discovery-Workflow. Schlimmstes-Case: ein paar Tests temporär `.skip()` mit Linear-Issue-Marker. |
| `@xyflow/react` + `@react-spring/web` Entfernung (2.1a) bricht versteckten Import | **Weak** | Audit hat `grep -rn` durchgeführt: 0 Treffer. Aber: kann transitive devDep eines anderen Pakets sein. Vor Remove: `pnpm why @xyflow/react` verifizieren. |
| `lucide-react@^1.16.0` Major-Wechsel (2.1d) bricht alle Icon-Imports | **Strong** | Wenn lucide-react@1.x ein Squat ist und wir auf `lucide-react@latest` (0.4xx) wechseln → ALLE Icon-Imports müssen geprüft werden. Mitigation: vor Wechsel `pnpm view lucide-react versions` + `grep -rn "from \"lucide-react\"" apps/web/src` zur Impact-Analyse. Stretch-Goal, nicht-blocking für Phase 2.1. |
| ui-vk-Cleanup (2.2b) löscht Komponenten, die User für Nova-3 ausgedacht hatte | **Mid** | Audit-Empfehlung: löschen statt behalten — "irreführt zukünftige Sessions zu ungenutzten Mustern". Mitigation: Git-History bewahrt die Komponenten; Reaktivierung kostet `git show` + Copy. |
| Customer-Route-Rename (3.8) bricht extern verlinkte Bookmarks | **Strong** | Edge-Redirects in `next.config.ts` für alle alten Pfade. `middleware-redirects.ts` mit legacy-customer-bookmarks. Sub-Plan-Owner via neuem `/plan customer-route-rename`. |
| Husky/lint-staged (2.7) macht Commits langsamer | **Weak** | Akzeptabel, weil verhindert dass rote Tests/Lint in main landen. Bypass via `--no-verify` ist möglich aber durch CLAUDE.md "Never skip hooks" konsequent abzulehnen. |
| ADR-0006 (Workspace vs Better-Auth-Org) ist post-hoc-Rationalisierung | **Weak** | Ist Solo-Dev-Repo. Post-hoc-Doku ist okay solange die Entscheidung sauber argumentiert ist (Audit hat sie als bewussten Build-vs-Buy identifiziert). |
| `packages/llm/select.ts` OpenAI-Edit kills bestehende OPENAI_API_KEY-Codepfade in Production | **Strong** | Vor Edit: `grep -rn "OPENAI_API_KEY"` — wenn nur in select.ts und nicht im Frontend-Setup → safe. Sonst throw-Variante wählen, nicht delete. |
| Subagent-Re-Runs in Phase 2 stoßen wieder auf Session-Limit | **Mid** | Serialisiert ausführen (1 Audit pro Execute-Session). Briefings aus diesem Plan kopieren, nicht neu schreiben. |
| Phase 4 Doc-Consistency-Linter ist false-positive-anfällig (parst Markdown-Tabellen brittle) | **Weak** | Anfangs als `warning`-only, nicht hard-fail. Nach 1-2 Wochen Stabilität → hard-fail. |
| Plan ist zu groß, wird nie komplett abgearbeitet → Karteileiche | **Strong** | Phasen-Cherry-Pick erlaubt. User triggert `/execute repo-health-and-workflow-overhaul phase-0` (oder gleichwertig: Phase 0 als eigener Sub-Plan-Slug `workflow-overhaul-phase-0`). Plan bleibt aktiv solange noch eine Phase offen ist. |
| ADR-0004 schreiben ohne Architecture-Doku-Owner-Review → Inkonsistenz | **Weak** | Solo-Dev = User ist Reviewer. Reicht. |
| Plan ergänzt sich selbst mit Sub-Plans (Phase 2.7) → Plan-Explosion in `docs/plans/` | **Mid** | Sub-Plans bekommen Slug-Prefix `audit-fix-<area>-<n>` damit klar erkennbar. Max 6 Sub-Plans erwartet. |

---

## 10. Anhang — Vollständige Markdown-Bodies für `.claude/commands/`

Diese Bodies sind im Phase-0-Schritt 0.1 und 0.2 direkt zu übernehmen. Sie stammen aus dem Subagent-Report "Plan/Execute Workflow Audit" (vollständig in Task-Output gespeichert, hier auszugsweise mit Konsistenz-Anpassungen).

### 10.1 Neuer `.claude/commands/plan.md`

````markdown
---
description: Erstelle einen optimalen Plan via mehrrundige Discovery-Klärung. Schreibe nach docs/plans/<slug>.md.
---

Du planst eine konkrete Änderung am Projekt. Argument vom User: `$ARGUMENTS`
(typischerweise ein Kebab-Case-Slug wie `magic-link-rate-limit` oder
`fix-drift-pagination`; ggf. mit Freitext-Beschreibung dahinter).

**Dein Job ist nicht, schnell einen Plan zu schreiben — sondern einen Plan zu schreiben, hinter dem keine Vermutungen mehr stecken.** Frag lieber 12× kurz als 1× falsch zu raten. Der User will Klarheit, keine Geschwindigkeit.

## Phase A — Discovery (vor jedem Schreibversuch)

### A.1 Kontext aufbauen
1. **Lies `.claude/CLAUDE.md`** für Repo-Kontext.
2. **Lies thematisch verwandte Plan-Files** in `docs/plans/` + `docs/plans/done/`. Grep nach 2–3 Keywords aus dem Slug.
3. **Lies relevanten Code** gezielt (kein Repo-Wide-Scan außer der Slug ist Repo-weit).
4. **Notiere intern** (nicht im Plan-File): Confidence pro Sektion (High/Mid/Low), Vermutungen, Patterns die du im Repo identifiziert hast.

### A.2 Frage-Runden (immer mindestens 2, max. 4)

**Regel für jede AskUserQuestion-Frage:**
- Max. 1–2 Sätze pro Option. User entscheidet in <5s.
- Erste Option immer Suffix `(Recommended)` mit begründeter Empfehlung. Wenn du keine Empfehlung hast → frag NICHT — recherchiere weiter.
- Vierte Option ist automatisch via AskUserQuestion "Other" (Freitext) verfügbar — nicht explizit listen.
- Deutsch, klar, kurz. Code-Terms (file paths, function names) okay.

**Runde 1 — Scope & Intent (immer):**
1. Was-für-Change — Refactor / Feature / Bugfix
2. Scope-Breite — Single-File / Single-Package / Cross-Package
3. Zeit-Schätzung — Mini-Sprint (≤2h) / Half-Day / Multi-Session
4. Verwandte Pläne — kein Vorgänger / bezieht sich auf [X] / Sub-Plan von [Y]

**Runde 2 — Risk-Surface (immer):**
1. DB-Touching? — Nein / Additive / Destructive
2. Auth/Permission? — Nein / Read-Permission / RBAC-Erweiterung
3. External-API? — Nein / 1 Provider Reads / Multi-Provider oder Writes
4. Secrets/Env-Vars? — Nein / nur DEV / auch PROD

**Runde 3 — Execution-Shape (conditional: nur wenn ≥1 Risk-Surface ≠ Nein, ODER Multi-Session):**
1. Rollout — Direkt-Merge / Branch+Review / Feature-Flag
2. Test-Tier — Typecheck+Vitest / +Integration / +Playwright E2E
3. Existing-Pattern — Folge [X] / wähle aus mehreren / Neues Pattern
4. Out-of-Scope — alles im Plan / Claude schlägt V2-Cut vor / User füllt aus

**Runde 4 — Deep-Dive (conditional bei destructive/RBAC/Webhook/Feature-Flag):**
- DB destructive → Soft-Delete-Window? Migration-Reversibilität?
- RBAC → Welches Modell (RLS vs App-Layer)?
- Feature-Flag → Backend (env / DB-row / LD)?
- Multi-Session → PR-Schnitt-Strategie?

### A.3 Stopp-Bedingung (Klarheits-Schwelle)

Vor jeder Runde intern checken: Kann ich JETZT, mit den gegebenen Antworten, JEDE dieser Plan-Sektionen ohne weitere Vermutung schreiben?
- §5 Ziel · §6 Endzustand · §7 Schritte · §8 Files · §9 Test-Plan · §10 Risiken (alle Severity-Bänder?) · §11 Rollout · §12 Out-of-Scope

Wenn alle ✓ → Discovery beenden, in Phase B.
Wenn ≥1 ✗ → eine weitere Runde mit gezielter Fragen-Auswahl.
Hard-Cap: 4 Runden. Nach Runde 4 verbleibende Lücken in §13 Open Questions dokumentieren, NICHT weiter raten.

## Phase B — Plan-File schreiben

Schreibe `docs/plans/<slug>.md` mit:

```markdown
# Plan — <Titel>

> Erstellt: <Datum>
> Status: 🟡 In Review
> Slug: `<slug>`
> Confidence: High/Mid/Low — basiert auf {N} User-Entscheidungen + Code-Audit von {M} Files
> Voraussetzung (falls Sub-Plan): siehe `docs/plans/<parent>.md`

## 1. Ziel
Ein Satz. Was ist nach Execute anders?

## 2. User-Entscheidungen (Audit-Trail aus Discovery)
| ID | Runde | Frage | Antwort |

## 3. Existing-Patterns im Repo (Vorbild)
- `path/to/file.ts:L1-L40` — was es zeigt, warum wir dem folgen.

## 4. Alternativen die wir bewusst NICHT wählen
- Alt-A: ... → Verworfen wegen ...

## 5. Endzustand
## 6. Schritte (Checkboxes)
## 7. Files-to-Change (Tabelle)
## 8. Test-Plan (auto + manuell mit Checkboxen)
## 9. Risiken + Mitigation (Severity-Spalte PFLICHT: Kill/Strong/Mid/Weak)
## 10. Rollout (Strategie, Pre-Deploy-Gates, Post-Deploy-Verifikation, Rollback)
## 11. Out-of-Scope (V2 / separater Plan)
## 12. Open Questions (nur Post-Execute-Items)
## 13. Geschätzter Aufwand
```

## Phase C — User-Review-Loop

Nach Plan-Write:
1. Antwort: Pfad + 3-Satz-Summary + Confidence-Level + Liste aller Fragen+Antworten.
2. AskUserQuestion:
   - Ready für `/execute <slug>` (Recommended)
   - Sektion X anpassen
   - Re-Plan from scratch
   - [Other: Freitext]

## Anti-Patterns
- Kein Code in dieser Phase, nur Plan-File.
- Keine Frage stellen ohne Recommended-Vorschlag mit Begründung.
- Keine vagen Schritte — immer Datei + konkrete Änderung.
- Open Questions ist NICHT okay für load-bearing Architektur-Decisions — die kommen in §2.
- Kein Plan-File schreiben solange ein Section-Item nur "TBD" ist.
- Confidence Low → Phase A nochmal, nicht Plan-File mit Low schreiben.
````

### 10.2 Neuer `.claude/commands/execute.md`

````markdown
---
description: Führe einen Plan aus docs/plans/<slug>.md mit Pre-Flight, Block-Resolver, Dev-Server-Auto-Start. Verschiebe nach done/.
---

Du führst einen bereits geschriebenen Plan aus. Argument: `$ARGUMENTS`.

## Phase A — Pre-Flight
1. **Lies `docs/plans/$ARGUMENTS.md`.** Wenn nicht existiert: Fehler + 3–5 nächst-ähnliche Slugs aus `docs/plans/` + `docs/plans/done/` listen.
2. **Lies `.claude/CLAUDE.md`** für Repo-Kontext.
3. **Confidence-Check:** Plan-Header `Confidence: Low`? → AskUserQuestion (Re-Plan first Recommended / Trotzdem starten / Stop).
4. **Git-Branch-Status:** clean? Wenn modified → AskUserQuestion (Commit-first Recommended / Stash / Continue).
5. **Heuristik:** `isUIChange = (Files-to-Change ≥3 unter apps/web/src/)`.

## Phase B — Step-by-Step
1. **TaskCreate** pro Schritt aus §6.
2. Pro Schritt: TaskUpdate `in_progress` → Edit/Bash → Checkbox abhaken → TaskUpdate `completed`.

### Step-Block-Resolver
Blockiert wenn: File existiert nicht / API existiert nicht / Test-Befehl funktioniert nicht / unerwarteter Typecheck-Fehler.
- **NIE raten.** STOP + AskUserQuestion:
  - Op1: Plan §X.Y updaten auf [Claude's Korrektur] (Recommended)
  - Op2: Schritt skippen + in §12 dokumentieren
  - Op3: Re-Plan
  - [Other]

### Sub-Step-Adjustment
Wenn Schritt 3× größer als geplant → STOP + AskUserQuestion (Scope erweitern Recommended bei <30min / Sub-Plan auslagern / Plan refinen).

## Phase C — Test + Verifikation
1. **§8 Auto-Tests** alle ausführen. Bei Rot → STOP, fix-or-ask.
2. **§8 Manuelle Tests** — pro Check AskUserQuestion (Ja Recommended / Nein hier ist was kaputt / Skippe).
3. **Dev-Server-Auto-Start** (nur `isUIChange = true`): `pnpm --filter @vk/web dev` im Background, URL extrahieren, an User reporten mit Liste der zu verifizierenden Routen.

## Phase D — Plan-Abschluss
1. **Acceptance-Check** (Plan §10 Rollout): AskUserQuestion (Alle erfüllt Recommended / X fehlt → Plan bleibt aktiv / Mit deferrals in §12).
2. Status-Zeile updaten: `✅ Done — <Datum> (Confidence-At-Start: X, {N} abgehakt, {M} deferred, {K} manuelle pending)`.
3. `git mv docs/plans/$ARGUMENTS.md docs/plans/done/$ARGUMENTS.md`.
4. Antwort: Was geändert, Plan-Pfad jetzt, Test-Status, Dev-Server-URL falls UI, offene Items.

## Anti-Patterns
- Kein Schritt skippen ohne explizites User-OK.
- Kein neuer Schritt ohne Plan-Edit vorher.
- Keine Commits ohne User-Aufforderung.
- Kein Deploy.
- Bei Block NIE raten — IMMER AskUserQuestion.
- Dev-Server nicht starten bei non-UI-Plans.
- Plan nicht nach done/ moven solange Acceptance ✗.
````

---

## 11. Rollout

- **Strategie:** Phasen-Cherry-Pick. Phase 0 zuerst (Workflow), dann nutzt der Plan ab Phase 1 sich selbst (Phase 1 wird via neuem Discovery-Workflow re-geplant ODER direkt als-ist ausgeführt). Phase 2 läuft serialisiert wegen Subagent-Session-Limits. Phase 3 + 4 in eigenem Execute-Slot, nicht Pflicht für Beta-Launch.
- **Pre-Deploy-Gates pro Phase:** typecheck + test + eval + build grün. Bei Code-Changes (Phase 1.13–1.15, Phase 4) zusätzlich manuelle UI-Smoke wenn `isUIChange`.
- **Post-Deploy-Verifikation:** Nicht relevant — alle Changes sind Doku/Workflow/Local-Code, kein Deploy nötig bis Beta-Launch separat.
- **Rollback-Trigger:**
  - Workflow-Phase 0: Plan-Discovery wird untragbar nervig → revert via `git checkout` der zwei Command-Files.
  - Code-Phase 1.13–1.15: typecheck oder test failed → revert single file.
  - File-Moves 1.8/1.11/1.12: bei broken Backlinks → revert Move + Backlinks updaten.
- **Rollback-Schritte:** `git diff` zeigt isolierte Changes pro Schritt. Jeder Schritt ist atomar revert-bar.

---

## 12. Out-of-Scope (V2 oder separater Plan)

- **Nova-3 Render-Engine-Migration** (Pixi → SVG einheitlich oder umgekehrt) — separater Master-Plan wenn Phase Nova-3 startet.
- **Beta-Launch Pre-Reqs** (Vercel-Prod-Deploy, Domain, Stripe-Live-Keys) — separater Plan, dieser hier macht nur die Repo-Hygiene zu Beta-Readiness.
- **Settings-Backend** (6 Sections ohne Backend) — bereits eigener aktiver Plan `nova-2-settings-backend.md`, wird nicht hier dupliziert. Phase 2.5 Audit referenziert diesen.
- **A11y-Deep-Sweep** — bereits eigener aktiver Plan `nova-2-a11y-deep-sweep.md`.
- **Live-Audit-Flow auf Landing** — bereits eigener aktiver Plan `nova-2-live-audit-flow.md`.
- **`/ultrareview`-Setup oder ähnliche Multi-Agent-Review-Tools** — Phase Future.
- **Public-Doku-Site (`/docs`-Route)** — Phase 4.5 Stretch, nicht-blocking.

---

## 13. Open Questions (User-Review, vor Execute)

Diese 4 Entscheidungen sollten vor `/execute` geklärt werden — sie sind Sub-Discovery zu Q7–Q10 aus §2:

**Alle 4 Discovery-Fragen entschieden 2026-05-21 (siehe §2 Q7–Q10).** Keine offenen Items vor Execute.

**Post-Execute-Items (Phase 2 wird welche generieren):**
- Pro Audit-Finding mit KILL/STRONG-Severity entsteht ein neuer Sub-Plan via /plan-Workflow.
- Maximale erwartete Sub-Plan-Anzahl: 6 (einer pro Audit-Bereich, falls KILL-Findings dort sind).

---

## 14. Geschätzter Aufwand

- **Phase 0** (Workflow-Overhaul): 1–2h, ein Execute-Slot. Kritischer Pfad.
- **Phase 1** (Kontext-Reality-Pass mit erweiterten 18 Schritten inkl. Drift-Cleanup + vitest-Fix + Settings-Danger-Block): 3–5h, ein langer Execute-Slot ODER auf 2 Slots gesplittet (1a: Doku 1.1–1.13c, 1b: Code-Cleanup 1.14–1.18).
- **Phase 2** (Hygiene mit konkretisierten Findings): 4–6h verteilt auf 2–3 Execute-Slots. Audit-Reports sind bereits da → schneller als ursprünglich geschätzt.
- **Phase 3** (Doku + Route-IA): 4–6h (ARCHITECTURE.md + Operations + Customer-Route-Rename Sub-Plan).
- **Phase 4** (Quality-Gates): 2–3h plus optional Stretch 4.5 separat.

**Gesamt:** ~14–22h, verteilt auf ~8–10 Execute-Slots. **Beta-Launch-relevant** (Mis-Selling-Risiken adressieren):
1. Phase 0 + Phase 1.14 (Drift-Cleanup, Pricing-Page) + Phase 1.18 (Danger-Zone) = ~4–5h
2. Plus Phase 2.1 (Tech-Stack-Cleanup) + Phase 2.5g (README-Update) = ~1h
→ **Total Beta-Block: ~5–6h.**

Rest ist Quality-of-Life für die nächsten 6+ Monate.
