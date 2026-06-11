# Pre-Launch Second-Opinion Audit — Master-Prompt-Pack

> **Status:** 📋 Ready to run — 2026-06-10 (Confidence-At-Start: **High** · 2 Discovery-Runden · 3 Prep-Subagenten · keine offenen Load-Bearing-Fragen)
>
> **Was das ist:** Kein Feature-Plan zum `/execute`. Dies ist ein **Prompt-Pack** — eine Sammlung copy-paste-fertiger Anweisungen, die du in **frischen Claude-Sessions (Modell: Fabel 5)** startest, um vor dem Go-Live einen unabhängigen, belastbaren Voll-Audit deines Repos zu fahren. Der Plan selbst ist die Single-Source: jede Audit-Session liest die relevanten Sektionen hier und schreibt ihren Report nach `docs/audits/2026-06-second-opinion/`.

---

## §1 — Meta & Confidence

| Feld | Wert |
|------|------|
| Slug | `pre-launch-second-opinion-audit` |
| Erstellt | 2026-06-10 |
| Confidence-At-Start | **High** |
| Discovery-Runden | 2 (8 Fragen) |
| Prep-Subagenten | 3 (Audit-State-Map · Test-Infra-Inventar · Open-Source-Framework-Research) |
| Ziel-Modell für den Run | **Fabel 5 — ausschließlich** (kein Opus, kein Mid-Session-Fallback) |
| Deliverable des Runs | Priorisierter **Findings-Report mit Severity-Bändern** — **kein** Code-Change |
| Output-Ort | `docs/audits/2026-06-second-opinion/` (wird vom Run angelegt) |

**Warum High:** Alle load-bearing Entscheidungen (Output-Form, Verhältnis zum Erst-Audit, Verifikations-Modell, Test-Tiefe, Scope-Breite, Modell-Pinning) sind durch zwei Discovery-Runden fixiert; die Audit-Dimensionen + False-Positive-Technik sind durch externe Frameworks (OWASP ASVS/WSTG, Google SRE PRR, Stripe Go-Live, 12-Factor, web.dev, Chain-of-Verification) geerdet; der Ist-Zustand (vorhandene Audits, Test-Infra, bekannte offene Kills) ist inventarisiert.

---

## §2 — Discovery: User-Entscheidungen-Audit-Trail

**Runde 1:**
| Frage | Antwort |
|-------|---------|
| Output des Runs? | **Findings-Report mit Severity-Bändern, kein Code-Change** — User triagiert danach selbst und gibt gezielt `/execute`. |
| Verhältnis zum Erst-Audit (14-Subagent-Launch-Verify)? | **Frischer, unabhängiger Zweit-Audit** — bewusst blind, als echte Second-Opinion; danach Abgleich. |
| Meta-Loop „Claude analysiert/verbessert es nochmal separat"? | **Adversariale Verifikation im Prompt eingebaut** — zweiter Pass muss jede Finding aktiv widerlegen, bevor sie zählt (Default = verworfen bei Zweifel). |
| Run-Struktur wegen Limit? | (User redirektet auf Modell-Frage → in R2 geklärt; Struktur-Entscheidung an Claude delegiert → **Domänen-Session-Chunkung**.) |

**Runde 2:**
| Frage | Antwort |
|-------|---------|
| Modell-Pinning? | **„Fabel 5 heißt das neue Modell — nur das!"** → Run läuft ausschließlich auf Fabel 5, kein Opus, kein Fallback. |
| Test-Tiefe? | **Statisch + gezielt dynamisch** — tiefes Code-Lesen über alle Domänen PLUS gezielte Ausführung (Test-Suite, eval, `stripe trigger`, Dev-Smoke, typecheck/lint/build). Kein Playwright (Env tot). |
| Scope-Breite? | **Alle 12 Dimensionen, Severity streng nach „blockt das den Launch?"** — Post-Launch-Deferred wird notiert, nicht vertieft. |

**Von Claude entschieden (delegiert):**
- **Struktur = 7 Domänen-Sessions + 1 Synthese-Session**, jede einzeln limit-tauglich, resumierbar, auf Fabel 5 gepinnt.
- **Output-Ort** = `docs/audits/2026-06-second-opinion/` (Sibling zum Erst-Audit `2026-06-launch-verify/`, Repo-Konvention).
- **Protokoll lebt einmal hier (§7.0)**, jede Session liest es — DRY + limit-schonend (kein 8×-Duplikat im Paste).

---

## §3 — Problem & Ziel

**Problem:** Vor dem GA-Launch für zahlende DACH-B2B-Kunden auf eigener Domain braucht Kolja ein *belastbares* Gewissen, dass Frontend, Backend, Security, Payment, Daten, Legal & Betrieb tragen. Es gibt zwei interne Audits (Mai-Nova-3, Juni-Launch-Verify) — aber die haben einen blinden Fleck: sie kennen ihre eigenen Annahmen. Ein **unabhängiger Zweit-Audit** ohne Vorab-Wissen über die alten Findings fängt Confirmation-Bias und Lücken.

**Ziel:** Ein reproduzierbarer Audit-Lauf, der
1. ausschließlich auf **Fabel 5** läuft,
2. in **limit-feste Domänen-Sessions** zerlegt ist (jede einzeln startbar, abbruch-resistent),
3. jede Finding **adversarial verifiziert** (Chain-of-Verification → niedrige False-Positive-Rate),
4. jede Finding mit **Evidenz** belegt (`file:line` + Snippet + Exploit-/Impact-Pfad),
5. in einen **priorisierten Go-Live-Blocker-Report mit Severity-Bändern** mündet,
6. **keinen Code anfasst** — Kolja triagiert und gibt danach gezielt `/execute`.

**Nicht-Ziel:** Fixes umsetzen · Test-Infra bauen · die alten Audits ersetzen (sie bleiben als Vergleichsbasis).

---

## §4 — Existing Patterns (worauf der Run aufsetzt)

- **Severity-Bänder** {Kill · Weak · Mid · Strong · Exceptional} = Repo-Konvention für alle Audit-Outputs. Der Run nutzt exakt diese, plus ein binäres `go-live-blocker: yes/no`.
- **Audit-Persistenz-Muster:** `docs/audits/YYYY-MM/_synthesis.md` + Einzeldateien (siehe `docs/audits/2026-06-launch-verify/`, `docs/audits/2026-05/_synthesis.md`).
- **Test-/Quality-Infra (vom Prep-Agent inventarisiert):**
  - Vitest: `pnpm test` (46 Unit), `pnpm test:integration` (+4 Integration, braucht Stack), Config `vitest.config.ts` (Projects `unit`/`integration`, MSW-Mocks).
  - Eval-Gates: `pnpm eval` (golden-set), `pnpm eval:conflicts` (LLM-FPR, braucht `ANTHROPIC_API_KEY`).
  - Statik: `pnpm typecheck`, `pnpm --filter @vk/web lint`, `pnpm --filter @vk/web build`.
  - Stack/E2E: `pnpm stack:up`, `pnpm db:migrate`, `pnpm e2e:smoke` (Docker-Roundtrip-Health, **kein** Browser-E2E).
  - Stripe: `pnpm stripe:setup-test` (Test-Mode-Bootstrap), `stripe trigger <event>`.
  - CI-Gates: `.github/workflows/ci.yml` (gates · integration · lighthouse · conflict-eval), Pre-Commit `.husky/pre-commit` (typecheck + lint).
  - **Bare (0 Tests):** UI-Components · Browser-E2E (Playwright nicht verdrahtet) · Email-Flow · Invoice-Lifecycle · axe-core. **LHCI-Token fehlt.**
- **Bekannte offene Kills (Erst-Audit, NICHT erneut „entdecken" — als Known-Issues in §7.0 gelistet):** Auth-IDOR `customers.ts`, Stripe `invoice.paid`-Credit-Grant, Auto-Overage, Migration-in-buildCommand, Galaxie-Kontrast/Marker (teils durch 3-Farben-Overhaul erledigt — verifizieren!), Scan-Detail-Seite, Impressum/Datenschutz fehlend, Member-Invite-Mail, GitHub-URL-Audit-Timeout.
- **⚠️ Bekannter Build-Blocker:** Letzter Commit `da0babb` loggt einen „discovered prod-build blocker" — der Run muss `pnpm --filter @vk/web build` real ausführen und den Status verifizieren.
- **⚠️ Migration 0018** (`finding.file_path`/`file_kind`) laut Memory noch nicht auf Prod-DB — S3 prüft Migrations-Drift explizit.

---

## §5 — Design des Audit-Harness

```
                         ┌─────────────────────────────────────────────┐
                         │  §7.0  SHARED AUDIT PROTOCOL  (eine SSOT)    │
                         │  Threat-Model · Evidenz-Pflicht · Severity ·│
                         │  CoVe-Verifikation · Known-Issues · Output  │
                         └─────────────────────────────────────────────┘
                                          │ jede Session liest es
   ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
   │  S1  │  S2  │  S3  │  S4  │  S5  │  S6  │  S7  │   ← 7 Domänen-Sessions
   │ Auth │ Pay  │  DB  │ Flows│ Web  │ FE/  │Legal/│     (je 1 frische Fabel-5-Session,
   │      │      │      │ /Jobs│ Hard │a11y/ │Email │      einzeln limit-fest, resumierbar)
   │      │      │      │      │ /Sec │ Perf │      │
   └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴──┬───┘
      │      │      │      │      │      │      │  jede schreibt SX-*.md
      ▼      ▼      ▼      ▼      ▼      ▼      ▼
   docs/audits/2026-06-second-opinion/S1..S7-*.md
                                          │
                                          ▼
                         ┌─────────────────────────────────────────────┐
                         │  S8  SYNTHESE & CROSS-CUTTING + COMPLETENESS │
                         │  liest alle SX-*.md → dedupe · re-judge ·    │
                         │  cross-cutting Muster · „was fehlt?"-Kritik  │
                         │  → _synthesis.md (priorisierte Blocker-Liste)│
                         └─────────────────────────────────────────────┘
```

**Pro Session, intern (im Shared Protocol §7.0 fest verdrahtet):**
1. **Threat-Model & In-Scope-Annahmen zuerst benennen** (False-Positive-Killer #1).
2. **Read-only Deep-Trace** der echten Ausführungspfade (nicht skimmen).
3. **Gezielte dynamische Checks** (pro Session in §7.SX gelistet).
4. **Findings draften** mit Evidenz-Pflicht.
5. **Adversariale Verifikations-Runde** (CoVe): jede Finding aktiv zu widerlegen versuchen; Default-Drop bei Zweifel; markieren `verified | refuted | uncertain`.
6. **Report schreiben** im Fixed-Template nach `docs/audits/2026-06-second-opinion/SX-*.md`.

**Limit-Robustheit:** Bricht eine Session ab, ist nur diese eine zu wiederholen — die anderen Reports liegen schon auf Platte. S8 läuft erst, wenn S1–S7 fertig sind (liest deren Dateien).

**Reihenfolge-Empfehlung (höchstes Launch-Risiko zuerst):** S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8. Du kannst aber jede Session unabhängig fahren.

---

## §6 — Deliverables & Run-Sequenz

**Dieser Plan liefert (jetzt, durch Claude):**
- [x] Den kompletten **Prompt-Pack** in §7 (Shared Protocol + 7 Domänen-Scopes + Synthese + Kickoff-Template).
- [x] Die **Severity-/Output-Spezifikation** (§9).
- [x] Die **Run-Anleitung + Acceptance** (§10).

**Der Audit-Run liefert (später, durch dich in Fabel-5-Sessions):**
- [ ] `docs/audits/2026-06-second-opinion/S1-auth.md` … `S7-legal-email.md` (7 Domänen-Reports).
- [ ] `docs/audits/2026-06-second-opinion/_synthesis.md` (priorisierte Go-Live-Blocker-Liste + Cross-Cutting + Completeness-Kritik).
- [ ] Optional: `_diff-vs-launch-verify.md` (Abgleich neu-vs-alt, von S8 erzeugt).

**So startest du jede Session (Kickoff-Template, §7.K):** eine 4-Zeilen-Paste pro Session, jede in einer **frischen Fabel-5-Session**.

---

## §7 — DER PROMPT-PACK

### §7.0 — SHARED AUDIT PROTOCOL (jede Session liest dies zuerst)

```
ROLLE
Du bist ein unabhängiger Senior Security-/Reliability-Auditor. Du führst einen
PRE-LAUNCH SECOND-OPINION AUDIT des ValidationKit-Monorepos durch. Du kennst die
internen Vor-Audits NICHT und sollst sie NICHT lesen — du bildest dir ein
eigenes, unabhängiges Urteil. Du bist skeptisch, evidenzgetrieben und vermeidest
Spekulation.

MODELL-GUARD (HART)
- Dieser Audit darf AUSSCHLIESSLICH auf dem Modell "Fabel 5" laufen.
- Nenne zu Beginn dein eigenes Modell in einer Zeile. Ist es NICHT Fabel 5:
  STOP, schreibe nichts, melde "Falsches Modell — erwartet Fabel 5" und brich ab.
- Spawnst du Subagenten, müssen sie ebenfalls Fabel 5 erben. Kein Opus, kein
  Fallback, kein Downgrade — auch nicht für Verifikation.

THREAT-MODEL & IN-SCOPE-ANNAHMEN (zuerst schreiben, vor jeder Suche)
Bevor du Code liest, schreibe explizit auf:
- Wer sind die Angreifer? (anonymer Web-User · authentifizierter Tenant-User ·
  böswilliges Mitglied einer anderen Organisation · kompromittierter API-Key)
- Was sind die Kronjuwelen? (Cross-Tenant-Daten · Stripe-Geldpfad · Auth-Tokens ·
  PII/DSGVO-Daten · Prod-DB-Integrität)
- Was ist EXPLIZIT out-of-scope? (siehe KNOWN-ISSUES & OUT-OF-SCOPE unten)
Threat-Model-Fehlausrichtung ist die #1-Quelle für False-Positives — diese
Annahmen sind dein Filter.

METHODE
1. READ-ONLY. Du veränderst KEINEN Produktivcode. (Reports schreiben ist erlaubt.)
2. Folge echten Ausführungspfaden (Request → Handler → DAL → DB → Response),
   nicht Datei-für-Datei-Skimming. Lies die wenigen Dateien eines Pfads ganz.
3. Führe die in deiner Session-Scope (§7.SX) gelisteten DYNAMISCHEN CHECKS aus
   und werte ihren Output als Evidenz. Kein Playwright (Env tot).
4. Für jede vermutete Finding: trace den konkreten Exploit-/Fehlerpfad. Wenn du
   den Pfad nicht bis zum Impact ziehen kannst, ist es KEINE Finding.

EVIDENZ-PFLICHT (härtester False-Positive-Filter)
Jede Finding MUSS enthalten:
- `file:line` (exakt) + ein zitierter Code-Snippet (≤8 Zeilen)
- den konkreten Impact-/Exploit-Pfad in 1–3 Sätzen (was kann ein Angreifer/
  welcher Laufzeitfehler passiert konkret?)
- Severity-Band + Confidence (low/mid/high)
Findings ohne nachvollziehbare Evidenz werden VERWORFEN, nicht abgeschwächt.

SEVERITY-RUBRIK (Repo-Konvention)
- Kill          = blockt Launch / Geldverlust / Cross-Tenant-Leak / Rechtsbruch.
- Weak          = ernst, aber nicht launch-blockend; bald fixen.
- Mid           = solide Verbesserung, neutral.
- Strong        = gut gelöst, nur Politur.
- Exceptional   = vorbildlich.
Zusätzlich pro Finding: `go-live-blocker: yes|no`. Jede Kill braucht eine
explizite Begründung, WARUM sie den Launch blockt.

ADVERSARIALE VERIFIKATION (Chain-of-Verification — Pflicht, NACH dem Draften)
Für JEDE gedraftete Finding, in einem separaten Pass:
- Formuliere 2–3 unabhängige Verifikationsfragen, die die Finding WIDERLEGEN
  würden ("Gibt es ein Guard weiter oben im Pfad? Ist der Wert serverseitig
  re-validiert? Ist der Pfad überhaupt erreichbar?").
- Beantworte sie gegen den echten Code.
- Default = VERWERFEN bei Zweifel. Markiere jede Finding final:
  `verification: verified | refuted | uncertain`.
- `refuted` → raus aus dem Report (optional als Anhang "geprüft & verworfen").
- `uncertain` → drin, aber Severity max. Weak + Confidence low + Notiz, was zur
  Klärung fehlt.
Wenn du Subagenten nutzt: ein Verifizierer-Agent pro Finding, dessen einzige
Aufgabe das Widerlegen ist (er darf NICHT bestätigen wollen).

KNOWN-ISSUES & OUT-OF-SCOPE (NICHT erneut melden — Rausch-Filter)
Diese sind dem Team bereits bekannt ODER bewusst aufgeschoben. Melde sie NUR,
wenn du einen NEUEN, anderen Aspekt findest, der über das Bekannte hinausgeht:
- Auth-IDOR in customers.ts (getRepo/listRepos/addRepo) — bekannt, Bundle A.
- Stripe invoice.paid liest entfernten invoice.subscription — bekannt, Bundle B.
- Auto-Overage allowOverage nicht durchgereicht — bekannt, Bundle B.
- DB-Migration im Vercel buildCommand ohne Advisory-Lock — bekannt, Bundle C.
- Impressum (§5 DDG) + Datenschutzerklärung (Art. 13 DSGVO) fehlen — bekannt, F.
- Member-Invite verschickt keine Email — bekannt, Bundle G.
- GitHub-URL-Audit ignoriert BACKGROUND_THRESHOLD (Timeout) — bekannt, Bundle J.
- Galaxie/Pixi ist RETIRED (2026-06-10) — kein Pixi-Code mehr; falls du Pixi-
  Referenzen findest = Dead-Code-Finding, nicht Funktions-Finding.
OUT-OF-SCOPE (nicht auditieren, höchstens 1 Zeile notieren):
- pgvector/Embeddings (nicht GA-Scope) · Marketing-Material · B2C-Cookie-Banner
  (DACH-B2B, 0 Analytics) · User-externe Tasks (Stripe-Live-KYC, Domain-Kauf,
  Sentry/Upstash-Provisioning, Impressum-Daten-Ausfüllen).

OUTPUT (Fixed-Template — siehe §9 des Plans)
Schreibe deinen Report nach docs/audits/2026-06-second-opinion/SX-<domain>.md
im Template aus §9. Eine Tabelle aller Findings oben, dann Detail-Blöcke. Keine
Prosa-Einleitung über 5 Zeilen. Am Ende: "Completeness self-check" — was hast du
NICHT erreicht/gelesen, welche Annahme ist unbestätigt?
```

---

### §7.S1 — Session 1: Auth, Session & Multi-Tenant Access-Control

```
SCOPE
Authentifizierung, Session-Lifecycle und vor allem MANDANTEN-ISOLATION. Höchste
B2B-SaaS-Bug-Klasse: IDOR (ein Org-Mitglied erreicht Daten einer anderen Org).
TARGETS (lies diese Pfade vollständig + folge ihren Aufrufern):
- packages/auth/** (Better-Auth-Setup, Magic-Link, Session, Workspace/Membership)
- apps/web/src/lib/session.ts, workspace-context*.ts, *-actions.ts (alle Server-
  Actions/DAL, die per workspaceId/userId scopen)
- apps/web/src/lib/customers.ts (+ alle Object-Fetch-Funktionen)
- apps/web/src/middleware.ts (Route-Gating)
- Account/Workspace/Membership-Delete-Flows + Cookie-Cleanup (vk_default_workspace_slug)
- GitHub-App-Webhook-Signatur + Replay (packages/github-app/**)
PRÜFE GEZIELT:
- Wird JEDER Object-Fetch serverseitig auf den authentifizierten Tenant gescoped?
  (nicht nur im UI gefiltert) — trace 5–10 DAL-Funktionen bis zur WHERE-Klausel.
- Privilege-Escalation: kann ein "member" Owner-Aktionen? Rollen-Checks server-
  seitig?
- Magic-Link-Token: single-use? kurze TTL? nicht in Logs/Referrer geleakt?
- Logout/Delete: invalidiert Sessions wirklich? in-flight Requests? Stale-Cookie?
- CSRF auf state-ändernden Server-Actions/Routes.
- GitHub-App-Webhook: Signatur verifiziert? Replay-Schutz?
DYNAMISCHE CHECKS:
- `pnpm typecheck` (Auth-Pakete sauber?)
- grep nach Object-Fetches ohne workspaceId/userId-Filter; liste Verdächtige.
- Wenn lokaler Stack läuft: `pnpm test` (Auth-/workspace-context-Tests grün?).
Befolge §7.0 (Threat-Model, Evidenz, CoVe-Verifikation, Known-Issues, Output).
Report → docs/audits/2026-06-second-opinion/S1-auth.md
```

### §7.S2 — Session 2: Payments & Credit-Ledger-Integrität

```
SCOPE
Stripe-Geldpfad und die interne Credit-Ledger-Buchhaltung. Geldverlust ODER
Doppel-Belastung = automatisch Kill.
TARGETS:
- apps/web/src/app/api/stripe/webhook/route.ts (alle Event-Handler)
- apps/web/src/lib/credits.ts, audit-action.ts (Credit-Reservierung/-Verbrauch)
- packages/billing/** (Tiers, Metering, Overage, BYOK-Crypto)
- Stripe-Setup-Script (pnpm stripe:setup-test) + Meter-Idempotenz
PRÜFE GEZIELT:
- Webhook-Idempotenz: tolerieren die Handler Duplikate / Out-of-Order / verspätete
  Events? (Stripe garantiert keine Reihenfolge.)
- Credit-Ledger-ATOMIZITÄT/TOCTOU: wird Credit VOR dem teuren LLM-Call reserviert
  oder danach? Gibt es ein SELECT ... FOR UPDATE / Transaktions-Guard gegen
  Double-Spend bei nebenläufigen Audits? Trace runForegroundAudit + Monats-Grant.
- Werden ALLE Stripe-Fehlertypen defensiv behandelt (nicht nur die häufigen)?
- Live-Mode-Parität: werden Products/Prices/Meter in Live-Mode mit passenden IDs
  erwartet? Hardcodes, die in Live brechen?
- Eigenes Backup-Logging jeder Charge?
DYNAMISCHE CHECKS (Geld = hier lohnt sich dynamisch):
- `pnpm test` (Billing-Unit-Tests) + falls Stack: `pnpm test:integration`
  (stripe/webhook.integration.test grün?).
- Stripe-CLI vorhanden? Dann `stripe trigger invoice.paid`,
  `stripe trigger customer.subscription.updated` gegen den lokalen Webhook
  forwarden und beobachten, ob der Monats-Credit-Grant WIRKLICH bucht
  (der Erst-Audit fand das nur per Code-Review, nie live).
Befolge §7.0. Report → docs/audits/2026-06-second-opinion/S2-payments.md
```

### §7.S3 — Session 3: Data-Layer, DB-Schema & Migrationen

```
SCOPE
Drizzle-Schema, Migrations-Integrität, Transaktions-Isolation, Injection,
Daten-Integrität.
TARGETS:
- packages/db/** (Schema, Migrationen, Drizzle-Client/Pooling)
- migrate.ts + vercel.json buildCommand (Migration-im-Build?)
- Alle raw-SQL-Stellen (grep sql`...` / db.execute) — Injection-Risiko?
- Cascade-/onDelete-Verhalten an FKs; verwaiste Rows möglich?
PRÜFE GEZIELT:
- Migrations-DRIFT: stimmt das Schema im Code mit den Migrationen überein? Gibt es
  unangewendete Migrationen? (Memory-Hinweis: Migration 0018 finding.file_path/
  file_kind evtl. nicht auf Prod — verifiziere im Migrations-Ordner + Schema.)
- Transaktions-Isolation an Geld-/Credit-/Membership-Mutationen (Double-Spend,
  Lost-Update).
- Fehlende Unique-/Partial-Indizes (z.B. pending-Membership (workspace_id,user_id)).
- Parametrisierung: alle Queries via Drizzle-Builder? raw-SQL mit User-Input?
- N+1 / fehlende Indizes auf Hot-Paths.
DYNAMISCHE CHECKS:
- `pnpm db:migrate` gegen Test-DB (falls Stack) — laufen alle Migrationen sauber?
- Drizzle-Schema-vs-Migration-Abgleich (generate --dry / Diff prüfen, ohne zu
  committen).
Befolge §7.0. Report → docs/audits/2026-06-second-opinion/S3-data-db.md
```

### §7.S4 — Session 4: Backend-Flows, Background-Jobs & Observability

```
SCOPE
Die Kern-Flows (Audit-Pipeline), Inngest-Background-Jobs, Fehlerbehandlung,
Resilienz, Monitoring.
TARGETS:
- packages/inngest/** (alle Jobs + Cron) + apps/web Inngest-Anbindung
- audit-action.ts (Foreground vs Background, BACKGROUND_THRESHOLD)
- Rate-Limit-Implementierung (in-memory Map? Upstash-Wiring?)
- Sentry/Error-Tracking-Wiring · strukturiertes Logging · Env-Validierung
PRÜFE GEZIELT:
- Inngest-Pipeline (init → poll → complete): Retry-Semantik, Fehlerpfade,
  Timeout-Verhalten, Idempotenz der Steps, signingKey-Enforcement.
- Foreground-Audit-Timeout: greift BACKGROUND_THRESHOLD korrekt? Serverless-
  Timeout-Risiko bei großen Repos / GitHub-URL-Audits.
- Graceful Degradation: was passiert, wenn eine Dependency (Redis, Stripe, LLM,
  Neon) ausfällt? Synchroner Hard-Fail auf unkritischer 3rd-Party?
- Rate-Limit-Failover: was bei Redis-Outage / Quota? Circuit-Breaker?
- Sind finanz-/sicherheitskritische Signale alarmiert?
DYNAMISCHE CHECKS:
- `pnpm --filter @vk/web build` — VERIFIZIERE den in Commit da0babb geloggten
  prod-build-blocker: existiert er noch? Reproduzier + lokalisiere ihn exakt.
- `pnpm test` (API-Route-/Inngest-Tests).
Befolge §7.0. Report → docs/audits/2026-06-second-opinion/S4-flows-jobs.md
```

### §7.S5 — Session 5: Web-Platform-Hardening, Secrets & Config

```
SCOPE
HTTP-Security-Layer, Secrets-Hygiene, Konfiguration (12-Factor), SSRF.
TARGETS:
- Security-Header / CSP (next.config, middleware) — Report-Only oder enforced?
- CORS-Konfiguration · Rate-Limiting auf Auth + teuren Endpoints
- Env-Handling: zod-Validator? Secrets nur in Env, nichts im Client-Bundle?
- Jede Stelle, die eine USER-gelieferte URL fetcht (GitHub-URL-Audit!) → SSRF.
PRÜFE GEZIELT:
- CSP-Directives: connect-src-Whitelist vollständig? script-src nonce/strict?
  Report-Endpoint verdrahtet (an Sentry)? Oder nur Report-Only ohne Sink?
- Secrets-im-Bundle: grep das gebaute Client-Bundle / NEXT_PUBLIC_*-Lecks.
- SSRF: kann die Repo-/GitHub-URL auf interne Adressen (169.254.169.254,
  localhost, file://) zeigen? Allow-Listing?
- CORS: kein `*` mit credentials.
- HSTS / X-Frame-Options / X-Content-Type-Options gesetzt?
DYNAMISCHE CHECKS:
- `pnpm --filter @vk/web build` und Response-Header der gebauten App prüfen
  (curl -I gegen Dev/Preview, wenn verfügbar).
- grep NEXT_PUBLIC_ + process.env-Nutzung im Client-Code.
Befolge §7.0. Report → docs/audits/2026-06-second-opinion/S5-web-hardening.md
```

### §7.S6 — Session 6: Frontend, Accessibility, Performance & SEO

```
SCOPE
Client-Qualität: Core Web Vitals, a11y, Hydration, Bundle, SEO. Berücksichtige
das frische 3-Farben-Design (2026-06-10) — Kontrast neu bewerten.
TARGETS:
- Landing (ConsoleSurface, HeroText, LandingNarrative) · Konsole (SolarListView)
  · Settings · Scan-Detail-Seite ([workspace]/scans/[id])
- globals.css (OKLCH-Tokens, --radius, severity-Tokens) · severity-colors.ts
- next/image-Nutzung · Font-Loading · dynamische Imports
PRÜFE GEZIELT:
- a11y: alle interaktiven Elemente tastatur-erreichbar + screenreader-beschriftet?
  Fokus-Reihenfolge? Das neue Rule-`<details>`-Filter + SeverityDot korrekt
  aria-labeled? Rot/Grün-Severity: Text-Label IMMER vorhanden (Farbe nie alleiniger
  Träger — Deuteranopie)?
- Kontrast AA: prüfe die neuen severity-Tokens gegen ihren Hintergrund (besonders
  Kill gefüllt vs Hairline-Pills).
- CWV: LCP-Element der Landing? Layout-Shift im 100dvh-Hero? Bundle-Größe?
- Scan-Detail-Seite: ist sie inzwischen designt oder noch roh? (Erst-Audit: Kill)
- SEO: sitemap/robots/canonical/OG-Meta vorhanden?
DYNAMISCHE CHECKS:
- `pnpm --filter @vk/web build` (Bundle-Report / Route-Größen).
- Falls LHCI lauffähig: `pnpm exec lhci autorun` (Perf/a11y/BP-Scores).
- KEIN Playwright (Env tot) — wenn du visuelle Verifikation brauchst, notiere sie
  als manuelle User-Aufgabe statt zu blockieren.
Befolge §7.0. Report → docs/audits/2026-06-second-opinion/S6-frontend-a11y-perf.md
```

### §7.S7 — Session 7: Legal/DSGVO, Email & Deliverability

```
SCOPE
Rechtskonformität (DACH-B2B) und transaktionale Email-Zustellung.
TARGETS:
- app/legal/** · trust/** · DPA-Flow · Footer-Komponente(n)
- packages/auth/src/emails/** (alle Templates) · Email-Versand (nodemailer-SMTP/
  Resend) · Suppression/Unsubscribe · Retention-Logik/Cron
PRÜFE GEZIELT:
- Impressum (§5 DDG/TMG) + Datenschutzerklärung (Art. 13 DSGVO): existieren sie
  inzwischen + erreichbar verlinkt? (Erst-Audit: fehlten = Kill.)
- DPA/AVV (Art. 28) + TOMs + Subprozessor-Liste + SCCs für Nicht-EU-Transfers.
- Persönliche Gmail im öffentlichen DPA-Flow (Erst-Audit-Fund) — noch da?
- Email-Templates: Impressum-Pflichtangaben im Footer? List-Unsubscribe (RFC 8058)?
  de-DE-Locale genutzt? Alle Footer-Links live?
- Member-Invite-Mail: wird sie inzwischen verschickt? (Erst-Audit: nie = Kill.)
- Datenlösch-/Retention-Flow (Art. 17): Cron vorhanden + korrekt?
DYNAMISCHE CHECKS:
- Falls Stack: Email-Templates rendern (de-DE + en-US) und gegen Mailpit prüfen.
- Alle /legal- + /trust-Links auf 200 prüfen (curl).
Befolge §7.0. Report → docs/audits/2026-06-second-opinion/S7-legal-email.md
```

### §7.S8 — Session 8: Synthese, Cross-Cutting & Completeness-Kritik

```
ROLLE
Du bist der Audit-Koordinator. S1–S7 sind fertig und liegen als Reports in
docs/audits/2026-06-second-opinion/. Befolge den MODELL-GUARD aus §7.0 (nur
Fabel 5).
AUFGABE:
1. Lies ALLE SX-*.md-Reports.
2. DEDUPE Findings, die in mehreren Sessions auftauchen (eine kanonische Finding,
   alle Fundstellen verlinkt).
3. RE-JUDGE Severity konsistent über alle Domänen (eine Skala, kein Domänen-Bias).
4. CROSS-CUTTING-Muster: Probleme, die einzeln klein aussehen, zusammen aber ein
   Muster sind (z.B. dieselbe fehlende Tenant-Scoping-Hilfsfunktion an 8 Stellen,
   durchgängig fehlende Transaktions-Guards, ein Logging-Antipattern überall).
5. COMPLETENESS-KRITIK (der „verbessert sich selbst"-Pass): Welche Dimension wurde
   dünn abgedeckt? Welche Finding ist `uncertain` geblieben und braucht eine
   Folge-Session? Welche Annahme im Threat-Model ist unbestätigt? Liste konkrete
   Folge-Schritte.
6. Optional: _diff-vs-launch-verify.md — vergleiche deine unabhängigen Findings
   mit docs/audits/2026-06-launch-verify/_synthesis.md (ERST JETZT lesen, nachdem
   du unabhängig geurteilt hast): Was hat der Erst-Audit übersehen? Was hat er
   gefunden, das du nicht reproduziert hast?
OUTPUT → docs/audits/2026-06-second-opinion/_synthesis.md:
- Ganz oben: PRIORISIERTE GO-LIVE-BLOCKER-LISTE (nur go-live-blocker: yes),
  sortiert Kill→Weak, jede mit file:line + 1-Satz-Impact + 1-Satz-Fix-Richtung.
- Dann: Severity-Tally (X Kill · Y Weak · Z Mid · …) pro Dimension.
- Dann: Cross-Cutting-Muster.
- Dann: Completeness-Kritik + empfohlene Folge-Sessions.
```

### §7.K — Kickoff-Template (so startest du eine Session)

> Öffne eine **frische Session, Modell = Fabel 5**, im Repo-Root, und paste (Beispiel S2):

```
Du bist im ValidationKit-Repo. Pinne dich auf Fabel 5 — kein Opus, kein Fallback;
wenn dein Modell nicht Fabel 5 ist, brich ab und melde es.
Lies docs/plans/pre-launch-second-opinion-audit.md, Sektionen §7.0 (Shared Audit
Protocol) und §7.S2 (Payments). Führe die S2-Session exakt nach Protokoll aus:
unabhängig, evidenzbasiert, mit adversarialer Verifikation, read-only am Code.
Schreibe den Report nach docs/audits/2026-06-second-opinion/S2-payments.md.
```

> Für S1/S3/S4/S5/S6/S7 jeweils `§7.S2 (Payments)` und den Report-Pfad austauschen.
> S8 (Synthese) erst starten, wenn S1–S7-Reports existieren.

---

## §8 — Verifikation des Audits selbst (ist der Lauf gut?)

Der Run ist *selbst* qualitätsgesichert durch:
- **Evidenz-Pflicht** (jede Finding `file:line` + Snippet + Impact) → keine vagen Behauptungen.
- **CoVe-Verifikations-Pass** pro Finding → niedrige False-Positive-Rate.
- **Known-Issues-Filter** → kein Rauschen durch bereits-bekannte Kills.
- **Completeness-Self-Check** am Ende jeder Session + **Completeness-Kritik** in S8 → fängt Unter-Abdeckung.
- **Optionaler Diff gegen den Erst-Audit** (S8) → externe Plausibilisierung.

**Du (Kolja) prüfst nach dem Lauf:**
- Stichprobe: 3–5 Kill-Findings — ist die Evidenz real und der Exploit-Pfad plausibel?
- Sind die bekannten offenen Kills NICHT als „neu" gemeldet? (Sonst Filter kaputt.)
- Hat S8 eine klare, sortierte Go-Live-Blocker-Liste produziert?

---

## §9 — Severity & Output-Format

**Report-Template (jede SX-*.md):**

```markdown
# SX — <Domain> · Second-Opinion Audit · 2026-06-10
Modell: Fabel 5 · Methode: static + targeted dynamic · read-only

## Threat-Model & In-Scope-Annahmen
<die zu Beginn geschriebenen Annahmen>

## Findings (Übersicht)
| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| SX-01 | Kill | yes | … | path:line | verified |

## Findings (Detail)
### SX-01 · <Titel> · Kill · go-live-blocker: yes
- **Evidenz:** `path:line`
  ```<lang>
  <≤8 Zeilen Snippet>
  ```
- **Impact/Exploit-Pfad:** …
- **Confidence:** high
- **Verifikation:** verified — Widerlegungs-Fragen + Antworten: …
- **Fix-Richtung (1 Satz, kein Code):** …

## Geprüft & verworfen (refuted — optional)
| Vermutung | Warum verworfen |

## Completeness self-check
- Nicht erreicht/gelesen: …
- Unbestätigte Annahme: …
```

**Severity-Bänder:** {Kill · Weak · Mid · Strong · Exceptional} + binär `go-live-blocker: yes|no`. Kill braucht Launch-Block-Begründung.

---

## §10 — Rollout & Acceptance

**So fährst du den Audit:**
1. Stelle sicher, dass dein Modell **Fabel 5** ist (`/model` → Fabel 5).
2. *(Empfohlen für dynamische Checks)* lokaler Stack hoch: `pnpm stack:up && pnpm db:migrate`. Ohne Stack laufen die rein statischen Teile trotzdem.
3. Fahre **S1 → S7** nacheinander (je eine frische Fabel-5-Session, Kickoff §7.K). Jede schreibt ihren Report. Bricht eine ab → nur die wiederholen.
4. Fahre **S8** (Synthese), wenn S1–S7-Reports liegen.
5. Lies `_synthesis.md`, triagiere die Go-Live-Blocker-Liste, gib mir gezielt `/plan` bzw. `/execute` für die Fixes, die du angehen willst.

**Acceptance dieses Plans (jetzt):**
- [x] Prompt-Pack vollständig (Shared Protocol + S1–S8 + Kickoff).
- [x] Severity-/Output-Format spezifiziert.
- [x] Modell-Pinning (Fabel 5, kein Fallback) in jedem Session-Guard verankert.
- [x] Dynamische Checks pro Session konkret (Befehle aus echtem Test-Infra-Inventar).
- [x] Known-Issues-Filter aus realem Erst-Audit befüllt.

**Acceptance des Runs (später, durch dich):** `_synthesis.md` existiert mit priorisierter Go-Live-Blocker-Liste; Stichproben-Findings sind evidenzbasiert + plausibel.

---

## §11 — Alternativen (erwogen & verworfen)

| Alternative | Warum verworfen |
|-------------|-----------------|
| **Ein großer Run mit internem Subagent-Fan-out** (à la /ultrareview) | Bequemer Start, aber knallt schnell ans Fabel-5-Limit, und bei Mid-Run-Abbruch ist alles weg. Domänen-Sessions sind resumierbar. |
| **Generischer „audite alles"-Mega-Prompt** | Research zeigt: AI-Qualität degradiert mit Input-Größe → Skimming statt Lesen, mehr False-Positives. Domänen-Slicing erzwingt Tiefe. |
| **Code-Änderungen direkt im Audit-Run** | User will Kontrolle + Triage (Findings-Report-Entscheidung). Trennung Audit↔Fix hält den Run billig und reviewbar. |
| **Findings ohne CoVe-Verifikation** | False-Positive-Rate zu hoch; CoVe + Evidenz-Pflicht sind die belegten FP-Killer. |
| **Auf den Erst-Audit aufbauen statt unabhängig** | User wählte bewusst Second-Opinion → Confirmation-Bias-Schutz. Abgleich passiert erst in S8, nach unabhängigem Urteil. |
| **Prompts als separate .md-Dateien** | Verletzt „keine neuen MD außerhalb docs/plans". Prompts leben im Plan, Sessions lesen sie dort. |

---

## §12 — Out-of-Scope / Open Items

- **Fixes** — bewusst nicht Teil des Runs; folgen via separatem `/plan`+`/execute` nach Triage.
- **Test-Infra-Aufbau** (Playwright-E2E, axe-core, LHCI-Token) — eigenständiges Thema, nicht dieser Audit (der *meldet* die Lücken nur).
- **Exakter Fabel-5-Modell-String** — konnte ich nicht gegen die mir bekannten Modell-IDs (Opus 4.8 / Sonnet 4.6 / Haiku 4.5) auflösen; „Fabel 5" ist offenbar neuer als mein Wissensstand. Du pinnst es über den Modell-Picker; der Session-Guard lässt den Run abbrechen, falls ein anderes Modell aktiv ist.
- **Playwright** — in dieser Umgebung nicht nutzbar (Calls timeouten); S6 notiert visuelle Checks als manuelle Aufgabe statt zu blockieren.

---

## §13 — Referenzen

- **Frameworks (Prep-Research):** OWASP ASVS v5 + WSTG · Google SRE Production Readiness Review · Stripe Go-Live-Checklist · The Twelve-Factor App · web.dev Core Web Vitals · Chain-of-Verification (Dhuliawala et al. 2023, arXiv:2309.11495) · „Prompting the Priorities" LLM-Vuln-Triage-FP (arXiv:2510.18508) · Fan-out-Auditing (dev.to/lachiejames).
- **Repo-intern:** `docs/audits/2026-06-launch-verify/_synthesis.md` (Erst-Audit, erst in S8 lesen) · `docs/audits/2026-05/_synthesis.md` · `docs/plans/production-launch-readiness.md` · `.claude/CLAUDE.md` (Konventionen, Severity-Bänder, Constraints).
