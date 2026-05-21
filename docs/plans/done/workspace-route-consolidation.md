# Plan — Workspace-Route-Konsolidierung (`/scans`, `/customers`, `/requests` → `/[workspace]/*`)

> Erstellt: 2026-05-19
> Status: ✅ Done — 2026-05-19 (außer F4–F7 manuelle Browser-QA, dem User übergeben)

## Kontext-Snapshot

Zwei Vorgänger-Pläne haben die UI-Reduktion gemacht:
- `homepage-relaunch` Phase 3 hat Drift/BIP/Skills/Onboarding gelöscht, `/dashboard` zu Redirect-Stub, aber C1-C3 (Routen-Moves) deferred.
- `frontend-relaunch-v2` Phase 10 hat den Legacy-CSS-Cleanup vorgenommen, aber K1-K3 (physical File-Moves) deferred.

**Verbleibende Top-Level-Routes nach beiden Sprints:**

| Route | Status |
|---|---|
| `/` | Landing — bleibt |
| `/login` | Auth — bleibt |
| `/[workspace]` + `/[workspace]/settings/*` | Hub — bleibt, ist das Ziel |
| `/billing` | Marketing-Sub — bleibt |
| `/pricing`, `/trust/*`, `/status` | Public/Marketing — bleibt |
| `/dashboard` | Redirect-Stub — bleibt |
| **`/scans`, `/scans/[id]`** | **Migrationsziel: `/[workspace]/scans/*`** |
| **`/customers`, `/customers/[id]`, `/customers/[id]/access`, `/customers/c/[customerId]`** | **Migrationsziel: `/[workspace]/customers/*`** |
| **`/requests`** | **Migrationsziel: `/[workspace]/requests`** |

**Vorhandenes Pattern für die Zielarchitektur:**
- `/[workspace]/layout.tsx` validiert Membership via `listUserWorkspaces(userId)` → bei missing → `notFound()`.
- `/[workspace]/settings/*` sind echte workspace-scoped Sub-Routes mit `params: Promise<{ workspace: string }>`.
- `lib/dal/galaxie.ts` zeigt das DAL-Pattern: workspace-Slug → workspace-ID Resolution + Membership-Validation.
- `proxy.ts` + `middleware-redirects.ts` haben schon Legacy-Map-Einträge für `/scans` → `/{slug}/scans` (cookie-gesteuert).

**Hauptkomplexität:** Server-Actions (`auditAction`, `requestInstall`, `addCustomer`, `addRepoAction`, `decideInstall`) müssen wissen, in welchem Workspace sie operieren. Aktuell fallen sie auf `ensureDefaultWorkspace(user.id)` zurück — das Multi-Workspace-fähig zu machen ist Teil dieses Sprints.

---

## 1. Ziel

Nach Execute existieren `/scans`, `/customers`, `/requests` als Top-Level-Pfade nicht mehr — sie leben unter `/[workspace]/*` mit voller Membership-Validation und korrektem Multi-Workspace-Verhalten.

---

## 2. Endzustand

**UI/Verhalten:**
- `/<slug>/scans`, `/<slug>/scans/<id>` rendern Audit-Liste + Detail für genau den gewählten Workspace.
- `/<slug>/customers`, `/<slug>/customers/<id>`, `/<slug>/customers/<id>/access`, `/<slug>/customers/c/<customerId>` analog.
- `/<slug>/requests` zeigt Install-Requests genau dieses Workspaces (nicht mehr ownerId-global).
- Legacy-URLs `/scans`, `/customers/...`, `/requests` werden über `proxy.ts` zu `/<default-slug>/...` redirected (vorhandenes LEGACY_MAP-Pattern).
- Workspace-Switcher in der Galaxie funktioniert für alle Sub-Routes (alle Links sind `/${workspaceSlug}/...`-prefixed).
- Nicht-Member: Sub-Route gibt `notFound()`, keine 403/Datenleak.

**Code-Pfade:**
- `apps/web/src/app/scans/` existiert nicht mehr.
- `apps/web/src/app/customers/` existiert nicht mehr.
- `apps/web/src/app/requests/` existiert nicht mehr.
- `apps/web/src/app/[workspace]/scans/page.tsx` + `[id]/page.tsx`.
- `apps/web/src/app/[workspace]/customers/page.tsx` + `[id]/page.tsx` + `[id]/access/page.tsx` + `c/[customerId]/page.tsx`.
- `apps/web/src/app/[workspace]/requests/page.tsx`.
- `lib/install-requests.ts`, `lib/customers.ts`, `lib/audit-action.ts` haben Server-Actions, die einen `workspaceSlug`-Parameter oder Hidden-Form-Field konsumieren.
- `lib/workspace-context.ts` (neu): Helper `resolveWorkspaceFromSlug(slug, userId)` als zentrales Membership-Gate.

**Tests:**
- `pnpm -w typecheck` ✅
- `pnpm -w test` ✅
- `pnpm --filter @vk/web build` ✅ — Route-Liste zeigt nur 1 Top-Level für `scans`/`customers`/`requests` (alle als `/[workspace]/*`).

---

## 3. Architektur-Pattern (Konvention für den Sprint)

### 3.1 Workspace-Slug-Resolution

Neue Datei `apps/web/src/lib/workspace-context.ts`:

```typescript
import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getDb, isDbEnabled, schema } from '@vk/db';
import { and, eq } from 'drizzle-orm';

export interface ResolvedWorkspace {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
}

/**
 * Resolve a workspace slug to its row, gated by user membership.
 * Returns null when DB is off, throws notFound() on missing/forbidden.
 * `cache()` memoizes per-request so multiple DAL calls share one DB roundtrip.
 */
export const resolveWorkspaceFromSlug = cache(
  async (slug: string, userId: string): Promise<ResolvedWorkspace> => {
    if (!isDbEnabled()) notFound();
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.workspace)
      .where(eq(schema.workspace.slug, slug))
      .limit(1);
    const ws = rows[0];
    if (!ws) notFound();

    // Membership-Gate (analog lib/dal/galaxie.ts userIsMember)
    const member = await db
      .select({ role: schema.membership.role })
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.workspaceId, ws.id),
          eq(schema.membership.userId, userId),
          eq(schema.membership.status, 'active'),
        ),
      )
      .limit(1);
    const isLegacyOwner = ws.ownerId === userId;
    if (member.length === 0 && !isLegacyOwner) notFound();

    return { id: ws.id, slug: ws.slug, name: ws.name, ownerId: ws.ownerId };
  },
);
```

Diese Funktion wird in jeder Workspace-Sub-Page genutzt:

```typescript
export default async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { workspace: slug } = await params;
  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  // ws.id ist jetzt die workspace-ID für alle DAL-Calls
  const rows = await listScansForWorkspace(ws.id);
  // ...
}
```

### 3.2 Server-Action-Workspace-Context

Server-Actions kennen keine URL-Params. Zwei Optionen, kombiniert:

**A) Hidden-Form-Field-Pattern** für Forms (`<form action={action}>`):

```tsx
<form action={addCustomerAction}>
  <input type="hidden" name="workspace" value={workspaceSlug} />
  <Input name="label" />
  <Button type="submit">Add</Button>
</form>
```

Action liest `formData.get('workspace')` + validiert via `resolveWorkspaceFromSlug`.

**B) Explizites Argument** für Client-Component-Actions (über `useTransition`):

```tsx
const [pending, start] = useTransition();
function onClick() {
  start(async () => {
    await requestInstall(workspaceSlug, { ... });
  });
}
```

### 3.3 `revalidatePath` dynamisch

```typescript
revalidatePath(`/${ws.slug}/requests`);
revalidatePath(`/${ws.slug}/customers`);
```

Plus Cache-Tag-Pattern (`workspaceCacheTag(ws.id)`) wo schon vorhanden.

### 3.4 Legacy-Redirects

`proxy.ts` + `middleware-redirects.ts` haben schon `/scans` → `/{slug}/scans`, `/dashboard` → `/{slug}`. Wir erweitern LEGACY_MAP um `/customers/*` und `/requests`:

```typescript
const LEGACY_MAP: Record<string, string> = {
  '/billing': '/{slug}/settings/billing',
  '/dashboard': '/{slug}',
  '/scans': '/{slug}/scans',
  '/customers': '/{slug}/customers',
  '/requests': '/{slug}/requests',
};
```

Cookie `vk_default_workspace_slug` wird in `/[workspace]/page.tsx` gesetzt; signed-in User mit Bookmark auf `/scans` wird automatisch zu `/<slug>/scans` weitergeleitet. Anonymous-User (kein Cookie) bekommt 404 (verkraftbar — keine kritischen Bookmarks).

---

## 4. Schritte

Drei Sub-Phasen, jede unabhängig mergebar. Phase A baut das Fundament, B-D sind die Migrations.

### Phase A — Fundament

- [x] **A1** Neue Datei `apps/web/src/lib/workspace-context.ts` mit `resolveWorkspaceFromSlug(slug, userId)` (§3.1).
- [x] **A2** `proxy.ts` + `middleware-redirects.ts` LEGACY_MAP erweitern um `/customers` und `/requests` (zusätzlich zu `/scans` + `/billing` + `/dashboard`). `PUBLIC_TOP_LEVEL` aktualisieren: `/customers`, `/requests` raus.
- [x] **A3** Test-Smoke: `pnpm -w typecheck` ✅.

### Phase B — `/scans` → `/[workspace]/scans`

- [x] **B1** `git mv apps/web/src/app/scans apps/web/src/app/[workspace]/scans`.
- [x] **B2** `[workspace]/scans/page.tsx` Page-Signature `params: Promise<{ workspace: string }>` einführen, mit `resolveWorkspaceFromSlug` validieren. Inline-Query nutzt `eq(schema.scan.workspaceId, ws.id)` statt `ownerId`-Filter.
- [x] **B3** `[workspace]/scans/[id]/page.tsx` analog — `params: Promise<{ workspace: string; id: string }>`. Inline-Query mit `scan.workspaceId = ws.id` Membership-Gate.
- [x] **B4** `lib/audit-action.ts`: `ensureDefaultWorkspace` returnt jetzt `{ id, slug }`; `revalidatePath` benutzt den Slug. `AuditFormState` hat neues `workspaceSlug?: string`. `AuditForm.tsx` Background-Link nutzt `state.workspaceSlug`.
- [x] **B5** Footer-Links in `/[workspace]/scans/page.tsx` + `[id]/page.tsx` auf workspace-scoped umgestellt. Rest (`customers/[id]/page.tsx:160`, `AuditForm`-Link für Save-Variante) folgt in Phase C, wenn der workspace-Slug-Kontext dort da ist.
- [x] **B6** Build + Smoke-Test (`pnpm --filter @vk/web build`) ✅.

### Phase C — `/customers/*` → `/[workspace]/customers/*`

- [x] **C1** `git mv apps/web/src/app/customers apps/web/src/app/[workspace]/customers`.
- [x] **C2** Vier Sub-Routes auf workspace-Param refactoren — `page.tsx`, `[id]/page.tsx`, `[id]/access/page.tsx`, `c/[customerId]/page.tsx`. Membership-Gate via `resolveWorkspaceFromSlug`.
- [x] **C3** `lib/customers.ts` umbenannt → `addRepo`/`listRepos`/`getRepo` (DAL-Schicht ohne `userId`-Lookup, callerseite hat workspace-Membership schon validiert). `customer-dal.ts` ebenso (`listCustomers(workspaceId)`, `getCustomerById(workspaceId, customerId)`, etc.). `ensureDefaultWorkspace` raus aus Customer-Hot-Paths.
- [x] **C4** `AddCustomerForm.tsx` + `AddRepoForm.tsx` + `ApplyModeSelector.tsx` haben jetzt `workspaceSlug` Prop. `AccessForms.tsx` bleibt workspaceId-basiert, da die parent-Page schon `ws.id` aufgelöst hat. Hidden-Input via FormData (kein DOM-`<input type=hidden>` weil die Forms `onSubmit`-Pattern nutzen, nicht `action={}`).
- [x] **C5** `customer-actions.ts` liest `formData.get("workspace")` + ruft `resolveWorkspaceFromSlug`. Bei missing slug → `{ ok: false, error: "Missing workspace context." }`.
- [x] **C6** `revalidatePath` durchgängig workspace-scoped (`/${ws.slug}/customers`). Cache-Tags via `galaxieWorkspaceTag(ws.id)`.
- [x] **C7** Interne Links: `EmptyGalaxie`, `OnboardingBanner`, `GalaxieScene` durchgereicht. Customer-Pages haben workspace-scoped Hrefs. `RequestWriteButton` zieht jetzt `workspaceSlug` Prop (Vorgriff auf D).
- [x] **C8** Build ✅. Route-Liste zeigt `/customers/*` Top-Level WEG, alle als `/[workspace]/customers/*` Dynamic Routes.

### Phase D — `/requests` → `/[workspace]/requests`

- [x] **D1** `git mv apps/web/src/app/requests apps/web/src/app/[workspace]/requests`.
- [x] **D2** Page-Signature `params: Promise<{ workspace: string }>` + `listRequestsForWorkspace(workspaceId)` als neue DAL-Funktion. Alte `listRequestsForOwner(userId)` ersetzt.
- [x] **D3** `requestInstall(workspaceSlug, input)`. `decideInstall` revalidiert jetzt `/${slug}/requests` + `/${slug}/customers` (alter Workspace-ID-statt-Slug-Bug aus Plan-Risk #2 mit gefixt).
- [x] **D4** `RequestWriteButton.tsx` hat `workspaceSlug` Prop. `RequestActions.tsx` braucht keinen (lookup über requestId genügt — decideInstall kennt den Slug aus dem JOIN).
- [x] **D5** Page-Footer + RequestWriteButton-CTA-Link auf `/${ws.slug}/requests` umgestellt.
- [x] **D6** Build ✅. `/requests` Top-Level WEG.

### Phase E — Polish

- [x] **E1** `/[workspace]/requests/loading.tsx` neu angelegt. Scans + Customers loadings sind via `git mv` mit-verschoben worden.
- [x] **E2** Existierende `app/scans/loading.tsx`, `app/customers/loading.tsx` Files unverändert mitgewandert (Skeleton-Inhalt war workspace-agnostisch).
- [x] **E3** Page-Footer in allen Sub-Pages auf workspace-scoped Pendants umgestellt (während C/D abgehakt).

### Phase F — QA

- [x] **F1** `pnpm -w typecheck` — 23/23 Pakete grün ✅.
- [x] **F2** `pnpm -w test` — 13 Files / 74 Tests grün ✅.
- [x] **F3** `pnpm --filter @vk/web build` — Production-Build durch ✅.
- [ ] **F4** Manuell (User-Aufgabe): signed-in mit Cookie → `/scans` redirected zu `/<slug>/scans`. Anonymous → `/scans` zeigt 404 (akzeptabel).
- [ ] **F5** Manuell (User-Aufgabe): Workspace-Switcher in Galaxie wechselt korrekt zwischen Workspaces — alle Sub-Routes (Scans/Customers/Requests) zeigen workspace-spezifische Daten.
- [ ] **F6** Manuell (User-Aufgabe): nicht-Member-User mit gültiger Workspace-URL → 404, kein 403 (DataLeak vermeiden).
- [ ] **F7** Manuell (User-Aufgabe): Forms (`AddCustomerForm`, `RequestWriteButton`) — Submit landet im richtigen Workspace. `AuditForm` Background-Variante → Save+Link zeigt auf `/<slug>/scans/<id>`.

---

## 5. Files-to-Change

| Datei | Was passiert |
|---|---|
| `apps/web/src/lib/workspace-context.ts` | NEU, `resolveWorkspaceFromSlug` + Membership-Gate |
| `apps/web/src/lib/middleware-redirects.ts` | LEGACY_MAP erweitert um `/customers` + `/requests` |
| `apps/web/src/app/scans/*` | DROP (via git mv) |
| `apps/web/src/app/customers/*` | DROP (via git mv) |
| `apps/web/src/app/requests/*` | DROP (via git mv) |
| `apps/web/src/app/[workspace]/scans/page.tsx` + `[id]/page.tsx` + `loading.tsx` | NEU (gemoved + workspace-Param) |
| `apps/web/src/app/[workspace]/customers/page.tsx` + `[id]/page.tsx` + `[id]/access/page.tsx` + `c/[customerId]/page.tsx` + `loading.tsx` | NEU (gemoved + workspace-Param) |
| `apps/web/src/app/[workspace]/requests/page.tsx` + `loading.tsx` | NEU (gemoved + workspace-Param) |
| `apps/web/src/lib/customers.ts` | `addCustomer`/`getCustomer`/`listCustomers` mit workspace-Slug-Resolution |
| `apps/web/src/lib/install-requests.ts` | `requestInstall` mit workspace-Slug. Plus `listRequestsForWorkspace(workspaceId)` als neue Funktion. Dynamische `revalidatePath` |
| `apps/web/src/lib/audit-action.ts` | dynamische `revalidatePath` |
| `apps/web/src/lib/customer-actions.ts` | workspace aus FormData |
| `apps/web/src/components/AddCustomerForm.tsx` | `workspaceSlug` Prop + Hidden-Input |
| `apps/web/src/components/AddRepoForm.tsx` | analog |
| `apps/web/src/components/RequestWriteButton.tsx` | `workspaceSlug` Prop + explizites Action-Argument |
| `apps/web/src/components/RequestActions.tsx` | analog |
| `apps/web/src/app/customers/[id]/access/AccessForms.tsx` | wird gemoved + `workspaceSlug` Prop |
| `apps/web/src/components/galaxie/OnboardingBanner.tsx` | interne Links `/customers` → `/<slug>/customers` |
| `apps/web/src/components/SiteNav.tsx` | keine Änderung nötig (Drift/Customers/Requests-Links nicht in der Nav) |
| `apps/web/src/app/[workspace]/page.tsx` | Cookie `vk_default_workspace_slug` ist schon gesetzt — keine Änderung |

---

## 6. Test-Plan

**Automatisch:**
- `pnpm -w typecheck` — alle Pakete grün.
- `pnpm -w test` — Vitest-Suite. Plus neue Tests für `resolveWorkspaceFromSlug`: (a) gültige Membership → returnt Workspace, (b) keine Membership → `notFound()`, (c) ungültiger Slug → `notFound()`, (d) Legacy-Owner ohne Membership-Row → returnt Workspace (Backwards-Compat).
- `pnpm --filter @vk/web build` — Production-Build muss durch. Route-Liste sollte zeigen: `/scans`/`/customers/*`/`/requests` als Top-Level WEG, statt `/[workspace]/scans`, `/[workspace]/customers/*`, `/[workspace]/requests` als Dynamic-Routes.

**Manuell:**
- **Legacy-Redirect**: Mit Cookie `vk_default_workspace_slug` gesetzt → `/scans` redirected zu `/<slug>/scans`. Without Cookie + signed-in → ggf. weiter zu `/login` oder 404. Without Cookie + anonymous → 404.
- **Workspace-Switcher-Routing**: in `/[workspace]/page.tsx` Workspace wechseln; Sub-Pages müssen weiterhin korrekt funktionieren ohne stale-data.
- **Member-Gate**: User-A loggt sich ein, fügt Workspace-B-URL `/workspace-b/scans` in URL — soll 404 ergeben (kein 403, kein Datenleak).
- **Forms**: signed-in `<slug>/customers` → "Add customer" → Customer landet im richtigen Workspace. Plus AccessForms (approve/reject install-request) wirken auf richtigen Workspace.
- **Galaxie-Multi-Workspace**: User mit 2+ Workspaces wechselt → `/<slug>/customers` zeigt jeweils nur diesen Workspace.

---

## 7. Risiken + Rollback

**Risiken:**

1. **Server-Actions ohne Workspace-Kontext** — wenn ein Form-Submit den Hidden-Input vergisst oder ein Cookie-Read leer ist, default-fallt die Action auf `ensureDefaultWorkspace(user.id)`. Bei Multi-Workspace-Usern könnte das in den **falschen** Workspace schreiben. **Mitigation**: alle Server-Actions explizit `workspaceSlug` requiren, kein Fallback. Bei missing → return `{ ok: false, error: "Missing workspace context" }`.

2. **`decideInstall` ist schon workspace-aware** über JOIN auf `installRequest.workspaceId`, aber `revalidatePath('/customers/${row.workspace.id}/access')` ist **falsch** (Workspace-ID statt -Slug). Existierender Bug, muss in C/D mit gefixt werden.

3. **Cookie-basierter Redirect ist nicht zuverlässig** — User ohne Cookie (Inkognito-Modus, Cookie-Clear) bekommt 404 bei Bookmark-URLs. **Mitigation**: Falls Logged-In aber kein Cookie → in `proxy.ts` zusätzlich `getSessionUser()` + `listUserWorkspaces` → erstes Workspace nehmen. Aber: Proxy hat keinen DB-Zugriff (Edge-Runtime). Alternative: 404 mit hilfreichem Link "Workspace wählen → /dashboard".

4. **`AccessForms.tsx` + verwandte Server-Actions** — heißen RBAC, prüfen via `getUserRole` workspace-Membership, sind aber routenlos in `lib/install-requests.ts`. Plus `lib/customer-actions.ts` für Customer-Add-Logic. **Beide brauchen Workspace-Context-Migration**.

5. **Tests** — Plus es gibt aktuell **keine** Tests für `lib/customers.ts` oder `lib/install-requests.ts`. Refactoring ohne Test-Net ist riskanter. **Mitigation**: pragmatisch typecheck + manuelle Browser-Tests; neue Unit-Tests für `resolveWorkspaceFromSlug` (Membership-Gates) als Min.

**Rollback:**

- Alle Phasen sind Code-only (keine DB-Migrations). `git revert <merge-commit>` reicht.
- Phase A (workspace-context.ts) ist additive — Standalone-File ohne Konsumenten, kann allein als ersten Schritt gemerged werden.
- Phase B-D einzeln mergebar. Wenn z.B. Phase C kaputt geht, kann sie zurückgerollt werden ohne B oder D zu beeinträchtigen (alle drei sind unabhängig).
- `proxy.ts` LEGACY_MAP-Updates sind in `middleware-redirects.ts` zentral; ein Eintrag mehr/weniger ist trivial.

---

## 8. Open Questions

- [ ] **Anonymous-Audit-Form auf der Landing**: `AuditForm.tsx` wird auf `/` (öffentlich) und ggf. signed-in für persistente Audits genutzt. Plan-Default: nicht migrieren — der anonymous-Flow bleibt user-agnostisch. Signed-in User der "Save to workspace"-Button drückt → workspace via Hidden-Input.
- [ ] **`/customers/c/[customerId]` vs. `/customers/[id]`** — die Sub-Route `c/[customerId]` ist die "Customer-Detail" (Customer-Layer), während `/customers/[id]` die "Repo-Detail" (Repo-Layer) ist. Sehr verwirrend. Konsolidieren in diesem Sprint, oder als separater Cleanup?
- [ ] **Tests für `resolveWorkspaceFromSlug`**: separater Vitest-File `lib/workspace-context.test.ts` mit (a) member, (b) non-member, (c) legacy-owner, (d) unbekannter slug. Lohnt sich der Setup-Aufwand (DB-Test-Fixtures), oder reicht typecheck + manual?
- [ ] **`/dashboard` Redirect** — aktuell zeigt der Stub `redirect('/' + firstWorkspaceSlug)`. Soll der bleiben oder zu `/<default-slug>/scans` als Default-Landing nach Login zeigen?
- [ ] **Cookie-fallback in proxy.ts** — wenn kein Cookie, sollten signed-in User trotzdem auf ihren Default-Workspace umgeleitet werden? Erfordert DB-Zugriff im Edge-Runtime; Plan-Default: nein (404 mit Hinweis), siehe Risiko 3.
- [ ] **Phase-Reihenfolge**: A → B → C → D → E → F ist sicher, aber langsam. Optional: B+C+D parallel zwei feature-Branches. Plan-Default: sequenziell, ein PR pro Phase.

---

## 9. Out of Scope

- DB-Migrations (alles ist UI-Routing-Refactor).
- Customer-vs-Repo-DAL-Verwirrung (`getCustomer` operiert auf `schema.repo`) — separater Cleanup.
- Public-Audit-Flow auf Landing — bleibt unchanged.
- `/billing`, `/pricing`, `/trust/*`, `/status` — Marketing-Surfaces, bleiben Top-Level.
- Lint-Script-Migration auf flat-config — separater Mini-Plan (siehe `frontend-relaunch-v2` Phase 11 Q2).
- Phase 11 manuelle Browser-QA aus `frontend-relaunch-v2` — kommt nach diesem Sprint.

---

## 10. Geschätzter Aufwand

- **Phase A**: 1–2 h (workspace-context.ts + LEGACY_MAP).
- **Phase B**: 1–2 h (`/scans` ist klein, 2 Files).
- **Phase C**: 3–4 h (`/customers` ist die komplexeste, 4 Sub-Routes + 3 Forms).
- **Phase D**: 1–2 h (`/requests` ist 1 Page + 2 Forms).
- **Phase E**: 1 h (loading.tsx + Footer-Links).
- **Phase F**: 1–2 h (Tests + manuelle Browser-Walks).

**Gesamt: ~8–13 h.** Sinnvoll: drei PRs (A, B+C, D+E+F) oder vier PRs (A, B, C, D+E+F).
