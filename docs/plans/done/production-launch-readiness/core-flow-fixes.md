# Plan — Bundle J · Core-Flow-Fixes

> Master: `production-launch-readiness.md` (Wave 1) · Status: 🔵 Draft
> Slug: `core-flow-fixes` · Confidence: **High** (`_synthesis.md` Dim 12, Code-Trace-verifiziert)
> Funktionale Bugs außerhalb Auth/Payment, die ein echter User trifft.

## 1. Ziel

Die von-Usern-treffbaren funktionalen Defekte schließen, die nicht in Bundle A (Auth) oder B (Payment) gehören: GitHub-Audit-Timeout, fehlender Logout, Workspace-Delete-Redirect-Loop, blockierende Solution-Generierung, Credit-TOCTOU.

## 2. Sub-Steps

**J1 — GitHub-Audit-Timeout (Kill, ~1 dd)** — `audit-action.ts:226`
`auditGithubUrl` (Haupt-Produktiv-Pfad) ignoriert `BACKGROUND_THRESHOLD` und ruft immer `runForegroundAudit` (sync + LLM) → Serverless-Timeout bei realen Repos. Fix: denselben Threshold-Branch wie der lokale Pfad (`scanRepository` → Filecount > 30 → `enqueueBackgroundAudit` via Inngest + `background:true`). Plus `maxDuration` auf Action/Route.

**J2 — Kein Logout (Strong, ~1 dd)** — `SiteNav.tsx:38`
`auth.api.signOut` ist nur Seiteneffekt von `deleteAccount`; `/account/settings` nur per Direkt-URL. Fix: User-/Account-Menü in SiteNav (+ Galaxie-HUD) mit „Sign out" (signOut-Server-Action) + Link auf `/account/settings/profile`.

**J3 — Workspace-Delete-Redirect-Loop (Strong, ~1 dd)** — `workspace-actions.ts:40`, `dashboard/page.tsx:73`
Letzten Workspace löschen → `vk_default_workspace_slug`-Cookie bleibt → `/dashboard`(leer)→`redirect('/login')`(aber authentifiziert)→`/dashboard` Loop; Proxy mappt auf stale-slug → 404. Fix: (a) Cookie in `deleteWorkspace`/`DeleteWorkspaceForm` clearen; (b) `dashboard/page.tsx` bei leerer Liste NICHT auf `/login` — stattdessen Empty-State/„Create workspace" bzw. `ensureDefaultWorkspace`.

**J4 — Solution-Generierung blockierend (Mid, ~1.5 dd)** — `solution-dal.ts:257`
`requestSolution → getOrGenerateSolution` ruft `await generateFixAsync` sync (5-30s LLM), gibt nie `pending` → das 15-Attempt-Poll-Gerüst (`AISolutionPlaceholder`) ist toter Code + Timeout-Risiko. Fix: entweder echt async (pending-Row sofort + Inngest-Job, Client pollt) ODER tote Poll-Logik entfernen + ehrlich blockierend mit Timeout-Guard.

**J5 — Audit-LLM-vor-Consume TOCTOU (Mid, ~1 dd)** — `audit-action.ts:343`
`runForegroundAudit` zahlt LLM-Kosten VOR `consumeCredits` → Pool-Race verbrennt bezahlte Tokens. Fix: Credits atomar VOR LLM-Call reservieren (hold + Rückbuchung bei Audit-Fehler).

**J6 — Invite/Revoke-UX (Weak, ~0.5 dd)** — `membership.ts:138`, `AccessForms.tsx:20`
Kein `router.refresh` nach invite/revoke (stale Liste); Settings-Members read-only, Invite/Revoke versteckt unter `/repos/[id]/access`. Fix: `router.refresh()`/`revalidateTag`; Invite/Revoke-UI nach `settings/members` ziehen.

## 3. Koordination / Out-of-Scope

- **Stripe-Abo bei Delete kündigen** (Dim 12 Strong): in Bundle B abgehandelt (braucht `getStripe`), nicht hier — aber Workspace/Account-Delete-Pfad (J3 + Bundle A) müssen den Cancel-Call aufnehmen → Cross-Bundle-Note.
- `ensureDefaultWorkspace` ownerId-vs-membership-Divergenz (Dim 12 Beobachtung): nur Drift-Surface, kein User-Bug → post-launch-Ticket.

## 4. Verifikation

Browser-Durchklick (kein neuer Test): großer GitHub-Repo → Background-Job; Logout-Button funktioniert; letzten Workspace löschen → Empty-State statt Loop; Solution-Generierung zeigt Pending/Spinner.
