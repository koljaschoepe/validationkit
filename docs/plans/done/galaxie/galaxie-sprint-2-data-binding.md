# Plan — Galaxie Sprint G2: Data-Binding + Customer-Migration

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Slug: `galaxie-sprint-2-data-binding`
> Branch: `feat/galaxie-sprint-2-data-binding`
> Umfang: Schema-Migration + DAL + Real-Data-Wiring der Galaxie. Liefert auf `/[workspace]` echte Customer/Repo/Finding-Daten aus Postgres mit Membership-Gate.

---

## 1. Ziel

Echte DB-Daten in der Galaxie auf `/[workspace]`: Customer→Repo→File-Hierarchie kommt aus Postgres, Membership-Gate gegen Slug-Hijacking, Cache-Invalidation funktioniert.

## 2. Endzustand

**DB:**
- `customer` Tabelle existiert (FK auf `workspace`, UNIQUE(workspace_id, slug)).
- `repo.customer_id uuid` Spalte existiert, ist für alle bestehenden Repos befüllt (Backfill: 1 Customer pro existing `repo.label`).
- `repo.apply_mode varchar(20)` Spalte mit DEFAULT 'pr'.
- Composite Index `(scan_id, severity)` auf `finding`.
- Drizzle-Migrations 0008, 0009, 0010 generiert + reproducible via `pnpm db:migrate` auf leerer DB.

**Code:**
- `lib/dal/galaxie.ts` ersetzt den Mock-Stub:
  - `getGalaxieDataForWorkspace(slug, userId)` → echte DB-Query mit Membership-Gate.
  - Returnt typed `GalaxieData` (gleicher Shape wie mock-data, drop-in-replacement für GalaxieScene).
  - Uses `unstable_cache` mit Tag `galaxie:workspace:<id>`.
- `lib/cache-tags.ts` (NEU) — zentrale cacheTag-Helper für `galaxie:`-Namespace.
- `app/[workspace]/layout.tsx` — Membership-Check via `membership`-Tabelle (existiert seit Migration 0007). Unbekannter Slug oder Non-Member → `notFound()`.
- `app/[workspace]/page.tsx` — `getGalaxieDataForWorkspace` aufrufen, `data` als prop runter zu `GalaxieRoot`.
- `GalaxieRoot.tsx` + `GalaxieScene.tsx` — neuer optional prop `initialData?: GalaxieData`. Wenn vorhanden, nutze die statt mock. Default (für `/`) bleibt mock.
- `WorkspaceSwitcher.tsx` — auf `/[workspace]` zeigt die User-eigenen Workspaces aus DB (nicht mock); auf `/` zeigt es weiterhin mock-Workspaces.

**Tests:**
- `pnpm test` 20+ vitest grün (apps/web + packages/db). Neue Tests: customer-backfill (raw SQL gegen Test-DB), DAL membership-gate, cache-tag-helpers.
- E2E manuell: ein Test-User mit Workspace + 2 Customers + 5 Repos sieht Galaxie auf `/[workspace]`; ein anderer User auf demselben Slug bekommt 404.

**Was NICHT in G2 ist:**
- `/customers` Route bleibt unverändert (zeigt weiterhin Repos as-if-Customer, weil Migration additiv ist). Refactor in G3+.
- Customer-CRUD-UI (Hinzufügen/Bearbeiten von Customer). Sprint G3 (Inspector + Drill-In) bringt das mit.
- `galaxie_layout` Cache-Tabelle (Migration 0011 deferred). Begründung: Layout ist clientside in <50ms computed bei ≤500 Asteroiden; Server-Cache wäre vorzeitige Optimierung.
- Default-Redirect von `/dashboard` zu `/[workspace]`. G6 Polish.

## 3. Schritte

### A. Schema + Migrations (~4h)

- [x] `packages/db/src/schema.ts`: `customer` Tabelle hinzufügen + `customerRelations`.
- [x] `packages/db/src/schema.ts`: `repo` erweitern um `customerId` (uuid, FK → customer.id, ON DELETE SET NULL) + `applyMode` (varchar(20), DEFAULT 'pr').
- [x] `pnpm db:generate` (oder `pnpm exec drizzle-kit generate` im packages/db) erzeugt `0008_<auto>.sql`.
- [x] **Backfill in `0008_*.sql` manuell anhängen** (Drizzle generiert nur structural SQL):
  ```sql
  -- Backfill: 1 customer per distinct (workspace_id, label) in repo.
  WITH new_customers AS (
    INSERT INTO customer (id, workspace_id, slug, label)
    SELECT gen_random_uuid(), workspace_id,
           btrim(regexp_replace(lower(label), '[^a-z0-9]+', '-', 'g'), '-'),
           label
    FROM (SELECT DISTINCT workspace_id, label FROM repo) AS u
    RETURNING id, workspace_id, label
  )
  UPDATE repo r SET customer_id = nc.id
  FROM new_customers nc
  WHERE r.workspace_id = nc.workspace_id AND r.label = nc.label;
  ```
- [x] Separate Migration `0009_finding_severity_idx.sql` (composite index `finding(scan_id, severity)`). Drizzle-Index-Definition in `finding`-Tabelle hinzufügen → auto-generated.
- [x] `pnpm db:migrate` lokal verifizieren auf leerer + auf vorhandener DB.

### B. DAL-Layer (~6h)

- [x] `apps/web/src/lib/cache-tags.ts` (NEU): `galaxieWorkspaceTag(workspaceId)` Helper.
- [x] `apps/web/src/lib/dal/galaxie.ts` ersetzen:
  - `getGalaxieDataForWorkspace(slug: string, userId: string): Promise<{ workspace, data } | null>`.
  - Query-Pfad: workspace by slug → membership lookup (userId + workspaceId) → wenn kein membership → return null.
  - Customers per workspace_id, repos per customer_id, latest scan per repo, findings (filtered by scan-id + severity-band, Severity-Mapping aus DB → SeverityBand-Type), files-Layer = transformierte findings (1 finding = 1 FileNode aus Galaxie-Sicht).
  - Wrap query in `unstable_cache(..., [`galaxie:${workspaceId}`], { tags: [galaxieWorkspaceTag(workspaceId)] })`.
- [x] `apps/web/src/lib/dal/galaxie.ts`: `listUserWorkspaces(userId)` via `membership` join.
- [x] Cache-Invalidation-Hooks in:
  - `lib/customers.ts` `addCustomer` → `revalidateTag(galaxieWorkspaceTag(workspaceId))`.
  - `lib/audit.ts` (oder wo scan-complete fired wird) → `revalidateTag(...)`.
  - `lib/install-decisions.ts` (falls write-access-grants Galaxie tangieren) → optional.

### C. Routes + Components (~5h)

- [x] `apps/web/src/app/[workspace]/layout.tsx`: Membership-Check umbauen. Slug → workspaceId lookup → membership(userId, workspaceId) check. Bei Fehlschlag `notFound()`. Bei nicht-eingeloggtem User: redirect zu `/login?next=/[workspace]`.
- [x] `apps/web/src/app/[workspace]/page.tsx`: `await getGalaxieDataForWorkspace(slug, userId)` → wenn `null` notFound. Sonst `<GalaxieRoot initialData={result.data} />`.
- [x] `apps/web/src/components/galaxie/GalaxieRoot.tsx`: `initialData?: GalaxieData` prop weiterreichen.
- [x] `apps/web/src/components/galaxie/GalaxieScene.tsx`: `initialData?: GalaxieData` prop annehmen. Wenn vorhanden: nutze statt `generateMockGalaxieData()`. computeZoomLevels muss dynamisch werden (cannot be module-eval-const anymore, weil zoom-targets von realer Customer-Position abhängen) — als useMemo im Component.
- [x] `apps/web/src/components/galaxie/WorkspaceSwitcher.tsx`: neuer optional prop `workspaces: MockWorkspace[]` (default = MOCK_WORKSPACES). `/[workspace]/page.tsx` passt real Workspaces durch.
- [x] `apps/web/src/lib/galaxie/mock-data.ts`: keine Änderung — bleibt für `/` Public-Demo.

### D. Tests (~3h)

- [x] `packages/db/src/customer.test.ts` (NEU): Backfill-Test. Insert 1 workspace + 3 repos (gleiche label twice für dedup-Check), execute backfill-SQL (lese aus migration-file und führe gegen Test-DB aus), assert: 2 customer rows, alle 3 repos haben customer_id.
- [x] `apps/web/src/lib/dal/galaxie.test.ts` (NEU): Membership-Gate. Setup 2 users, 1 workspace mit user1 als member, query als user2 → null. Query als user1 → workspace + data.
- [x] `apps/web/src/lib/cache-tags.test.ts` (NEU): Tag-Format-Stability (Refactor-Schutz).
- [x] `pnpm test` muss alle 20+ tests grün halten.
- [x] `pnpm typecheck` muss grün bleiben.

### E. Manuelles E2E + Verifikation (~2h)

- [x] Lokal: Postgres-Stack hoch, login als test-user@validationkit.local, 2 Customers + 5 Repos anlegen (via existing /customers UI — die nutzt addCustomer aus lib/customers.ts).
- [x] `pnpm db:migrate` durchlaufen, Customer-Backfill triggered.
- [x] Navigate zu `/<workspace-slug>` → Galaxie zeigt 2 Customers + 5 Repo-Moons.
- [x] Zweiten User anlegen, von dem aus zu fremdem Slug navigieren → notFound.
- [x] `addCustomer` triggern → Galaxie aktualisiert sich nach revalidate.
- [x] `pnpm typecheck && pnpm test && pnpm build` alle grün.

### F. Plan-Close (~30min)

- [x] Plan-File-Boxen abhaken, Status auf ✅ Done.
- [x] `mv docs/plans/galaxie-sprint-2-data-binding.md docs/plans/done/`.

## 4. Files-to-Change

| Datei | Aktion | Was |
|---|---|---|
| `packages/db/src/schema.ts` | EDIT | `customer` Tabelle + `customerRelations`. `repo` extend: `customerId`, `applyMode`. `finding` extend: composite Index. |
| `packages/db/drizzle/0008_<auto>.sql` | NEW (drizzle-gen) | Structural SQL für customer + repo.customer_id + repo.apply_mode. Backfill manuell angehängt. |
| `packages/db/drizzle/0009_<auto>.sql` | NEW (drizzle-gen) | Composite Index `(scan_id, severity)` auf finding. |
| `packages/db/drizzle/meta/_journal.json` | AUTO | drizzle-kit updates. |
| `packages/db/src/customer.test.ts` | NEW | Backfill-Test gegen Test-DB. |
| `apps/web/src/lib/cache-tags.ts` | NEW | `galaxieWorkspaceTag(id)` + Friends. |
| `apps/web/src/lib/cache-tags.test.ts` | NEW | Tag-Format-Stabilitäts-Test. |
| `apps/web/src/lib/dal/galaxie.ts` | REPLACE | Mock-Stub → echte Drizzle-Query mit Membership-Gate + unstable_cache. |
| `apps/web/src/lib/dal/galaxie.test.ts` | NEW | Membership-Gate-Test. |
| `apps/web/src/lib/customers.ts` | EDIT | `addCustomer` triggert `revalidateTag(galaxieWorkspaceTag(workspaceId))`. |
| `apps/web/src/lib/audit.ts` | EDIT | scan-complete triggert revalidateTag. |
| `apps/web/src/app/[workspace]/layout.tsx` | REWRITE | Membership-Check + notFound + redirect-to-login. |
| `apps/web/src/app/[workspace]/page.tsx` | REWRITE | getGalaxieDataForWorkspace + initialData prop. |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx` | EDIT | `initialData?` prop pass-through. |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | EDIT | `initialData?` prop. ZOOM_LEVELS von module-const zu useMemo. |
| `apps/web/src/components/galaxie/WorkspaceSwitcher.tsx` | EDIT | optional `workspaces` prop (DI). |
| `apps/web/src/lib/galaxie/mock-data.ts` | KEEP | unverändert, weiter für `/` Public-Demo. |
| `apps/web/src/lib/galaxie/mock-workspaces.ts` | KEEP | weiter für `/` Demo. |

## 5. Test-Plan

**Automatisch:**
- `pnpm test` grün (apps/web + packages/db + alle existing packages).
- Neue Tests: `customer.test.ts`, `galaxie.test.ts` (DAL), `cache-tags.test.ts`.
- Min. **23/23 vitest grün** in apps/web (20 G1-Bestand + 3 G2-neue).
- Migration round-trip: `dropdb && createdb && pnpm db:migrate` ohne Fehler.

**Manuell:**
- 2 Test-Users anlegen, User-A hat Workspace + Customers + Repos.
- User-A → `/[workspace-A-slug]?debug=1` zeigt echte Galaxie aus DB (visuell unterscheidbar von mock-Galaxie, weil andere Customer-Labels).
- User-B → `/[workspace-A-slug]` → notFound (404).
- Logout → `/[workspace-A-slug]` → redirect zu `/login?next=/[workspace-A-slug]`.
- Login + zurück zu `[workspace]`: nach `addCustomer` triggert revalidateTag → Galaxie zeigt neuen Customer ohne hard-refresh.

**Verifizierungs-Greps:**
- `grep -r "generateMockGalaxieData" apps/web/src/app/\[workspace\]/` muss 0 Treffer haben (workspace-route nutzt nicht mehr mock).
- `grep -r "MOCK_WORKSPACES" apps/web/src/app/\[workspace\]/` muss 0 Treffer haben.

## 6. Risiken + Rollback

| Risiko | Severity | Mitigation |
|---|---|---|
| Backfill-SQL schlägt fehl auf Prod-Daten (z.B. NULL labels, Unicode-Chars, sehr lange labels) | Strong | Migration nur additiv (customer-table + nullable customer_id). Backfill in einer Transaktion. Test-DB-Snapshot vor Prod-Run. Rollback = `DROP TABLE customer; ALTER TABLE repo DROP COLUMN customer_id, apply_mode`. |
| Membership-Check falsch implementiert → User sieht fremden Workspace | Strong | Vitest-Test für DAL. Plus: manuelle 2-User-E2E. Plus: code-review-Convention "DAL ist die Boundary, niemals direkter db.select() in routes". |
| `unstable_cache` API ändert sich oder hat edge-cases (Next 16 + Cache Components) | Mid | `cache-tags.ts` zentralisiert die API-Calls, sodass ein Refactor 1-Stelle-Change ist. Fallback: per-request fetch ohne cache (Performance-Hit aber funktional). |
| Mock-Data und Real-Data divergieren in Schape | Mid | Beide return identisches `GalaxieData`-Type aus `lib/galaxie/types.ts`. Plus: tsc--strict erzwingt das. |
| Slug-Collisions bei Backfill (2 Repos mit gleicher Label im selben Workspace) | Weak | `DISTINCT (workspace_id, label)` im CTE, plus `UNIQUE (workspace_id, slug)` als Hard-Constraint. Tested via customer.test.ts. |
| ZOOM_LEVELS-Refactor von module-const zu useMemo bricht Cmd+0/1/2/3/4 | Weak | useMemo mit `[initialData]`-Dep. Vitest für Camera bleibt grün. Sprint G1 hat Smoke-Test-Coverage. |

**Rollback-Pfad:**
- Branch `feat/galaxie-sprint-2-data-binding`. `git checkout main` = voller Code-Rollback.
- DB-Rollback: `0009_*.down.sql` (drizzle stellt das nicht auto; manuell): `DROP TABLE customer; ALTER TABLE repo DROP COLUMN customer_id, apply_mode; DROP INDEX finding_scan_severity_idx;`. Migration-Journal-Entry entfernen.
- Schon-deployed: Migration ist additiv, kein Datenverlust. Code-Revert reicht; DB-Spalten bleiben unbenutzt bis nächster Sprint die wieder pickt.

## 7. Open Questions

- **Q2.1:** `galaxie_layout` Cache-Tabelle (Plan §3 Sprint G2 in `phase-galaxie.md` Migration 0011) — drinlassen oder defer?
  - **Default:** Defer zu G3+. Layout ist clientside <50ms bei ≤500 Asteroiden — Server-Cache ist vorzeitige Optimierung. Wenn G3 Inspector-Drill-In Performance-Issues zeigt, dann nachholen.

- **Q2.2:** WorkspaceSwitcher auf `/[workspace]` — zeigt DB-Workspaces des Users oder weiterhin Mock?
  - **Default:** DB-Workspaces. Mock bleibt nur auf `/` Public-Demo.

- **Q2.3:** Bei nicht-eingeloggtem Zugriff auf `/[workspace]` — `notFound()` oder Redirect zu `/login?next=...`?
  - **Default:** Redirect zu `/login`. Erklärt UX besser als 404 für eingeloggbare User.

- **Q2.4:** `repo.apply_mode` Sprint G5 (Apply-Workflow) braucht das. Ist die Migration jetzt in G2 trotzdem sinnvoll (= zukünftige Migration sparen) oder erst in G5?
  - **Default:** Mitnehmen in G2. Migration ist trivial, kein Daten-Risk, spart eine spätere Migration. ADR-0001 listet das schon.

- **Q2.5:** `/customers` Route Refactor (Customer-Liste statt Repo-Liste) — in G2 oder erst G3?
  - **Default:** Erst G3 (oder eigener kleiner Plan zwischen G2 und G3). Die Migration ist additiv, /customers bleibt funktional, nur semantisch verwirrend (zeigt Repo-Label wo "Customer-Label" stehen sollte). Refactor ist mehrere Stunden, sprengt G2-Scope.

---

**Ausführungs-Trigger:** `/execute galaxie-sprint-2-data-binding` nach User-Review der 5 Open Questions.
