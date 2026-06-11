# S3 — Data-Layer, DB-Schema & Migrationen · Second-Opinion Audit · 2026-06-10
Modell: Fable 5 (claude-fable-5) · Methode: static + targeted dynamic · read-only

## Threat-Model & In-Scope-Annahmen

**Angreifer / Fehlerquellen (Data-Layer-spezifisch):**
1. Nebenläufigkeit als "Angreifer": parallele Requests/Crons, die Geld-/Credit-/Membership-Rows konkurrierend mutieren (Double-Spend, Lost-Update, Unique-Violations).
2. Transiente Infrastruktur-Fehler (Neon-Serverless-Hiccup, Stripe-API-Fehler) mitten in mehrstufigen, nicht-atomaren Schreibpfaden.
3. Operator-Fehler: Migrations-Drift zwischen `schema.ts`, `drizzle/`-SQL, Snapshots und der Prod-DB; destruktive `generate`-Outputs.
4. Authentifizierter Tenant-User mit kontrollierten Inputs, die in raw-SQL landen könnten (Injection).

**Kronjuwelen:** Credit-Ledger + Subscription (Geldpfad), Mandanten-Isolation auf FK-/Query-Ebene, Prod-DB-Integrität bei Deploys, Compliance-Audit-Trails (install_decision, apply_action, dpa_acceptance).

**Out-of-scope:** pgvector/Embeddings, bekannte Kills aus §7.0 (Migration-im-buildCommand-ohne-Advisory-Lock = bekannt Bundle C — hier nur neue Aspekte), Auth-IDOR customers.ts, Stripe `invoice.paid` liest entferntes `invoice.subscription`.

**Dynamische Checks ausgeführt:** `pnpm db:migrate` gegen lokale DB (vom Koordinator, "Migrations applied"); Inspektion `drizzle.__drizzle_migrations` + `\d finding` / `\d credit_ledger` / `\d membership` in vk-postgres; `drizzle-kit check` (grün); `drizzle-kit generate --name s3_drift_probe` als Drift-Probe (schlug fehl, s. S3-01; **keine Files erzeugt, nichts zu verwerfen** — `git status` auf `drizzle/` clean).

## Findings (Übersicht)

| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S3-01 | Kill | yes | Stripe-Event wird VOR Verarbeitung als gesehen markiert — transienter Handler-Fehler verliert Geld-Events permanent | apps/web/src/app/api/stripe/webhook/route.ts:104–118,160 | verified |
| S3-02 | Weak | no | Drizzle-Snapshot-Drift: Snapshots enden bei 0011, Migrationen 0012–0018 handgeschrieben — `drizzle-kit generate` ist funktional kaputt | packages/db/drizzle/meta/_journal.json + drizzle/meta/ | verified |
| S3-03 | Weak | no | Fehlender partial-unique-Index auf pending-Invites + nicht-konflikt-toleranter Claim → Unique-Violation crasht Dashboard permanent | apps/web/src/lib/membership.ts:96–141,202–212 | verified |
| S3-04 | Weak | no | Workspace-Delete hinterlässt Stripe-Subscription mit totem `workspaceId` → `publishEvent`-FK-Violation vergiftet den nightly Reconcile-Cron dauerhaft | packages/inngest/src/functions/stripe-reconcile.ts:113 | verified |
| S3-05 | Mid | no | Prepaid-Grant-Rows ohne Row-Lock: Expirer-Cron vs. `consumeCredits` → Lost-Update / falsche Ledger-Deltas | packages/inngest/src/functions/prepaid-credit-expirer.ts:88–104 | verified |
| S3-06 | Mid | no | Idempotenz-Schicht (0016) schützt nur die Ledger-Row, nicht den Quota-Reset; `resetCycleQuota` ist toter Code, der den Index per NULL-referenceId umgeht | packages/billing/src/credits.ts:253–257, 279–301 | verified |
| S3-07 | Mid | no | `event`-Tabelle: Schema-Kommentar behauptet 7d-Retention, es existiert kein Retention-Code → unbounded growth | packages/db/src/schema.ts:511–513 | verified |

## Findings (Detail)

### S3-01 · Stripe-Event insert-before-process verliert Geld-Events permanent · Kill · go-live-blocker: yes
- **Evidenz:** `apps/web/src/app/api/stripe/webhook/route.ts:104–118` und `:157–161`
  ```ts
  const seen = await db
    .insert(schema.stripeEvent)
    .values({ id: event.id, type: event.type, ... })
    .onConflictDoNothing({ target: schema.stripeEvent.id })
    .returning({ id: schema.stripeEvent.id });
  if (seen.length === 0) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  try { switch (event.type) { ... } }
  catch (err) { ... return NextResponse.json({ error: "Handler error." }, { status: 500 }); }
  ```
- **Impact/Exploit-Pfad:** Die `stripe_event`-Row wird **vor** der Verarbeitung committet. Wirft der Handler danach (Neon-Connection-Hiccup in `handleInvoicePaid`, Stripe-API-Fehler im synchronen `flushPendingForCustomer` bei `invoice.created`), antwortet die Route 500 — aber die Row bleibt. Stripes Retry (gleiche `event.id`, auch manueller "Resend" nutzt dieselbe ID) läuft in `seen.length === 0` → `{ ok, duplicate }` → das Event wird **nie** verarbeitet. Konkrete Folgen: `checkout.session.completed` (Kunde hat Pack bezahlt) → Credits werden nie gutgeschrieben; `invoice.paid` → Monats-Grant entfällt. Der nightly `stripe-reconcile` heilt das nicht — er detektiert nur Tier-/Status-Drift der Subscription (`stripe-reconcile.ts:107–110`), keine fehlenden Credit-Grants, und fixt nichts ("does NOT auto-fix"). Stripes eingebautes 72h-Retry-Sicherheitsnetz wird damit auf dem Geldpfad aktiv neutralisiert.
- **Confidence:** high
- **Verifikation:** verified — Widerlegungsversuche: (1) *Rollt eine umschließende Transaktion die Row zurück?* Nein — `db.insert` und der `try`-Block sind getrennte Statements, keine gemeinsame Transaktion; Nicht-DB-Fehler (Stripe-API) lassen die Row ohnehin stehen. (2) *Sind die Handler effektiv no-throw?* Nein — sie machen DB-Selects/-Updates, `db.transaction` (grantCredits) und synchrone Stripe-API-Calls; E-Mail ist soft-fail, der Rest nicht. (3) *Heilt ein anderes Event denselben Zustand?* `invoice.paid` und `checkout.session.completed` feuern einmalig; `stripe-reconcile` deckt Grants nicht ab. (4) *Liefert Stripe Resend mit neuer Event-ID?* Nein, Resend nutzt dieselbe ID → Duplicate-Kurzschluss. — **Kill-Begründung:** GA heißt zahlende Kunden ab Tag 1; ein einzelner transienter Fehler (bei Serverless-Postgres realistisch) führt zu "Kunde hat bezahlt, Leistung nie gutgeschrieben" ohne Alarm und ohne Selbstheilung.
- **Fix-Richtung (1 Satz, kein Code):** `stripe_event` um einen Status (`processing|processed|failed`) erweitern bzw. die Row bei Handler-Fehler löschen/als failed markieren, damit Stripes Retry den Handler erneut erreicht.

### S3-02 · Drizzle-Snapshot-Drift 0012–0018 — `generate` funktional kaputt · Weak · go-live-blocker: no
- **Evidenz:** `packages/db/drizzle/meta/` enthält Snapshots nur bis `0011_snapshot.json`; Migrationen gehen bis `0018_finding_filepath.sql`. Eingestanden in `0015_user_cascade_hardening.sql:7–9`:
  ```sql
  -- Schema-snapshot regenerate (drizzle-kit generate) is deferred — the
  -- existing 0011_lame_speedball.sql + saas-pricing-sub-a snapshots have
  -- pre-existing rename-conflicts that need a separate cleanup pass.
  ```
  **Dynamischer Beweis:** `pnpm exec drizzle-kit generate --name s3_drift_probe` bricht ab mit `Error: Interactive prompts require a TTY terminal … promptColumnsConflicts` — der Diff gegen den 7 Migrationen alten Snapshot 0011 erzeugt Spalten-Konflikt-Prompts (u. a. der user→workspace-Pivot der `subscription`). Keine Files entstanden (verworfen-by-default).
- **Impact/Exploit-Pfad:** Jede künftige Schema-Änderung kann nicht mehr generiert werden (CI/non-TTY: harter Fehler; interaktiv: Konflikt-Prompts, deren falsche Beantwortung destruktives SQL erzeugt — der Diff enthält den kompletten Subscription-Rewrite). Das Team ist dauerhaft auf handgeschriebene Migrationen + handgepflegte `_journal.json`-`when`-Werte angewiesen; ein einziger nicht-monotoner `when`-Wert würde vom Migrator kommentarlos übersprungen.
- **Confidence:** high
- **Verifikation:** verified — Widerlegungsversuche: (1) *Validiert `drizzle-kit check` das?* Nein — `check` prüft nur Migrations-Kollisionen, lief grün, fängt Snapshot-Drift nicht. (2) *Blockt es den Launch selbst?* Nein — alle 19 Migrationen laufen sauber (lokal verifiziert: `drizzle.__drizzle_migrations` = 19 Rows); das Risiko materialisiert erst bei der nächsten Schema-Änderung. (3) *Ist es schon als Known-Issue gelistet?* Nicht in §7.0 — nur als Code-Kommentar "separate cleanup pass" ohne Bundle-Tracking.
- **Fix-Richtung:** Snapshot-Rebuild-Pass (Snapshots 0012–0018 nachziehen bzw. `drizzle-kit pull`/Re-Baseline), bevor die nächste Schema-Änderung ansteht.

### S3-03 · Pending-Invites ohne Unique-Constraint + nicht-konflikt-toleranter Claim · Weak · go-live-blocker: no
- **Evidenz:** DB (lokal verifiziert via `\d membership`): einziger Unique-Index ist `membership_workspace_user_unique (workspace_id, user_id)`; `membership_workspace_email_idx` ist **nicht** unique. `apps/web/src/lib/membership.ts:202–211`:
  ```ts
  for (const row of pending) {
    await db
      .update(schema.membership)
      .set({ userId, status: "active", acceptedAt: new Date() })
      .where(eq(schema.membership.id, row.id));
  ```
  Aufgerufen ungeschützt in `apps/web/src/app/dashboard/page.tsx:52`.
- **Impact/Exploit-Pfad:** Zwei Wege zu Duplikaten: (a) Doppelklick/parallele `inviteAdmin`-Calls — der Check-then-Insert (`membership.ts:121–140`) ist nicht atomar, NULL-`user_id`-Rows kollidieren nie im Unique-Index → zwei pending-Rows gleicher E-Mail; (b) E-Mail-Invite pending, User registriert sich, Admin lädt dieselbe Person erneut ein — der userId-Branch (`:96–118`) prüft nur `(workspaceId,userId)`, sieht die pending-E-Mail-Row nicht → aktive Row + pending Row koexistieren. In beiden Fällen wirft `claimPendingMemberships` beim Setzen von `userId` auf die zweite Row eine Unique-Violation (23505) — ungefangen im Dashboard-Mount → der betroffene User bekommt bei **jedem** /dashboard-Aufruf einen Fehler (pending-Row bleibt pending → Zustand permanent bis manueller DB-Eingriff).
- **Confidence:** high
- **Verifikation:** verified — Widerlegungsversuche: (1) *Fängt ein App-Level-Guard das ab?* Der sequentielle `already`-Check fängt nur den Nicht-Race-Fall; Szenario (b) wird von keinem Check abgedeckt (Branch prüft nur userId). (2) *Ist der Claim konflikt-tolerant?* Nein — plain `update`, kein try/catch, kein `onConflict`-Äquivalent. (3) *Crasht wirklich der Mount?* `dashboard/page.tsx:52` `await`et ohne try/catch in der Server-Component. — Kein Launch-Blocker (braucht Doppel-Invite-Sequenz), aber Lockout-Charakter.
- **Fix-Richtung:** Partial-unique-Index `(workspace_id, lower(invited_email)) WHERE status='pending'` + Claim konflikt-tolerant machen (Duplikat-Row als revoked/merged markieren statt blind updaten).

### S3-04 · Workspace-Delete vergiftet den Stripe-Reconcile-Cron (FK-Violation auf `event`) · Weak · go-live-blocker: no
- **Evidenz:** `packages/inngest/src/functions/stripe-reconcile.ts:107–130` (Ausschnitt):
  ```ts
  const tierDrift = !dbRow || dbRow.tier !== tier;
  ...
  await publishEvent({
    workspaceId,            // aus sub.metadata — Workspace ggf. gelöscht
    type: "audit.failed",
  ```
  `publishEvent` (`packages/inngest/src/events.ts:15–22`) ist ein nackter Insert in `event` mit `workspace_id … NOT NULL REFERENCES workspace ON DELETE CASCADE`.
- **Impact/Exploit-Pfad:** `deleteWorkspace` (workspace-actions.ts:77–79) cancelt die Stripe-Subscription nur best-effort und löscht dann den Workspace samt `subscription`-Row. Die Stripe-Subscription (aktiv bei Cancel-Fehler, sonst `canceled`) behält für immer `metadata.workspaceId`. Der nightly Reconcile listet `status: "all"` → findet die Sub, `dbRow` fehlt → `tierDrift` → `publishEvent` mit gelöschter `workspaceId` → FK-Violation. Der Call steht **außerhalb** von `step.run` → der gesamte Function-Run failt, bei jedem nächtlichen Lauf erneut am selben Datensatz (Poison-Record). Damit ist genau das Sicherheitsnetz dauerhaft tot, das Webhook-Drops (S3-01!) detektieren soll — und der Cancel-Fehlerpfad loggt nur `console.error` ("for stripe-reconcile to pick up"), d. h. der dokumentierte Fallback beruht auf dem Cron, der hier stirbt.
- **Confidence:** high
- **Verifikation:** verified — Widerlegungsversuche: (1) *Filtert der Reconcile gelöschte Workspaces?* Nein — kein Existenz-Check, das 5-min-Settle-Window greift nur bei vorhandener `dbRow`. (2) *Fängt Inngest den Fehler pro Item?* Nein — `publishEvent` ist nicht step-gewrappt; Retries wiederholen den ganzen Run gegen denselben Poison-Record. (3) *Ist das Szenario erreichbar?* Jeder Workspace-Delete eines Workspace, der je eine Stripe-Subscription hatte, reicht (auch bei erfolgreichem Cancel, da `status:"all"` gecancelte Subs mitlistet).
- **Fix-Richtung:** `publishEvent` im Reconcile pro Sub in `step.run` + Existenz-Check des Workspace (oder FK-tolerantes Logging statt `event`-Insert für verwaiste Subs).

### S3-05 · Prepaid-Grants ohne Row-Lock: Expirer vs. consumeCredits · Mid · go-live-blocker: no
- **Evidenz:** `packages/inngest/src/functions/prepaid-credit-expirer.ts:88–99`:
  ```ts
  await db.transaction(async (tx) => {
    const remaining = row.creditsRemaining;   // stale: außerhalb der tx gelesen
    if (remaining <= 0) return;
    await tx.update(schema.prepaidCreditGrant)
      .set({ creditsRemaining: 0 }) ...
    await tx.insert(schema.creditLedger).values({ delta: -remaining, ... });
  ```
  `consumeCredits` (packages/billing/src/credits.ts:121–186) lockt nur die `subscription`-Row (`FOR UPDATE`), liest/updated `prepaid_credit_grant`-Rows ohne Lock.
- **Impact/Exploit-Pfad:** Konkurrierende `consumeCredits`-Aufrufe sind via Subscription-Lock serialisiert — der Expirer-Cron nimmt dieses Lock aber nicht. Läuft ein Consume parallel zum 02:00-Expirer an der Expiry-Grenze, schreibt der Consume `creditsRemaining = stale - take` und kann eine bereits genullte Grant-Row "wiederbeleben" (Lost-Update), bzw. der Expirer bucht `delta = -remaining` auf Basis eines veralteten Werts → Ledger-Deltas stimmen nicht mit den realen Beständen überein (Audit-Trail-Drift, kein direkter Geldverlust — `getCreditBalance` rechnet aus den Tabellen, nicht aus dem Ledger).
- **Confidence:** mid (Race-Fenster klein: täglicher Cron × Expiry-Grenze)
- **Verifikation:** verified (Code-Logik) — Widerlegung versucht: (1) *Serialisiert die Transaktion das?* Nein — Default READ COMMITTED, kein `FOR UPDATE`/`WHERE creditsRemaining > 0`-Re-Check auf der Update-Klausel. (2) *Ist der Expirer idempotent genug?* Das `remaining <= 0`-Guard nutzt den stale Wert, nicht den DB-Zustand.
- **Fix-Richtung:** Expirer-Update mit `RETURNING`-basiertem Re-Read bzw. `SELECT … FOR UPDATE` in der Transaktion; alternativ beide Pfade aufs Subscription-Lock normieren.

### S3-06 · Monthly-Grant-Idempotenz deckt Quota-Reset nicht; `resetCycleQuota` = toter, ungeschützter Pfad · Mid · go-live-blocker: no
- **Evidenz:** `packages/billing/src/credits.ts:253–257` (Reset läuft VOR dem `onConflictDoNothing`-Insert, auch wenn dieser konfligiert):
  ```ts
  if (args.reason === "monthly_grant") {
    await tx.update(schema.subscription)
      .set({ creditsUsedThisPeriod: 0, updatedAt: new Date() })
  ```
  und `:288–300` (`resetCycleQuota`): Ledger-Insert mit `reason: "monthly_grant"` **ohne** `referenceId` → NULL umgeht den Partial-Unique-Index (NULLs sind in Postgres-Unique-Indizes distinct) und ohne `onConflictDoNothing`; keine Aufrufer im Repo (nur Re-Export in `packages/billing/src/index.ts:36`).
- **Impact/Exploit-Pfad:** Die als "second line of defense" gebaute 0016-Idempotenz (für den Fall, dass "two distinct events try to grant the same invoice", Kommentar in 0016) verhindert nur die doppelte Ledger-Row — der Quota-Reset (`creditsUsedThisPeriod=0`) läuft trotzdem, d. h. im anvisierten Cross-Event-Replay-Fall wird der Verbrauchszähler erneut genullt = effektiver Doppel-Grant. `resetCycleQuota` würde, falls je wieder verdrahtet, beide Schutzschichten umgehen.
- **Confidence:** mid (Erreichbarkeit hängt am Cross-Event-Replay; Same-Event-Replays blockt die `stripe_event`-PK — siehe aber S3-01)
- **Verifikation:** verified (Logik) / Erreichbarkeit niedrig — Widerlegung: (1) *Blockt `stripe_event` alle Replays?* Nur gleiche Event-IDs; der 0016-Kommentar postuliert selbst den Distinct-Event-Fall als Schutzziel. (2) *Ist `resetCycleQuota` erreichbar?* Kein Aufrufer gefunden (grep über apps/web + packages) → aktuell toter Code, als Landmine gemeldet.
- **Fix-Richtung:** Quota-Reset an den erfolgreichen (nicht-konfligierten) Ledger-Insert koppeln; `resetCycleQuota` löschen oder mit referenceId + Conflict-Handling nachrüsten.

### S3-07 · `event`-Tabelle: dokumentierte Retention existiert nicht · Mid · go-live-blocker: no
- **Evidenz:** `packages/db/src/schema.ts:511–513`:
  ```ts
  // Sprint 0.12: lightweight workspace-scoped event log. Producers (Inngest
  // audit completions) INSERT; the SSE endpoint SELECTs since last_id.
  // Auto-rolled by retention; 7d default.
  ```
  Grep über `packages/inngest/src` + `apps/web/src` findet keinerlei Lösch-/Retention-Code für `event` (kein `delete(schema.event)`, kein Cron).
- **Impact/Exploit-Pfad:** Unbounded growth einer Hot-Path-Tabelle (SSE-Polling + Producer-Inserts inkl. Billing-Drift- und Prepaid-Warning-Events); der Schema-Kommentar dokumentiert eine Garantie, die nicht existiert. Zusätzlich dient die Tabelle als Idempotenz-Store für Warn-E-Mails (prepaid-credit-expirer `hasRecentWarning`, Lookback 48 h) — eine später eingeführte aggressive Retention (<48 h) würde Doppel-Mails re-aktivieren.
- **Confidence:** high
- **Verifikation:** verified — Hinweis: Ein "Retention-Cron" ist im Master-Plan als Rest-Politur erwähnt (Überschneidung möglich, dort vermutlich DSGVO-Datenretention); der hier gemeldete neue Aspekt ist der **lügende Schema-Kommentar** + die 48h-Kopplung der E-Mail-Idempotenz.
- **Fix-Richtung:** Retention-Cron für `event` (≥48 h Fenster) + Kommentar korrigieren.

## Migration-0018-Drift-Verdacht (explizit geprüft)

**Verdacht (Memory/§4):** `0018_finding_filepath` (finding.file_path/file_kind) evtl. nicht auf Prod-DB.

**Befund — als Code-/Launch-Problem im Wesentlichen widerlegt, als Ops-Zustand unbestätigbar:**
1. `0018_finding_filepath.sql` ist im `main`-Tree enthalten (`git ls-tree main` ✓) und in `_journal.json` als Eintrag idx 18 registriert.
2. Lokal verifiziert angewandt: `drizzle.__drizzle_migrations` hat 19 Rows (letzte `created_at = 1780300000000` = 0018); `\d finding` zeigt `file_path` + `file_kind`.
3. Das SQL ist vollständig idempotent (`ADD COLUMN IF NOT EXISTS`, Backfill `WHERE file_path IS NULL`) — Mehrfachausführung gefahrlos.
4. Prod-Apply-Mechanik: `vercel.json` buildCommand endet mit `pnpm --filter @vk/db exec tsx src/migrate.ts`; `migrate.ts` skippt nur `VERCEL_ENV=preview`. Der **nächste Production-Deploy von main** wendet 0018 also automatisch an, bevor der neue Code Traffic bekommt (buildCommand läuft komplett vor Aktivierung) — die Code-Seite (`audit-action.ts:412`, `audit-requested.ts:129` schreiben `filePath`/`fileKind` unconditionally) kann Prod ohne die Spalten nicht erreichen, außer über einen Preview-Deploy, der auf die Prod-DB zeigt (das ist die bekannte Bundle-C-Baustelle, nicht neu gemeldet).
5. **Nicht prüfbar von hier:** ob seit dem Merge von 0018 auf main bereits ein Production-Deploy lief (Prod-DB-Zugriff/Vercel-Deploy-Historie = extern). Rest-Risiko ist rein operativ, nicht strukturell.

## Geprüft & verworfen (refuted)

| Vermutung | Warum verworfen |
|-----------|------------------|
| SQL-Injection über raw-SQL (`db.execute` / `` sql`…` ``) | Alle 6 raw-SQL-Stellen (credits.ts, credit-aggregator.ts, prepaid-credit-expirer.ts, health-check.ts) nutzen den parametrisierenden drizzle-`sql`-Tag; kein String-Concat, kein User-Input unparametrisiert. Vorbildlich (Strong). |
| Double-Spend bei nebenläufigen Audits | `consumeCredits` nimmt `SELECT … FOR UPDATE` auf die Subscription-Row und bucht im selben `db.transaction` — konkurrierende Consumes sind serialisiert (Strong). Restrisiko nur an der Expirer-Flanke (→ S3-05). |
| Revoked-Member behält Zugriff (Membership-Datenmodell) | `authz.ts` filtert durchgängig `status='active'` (userIsMember:38, getUserRole:73); Status-Spalte wird serverseitig durchgesetzt. |
| Verwaiste Rows durch fehlende/falsche Cascades | FK-Topologie konsistent: workspace-cascade über alle 13 Tenant-Tabellen; Compliance-Trails (install_decision, apply_action, dpa_acceptance) per 0015 bewusst auf SET NULL gehärtet (Strong); scan.repo_id SET NULL erzeugt absichtlich History-erhaltende, workspace-gebundene Rows. |
| `prepaidCreditGrant`-Doppel-Grant bei Webhook-Replay | `stripe_invoice_id` UNIQUE + `onConflictDoNothing` + early-return; Ledger-Row fehlt nur im Crash-Fenster zwischen Insert und grantCredits (Balance bleibt korrekt, da aus Tabellen gerechnet) — kein eigenständiges Finding. |
| Journal-`when`-Werte handgesetzt → falsche Apply-Reihenfolge | Werte 1779553600000…1780300000000 sind streng monoton; lokal alle 19 angewandt. Als latentes Prozessrisiko in S3-02 miterfasst. |

## Completeness self-check

- **Nicht erreicht/gelesen:** Better-Auth-interne Query-Pfade auf `verification` (kein Index auf `identifier` — Magic-Link-Lookups seq-scannen; Tabelle bleibt klein, nicht vertieft). Kein Prod-DB-Zugriff → 0018-Ist-Zustand auf Prod nur mechanisch hergeleitet, nicht beobachtet. `pnpm test`/`build` bewusst nicht ausgeführt (Parallel-Sessions, Protokoll-Vorgabe).
- **Unbestätigte Annahmen:** (1) Ob seit Merge von 0018 ein Production-Deploy lief (extern). (2) Inngest-Step-Memoisierung verhindert Doppel-`consumeCredits` bei Function-Retries in `audit-requested.ts` — plausibel (Step-IDs), aber nicht dynamisch verifiziert (S4-Domäne). (3) Fehlender Unique-Index auf `repo (workspace_id, github_full_name)` könnte Duplikat-Repos/Doppel-Audits erlauben — nicht bis zum Impact getraced, daher keine Finding.
