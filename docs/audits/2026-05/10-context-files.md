# Audit Sub-10 — Context-Files

> Generated: 2026-05-21
> Domain: Docs · Plans · ADRs · `.claude/` · README · Operations · Roadmap
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- Total `.md` files audited: ~58 (8 ADRs · 5 active plans · 27 done plans · 4 README · 1 vision · 1 architecture · 1 changelog · 2 roadmap · 1 design · 4 operations · 1 CLAUDE · 2 commands · 1 CONTRIBUTING · 1 SECURITY · 1 TODO · 9 prior audit reports)
- ADR continuity: ✅ 0001–0008 lückenlos, Front-Matter `id:` korrekt
- Plan-Status hygiene: 27/27 done-Pläne haben `Status:`-Header (✅ Done / 🟢 Approved / 🟢 Code Complete) — keine waisen
- Active-plan hygiene: 5/5 aktive Pläne haben Status-Header
- Notable issues: 11 (1 KILL · 2 Strong · 4 Mid · 4 Weak)
- Exceptional patterns: 3

---

## Findings

### [KILL] FN-01 — CLAUDE.md "Aktive Phase" lügt jetzt nach 5 weiteren shipped Phasen
**File:** `.claude/CLAUDE.md:9`
**Issue:** CLAUDE.md sagt `Aktive Phase (Mai 2026 →): Nova-2 · Full-Product ✅ shipped (Shell)` und listet als laufende Sub-Pläne `nova-2-live-audit-flow.md`, `nova-2-settings-backend.md`, `nova-2-a11y-deep-sweep.md`. Realität laut `docs/changelog.md` + `docs/plans/done/`:
- **5 weitere Phasen wurden zwischen 2026-05-20 und 2026-05-21 shipped:** Phase Repo-Health, SaaS-Pricing-Sub-A, Sub-B, Sub-C, Email-Templates-Polish-Pack. Master `saas-pricing-redesign.md` ist ✅ Done. `customer-route-rename.md` ist ✅ Done.
- **Aktiver Plan ist jetzt `nova-3-repo-polish-and-prod-prep.md`** (`docs/plans/nova-3-repo-polish-and-prod-prep.md`, 🟡 In Review, 27 KB, geschrieben 2026-05-21).
- CLAUDE.md erwähnt weder SaaS-Pricing-Phase noch Nova-3 — wer einen `/plan`-Call macht und CLAUDE.md liest, denkt die Pricing-Schicht existiert nicht und die Settings-Backend-Section ist Top-Prio.

**Why Kill:** Load-bearing Fact über Aktive-Phase ist falsch. CLAUDE.md ist die erste Datei jedes Plan-/Execute-Calls — falscher Kontext direkt am Eingang ist mis-leading, nicht mid-loading.
**Suggested Fix:** §"Aktive Phase" auf `Nova-3 · Repo-Polish + Prod-Prep (🟡 In Review)` umschreiben + Verweis auf abgeschlossene Phasen (Phase Nova-2 + Repo-Health + SaaS-Pricing Master+Sub-A/B/C + Email-Polish). Sub-Plan-Liste streichen (Nova-2-Subs sind veraltet / parallel zu Nova-3).

---

### [Strong] FN-02 — TODO.md "Aktive Sub-Pläne" + "Parking-Lot" sind 2 Tage veraltet
**File:** `TODO.md:24-27, 40-46`
**Issue:**
- `Aktive Sub-Pläne (Nova-2 Backend-Gaps)` listet `nova-2-live-audit-flow.md`, `nova-2-settings-backend.md`, `nova-2-a11y-deep-sweep.md` — diese sind technisch noch aktiv, aber **Master-Aktivität ist jetzt Nova-3**.
- `Parking-Lot` enthält `Customer-Route-Naming-Fix (...) — Phase 3.8 als Sub-Plan` (Z.43) — **bereits ✅ Done am 2026-05-21** (`docs/plans/done/customer-route-rename.md`).
- `Parking-Lot` enthält `Stripe Test-Mode Setup` (Z.45) — **bereits in `nova-3` Phase aktiv** + Master-SaaS-Pricing ist Done.
- `Beta-Launch Pre-Reqs` Z.22 hat noch `Drift-Cleanup-Verifikation (Phase 1.14 dieser Repo-Health-Pass)` als pending — laut ADR-0003 Final-Cleanup-Annex und `repo-health-and-workflow-overhaul.md` Step 1.14 ist das ✅ abgeschlossen.

**Why Strong:** Mehrere Refs in einer File auf Items die nicht mehr existieren oder schon erledigt sind. TODO.md ist explizit Source-of-Truth-Anker für "aktuelle Sprint-Tasks" (`docs/vision.md:152`).
**Suggested Fix:** TODO.md pflegen: Customer-Route + Drift-Cleanup + Stripe-Test-Mode aus Parking-Lot raus. "Aktive Sub-Pläne" Sektion entweder umbenennen zu "Nova-2 Backend-Gaps (parallel zu Nova-3)" oder komplett löschen. `Phase-History`-Sektion erweitern um SaaS-Pricing, Email-Polish, Customer-Route-Rename, Nova-3.

---

### [Strong] FN-03 — `linear-aesthetic.md` zeigt auf nicht-existenten Plan (Z.5)
**File:** `docs/design/linear-aesthetic.md:5`
**Issue:** Header sagt `Phase: Nova (siehe docs/plans/phase-nova-r3f-uplevel.md)`. Diese Datei existiert nicht — R3F-Stack wurde verworfen (siehe ADR-0004). Sektion 8 "R3F-spezifische Aesthetic-Notes" hat zwar einen Superseded-Banner (Z.277), aber der Header-Verweis am Anfang ist ein toter Link.
**Why Strong:** Style-Guide ist Pflichtlektüre — Phase-Verweis auf nicht-existentes File untergräbt Vertrauen + Onboarding.
**Suggested Fix:** Z.5 ersetzen durch `> Phase: Nova-2 ✅ shipped, lebt weiter in Nova-3+. Pivot 2026-05-20: R3F verworfen (siehe ADR-0004), Stack ist SVG (Landing) + PixiJS (Workspace).` Optional: Sektion 8 als ganzes löschen statt nur supersedet markieren (die Referenz für „eventuelle Migration" ist 2026-05-21 nicht mehr load-bearing).

---

### [Mid] FN-04 — `pricing/page.tsx:203` verkauft noch "drift-checks" (ADR-0003 Cleanup-Leak)
**File:** `apps/web/src/app/pricing/page.tsx:203`
**Issue:** Marketing-Copy enthält `Ideal for nightly drift-checks and ...`. ADR-0003 Final-Cleanup-Annex (2026-05-21) sagt: `Kein bekannter dead-weight-Rest mehr.` Falsch — die Pricing-Copy verkauft ein gedropptes Feature noch.
**Why Mid:** Bait-and-Switch-Risiko (Customer kauft Plan für "drift-checks", die nicht existieren). ADR-0003-Annex-Statement ist damit falsch.
**Suggested Fix:** Pricing-Copy Z.203 umtextieren (z.B. `Ideal for scheduled multi-repo audits and ...`). ADR-0003 Annex um diese 8. Stelle erweitern oder Annex-Statement weichzeichnen.

---

### [Mid] FN-05 — `docs/changelog.md` führt `Phase Future` aber Nova-3 ist aktiv
**File:** `docs/changelog.md:123-125`
**Issue:** Letzte Sektion sagt `## Phase Future (offen)` und `Kein aktiver Plan. Themen-Backlog im TODO.md Parking-Lot.`. Realität: Nova-3 ist aktiv und in Review.
**Why Mid:** Changelog ist Top-Down-Lesefluss — "Phase Future (offen)" suggeriert kein aktiver Plan, während `nova-3-repo-polish-and-prod-prep.md` existiert und im Review steht.
**Suggested Fix:** Neue Sektion `## Phase Nova-3 (🟡 in Review)` oberhalb von "Phase Future" einfügen, mit Plan-Verweis. ODER `Phase Future` umbenennen zu `Phase Nova-3+ (offen)` und Verweis auf den aktiven Nova-3-Plan ergänzen.

---

### [Mid] FN-06 — `CLAUDE.md` "Cache: Vercel Runtime Cache + Redis (dev)" — Redis nicht im Code
**File:** `.claude/CLAUDE.md:39`
**Issue:** Tech-Stack-Zeile sagt `Cache: Vercel Runtime Cache + Redis (dev)`. Code-Realität:
- `unstable_cache` aus `next/cache` ist überall verwendet (`apps/web/src/lib/dal/galaxie.ts:2`, `lib/cache-tags.ts`).
- Redis steht im `docker-compose.yml` als Service, aber `grep -rn "redis|ioredis" packages/ apps/` findet 0 Client-Calls.
- Kein `REDIS_URL` in `.env.example` aktiv genutzt.

**Why Mid:** Tech-Stack-Tabelle ist eine Pflicht-Lese-Sektion bei jedem `/plan`-Run — Redis als "dev cache" zu listen suggeriert ein Cache-Setup, das nicht existiert.
**Suggested Fix:** Cache-Zeile auf `Next 16 unstable_cache + revalidateTag (cache-tags.ts Helpers)` ändern. Redis komplett rauslassen, ODER aus `docker-compose.yml` rauswerfen (parallele Action in Nova-3 Audit).

---

### [Mid] FN-07 — `CLAUDE.md` listet `phase-0-history.md` ohne Sub-Folder-Kontext
**File:** `.claude/CLAUDE.md:64`
**Issue:** "Wo finde ich was"-Sektion sagt `docs/plans/done/ ... Sub-Ordnern (galaxie/, nova/, homepage-relaunch/, landing/) + phase-0-history.md`. Aktuell existieren in `docs/plans/done/` flach:
- `customer-route-rename.md`
- `phase-0-history.md`
- `refactor-minimal-context.md`
- `repo-health-and-workflow-overhaul.md`
- `saas-pricing-redesign.md`
- `saas-pricing-sub-a-db-metering.md`
- `saas-pricing-sub-b-stripe-credits.md`
- `saas-pricing-sub-c-ui-compliance.md`
- `workspace-route-consolidation.md`

5 Sub-Plan-Files (3× saas-pricing + 2× refactor/route) liegen auf der Top-Ebene statt in einem `pricing/`- oder `refactor/`-Subfolder. Pattern-Drift gegen die Sub-Folder-Konvention.

**Why Mid:** Nicht falsch (Konvention erlaubt flat) — aber inkonsistent mit der `galaxie/`/`nova/`/`landing/`/`homepage-relaunch/`-Pattern. Mit 5+ Files auf Top wird `done/` unübersichtlich.
**Suggested Fix:** Entweder einen `pricing/`-Subfolder anlegen und die 4 SaaS-Pricing-Files dort hineinverschieben (passend zu `feedback_phase_pacing.md`-Pattern), oder CLAUDE.md-Sub-Folder-Liste explizit erweitern um „Sub-Plans ohne Phase-Bucket liegen flach".

---

### [Mid] FN-08 — `docs/changelog.md` enthält 4 SaaS-Pricing-Blöcke ohne aggregierten Phasen-Wrapper
**File:** `docs/changelog.md:7-72`
**Issue:** Die ersten 4 Sektionen (Email-Polish, Sub-C, Sub-B, Sub-A) sind alle aus dem SaaS-Pricing-Master und gehören logisch zur selben Phase. Aktuell stehen sie als 4 separate Top-Level-Phasen. Phase Repo-Health (Z.74) ist eine eigene Phase, das ist OK — aber 4× SaaS-Pricing zeigt: ein Phasen-Wrapper für "SaaS-Pricing Master+Subs" mit den 4 Bullet-Items wäre lesbarer.
**Why Mid:** Skalierungs-Problem: bei jedem Sub-Plan einen Top-Level-Block schafft Visual-Bloat. Changelog-Konvention sagt "Pro Phase ein Block" (Z.3).
**Suggested Fix:** Vier Blöcke in 1 Block `## Phase SaaS-Pricing-Redesign (✅ 2026-05-21)` mergen mit 4 Sub-Sektionen (Email-Polish / Sub-C / Sub-B / Sub-A). Master-Plan + Sub-Plans als Verweise. Refactor erhält Format-Konsistenz.

---

### [Weak] FN-09 — `roadmap/phase-nova-2.md` erwähnt Nova-3 noch nicht
**File:** `docs/roadmap/phase-nova-2.md:34-37`
**Issue:** Sektion "Was als Nächstes ansteht" listet 3 Themen-Bullets aber kein Nova-3-Plan-Verweis. Nova-3-Plan existiert jetzt.
**Why Weak:** Roadmap ist Schreib-Lese-Lopp, ein Update bei Phase-Drift ist Konvention. Nicht falsch, nur überholt.
**Suggested Fix:** Z.34 Bullet hinzufügen: `- Nachfolge-Phase: docs/plans/nova-3-repo-polish-and-prod-prep.md (🟡 In Review)` + ggf. Status-Block am Anfang annotieren.

---

### [Weak] FN-10 — `operations/stripe-go-live.md:108` zeigt auf Linear-Triage-Flow der nicht existiert
**File:** `docs/operations/stripe-go-live.md:108-110`
**Issue:** Open-Item-Bullet sagt `Auto-fix in the reconcile cron (currently detection-only) — only enable when drift incidents land in a Linear/Linear-equivalent triage flow.` Kein Linear/Issue-Tracker im Repo eingerichtet — daher unklar wann das Item adressiert wird.
**Why Weak:** Open-Item ist V2, kein Blocker. Aber „when X happens" ohne X-Spec ist non-actionable.
**Suggested Fix:** Re-Open-Trigger explizit machen (z.B. `wenn ≥3 drift-Incidents in 30 Tagen via reconcile-Cron-Log auftauchen` oder `wenn Customer-Beschwerde wegen Marge-Drift kommt`).

---

### [Weak] FN-11 — `vision.md:152` "Aktuelle Sprint-Tasks → TODO.md" passt nicht zu Plan-First-Workflow
**File:** `docs/vision.md:144-152` (Source-of-Truth-Anker-Tabelle)
**Issue:** Tabelle sagt `Aktuelle Sprint-Tasks? → TODO.md`. CLAUDE.md-Workflow-Section sagt aber: aktuelle Sprint-Tasks leben in `docs/plans/<slug>.md`. TODO.md ist eher Parking-Lot/Ideen, was sie auch selbst Z.3 sagt: `Volatile. Source-of-Truth ist .claude/CLAUDE.md + docs/roadmap/ + docs/plans/.`
**Why Weak:** Self-contradiction zwischen den Files. TODO.md sagt selbst, sie ist NICHT Source-of-Truth, vision.md sagt sie IST Source-of-Truth für Sprint-Tasks.
**Suggested Fix:** Zeile umändern auf `Aktuelle Sprint-Tasks? → docs/plans/<slug>.md`. TODO.md-Zeile separat: `Idea-Capture & Backlog? → TODO.md (volatile)`.

---

## Plan-Folder-Hygiene Check

### Active plans (`docs/plans/*.md`, NICHT done/)

| File | Status | Active? |
|------|--------|---------|
| `nova-2-a11y-deep-sweep.md` | 🟡 In Review · Sub-Plan zu nova-2 Phase 7 | Yes (Backend-Gap, parallel zu Nova-3) |
| `nova-2-live-audit-flow.md` | 🟡 In Review · Sub-Plan zu nova-2 Phase 4 | Yes (Backend-Gap) |
| `nova-2-settings-backend.md` | 🟡 In Review · Sub-Plan zu nova-2 Phase 5 | Yes (Backend-Gap) |
| `nova-3-repo-polish-and-prod-prep.md` | 🟡 In Review | Yes (Aktive Hauptphase) |
| `production-live-connect-stub.md` | 🔵 Out-of-Scope (Skelett) | Skeleton — clear Note `NICHT direkt mit /execute starten` |

Alle 5 aktiven Pläne haben sauberen Status-Header. Keine Waisen. ✅

### Done plans status hygiene

Alle 27 Plans in `docs/plans/done/**/*.md` haben `✅ Done` / `🟢 Approved` / `🟢 Code Complete` als Status. Konsistent.
- 1 Plan hat `🟢 Approved` statt `✅ Done` (`master-vision-galaxie.md`) — historisch akzeptabel.
- 2 Plans haben `🟢 Code Complete + Smoke-Tested` (`frontend-relaunch-v2.md`, `homepage-relaunch.md`) — User-side manuelle Tests pending. Akzeptabel laut Execute-Anti-Pattern §6.

---

## CLAUDE.md-Drift-Matrix

| Claim in CLAUDE.md (Zeile) | Actually in Repo? | Severity |
|-----------------------------|--------------------|----------|
| L9 "Aktive Phase: Nova-2 · Full-Product ✅ shipped (Shell)" | ❌ Aktive Phase ist Nova-3 + SaaS-Pricing shipped seither | **KILL (FN-01)** |
| L13-20 Nova-2-Shipped-Auflistung | ✅ Korrekt, deckt sich mit changelog + done/nova/ | OK |
| L22-25 "3 Sub-Pläne in Review" | ⚠ Veraltet — Master ist jetzt Nova-3 | Strong (Teil FN-01) |
| L34 "Monorepo: Turborepo + pnpm" | ✅ `package.json` confirms | OK |
| L35 "Next.js 16 + App Router + Cache Components" | ✅ `apps/web/package.json:44` next ^16.2.6 | OK |
| L36 "PixiJS v8 + @pixi/react (legacy)" | ✅ Confirmed pixi.js@8.18.1, pixi-react@8.0.5; @react-spring/@xyflow nicht installiert | OK |
| L37 "Better-Auth 1.6 + Magic-Link" | ✅ Confirmed, eigene workspace+membership-Tables (ADR-0006) | OK |
| L38 "Neon Postgres + Drizzle + pgvector" | ✅ drizzle-orm@0.45.2 in deps | OK |
| L39 "Vercel Runtime Cache + Redis (dev)" | ❌ Code nutzt `unstable_cache`; Redis steht in compose, aber 0 Client-Use | **Mid (FN-06)** |
| L40 "Stripe direkt + Stripe Tax" | ✅ stripe@22.1.1, Webhook-Pattern in `architecture.md:8`, stripe-go-live.md vorhanden | OK |
| L41 "Inngest Cloud + Cron" | ✅ inngest@4.4.0; `packages/inngest/src/functions/` mit Cron-Jobs | OK |
| L42 "@ai-sdk/anthropic primary, @ai-sdk/openai opt-in" | ✅ Beide installiert in `packages/llm/package.json`, ADR-0005 dokumentiert | OK |
| L43 "Resend (prod via nodemailer-SMTP)" | ✅ `packages/auth/src/emails/sender.ts` + secrets-rotation.md | OK |
| L52 "packages/db/ Drizzle-Schema" | ✅ exists | OK |
| L53 "packages/audit/ 5 deterministisch + 1 LLM" | ✅ 5× `packages/audit/src/rules/*.ts` + 1× `packages/llm/src/rules/conflicting-rules.ts` | OK |
| L54 "packages/parser/ AGENTS.md / CLAUDE.md / SKILL.md Parser" | ✅ `packages/parser/src/scan.ts` listet alle | OK |
| L55 "packages/billing/ Stripe-Tier-Definitionen" | ✅ exists | OK |
| L62 "docs/adrs/NNNN-*.md Decision-Log" | ✅ 0001–0008 lückenlos | OK + Exceptional |
| L65 "docs/audits/YYYY-MM/" Konvention | ✅ `docs/audits/2026-05/` existiert mit 9 Reports | OK |
| L97-109 Constraints (Severity, AI-Calls, etc.) | ✅ Severity-Bänder in `packages/core/src/severity.ts:1-7`, AI-Calls via direct SDKs | OK + Exceptional |

---

## ADR-Continuity Audit

| ID   | Title                                                    | Status                                       | Cross-Refs valid? |
|------|----------------------------------------------------------|----------------------------------------------|-------------------|
| 0001 | Customer-Schema (Echte Tabelle, C2)                      | ✅ Accepted (2026-05-19)                     | ✅ Plan-Verweise valid (gehört zu galaxie/done) |
| 0002 | UI-Render-Stack — PixiJS v8                              | ✅ Accepted-Partial · Superseded-Partial 0004 | ✅ ADR-0004-Verweis valid |
| 0003 | Drop Repo-Compare Feature                                | ✅ Accepted (Final-Cleanup-Annex 2026-05-21) | ⚠ Annex-Statement "kein dead-weight-Rest mehr" widerlegt durch FN-04 (pricing-page.tsx:203) |
| 0004 | Landing-Hero auf SVG + motion                            | ✅ Accepted (2026-05-20) · Supersedes-Partial 0002 | ✅ ADR-0002-Verweis valid |
| 0005 | LLM Multi-Provider                                       | ✅ Accepted (2026-05-21)                    | ✅ |
| 0006 | Workspaces in eigener Drizzle-Tabelle                    | ✅ Accepted (post-hoc 2026-05-21)           | ✅ |
| 0007 | Credit-System + Quick/Deep-Intensity                     | ✅ Accepted (2026-05-21)                    | ✅ Verweis auf ADR-0005, 0008 |
| 0008 | BYOK-Key-Encryption (AES-256-GCM)                        | ✅ Accepted (2026-05-21)                    | ✅ Verweis auf ADR-0007 |

**ADR-Format-Konsistenz:** Alle 8 ADRs nutzen das `id/title/status/date` YAML-Frontmatter. Alle 8 haben Sektionen `Kontext` / `Optionen` (oder `Entscheidung`) / `Konsequenzen` (positiv+negativ) / `Re-Open-Trigger`. **Exceptional Pattern.**

**Supersession-Chain:** ADR-0002 ↔ ADR-0004 via `supersedes-partial:` / `superseded-by-partial:` Frontmatter-Key. Sauber dokumentiert. **Exceptional Pattern.**

---

## README-Hygiene

| File | Status |
|------|--------|
| `README.md` (root) | ✅ Aktuell. Doc-Architektur-Tabelle stimmt. Stack-Zeile listet Anthropic-SDK (nicht aktualisiert um OpenAI-Opt-in, ABER bewusst, weil primary). |
| `CONTRIBUTING.md` | ✅ Aktuell. Verweist auf aktive Phase via CLAUDE.md (gut: nicht hardcoded auf Nova-2). |
| `SECURITY.md` | ✅ Aktuell. Severity-Bänder-Konvention durchgängig. |
| `docs/audits/2026-05/README.md` | ✅ Aktuell. Index-Tabelle mit 8 Audits + KILL-Liste. **Exceptional Pattern.** |
| Sub-Folder-README in `done/galaxie`, `done/nova`, `done/homepage-relaunch`, `done/landing` | ✅ alle 4 existieren (Stub-Files) |
| Package-READMEs (`packages/<pkg>/README.md`) | ⚠ **Existieren nicht** — Audit-6 (packages-health.md) findet 0 READMEs in packages/. Mid-Severity dort, hier nur Hinweis. |
| `apps/web/README.md` | ⚠ Existiert nicht. Nicht KILL — root-README deckt alles ab. |

---

## Operations-Docs Audit

| File | Status |
|------|--------|
| `deploy.md` | ✅ Aktuell. Verweist auf ADR-0005. Pixi-SSR-Hinweis korrekt. Phase Future Monitoring-Sektion explizit als TBD markiert. |
| `secrets-rotation.md` | ✅ Aktuell. Listet alle Secrets aus `.env.example`. ADR-0005-Verweis valide. BYOK-Encryption-Key fehlt allerdings als eigener Eintrag (siehe ADR-0008). |
| `stripe-go-live.md` | ✅ Aktuell. Verweis auf Sub-Plan-C valid. 1 Weak (FN-10). |
| `transfer-impact-assessment.md` | ✅ Aktuell. Verweis auf saas-pricing-redesign.md valid (Master ist done, Anwalts-Review explizit out-of-scope). |

**Lücke:** `BYOK_ENCRYPTION_KEY` fehlt in `secrets-rotation.md` als separate Sektion. ADR-0008 sagt `Key-Rotation-Procedure: TBD, gehört in docs/operations/byok-key-rotation.md`. Datei existiert nicht. **Mid-Severity, deferred items im Sub-Plan-C.**

---

## .claude/-Konstruct Audit

| File | Status |
|------|--------|
| `.claude/CLAUDE.md` | ⚠ Phase-Drift (FN-01) + Cache-Drift (FN-06) |
| `.claude/commands/plan.md` | ✅ 13-Sektionen-Skelett konsistent zu CLAUDE.md-Workflow §1-4. Recommended-Option-Pflicht dokumentiert. |
| `.claude/commands/execute.md` | ✅ Pre-Flight + Block-Resolver + Dev-Server-Auto-Start passt zu CLAUDE.md-Workflow §4. |
| `.claude/agents/` | Existiert nicht — laut CLAUDE.md-Constraint "Keine neuen Agents ohne explizite Anfrage". ✅ OK |
| `.claude/skills/` | Existiert nicht — laut CLAUDE.md-Constraint "Keine neuen Skills ohne explizite Anfrage". ✅ OK |
| `.claude/settings*.json` | Existiert nicht — Solo-Dev, OK. |
| `AGENTS.md` (root) | Nicht vorhanden. Repo nutzt CLAUDE.md statt AGENTS.md. ✅ konsistent. (Parser unterstützt beide, aber als Beispiel-Inputs in `examples/sample-*/AGENTS.md`.) |

---

## Audit-Folder-Hygiene

`docs/audits/2026-05/` enthält 9 Files (8 Reports + 1 README). Index-Konvention mit KILL-Listen + Severity-Bändern ist **Exceptional**. Diese Audit-Datei (Sub-10) erweitert das nach Nova-3 Phase 0.

---

## Exceptional Patterns (positive Findings)

### EX-01 — ADR-System mit Supersession-Chain via Frontmatter
ADR-0002 ↔ ADR-0004 nutzen `supersedes-partial:` / `superseded-by-partial:` als YAML-Frontmatter-Keys. Cross-Refs werden im Body wiederholt. Macht Discovery für künftige Refactors trivial — keine "warum ist X so?"-Suche nötig.

### EX-02 — Severity-Bänder als geteilte Konvention zwischen Code + Doc
`packages/core/src/severity.ts:1-7` exportiert `SEVERITY_BANDS = ["Kill","Weak","Mid","Strong","Exceptional"]` als type-safe enum. CLAUDE.md, ADR-0001, ALL audit-reports nutzen dieselbe Reihenfolge. **Doc ↔ Code-Sync ist hier vorbildlich** — eine seltene Konvention.

### EX-03 — Phase-Audit-Reports persistiert mit `docs/audits/YYYY-MM/`-Konvention
`docs/audits/2026-05/` enthält 8 Vorgänger-Reports + dieser hier. Index-README mit Hot-Findings-Tabelle + KILL-Liste + Methodologie. **Lässt sich für Phase Nova-3 (= Phase 0 dieses Plans) sauber wiederverwenden.** Reuse-Patterns-Hygiene.

---

## Adressierungs-Empfehlung (Priorität für Nova-3 Phase 1)

| # | Finding | Effort | Cleanup-Slot |
|---|---------|--------|--------------|
| 1 | FN-01 CLAUDE.md Phase-Drift | ~10min | Nova-3 Phase 1.1 |
| 2 | FN-02 TODO.md veraltet | ~10min | Nova-3 Phase 1.1 |
| 3 | FN-03 linear-aesthetic.md Z.5 Toter Link | ~2min | Nova-3 Phase 1.1 |
| 4 | FN-04 pricing/page.tsx drift-Leak | ~5min | Nova-3 Phase 1 (Cleanup-Sweep) |
| 5 | FN-05 changelog Phase-Future | ~5min | Nova-3 Phase 1.1 |
| 6 | FN-06 CLAUDE.md Cache-Drift | ~5min | Nova-3 Phase 1.1 |
| 7 | FN-07 done/-Sub-Folder-Inkonsistenz | ~15min | Optional V2 (kein Blocker) |
| 8 | FN-08 changelog SaaS-Block-Merge | ~10min | Optional V2 (kein Blocker) |
| 9 | FN-09 roadmap Nova-3-Verweis | ~3min | Nova-3 Phase 1.1 |
| 10 | FN-10 stripe-go-live Linear-Spec | ~5min | Deferred |
| 11 | FN-11 vision.md TODO.md-Anker | ~3min | Nova-3 Phase 1.1 |

**Geschätzter Gesamt-Cleanup-Aufwand:** ~70min. Alles in 1 Cleanup-Step bündelbar.

---

## Out-of-Scope für diesen Audit (nicht Domain Sub-10)

- Package-READMEs fehlend → Audit Sub-06 (packages-health) verantwortlich
- `lucide-react@1.x` Major-Suspekt → Audit Sub-04 (tech-stack-drift)
- Settings-Backend-Shells → Audit Sub-07 (settings-backend)
- TypeScript-Lint-Setup fehlt → Audit Sub-05 (tests-eval-ci)
