# Plan — Customer-Route-Naming-Fix

> Erstellt: 2026-05-21 (als Stub)
> Status: 🟡 In Discovery — Plan-File ist Stub, **Discovery-Runden noch nicht durchgeführt**.
> Slug: `customer-route-rename`
> Confidence: **Low** — kein Discovery, kein Plan-Body, nur Problem-Statement.
> Voraussetzung: `/execute repo-health-and-workflow-overhaul` Phase 3.8 (dieser Stub).

---

## 1. Ziel (provisorisch — vor Discovery)

Customer-Routen im Workspace haben semantisch invertiertes Naming. `/[workspace]/customers/[id]` adressiert ein **Repo**, `/[workspace]/customers/c/[customerId]` adressiert einen **Customer**. Das ist ein IA-Bug, der bei jedem Customer-Iterationssprint reibungsstiftet.

**Ziel-State (zu refinen in Discovery):**

- `/[workspace]/customers/[id]` (= Repo) → `/[workspace]/repos/[repoId]`
- `/[workspace]/customers/c/[customerId]` → `/[workspace]/customers/[customerId]`
- `/[workspace]/customers/[id]/access` → `/[workspace]/repos/[repoId]/access`

Plus Edge-Redirects in `next.config.ts` + `middleware-redirects.ts`-Updates für legacy bookmarks.

## 2. Discovery-Runden (NOCH NICHT DURCHGEFÜHRT)

Dieser Plan ist als Stub angelegt. Beim echten `/plan customer-route-rename` (User-Trigger) wird der neue Discovery-First-Workflow durchlaufen:

- **Runde 1 — Scope & Intent:** Refactor / Scope (Cross-Package?) / Zeit-Schätzung / Verwandte Pläne (workspace-route-consolidation als Vorbild?)
- **Runde 2 — Risk-Surface:** DB? (vermutlich nein) / Auth? (Membership-Gate bleibt) / External-API? (GitHub-App-Webhook-URLs erwähnen die alten Pfade?) / Secrets? (nein)
- **Runde 3 — Execution-Shape:** Rollout (Edge-Redirect Pflicht), Test-Tier (vitest für `resolveWorkspaceFromSlug`?), Existing-Pattern (`done/workspace-route-consolidation.md`), Out-of-Scope

## 3. Identifizierte Findings aus Repo-Health-Audit 2026-05-21

- `apps/web/src/app/[workspace]/customers/[id]/page.tsx:9` importiert `getRepo` (Repo!) — Pfad-Param `[id]` ist ein Repo-ID.
- `apps/web/src/app/[workspace]/customers/c/[customerId]/page.tsx:32` Pfad-Param ist Customer-ID, korrekt benannt.
- `/customers/[id]/access` Action-Files in `AccessForms.tsx`.
- `customers/page.tsx:81, 103` linkt zu `customers/c/{c.id}` (Customer-Detail).
- `c/[customerId]/page.tsx:133` linkt zu `customers/{r.id}` (Repo-Detail).
- `middleware-redirects.ts:5–8` hat legacy-customer-bookmark-Map.

Migration-Surface: ~8 Files, ~12 Link-Stellen. Plus Edge-Redirects.

## 4. Out-of-Scope

- DB-Schema-Änderungen (Tables bleiben `customer` und `repo` — nur Route-Naming wird gefixt).
- `nova-2-settings-backend.md` Settings-Sections sind separater Sub-Plan.

## 5. Bei `/plan customer-route-rename` (Dogfooding-Slot)

Dieser Stub markiert den ersten echten Test des neuen Discovery-First-Workflows. Empfohlene Reihenfolge:

1. User triggert `/plan customer-route-rename`.
2. Claude lädt diesen Stub als Context-Input.
3. Claude führt Discovery-Runden 1–3 durch.
4. Stub wird durch echten Plan-File ersetzt (gleicher Pfad).
5. `/execute customer-route-rename` startet Implementation.
