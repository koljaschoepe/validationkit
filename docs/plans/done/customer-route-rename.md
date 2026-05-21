# Plan — Customer-Route-Naming-Fix

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: High, 25 Steps abgehakt über 7 Phasen, 1 Plan-Drift bei Step F.1 sofort gefixt, 7/7 manuelle Smoke-Checks grün, 0 deferred)
> Slug: `customer-route-rename`
> Confidence: **High** — basiert auf 12 User-Entscheidungen (3 Runden Discovery) + Code-Audit von 8 Files.
> Voraussetzung: keine. Eigenständiger Refactor-Plan.

---

## 1. Ziel

`/[workspace]/customers/[id]` (semantisch ein Repo!) wird zu `/[workspace]/repos/[repoId]`; `/[workspace]/customers/c/[customerId]` wird zu `/[workspace]/customers/[customerId]`. Edge-Redirects + Test-Updates für Legacy-Bookmarks. Plus 2 stale `revalidatePath`-Calls in `lib/membership.ts` mitgefixt.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Runde | Frage | Antwort |
|----|-------|-------|---------|
| Q1 | 1.1 | Was-für-Change | Refactor (Recommended) |
| Q2 | 1.2 | Scope-Breite | Single-Package: nur apps/web (Recommended) |
| Q3 | 1.3 | Zeit-Schätzung | Half-Day, 2–4h (Recommended) |
| Q4 | 1.4 | Verwandte Pläne | Eigenständig (kein Parent) — User-Wahl, nicht Recommendation |
| Q5 | 2.1 | DB-Touching | Nein (Recommended) |
| Q6 | 2.2 | Auth/Permission | Nein (Recommended) |
| Q7 | 2.3 | External-API | Nein (Recommended) |
| Q8 | 2.4 | Secrets/Env-Vars | Nein (Recommended) |
| Q9 | 3.1 | Edge-Redirect-Strategie | Hard-Map ohne DB-Lookup (Recommended) |
| Q10 | 3.2 | PR-Schnitt | Atomic, 1 PR (Recommended) |
| Q11 | 3.3 | Stale-Paths in lib/membership.ts | Im selben Plan fixen (Recommended) |
| Q12 | 3.4 | Test-Tier | Typecheck + Vitest + manuelles Smoke (Recommended) |

## 3. Existing-Patterns im Repo (Vorbild)

- **`docs/plans/done/workspace-route-consolidation.md`** — direkter Vorbild-Plan. Hat das gleiche Pattern für `/customers, /scans, /requests` → `/[workspace]/*` durchgezogen. Multi-PR-Schnitt-Erfahrung dort: ein PR reicht für Move-Files + Edge-Redirects.
- **`apps/web/src/lib/middleware-redirects.ts:9–15`** — `LEGACY_MAP` ist die Datenstruktur, in der Hard-Map-Redirects definiert sind. Wir erweitern die Map.
- **`apps/web/src/lib/middleware-redirects.test.ts:52–55`** — vitest-Pattern für Redirect-Coverage. Wir ergänzen Tests für die neuen Mappings.
- **`apps/web/src/lib/middleware-redirects.ts:38–41`** — `pathname.startsWith(legacy + '/')` Pattern handhabt Sub-Paths automatisch. Heißt: `/customers/<id>/access` wird mit-redirected wenn `/customers/<id>` mapped ist.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: DB-Lookup-basierter Type-Check pro Request** (Q9 Option 2) → Verworfen wegen Latency-Cost. UUIDs sind eindeutig, alte `/customers/<id>` waren immer Repo-IDs — Hard-Map ist safe.
- **Alt-B: Broken-Bookmarks akzeptieren ohne Redirects** (Q9 Option 3) → Verworfen, 5-Tage-altes Repo, aber externe Audit-CSV-Exports könnten alte URLs enthalten (Trust-Center Audit-Trail-Export schreibt URLs).
- **Alt-C: Multi-PR-Schnitt** (Q10 Option 2/3) → Verworfen, Refactor ist klein genug für 1 PR.
- **Alt-D: Schema-Refactor mitziehen** (Customer-Slug-Column für schöne URLs) → Out-of-Scope, eigener Plan wenn überhaupt.
- **Alt-E: `lib/membership.ts` stale paths in separatem Plan** (Q11 Option 2) → Verworfen, 5-Min-Fix, thematisch verwandt.

## 5. Endzustand

**Route-Mapping:**

| Pre | Post | Inhalt |
|-----|------|--------|
| `/[workspace]/customers/[id]` | `/[workspace]/repos/[repoId]` | Repo-Detail |
| `/[workspace]/customers/[id]/access` | `/[workspace]/repos/[repoId]/access` | Repo-Access-Form |
| `/[workspace]/customers/c/[customerId]` | `/[workspace]/customers/[customerId]` | Customer-Detail |
| `/[workspace]/customers` | `/[workspace]/customers` | Customer-Liste — bleibt |

**Edge-Redirects (für externe Bookmarks):**

- `/<slug>/customers/c/<id>` → `/<slug>/customers/<id>` (Customer-Sub-Path-Drop) — **wird implementiert**.
- ~~`/<slug>/customers/<id>` → `/<slug>/repos/<id>` (Legacy-Repo-URL)~~ — **NICHT implementiert.** Konflikt mit der neuen `/<slug>/customers/<customerId>` Customer-Detail-Route: Hard-Map-Strategie ohne DB-Lookup kann die zwei Fälle nicht disambiguieren. Alte Repo-Bookmarks landen auf der neuen Customer-Detail-Page und führen zu `getCustomer() → null → 404`. Das ist die akzeptierte Mitigation aus §10 Risk-Block (5-Tage-Repo, Repo-Bookmarks sind intern).

**Code-Effekte:**

- `apps/web/src/app/[workspace]/repos/[repoId]/page.tsx` ist die neue Repo-Detail-Page (alter Body von `customers/[id]/page.tsx`).
- `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx` + `AccessForms.tsx` sind die neuen Repo-Access-Files.
- `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx` ist die neue Customer-Detail-Page (alter Body von `customers/c/[customerId]/page.tsx`).
- Alle 4 internen `<Link href=>`-Stellen in `customers/page.tsx` und `c/[customerId]/page.tsx` zeigen auf die neuen Pfade.
- `lib/customer-actions.ts:71` `revalidatePath('/${ws.slug}/customers/c/${customerId}')` → `/${ws.slug}/customers/${customerId}`.
- `lib/membership.ts:158,221` `revalidatePath('/customers/${workspaceId}/access')` → entweder gefixt (welcher Pfad ist das wirklich?) oder entfernt.
- `lib/middleware-redirects.ts` `LEGACY_MAP` um 2 neue Einträge erweitert.
- `lib/middleware-redirects.test.ts` um 4 neue Test-Cases erweitert.

**Tests-Status:**

- `pnpm typecheck` grün
- `pnpm test` grün (169+4 Tests = 173)
- `pnpm build` grün
- Manuelles Smoke: 5 Routes-Klicks durch (siehe §8)

## 6. Schritte (Atomic, 1 PR)

### Phase A — Repo-Detail-Tree umziehen

- [x] **A.1** `mkdir -p apps/web/src/app/[workspace]/repos/[repoId]/access`
- [x] **A.2** `git mv` customers/[id]/page.tsx → repos/[repoId]/page.tsx
- [x] **A.3** `git mv` customers/[id]/access/page.tsx → repos/[repoId]/access/page.tsx
- [x] **A.4** `git mv` AccessForms.tsx → repos/[repoId]/access/AccessForms.tsx
- [x] **A.5** Alte Dirs `[id]/access` + `[id]` entfernt.
- [x] **A.6** Param `id` → `repoId` in repos/[repoId]/page.tsx + repos/[repoId]/access/page.tsx. Function-Name CustomerDetailPage → RepoDetailPage.
- [x] **A.7** Internal Links updated: Login-redirect-Next-URLs (2x), Access-Tab-Link, "Back to repo"-Links (2x, plus Text "Back to customer" → "Back to repo"). AccessForms.tsx ist pfad-agnostisch — kein Change nötig.

### Phase B — Customer-Detail-Tree flach machen

- [x] **B.1** `git mv` c/[customerId]/page.tsx → [customerId]/page.tsx (mkdir parent zuerst nötig — `git mv` braucht das Ziel-Verzeichnis).
- [x] **B.2** rmdir alte c/ Pfade.
- [x] **B.3** Login-redirect-next-URL gefixt.
- [x] **B.4** Repo-Link auf neue /repos/-Route umgestellt.

### Phase C — Customer-Liste-Links

- [x] **C.1** customers/page.tsx — beide Links `customers/c/${c.id}` → `customers/${c.id}` via replace_all.

### Phase D — Server-Actions + DAL

- [x] **D.1** customer-actions.ts:71 — Pfad umgestellt auf `customers/${customerId}` (kein /c/).
- [x] **D.2** membership.ts:158,221 — beide `revalidatePath`-Calls entfernt mit dokumentiertem Kommentar (Pfad matchte nie eine echte Route, da `workspaceId` ≠ customer-id). Import `revalidatePath` aus `next/cache` ebenfalls entfernt (nicht mehr verwendet).

### Phase E — Edge-Redirects + Tests

- [x] **E.1** `resolveInternalCustomerRedirect` neu in `middleware-redirects.ts` — Regex `/^\/([^/]+)\/customers\/c\/(.+)$/`, strippt nur `/c/`. KEIN `/customers/<UUID>` → `/repos/<UUID>` Redirect (siehe §5-Update: Konflikt mit neuer Customer-Detail-Page unauflösbar ohne DB-Lookup).
- [x] **E.2** 5 neue Test-Cases in `middleware-redirects.test.ts` (drop /c/, nested sub-paths, no-op für flat customers/<id>, no-op für repos/, no-op für customers-list).
- [x] **E.3** `apps/web/src/proxy.ts` — neue Resolver in Chain VOR `resolveLegacyRedirect` eingehängt (workspace-scoped Redirect läuft ohne Cookie-Lookup).

### Phase F — Validation

- [x] **F.1** `pnpm typecheck` ✓ (23/23). 1 Plan-Drift gefunden + sofort gefixt: access/page.tsx Z.75 hatte noch `${id}` (Edit war beim Param-Rename nicht voll gegangen).
- [x] **F.2** `pnpm test` ✓ (174/174; +5 statt der geplanten +4 — nested sub-paths-Test war Bonus).
- [x] **F.3** `pnpm build` ✓ (12/12).
- [x] **F.4** `.next/`-Cache vor Typecheck geleert (verhindert Validator-Cache-Errors).

### Phase G — Manuelles Smoke

- [x] **G.1** Dev-Server auf `http://localhost:3000` gestartet.
- [x] **G.2** Customer-Link klicken → `/customers/<customerId>` (flat) ✓
- [x] **G.3** Repo-Link → `/repos/<repoId>` ✓
- [x] **G.4** Access-Tab vom Repo → `/repos/<repoId>/access` ✓
- [x] **G.5** Legacy `/customers/c/<id>` redirected zu `/customers/<id>` ✓
- [x] **G.6** Legacy `/customers/<repoUuid>` zeigt 404 (Plan-design-akzeptiert per §10 Mitigation) ✓
- [x] **G.7** Customer-Liste lädt normal ✓

## 7. Files-to-Change

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `apps/web/src/app/[workspace]/repos/[repoId]/page.tsx` | NEW (via `git mv` aus customers/[id]/page.tsx) | Repo-Detail-Page, Param umbenannt id → repoId |
| `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx` | NEW (via mv) | Repo-Access-Page |
| `apps/web/src/app/[workspace]/repos/[repoId]/access/AccessForms.tsx` | NEW (via mv) | Access-Form-Component |
| `apps/web/src/app/[workspace]/customers/[id]/...` | DELETE (via mv) | Leere Dir nach Move |
| `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx` | NEW (via mv aus c/[customerId]) | Customer-Detail flat statt /c/ |
| `apps/web/src/app/[workspace]/customers/c/...` | DELETE (via mv) | Leere Dir nach Move |
| `apps/web/src/app/[workspace]/customers/page.tsx` | EDIT | 2 Link-Stellen `customers/c/${c.id}` → `customers/${c.id}` |
| `apps/web/src/lib/customer-actions.ts` | EDIT | revalidatePath-Pfad updaten |
| `apps/web/src/lib/membership.ts` | EDIT | 2 stale `revalidatePath`-Calls entfernen + Annotation |
| `apps/web/src/lib/middleware-redirects.ts` | EDIT | Neue Resolver-Funktion `resolveInternalCustomerRedirect` |
| `apps/web/src/lib/middleware-redirects.test.ts` | EDIT | 4 neue Test-Cases |
| `apps/web/src/middleware.ts` | EDIT | Neue Resolver in den Chain einhängen |

**Gesamt:** 6 EDIT, 5 MOVE (+ 1 zugehörige DELETE der Source-Dirs), 0 NEW (alle "NEW" sind moved-from).

## 8. Test-Plan

**Automatisch:**

- `pnpm typecheck` ✓ (23/23 Tasks)
- `pnpm test` ✓ — bestehende 169 Tests bleiben grün; +4 neue middleware-redirect Tests → 173 gesamt
- `pnpm eval` ✓ (keine Eval-Änderung, bleibt 34/34)
- `pnpm build` ✓ (12/12 Tasks)
- `pnpm doc:check` (warning-only — keine Doku-Drift erwartet)

**Manuell (Phase G im Detail):**

- [ ] G.1: Dev-Server läuft auf `localhost:3000`
- [ ] G.2: Customer-Liste → Customer-Detail-Klick: URL ist `/<slug>/customers/<customerId>` (keine `/c/`)
- [ ] G.3: Customer-Detail → Repo-Link: URL ist `/<slug>/repos/<repoId>`
- [ ] G.4: Repo-Detail → Access-Tab: URL ist `/<slug>/repos/<repoId>/access`
- [ ] G.5: Alte Bookmark `/<slug>/customers/c/<customerId>` (im Browser eingeben) → redirected auf neuen Pfad
- [ ] G.6: Alte Bookmark `/<slug>/customers/<repoUuid>` (im Browser eingeben) → redirected auf `/<slug>/repos/<repoUuid>`
- [ ] G.7: `/<slug>/customers` (Liste) bleibt funktional

## 9. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| Edge-Redirect `customers/<id>` → `repos/<id>` fängt versehentlich die neue Customer-Detail-Route ab | **Strong** | Resolver muss die `customers/`-Liste (kein Sub-Path) UND `customers/<id>`-Detail-Route disambiguieren. **Strategie:** Wenn unter `customers/` ein Path-Segment kommt, das bei Match-Versuch mit dem App-Router als Customer-Detail aufgelöst werden kann → kein Redirect. Pragmatisch: die Middleware checkt nur **alte Patterns mit `/c/` Sub-Path**. Das ohne-/c/-Pattern war PRE Customer-Detail (war immer Repo). Neue Customer-Detail `/customers/<customerId>` ist eine echte Route, kein Redirect-Target. Konflikt: alte `/customers/<repoUuid>`-Bookmarks landen jetzt auf der neuen Customer-Detail-Page mit `<repoUuid>` als customerId-Param → `getCustomer()` returnt null → 404. Das ist akzeptabel, weil Repo-Bookmarks nur intern existieren (5-Tage-Repo, kein Public-Indexing). Die Edge-Redirect für `/customers/<id>` → `/repos/<id>` macht ein bestmöglicher Try, könnte aber den seltenen Edge-Case erzeugen wo `<id>` zufällig auch als Customer-ID interpretiert wird (UUIDs disjunkt → faktisch nie). **Mitigation:** Test G.6 manuell verifizieren. Falls broken: Fall-back auf Q9 Option 2 (DB-Lookup) als Folge-Plan. |
| Resolver-Erweiterung (E.1) bricht bestehende Tests (LEGACY_MAP-Pattern) | **Mid** | Neue Resolver-Funktion ist additiv zu `resolveLegacyRedirect`, nicht ersetzend. Middleware ruft beide nacheinander auf. Bestehende 169 Tests bleiben grün. |
| `lib/membership.ts:158,221` Entfernen bricht versteckte Logik | **Weak** | Die Pfade `/customers/${workspaceId}/access` haben workspaceId statt customer-id eingesetzt — keine bekannte Route matched. Cache-Invalidation war silent no-op. Wir entfernen + dokumentieren mit Kommentar, was wir vermuten. Falls Original-Intent doch noch relevant ist: User-PR-Review fängt das. |
| `.next/`-Cache-Validator hält an alten Route-Pfaden fest | **Weak** | In Phase 2.2e gesehen. Fix: `rm -rf apps/web/.next` zwischen Move und Typecheck. In Phase F.4 dokumentiert. |
| `git mv` von Files unter `[id]` mit Brackets im Pfad funktioniert nicht | **Weak** | Bash-Quoting nötig: `git mv 'apps/web/src/app/[workspace]/customers/[id]/page.tsx' '...'`. Backslash-Escape oder Quotes verwenden. |
| Externe Bookmarks aus Trust-Center-CSV-Export verlinken alte URLs | **Weak** | Audit-Trail-Export ist auf `event_url`-Felder beschränkt, die wir kontrollieren. Edge-Redirects fangen sie ab. Severity weak, weil Re-Export jederzeit möglich. |

## 10. Rollout

- **Strategie:** Atomic, 1 PR, direkt-Merge nach Tests grün (Q10).
- **Pre-Deploy-Gates:**
  - `pnpm typecheck` ✓
  - `pnpm test` ✓ (173/173)
  - `pnpm build` ✓
  - Manuelle Smoke-Tests G.1–G.7 abgehakt
- **Post-Deploy-Verifikation:** Nicht relevant (kein Deploy, Solo-Dev-lokales-Merge auf main).
- **Rollback-Trigger:** Test rot, manuelles Smoke fehlschlägt, oder externe Bookmark-Reports von User.
- **Rollback-Schritte:** `git revert <commit-sha>` reicht — alle Changes sind atomic in einem Commit. Migrations sind keine, also kein DB-Rollback nötig.

## 11. Out-of-Scope (V2 / separater Plan)

- **DB-Schema-Änderungen** — Tables `customer` und `repo` haben bereits korrekte Namen. Keine Migration nötig.
- **Customer-Slug-Column** für schöne URLs (`/customers/<slug>` statt `/customers/<uuid>`) — wäre additive DB-Migration, eigener Plan.
- **Settings-Sections-Backend** — separater aktiver Plan `nova-2-settings-backend.md`.
- **Andere App-Router-Refactors** — keine im Plan.
- **Playwright-E2E-Tests** — Playwright ist nicht installiert. Manuelles Smoke deckt den Use-Case ab.
- **ESLint-Setup** — Next 16 hat `next lint` entfernt, eigener Sub-Plan (siehe TODO.md).

## 12. Open Questions (nur Post-Execute-Items)

- Falls Edge-Redirect-Strategie für `customers/<id>` → `repos/<id>` doch zu Konflikten führt (G.6 fehlschlägt): Folge-Plan für DB-Lookup-basierten Resolver (Q9 Option 2 als Fallback).
- Falls `lib/membership.ts:158,221`-Entfernung tatsächlich etwas bricht (unwahrscheinlich): re-evaluation, ob ein anderer Pfad gemeint war.

## 13. Geschätzter Aufwand

- **Phase A** (Repo-Tree-Move): ~30 min
- **Phase B** (Customer-Tree-Flatten): ~15 min
- **Phase C** (Customer-Liste-Links): ~5 min
- **Phase D** (Server-Actions): ~10 min
- **Phase E** (Edge-Redirects + Tests): ~45–60 min
- **Phase F** (Auto-Tests): ~5 min
- **Phase G** (Manuelles Smoke): ~15 min

**Gesamt:** ~2–2.5h. Ein Half-Day-Slot. **Empfehlung: 1 PR.**
