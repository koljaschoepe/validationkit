# Plan — Galaxie Sprint G5: Zero-Code-Apply

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Slug: `galaxie-sprint-5-apply`
> Branch: `feat/galaxie-sprint-5-apply`
> Outcome: Apply-Button funktional via LocalGitClient (writes patches to /tmp/vk-patches/). Audit-Trail (apply_action) + Dismiss-with-Reason + Snooze. Customer-Apply-Mode-Selector. GitHub-App-Path code-ready, inaktiv bis App registriert ist.

---

## 1. Ziel

Apply-Button im Inspector dispatcht echte Patches (LocalGitClient als Default solange GitHub-App nicht registriert ist) und erzeugt einen Audit-Trail. Dismiss + Snooze sind funktional. PR-Status wird im Inspector poll-aktualisiert.

## 2. Endzustand

**DB:**
- Neue Tabelle `apply_action` (id, solution_id FK, finding_id FK, repo_id FK, workspace_id FK, mode varchar 'pr|direct|local', decision varchar 'apply|dismiss|snooze|undo-dismiss', reason text, target_url text, target_ref text, target_sha text, target_status varchar, snooze_until timestamptz, decided_by FK user, ip_address text, user_agent text, decided_at timestamptz default now). Append-only.
- `finding` extend: `dismiss_status varchar(20)` ('active'|'dismissed'|'snoozed', default 'active'), `dismiss_reason varchar(40)` (nullable, enum: 'false-positive'|'acceptable-risk'|'wont-fix'), `snoozed_until timestamptz` (nullable). Composite-Index `(scan_id, dismiss_status)`.
- Migration 0010 additiv.

**Apply-Pfad:**
- `Inspector.tsx` Apply-Button: ready solution + repo write-access (`repo.writeAccessGranted=true` ODER LocalGitClient-Mode) → enabled. Sonst disabled + Tooltip mit Erklärung.
- Click → `applySolution(solutionId)` Server-Action: liest solution-row, baut PRDispatchInput (branch=`vk/fix/<finding-id-short>`, title=`fix: ${finding.title}`, body=rationale + audit-link, patch=solution.patch), wählt PRClient basierend auf:
  - `customer.default_apply_mode='direct'` UND `repo.apply_mode != 'pr'` UND GitHub-App-configured → `GitHubAppClient`-Direct-Commit (nur wenn write_access).
  - GitHub-App configured (Env-Vars gesetzt) UND apply_mode='pr' → `GitHubAppClient`-PR.
  - Sonst Default → `LocalGitClient` (patch nach `/tmp/vk-patches/<workspace>/<finding>.patch`).
- `dispatchPR` enforced via existing `enforceAccess` (read-only-default-Policy).
- INSERT `apply_action` row mit mode + target_url + target_ref.
- `solution.applied_at` setzen optional als denormalized read-cache (oder via subquery; G5 ohne column-add, G6 wenn nötig).
- updateTag(galaxieWorkspaceTag) + revalidatePath(`/customers/...`).

**Dismiss-Pfad:**
- Inspector zeigt "Dismiss"-Dropdown-Button neben Apply mit 3 Reasons: False positive / Acceptable risk / Won't fix.
- Click → `dismissFinding(findingId, reason)` Server-Action: UPDATE finding.dismiss_status='dismissed' + dismiss_reason. INSERT apply_action mit decision='dismiss' + reason.
- Galaxie: FileAsteroid alpha=0.2, Severity-Color desaturiert auf Grau (#404040 statt severity-color).
- Aggregate-Severity-Rollup berücksichtigt dismissed-Findings NICHT (= Repo/Customer-Severity-Recompute ohne dismissed).
- Inspector zeigt "Dismissed: <reason>" Banner + "Un-dismiss"-Button.

**Snooze-Pfad:**
- Inspector "Snooze"-Dropdown: 24 hours / 7 days / Forever.
- `snoozeFinding(findingId, until: Date | null)` Server-Action: UPDATE finding.dismiss_status='snoozed' + snoozed_until.
- Galaxie: FileAsteroid alpha=0.3, etwas dimmer als active aber sichtbarer als dismissed.
- DAL-Galaxie-Read filtert: wenn `snoozed_until > now()` → status='snoozed'. Wenn `snoozed_until < now()` → status='active' (auto-expire). Cron- oder lazy-expire (lazy reicht für G5).
- Forever = `snoozed_until = '9999-12-31'`.

**PR-Status-Polling:**
- Wenn `apply_action.mode='pr'` AND `target_status IN ('open', 'unknown')`: Inspector "AI solution"-Tab zeigt PR-Card mit Status-Pill (open/merged/closed/draft) + Link.
- Polling via Server-Action `pollPRStatus(applyActionId)` every 30s solange Inspector offen + Status='open'.
- Polling-Helper: `@vk/github-app` `client.octokit.pulls.get({ owner, repo, pull_number })` → state mapping. Wenn LocalGitClient (mode='local') → kein Polling, "Local patch — review + git apply by hand".

**Repo-Settings-UI (Apply-Mode Override):**
- `/customers/c/[customerId]` Customer-Detail bekommt Apply-Mode-Selector (Dropdown: 'PR' / 'Direct commit'). UPDATE customer.default_apply_mode.
- Repos-Tabelle zeigt apply_mode-Spalte (mit "(default)" wenn nicht overridden). Per-Repo-Override via Dropdown direkt in der Row.

**Tests grün:**
- `pnpm test` mind. 60/60 vitest (52 G4 + 8 G5 für apply-dal + dismiss/snooze-logic).
- `pnpm typecheck` grün.
- `pnpm build` grün.

## 3. Schritte

### A. Schema + Migration 0010 (~3h)

- [x] `packages/db/src/schema.ts`: `applyAction`-Tabelle + Relations. `finding` extend: `dismissStatus`, `dismissReason`, `snoozedUntil`. Plus Composite-Index `(scan_id, dismiss_status)`.
- [x] `pnpm db:generate` → `0010_<auto>.sql`.
- [x] `pnpm db:migrate` lokal verifizieren.
- [x] `pnpm --filter @vk/db build`.

### B. Apply-DAL (~6h)

- [x] `apps/web/src/lib/apply-dal.ts` (NEU) — `"use server"`:
  - `applySolution(userId, solutionId): Promise<ApplyResult>`: load solution + finding + scan + repo + customer → membership-gate → choose PRClient (LocalGitClient default; GitHubAppClient wenn Env+install_id configured AND repo.writeAccessGranted) → build PRDispatchInput → call dispatchPR → INSERT apply_action → updateTag.
  - `dismissFinding(userId, findingId, reason): Promise<ApplyResult>`: UPDATE finding.dismiss_status='dismissed' + dismiss_reason. INSERT apply_action with decision='dismiss'.
  - `undoDismiss(userId, findingId): Promise<ApplyResult>`: UPDATE finding back to 'active' + clear reason. INSERT apply_action with decision='undo-dismiss'.
  - `snoozeFinding(userId, findingId, durationKey): Promise<ApplyResult>`: durationKey ∈ '24h'|'7d'|'forever'. Compute snoozed_until. UPDATE finding. INSERT apply_action.
  - `listApplyActionsForFinding(findingId): Promise<ApplyActionRow[]>` (für Inspector History).
  - `pollPRStatus(applyActionId, userId): Promise<{state: 'open'|'merged'|'closed'|'draft'|'unknown'}>`: nutzt octokit von @vk/github-app oder no-op für LocalGitClient.
- [x] `apps/web/src/lib/apply-actions.ts` (NEU): server-action-wrappers (applySolutionAction, dismissFindingAction, snoozeFindingAction, undoDismissAction, pollPRStatusAction).
- [x] `apps/web/src/lib/apply-mode.ts` (NEU): pure-function `resolveApplyMode(customerDefault, repoOverride): 'pr' | 'direct' | 'local'`. Plus `isGitHubAppConfigured(): boolean` (read env vars).

### C. DAL-Galaxie + FileNode extend (~2h)

- [x] `apps/web/src/lib/galaxie/types.ts`: `FileNode` extend `dismissStatus: 'active' | 'dismissed' | 'snoozed'`, `dismissReason?: string`, `snoozedUntil?: Date`.
- [x] `apps/web/src/lib/dal/galaxie.ts`: select finding.dismissStatus etc. mit. Lazy-expire snooze: wenn `snoozed_until < now()` → behandle als active in der read. Aggregate-Severity-Rollup excludiert dismissed.
- [x] `apps/web/src/lib/solution-alpha.ts`: erweitern um `dismissStatus`-Parameter. Wenn dismissed → alpha=0.2. Snoozed → alpha=0.3. Else original-Mapping.
- [x] `apps/web/src/components/galaxie/pixi/FileAsteroid.ts`: dismissed → severity-color overrideed auf grau (#404040) + alpha 0.2 + no glow. Snoozed → alpha 0.3, glow gedimmt.

### D. Inspector — Apply / Dismiss / Snooze UI (~6h)

- [x] `components/galaxie/AISolutionPlaceholder.tsx` erweitern:
  - Apply-Button: enabled wenn solution.status='ready' AND (apply_mode='local' OR repo.writeAccessGranted). Sonst disabled + Tooltip "Read-only mode: request write access" mit Link zu /customers/[id]/access.
  - Click → applySolutionAction(solutionId) → setApplyResult-state → show PR-Card mit Url + Status-Pill.
  - Polling-Effect: wenn applyResult.mode='pr' AND applyResult.targetStatus IN ['open','unknown'] → poll every 30s via pollPRStatusAction. Stop wenn merged/closed.
- [x] Apply-Mode-Banner unter Confidence-Pill: "Will create PR via GitHub App" oder "Will write patch to /tmp/vk-patches/ (GitHub App not configured — setup)" mit `/docs/setup`-Link.
- [x] Dismiss-Dropdown neben Apply-Button: 3 options. Click → dismissFindingAction → close inspector (or show "Dismissed: <reason>" + Un-dismiss).
- [x] Snooze-Dropdown: 24h / 7d / Forever. Click → snoozeFindingAction → close inspector.
- [x] Inspector-Banner-Section: wenn finding.dismissStatus='dismissed' → "Dismissed (<reason>)" mit Un-dismiss-Button. Wenn 'snoozed' → "Snoozed until <date>" mit Un-snooze-Button.

### E. Settings-UI für apply_mode (~3h)

- [x] `app/customers/c/[customerId]/page.tsx`: Apply-Mode-Selector (Radio: PR / Direct commit) updates `customer.default_apply_mode` via Server-Action `updateCustomerApplyMode`.
- [x] Repo-Tabelle pro Row: Apply-Mode-Selector mit "Use customer default" / "PR" / "Direct commit" → `repo.apply_mode` update.
- [x] Direct-Commit braucht extra Warning: "Direct commit skips PR review — only enable if you trust auto-fixes for this repo."

### F. Tests (~3h)

- [x] `apps/web/src/lib/apply-mode.test.ts` (NEU): resolveApplyMode mapping + isGitHubAppConfigured edge cases.
- [x] `apps/web/src/lib/apply-dal.test.ts` (NEU): durationKey → date mapping (24h/7d/forever); dismiss-reason validation; apply-mode-resolution-priority.
- [x] `apps/web/src/lib/solution-alpha.test.ts` extend: dismissed=0.2, snoozed=0.3 mapping.

### G. Build + E2E + Close (~3h)

- [x] `pnpm typecheck && pnpm test && pnpm build` grün.
- [x] Browser-E2E (Playwright @ /ws-…?file=<finding>&debug=1):
  - Apply-Button enabled wenn ready-solution + writeAccessGranted (heute: false → Tooltip "request write access"). Manuell SETUP: `UPDATE repo SET write_access_granted = true;` für Test.
  - Click Apply (LocalGitClient default) → toast "Patch written to /tmp/vk-patches/...". DB-row in apply_action.
  - Click Dismiss → False positive → Inspector schließt, Galaxie zeigt asteroid bei alpha 0.2 + grau.
  - Re-click asteroid → Inspector zeigt "Dismissed: false-positive" + Un-dismiss-Button.
  - Click Snooze 24h → Inspector schließt, asteroid alpha 0.3.
  - /customers/c/<id> Apply-Mode-Selector ändert customer.default_apply_mode.
- [x] Plan-File abhaken, Status → ✅ Done, `mv` zu `docs/plans/done/`.

## 4. Files-to-Change

| Datei | Aktion | Was |
|---|---|---|
| `packages/db/src/schema.ts` | EDIT | `applyAction`-Tabelle + Relations. `finding` extend dismiss_status/reason/snoozed_until + Index. |
| `packages/db/drizzle/0010_<auto>.sql` | NEW | Migration. |
| `apps/web/src/lib/apply-dal.ts` | NEW | applySolution/dismissFinding/snoozeFinding/undoDismiss/listApplyActionsForFinding/pollPRStatus mit Membership-Gate + dispatchPR. |
| `apps/web/src/lib/apply-actions.ts` | NEW | Server-Action-wrappers. |
| `apps/web/src/lib/apply-mode.ts` | NEW | resolveApplyMode + isGitHubAppConfigured. |
| `apps/web/src/lib/apply-mode.test.ts` | NEW | mode-resolution tests. |
| `apps/web/src/lib/apply-dal.test.ts` | NEW | durationKey + reason-validation tests. |
| `apps/web/src/lib/solution-alpha.ts` | EDIT | dismissStatus-arg, alpha=0.2/0.3 für dismissed/snoozed. |
| `apps/web/src/lib/solution-alpha.test.ts` | EDIT | New test cases for dismissed/snoozed. |
| `apps/web/src/lib/galaxie/types.ts` | EDIT | FileNode extend dismissStatus/dismissReason/snoozedUntil. |
| `apps/web/src/lib/dal/galaxie.ts` | EDIT | Read finding.dismiss_status, lazy-expire snooze, exclude dismissed from aggregate. |
| `apps/web/src/components/galaxie/pixi/FileAsteroid.ts` | EDIT | dismissed → grau-override, snoozed → dim. |
| `apps/web/src/components/galaxie/AISolutionPlaceholder.tsx` | EDIT | Apply-Button real + Dismiss-Dropdown + Snooze-Dropdown + PR-Card + Polling. |
| `apps/web/src/components/galaxie/Inspector.tsx` | EDIT | Dismiss/Snooze-Banner-Section wenn finding dismissed/snoozed. |
| `apps/web/src/lib/customer-dal.ts` | EDIT | `updateCustomerApplyMode(userId, customerId, mode)` + updateRepoApplyMode helpers. |
| `apps/web/src/lib/customer-actions.ts` | EDIT | Server-Action-wrappers für die zwei updates. |
| `apps/web/src/app/customers/c/[customerId]/page.tsx` | EDIT | Apply-Mode-Selector Customer-level + Repo-Tabelle mit per-Repo-Override. |
| `apps/web/src/components/ApplyModeSelector.tsx` | NEW | Reusable Radix-RadioGroup für PR/Direct. |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` grün.
- `pnpm test` grün — mind. 60/60 vitest (52 G4 + 8 G5):
  - apply-mode.test.ts (3): resolveApplyMode mapping, env-check edge cases.
  - apply-dal.test.ts (3): durationKey mapping, dismiss-reason allow-list, github-app-fallback-to-local logic.
  - solution-alpha.test.ts (+2): dismissed/snoozed.
- `pnpm build` grün.

**Manuell (Playwright + DB direct):**
- Setup: `UPDATE repo SET write_access_granted=true;` (G5 testet write-path; production-Flow nutzt /customers/[id]/access).
- Inspector öffnen für ein File → Apply-Button enabled. Banner "Will write patch to /tmp/vk-patches/" sichtbar.
- Click Apply → toast "Applied". DB: `SELECT * FROM apply_action;` zeigt mode='local' + target_url=`file:///tmp/vk-patches/...`.
- Asteroid alpha unchanged (apply doesn't change visual; G6 Polish könnte applied-marker).
- Click Dismiss → False positive → Inspector schließt. DB: apply_action.decision='dismiss' + finding.dismiss_status='dismissed'. Asteroid alpha=0.2 + grau.
- Re-click asteroid → Inspector öffnet mit Dismissed-Banner.
- Click Un-dismiss → finding zurück zu active, alpha normal.
- Snooze 24h → finding.snoozed_until = now+24h. Alpha=0.3.
- `/customers/c/<id>` → Apply-Mode-Selector ändert customer.default_apply_mode. Repo-Tabelle reflektiert.

**Verifizierungs-Greps:**
- `grep -r "Apply (Sprint G5)" apps/web/src/components/galaxie/` darf 0 Treffer haben (disabled-Tooltip raus, durch echte Logic ersetzt).

## 6. Risiken + Rollback

| Risiko | Severity | Mitigation |
|---|---|---|
| GitHub-App nicht registriert → Apply via LocalGitClient nur als file:// auf Test-Workspace. User confused über "wo ist mein PR?" | Strong | Klares "Will write patch to /tmp/…"-Banner BEFORE Apply. Plus docs/setup-Link prominent. Plus apply_action.mode='local' macht clear, was passiert. |
| dispatchPR wirft AccessDeniedError trotz write_access_granted=true (z.B. weil customer.default_apply_mode=direct + repo write nicht da) | Strong | Pre-Check vor dispatchPR: wenn mode=direct und !writeAccessGranted → Error mit Hinweis statt dispatchPR. Plus enforceAccess fängt es ab. |
| Dismiss bricht Aggregate-Severity (Repo zeigt Strong obwohl letztes nicht-dismissed Finding Kill war) | Strong | DAL-galaxie loadWorkspaceData filtert dismissed BEFORE aggregate. Test verifiziert das. |
| Snooze-Auto-Expire ist lazy (= nur beim DAL-Read passiert es). User snoozt 24h, kommt nach 25h zurück und sieht den Finding wieder. Wenn Job-Server (Inngest cron) Solution-Generation triggert vor read → potentially generation läuft auf snoozed-Finding | Mid | Server-Side Read filtert via `snoozed_until < now()` → expired = active. Inngest-Jobs (G4 lazy + heute keine) honorieren das query. G6 polish könnte explicit cron. |
| PR-Status-Polling 30s × N geöffnete Inspectors = GitHub-API-rate-limit-hit | Mid | Polling nur für Inspector mit offenem PR (single open inspector at a time). Per-User 5000 GitHub-API-calls/h reicht. G6 könnte central polling-Worker einführen. |
| `apply_action` row in transaction-isolated von actual dispatchPR-Call → wenn dispatchPR throws nach INSERT → orphan row | Mid | dispatchPR ZUERST, dann INSERT bei success. Failure = row gar nicht eingefügt. Cleanup-Pfad: wenn dispatchPR teilweise-success-state → Plan §6 risk-accepted, manuelle DB-cleanup wenn nötig. |
| Direct-Commit-Pfad → User commits a patch auf main branch. Wenn falsch → main is broken | Strong | Direct-Commit hat **Confirmation-Dialog** mit "This will commit directly to main. There is no PR review. Continue?" + Customer.default_apply_mode='direct' MUSS explicit gesetzt werden. + Repo.write_access_granted MUSS true sein. |

**Rollback:**
- Branch `feat/galaxie-sprint-5-apply`. `git checkout main` (oder G4-Branch) = voller Code-Rollback.
- DB-Rollback: `DROP TABLE apply_action; ALTER TABLE finding DROP COLUMN dismiss_status, dismiss_reason, snoozed_until;`. Migration-Journal-Entry entfernen. Solutions in DB bleiben unangetastet.

## 7. Open Questions

(leer — alle 4 Master-Decisions vorab geklärt:
- LocalGitClient als Default + GitHub-App-Setup-Banner,
- Neue `apply_action`-Tabelle,
- Dismiss = Asteroid dim+grau,
- PR-Status-Polling 30s in G5.)

---

**Ausführungs-Trigger:** `/execute galaxie-sprint-5-apply` nach User-Review.
