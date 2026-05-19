# Plan — Galaxie Sprint G3: Inspector + Drill-In

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Slug: `galaxie-sprint-3-inspector`
> Branch: `feat/galaxie-sprint-3-inspector`
> Outcome: Inspector mit Deep-Link funktional · 3 Tabs gerendert · Click-Drill-In für Customer/Repo/File · `/customers` zeigt echte Customer-Liste · `/customers/c/[customerId]` Detail mit Repo-Tabelle + AddRepoForm.

---

## 1. Ziel

Click auf Asteroid öffnet URL-synchronisierten Inspector mit Finding-Detail / Why-Important / AI-Solution-Placeholder. Click auf Customer-Star / Repo-Moon triggert GSAP-Camera-Tween. `/customers` zeigt endlich die echte Customer-Tabelle aus G2.

## 2. Endzustand

**Galaxie-Interaktion (`/[workspace]`):**
- Click auf **FileAsteroid** → Side-Panel slidet rechts ein, URL aktualisiert auf `/[workspace]?file=<finding-id>`. Browser-Refresh hält den Zustand. Cmd+W oder X-Button schließt → URL räumt `?file=` weg.
- Click auf **CustomerStar** → Camera-Tween auf Customer-Cluster (scale 1.7, focus auf Customer-Position). Kein Panel.
- Click auf **RepoMoon** → Camera-Tween auf Repo (scale 3.5, focus auf Repo-Position). Kein Panel.
- Click auf leere Galaxie-Fläche → schließt Panel falls offen.

**Inspector-Panel (`Inspector.tsx`):**
- 380px breit, slide-in von rechts, GSAP-Animation (300ms ease-out), `pointer-events-auto`.
- Header: File-Path + Severity-Badge + X-Button (schließt + URL-cleanup).
- 3 Tabs (Radix Tabs):
  - **Detail**: Finding title + detail + category + deterministic-Flag + citations (wenn vorhanden). Echte Daten aus DB via DAL.
  - **Why important**: pro `finding.category` ein curated Static-Markdown-Blurb (`inspector-templates.ts`). Erklärt für Lena, warum dieses Finding-Pattern wichtig ist (~3 Sätze, Persona-spezifisch).
  - **AI Solution**: Placeholder "Coming in Sprint G4 — AI-generated edits as PR or Direct-Commit." Plus Mock-Diff-Skelett (read-only Code-Block, fake hunks, "Apply"-Button disabled) damit das Layout schon stimmt.

**Deep-Link-Verhalten:**
- `/[workspace]?file=<id>` öffnet Galaxie + Inspector + tweent Camera auf Datei-Position.
- Bei Reload bleibt Inspector offen, Camera bei Datei-Position.
- Bei `file=<unknown-id>` → Panel öffnet nicht, URL räumt sich selbst auf, leise.

**`/customers` Route-Refactor:**
- `/customers` zeigt echte Customer-Liste aus DB (statt Repos-as-Customers).
- Jeder Customer: Label + Slug + Repo-Count + Aggregate-Severity-Badge + Default-Apply-Mode.
- Click → `/customers/[customerId]` (Slug- oder UUID-basiert) zeigt Customer-Detail mit Repos-darunter-Tabelle.
- `AddCustomerForm` wird gesplittet:
  - "Add Customer" Button im `/customers`-Header → öffnet Dialog, anlegt nur `customer` (label).
  - "Add Repo" Button in `/customers/[customerId]`-Header → öffnet Dialog, anlegt `repo` mit `customer_id = <currentCustomer>`.
- `lib/customers.ts` `addCustomer` wird umgebaut: legt customer-Record an (statt repo). Neue Function `addRepoUnderCustomer(label, rootPath, customerId)` legt den Repo mit FK an.

**Tests grün:**
- `pnpm test` 38+ vitest grün (35 G2-Bestand + ~3 G3-neue für inspector-templates + customer-dal).
- `pnpm typecheck` grün.
- `pnpm build` grün.

## 3. Schritte

### A. Inspector-Panel UI (~6h)

- [x] `apps/web/src/components/galaxie/Inspector.tsx` (NEU): Side-Panel mit slide-in, Radix Tabs, X-Button. Props: `finding: FileNode`, `onClose: () => void`.
- [x] `apps/web/src/components/galaxie/inspector-templates.ts` (NEU): `WHY_IMPORTANT_BY_CATEGORY: Record<string, string>` mit 6 Curated-Markdown-Blurbs (1 pro Finding-Category).
- [x] `apps/web/src/components/galaxie/AISolutionPlaceholder.tsx` (NEU): read-only Mock-Diff mit "Coming in G4"-Banner + disabled Apply-Button.
- [x] Falls Radix-`tabs` noch nicht installiert: `pnpm --filter @vk/web add @radix-ui/react-tabs`.

### B. Click-Handler in Pixi-Subclasses + GalaxieScene (~3h)

- [x] `FileAsteroid.ts`: bereits `eventMode='static'`. Kein Sub-Class-Change nötig — click bubbled via `world.on('pointertap', ...)`.
- [x] `CustomerStar.ts` + `RepoMoon.ts`: `eventMode='static'` + `cursor='pointer'` setzen (analog zu FileAsteroid).
- [x] `GalaxieScene.tsx`: neuer `world.on('pointertap', ...)`-Listener neben den existing pointerover/pointerout. Switch:
  - target instanceof FileAsteroid → openInspector(file.id) + tweenTo (focus on file pos at scale 3.5).
  - target instanceof CustomerStar → tweenTo computed customer-cluster (scale 1.7).
  - target instanceof RepoMoon → tweenTo computed repo (scale 3.5).
- [x] `useGesture` drag-handler hat `filterTaps: true` (schon aktiv) — tap-events laufen separat zu drag, kein Konflikt.

### C. URL-Sync + Deep-Link (~3h)

- [x] `GalaxieScene.tsx`: `inspectorFileId` als state. useEffect liest `searchParams.get('file')` beim Mount → setzt state + tweent Camera zur Datei.
- [x] `openInspector(fileId)`: `router.replace(\`?file=\${fileId}\`, { scroll: false })`, setState.
- [x] `closeInspector()`: `router.replace(window.location.pathname, { scroll: false })`, setState(null).
- [x] `[workspace]/page.tsx`: searchParams sind in Next 16 server-side verfügbar. KEINE Änderung dort, Client-Component liest's selbst.

### D. DAL-Erweiterung (~2h)

- [x] `lib/dal/galaxie.ts`: neue Function `getFindingById(workspaceId, fileId)` für Inspector-Refresh-Fall (falls man später Deep-Fetch will). Für G3 reicht: Inspector nimmt die `FileNode` aus dem im Memory geladenen `GalaxieData`.
- [x] `lib/customer-dal.ts` (NEU): `listCustomers(userId, workspaceId)` → query echte `customer`-Tabelle mit Repo-Count + Aggregate-Severity-Berechnung. Returnt `CustomerListItem[]`.
- [x] `lib/customer-dal.ts`: `getCustomerById(userId, customerId)` → query Customer + zugehörige Repos. Membership-Gate.
- [x] `lib/customer-dal.ts`: `addCustomer(userId, label)` → insert customer-Record, return id. `updateTag(galaxieWorkspaceTag(workspaceId))`.
- [x] `lib/customer-dal.ts`: `addRepoUnderCustomer(userId, customerId, label, rootPath)` → insert repo mit customer_id. updateTag.

### E. `/customers` Route Refactor (~4h)

- [x] `app/customers/page.tsx`: import `listCustomers` from `customer-dal`, table mit Customer-Rows. Severity-Badge nutzt aggregate-Severity. "Add Customer"-Button öffnet Dialog.
- [x] `app/customers/[customerId]/page.tsx`: Replace existing `[id]`-Route. Lädt customer + repos (DAL-Call). Repos in einer Tabelle. "Add Repo"-Button öffnet Dialog mit pre-selected customer-id.
- [x] `app/customers/[id]/access/`: vermutlich noch valid (write-access-grant flow). Lass unangetastet, nur ggf. route-rename anpassen.
- [x] `components/AddCustomerForm.tsx`: refactor zu Dialog-based, neuer `AddCustomerDialog` (Customer) + `AddRepoDialog` (Repo).
- [x] `lib/customers.ts`: deprecate old `addCustomer(label, rootPath)` (das war effectively addRepo). Beibehalten als Compat-Shim falls noch wo aufgerufen. Hauptlogik wandert nach `customer-dal.ts`.

### F. Camera-Targets aus realer Layout-Position (~1h)

- [x] `GalaxieScene.tsx` `tweenTo(target)` ist schon da. Neue Helper: `getTweenTargetForNode(nodeId, scale)` der die Layout-Position aus `layoutById` holt + ZoomLevel-Form returnt.
- [x] Customer-click-handler: `tweenTo(getTweenTargetForNode(customer.id, 1.7))`.
- [x] Repo-click-handler: `tweenTo(getTweenTargetForNode(repo.id, 3.5))`.
- [x] File-click-handler: `tweenTo(getTweenTargetForNode(file.id, 5))` + openInspector.

### G. Tests (~2h)

- [x] `apps/web/src/components/galaxie/inspector-templates.test.ts` (NEU): verifizieren dass jede Finding-Category einen Why-Important-Blurb hat + Fallback funktioniert.
- [x] `apps/web/src/lib/customer-dal.test.ts` (NEU): Pure-Logic-Tests für aggregate-Funktionen (kein DB-Mock; analog zu galaxie.test.ts in G2).
- [x] Manuelle Browser-Smoke (Playwright):
  - `/ws-PjHTS2qA-mp8yisgv` → click auf Asteroid → Inspector öffnet rechts, URL hat `?file=`.
  - Reload mit `?file=<id>` → Inspector öffnet pre-mounted + Camera ist gezoomt.
  - Click X → Panel zu, URL clean.
  - Click auf CustomerStar → Tween, kein Panel.
  - `/customers` → Customer-Liste (1 Eintrag "Sample-Bad Demo").
  - `/customers/<id>` → Detail mit 1 Repo darunter.

### H. Build + Sprint-Close

- [x] `pnpm typecheck && pnpm test && pnpm build` alle grün.
- [x] Plan-File-Boxen abhaken, Status auf ✅ Done.
- [x] `mv docs/plans/galaxie-sprint-3-inspector.md docs/plans/done/`.

## 4. Files-to-Change

| Datei | Aktion | Was |
|---|---|---|
| `apps/web/src/components/galaxie/Inspector.tsx` | NEW | Side-Panel-Component (Radix Tabs + slide-in via GSAP). |
| `apps/web/src/components/galaxie/inspector-templates.ts` | NEW | Why-Important-Blurbs pro Finding-Category. |
| `apps/web/src/components/galaxie/inspector-templates.test.ts` | NEW | Coverage-Guard für Templates. |
| `apps/web/src/components/galaxie/AISolutionPlaceholder.tsx` | NEW | Mock-Diff + Coming-in-G4-Banner. |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | EDIT | `pointertap`-Handler, Inspector-State, URL-Sync via router. |
| `apps/web/src/components/galaxie/pixi/CustomerStar.ts` | EDIT | `eventMode='static'` + `cursor='pointer'`. |
| `apps/web/src/components/galaxie/pixi/RepoMoon.ts` | EDIT | `eventMode='static'` + `cursor='pointer'`. |
| `apps/web/src/lib/dal/galaxie.ts` | EDIT | Optional: `getFindingById` helper (Future-proofing). |
| `apps/web/src/lib/customer-dal.ts` | NEW | `listCustomers` / `getCustomerById` / `addCustomer` / `addRepoUnderCustomer` mit Membership-Gate + updateTag. |
| `apps/web/src/lib/customer-dal.test.ts` | NEW | Aggregate-Logik-Tests. |
| `apps/web/src/lib/customers.ts` | EDIT | Old API wird Compat-Shim, ruft `customer-dal` intern. |
| `apps/web/src/app/customers/page.tsx` | REWRITE | Customer-Liste statt Repo-Liste. AddCustomerDialog-Trigger. |
| `apps/web/src/app/customers/c/[customerId]/page.tsx` | NEW | Customer-Detail + Repos-Tabelle. AddRepoDialog-Trigger. Sub-Pfad `/c/` vermeidet Route-Konflikt mit dem existing `[id]` (Repo-Detail + Access). |
| `apps/web/src/app/customers/[id]/page.tsx` | KEEP | Alte Repo-Detail-Page bleibt. Customer-Liste linkt zu `/customers/c/<customerId>`, Customer-Detail linkt zu `/customers/<repoId>` für Repo-Detail. |
| `apps/web/src/app/customers/[id]/access/page.tsx` | KEEP | Write-Access-Grant-Flow bleibt repo-scoped. Wird in G6 Polish customer-scoped refactored. |
| `apps/web/src/components/AddCustomerForm.tsx` | REFACTOR | Zu `AddCustomerDialog` (nur Customer). Neuer `AddRepoDialog` für Repo-Add. |
| `apps/web/package.json` | EDIT | `@radix-ui/react-tabs` (falls fehlt). |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` grün (alle neuen + modified files).
- `pnpm test` grün — mindestens **38/38 vitest** (35 G2 + 3 G3-neue).
  - `inspector-templates.test.ts` (alle 6 Categories haben Blurb + Fallback)
  - `customer-dal.test.ts` (aggregate-Helper)
  - ggf. Severity-Edge-Cases dazu
- `pnpm build` grün — alle Routes kompilieren, kein SSR-Crash mit Inspector.

**Manuell (Playwright wo möglich, sonst User):**
- `/ws-PjHTS2qA-mp8yisgv?debug=1` → click auf einen der 4 Asteroiden → Inspector öffnet, URL hat `?file=<id>`, Severity-Badge passt zur Finding-Severity.
- Inspector hat 3 Tabs: Detail (echte Finding-Daten), Why important (Static-Text passt zur Category), AI Solution ("Coming in G4" + Mock-Diff).
- Browser-Reload mit `?file=<id>` → Inspector öffnet pre-mounted, Camera gezoomt.
- Click X → Panel slide-out, URL clean.
- Click leerer Bereich → Panel zu.
- Click auf CustomerStar → Camera-Tween auf Customer-Pos, KEIN Panel.
- Click auf RepoMoon → Camera-Tween auf Repo, KEIN Panel.
- `/customers` → 1 echter Customer "Sample-Bad Demo" mit Repo-Count = 1.
- `/customers/<id>` → Customer-Detail + Repo-Tabelle mit "Sample-Bad Demo"-Repo.
- "Add Customer" → Dialog → Submit → neue Row in `/customers` + neuer Customer-Star in Galaxie (revalidateTag triggert).
- "Add Repo" in Customer-Detail → Dialog → Submit → neue Repo-Row + neuer Moon in Galaxie.

**Verifizierungs-Greps:**
- `grep -r "/customers/\[id\]" apps/web/src/` darf 0 Treffer haben (alte Route-Refs raus).
- `grep -r "schema.repo" apps/web/src/app/customers/` darf nur in Compat-Shim auftauchen.

## 6. Risiken + Rollback

| Risiko | Severity | Mitigation |
|---|---|---|
| Pixi `pointertap` kollidiert mit `useGesture` drag (User dragt minimal, wird als tap interpretiert oder umgekehrt) | Strong | useGesture `drag.filterTaps: true` (schon aktiv seit G3) verhindert das. Zusätzlich: pointer-distance-threshold von 3px im tap-handler als sentinel. |
| URL-Sync via `router.replace` triggert Re-render der ganzen Page → Galaxie remountet → State-Verlust | Strong | `router.replace` mit `scroll: false` + die Page hat `force-dynamic`. State (camera, world-children) lebt in client-Refs, kein React-state-Rerender für die Galaxie selbst. Test verifiziert das. |
| Inspector-Render verlangsamt Pixi-FPS (Layout-shift, Re-Render-Storm) | Mid | Inspector ist DOM-overlay, kein Pixi-impact. State-Updates nur on open/close, nicht per-frame. |
| `/customers` Refactor bricht existierende `/customers/[id]/access` Route (Write-Access-Grant) | Mid | Im Execute prüfen ob `[id]` weiterhin als repo-id interpretiert wird oder ob es customer-id wird. Falls Conflict: alte Route auf `/customers/[customerId]/repos/[repoId]/access` umleiten. |
| AddCustomerForm war Server-Action-basiert, neuer Dialog muss das nachbauen | Mid | useFormState mit Server-Action bleibt der idiomatic Pattern. Dialog ist nur DOM-Wrapper. |
| Mock-Diff-Placeholder sieht zu echt aus → User denkt G3 hat schon AI | Weak | Klare "Coming in G4"-Banner + disabled Apply-Button + read-only Background-Tint. |

**Rollback:**
- Branch `feat/galaxie-sprint-3-inspector` aus G2-Branch. `git checkout feat/galaxie-sprint-2-data-binding` = voller Rollback ohne DB-Risk.
- Keine DB-Migration in G3. Schema bleibt G2-Stand.

## 7. Open Questions

(leer — alle 4 Master-Decisions geklärt:
- Inspector = Side-Panel rechts mit URL-Sync via Querystring,
- Click-Verhalten = Customer/Repo zoom, File öffnet Inspector,
- `/customers` Refactor läuft in G3 mit,
- AI-Solution-Tab = "Coming in G4"-Placeholder mit Mock-Diff.)

---

**Ausführungs-Trigger:** `/execute galaxie-sprint-3-inspector` nach User-Review.
