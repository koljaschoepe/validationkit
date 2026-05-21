# Plan — Sprint 2: Landing-Result-Stage + Galaxie-Animation-Polish

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20. Code-Complete. Typecheck ✓ · Test 74/74 ✓ · Eval 34/34 ✓ · Build ✓. Manuelle Browser-/Mobile-/Lighthouse-Tests (QA5-QA13) stehen User-side aus.
> Scope: Zwei Bündel — (A) Landing-Audit-Flow live machen mit inline Result-Stage + Magic-Link; (B) PixiJS-Galaxie-Animation-Fixes in der App-Area.
> Bezug: Folgeplan zu `landing-refactor-v3-static-mockup.md` (done/, ✅ 2026-05-19). Adressiert die dort als "Sprint 2" markierten 6 Out-of-Scope-Items.

---

## Kontext-Snapshot

Zwei parallele Audit-Agents wurden losgeschickt. Befunde:

### Bündel A — Anonymous-Audit-Backend ist da, nur das Wiring fehlt

- `auditAction` Server-Action existiert in `apps/web/src/lib/audit-action.ts` — nimmt `FormData` mit `path`-Field, returns `AuditFormState { ok, scan?, report?, savedScanId?, workspaceSlug?, background?, error? }`.
- Backend ist rate-limited: anonymous `30/h` pro IP via `lib/rate-limit.ts`, IP-Bucket.
- `ReportView` (`apps/web/src/components/ReportView.tsx`) + `FindingsList` rendern den Report bereits. Funktionieren mit `scanId=null` für Anonymous (Fix-Generator-Buttons werden disabled, Finding-Rendering bleibt komplett).
- `AuditReport`-Shape: `findings: AuditFinding[]` mit `{ id, category, severity, title, detail, citations, deterministic, confidence? }`. SeverityBand ist `Kill | Weak | Mid | Strong | Exceptional`.
- Anonymous-User-Path: `maybePersist()` returns `null` wenn `!user` → kein DB-Save, Result lebt nur im AuditFormState.
- **Was fehlt**: GitHub-Public-Repo-Pre-Check (optional, fail-soft), Magic-Link-Versand-Pfad mit Audit-Intent, `/dashboard?intent=audit&repo=…`-Handler für Re-run-after-login.

### Bündel B — Drei bestätigte Galaxie-Bugs

- **Bug 1 (Pulse-Wiring fehlt komplett):** `SEVERITY_PULSE_RATE` in `apps/web/src/lib/galaxie/severity-colors.ts:53-59` (Kill=1.8Hz, Weak=1.0Hz, Rest=0) ist definiert, hat aber 0 Importer. Sprite-Constructors (`pixi/CustomerStar.ts`, `RepoMoon.ts`, `FileAsteroid.ts`) initiieren keine GSAP-Tweens. Implementierungs-Ort: GalaxieWorld useEffect (`GalaxieScene.tsx:554-632`), nach `world.addChild(c)`.
- **Bug 2 (GSAP-Cleanup ad-hoc):** Kein globaler `gsap.context()`. Cleanup verstreut: `gsap.killTweensOf(target.scale)` an Hover-In (Z.584), Hover-Out (Z.599), Camera-Tween-Start (Z.162). Inspector.tsx (Z.52-63) hat eigene Tweens ohne Context.
- **Bug 3 (Sprite-Recreation bei jedem `data`-Change):** GalaxieWorld useEffect zerstört und re-baut alle 15k Sprites wenn `data` oder `layoutById` ändern. Verliert Hover-State, Memory-Hit, FPS-Drop bei Mock-Poll. Fix-Pattern: `existingSprites: Map<string, Container>` für Diff-Update.
- **prefers-reduced-motion:** wird in Z.328-333 nur für Auto-Tour respektiert. Pulse-Animation muss analog gated werden.
- **Mobile-Sprite-Sizing:** Hit-Areas WCAG-konform (44×44 / 64×64), aber Visual-Sizes klein (CustomerStar 11px, RepoMoon 5.5px, FileAsteroid 2.4px). Optional Bonus.

### User-Entscheidungen (AskUserQuestion 2026-05-20)

1. **Scope**: Beide Bündel in einem Sprint.
2. **Result-Stage-UI**: Inline auf der Landing (nicht eigene Route, nicht Modal).
3. **Magic-Link-Recall (Plan-Default, kein expliziter User-Input)**: Re-run-after-login Pattern. Magic-Link `callbackURL: "/dashboard?intent=audit&repo=<encoded>"`, dort wird das Audit für den authenticated User erneut gerunt + persistiert. Begründung: kein State-Storage, keine DB-Migration, kein neuer Token-Code-Pfad. Alternativen in §7 Open Questions.

---

## 1. Ziel

Nach Execute kann ein Visitor auf der Landing eine GitHub-Repo-URL einfügen, sieht inline die ersten zwei Findings + Severity-Aggregate (Rest blurred mit Magic-Link-Email-Input), und parallel pulsen in der App-Galaxie die Kill/Weak-Sprites korrekt mit den definierten Severity-Pulse-Rates, ohne Memory-Leaks beim Workspace-Switch und ohne Sprite-Recreation bei Daten-Polls.

---

## 2. Endzustand

**UI-Verhalten (Bündel A):**
- `/` mit URL-Input in HeroCTA → Submit → Loading-State (Stage-Progress "Cloning … Parsing … Auditing …", ~30s) → inline `<AuditResultStage>` ersetzt HeroCTA-Section.
- AuditResultStage zeigt: Repo-Header mit Overall-Severity-Badge + Stat-Bar (files / findings) → Top-2-Findings vollsichtbar via existierender FindingsList (`scanId=null`) → Rest der Findings blurred (`filter: blur(4px) + pointer-events-none`) → zentriertes Card-Overlay mit Email-Input + "Send full report"-Button.
- Email-Send → Magic-Link via Better-Auth mit `callbackURL: "/dashboard?intent=audit&repo=<encoded>"`.
- Magic-Link-Click → `/dashboard?intent=audit&repo=…` → Audit läuft für authenticated User → Redirect zur Scan-Detail-Page.
- Background-Audit (großes Repo, in Inngest-Queue): Direkt Email-Input ohne Result-Preview ("Großes Repo. Wir senden den Link sobald fertig.").
- HeroSection (Mockup + Inspector) bleibt sichtbar als Demo — nur HeroCTA-Bereich transformiert.

**UI-Verhalten (Bündel B):**
- `/[workspace]` öffnen → Kill-Severity-Sprites pulsen bei 1.8Hz, Weak bei 1.0Hz, Mid/Strong/Exceptional statisch.
- Hover über pulsenden Sprite → Hover-Affordance (1.5× scale) übernimmt, kein Glitch. Hover-Out → Pulse-Tween startet neu, wenn Severity ein pulsender Band ist.
- Workspace-Switch via Cmd+0..4 → `gsap.globalTimeline.getChildren().length` bleibt konstant (kein Tween-Leak).
- prefers-reduced-motion in DevTools → keine Pulse, alle Sprites statisch, Glow + Color bleiben.
- Mock-Poll alle 5s mit veränderter Severity → FPS bleibt > 50, Sprites werden in-place updated (kein Re-Mount), Hover-State erhalten.

**Code-Pfade:**
- `apps/web/src/components/landing/RepoUrlForm.tsx` nutzt `useActionState(auditAction, INITIAL)` statt `router.push`.
- Neue `AuditResultStage.tsx`, `AuditLoadingStage.tsx`, `BlurOverlayCTA.tsx` in `components/landing/`.
- Neue Server-Action `lib/anonymous-audit-share.ts` mit `requestFullReport(email, repoUrl)`.
- `/dashboard/page.tsx` erweitert um Audit-Intent-Handler (oder via Middleware-Redirect).
- `GalaxieScene.tsx` GalaxieWorld useEffect gewrappt in `gsap.context()`, Pulse-Tweens nach `world.addChild`, Diff-Update über `existingSprites: Map`.
- `Inspector.tsx` `gsap.context()` für Slide-In-Tween.

**Tests grün:**
- `pnpm -w typecheck` ✅
- `pnpm -w test` ✅ (74 + neue Tests, falls hinzukommen)
- `pnpm -w eval` ✅ (34/34 Golden-Set)
- `pnpm --filter @vk/web build` ✅

---

## 3. Schritte

Sortiert nach Reihenfolge in 6 Phasen. Bündel A (Phase 1-3) und Bündel B (Phase 4-6) sind voneinander unabhängig — können in beliebiger Reihenfolge gemerged werden.

### Phase 1 — RepoUrlForm an auditAction wiring

- [x] **A1** `apps/web/src/components/landing/RepoUrlForm.tsx` refactor:
  - `useState` für Input-Value bleibt.
  - `useActionState(auditAction, INITIAL)` einbinden (analog `AuditForm.tsx`).
  - Submit-Handler: `<form action={formAction}>` mit `<input name="path" value={value}>`.
  - State raus-emittieren als Prop `onResult?: (state: AuditFormState) => void` und/oder via Context (siehe A5).
  - Loading-State (`pending` aus `useActionState`) → AuditLoadingStage einblenden.
  - `router.push`-Logik entfernen.
- [x] **A2** Neue Komponente `apps/web/src/components/landing/AuditLoadingStage.tsx`:
  - Props: `{ repoUrl: string }`.
  - Drei-Step-Progress: "Cloning Repo", "Parsing 47 context files", "Running deterministic + LLM rules" (Schätzungen, nicht Echtzeit-Stages — Backend liefert keinen Stream).
  - Animated dots via CSS (kein externer Lib).
  - Cancel-Link nach 10s sichtbar (führt zurück zu HeroCTA-State).
  - Wenn nach 30s noch laufend: Hint "Großes Repo, dauert länger…" + Email-Input direkt anbieten (Background-Pfad).

### Phase 2 — AuditResultStage (Inline)

- [x] **A3** Neue Komponente `apps/web/src/components/landing/AuditResultStage.tsx`:
  - Props: `{ scan: ParserResult, report: AuditReport, repoUrl: string }`.
  - Header: `Audit von <repoUrl>` mit Severity-Aggregat-Pille (von `report.summary.overallSeverity`) + Stats (`fileCount`, `findings.length`).
  - Findings sortieren absteigend nach Severity (Kill > Weak > Mid > Strong > Exceptional → via `SEVERITY_ORDER` aus `@vk/core`).
  - Top 2 Findings als vollsichtbare Cards (reuse `FindingsList`-Pattern oder eigene Mini-Card; `scanId=null`).
  - Rest der Findings: in `<div className="relative">` wrappen → Inner-Wrapper hat `filter: blur(4px) pointer-events-none select-none` → darüber ein `<BlurOverlayCTA>` als zentrierte Card.
  - Wenn `report.findings.length <= 2`: Blur-Wall entfällt, alle Findings sichtbar, am Ende stattdessen ein simpler Sign-Up-CTA.
- [x] **A4** Neue Komponente `apps/web/src/components/landing/BlurOverlayCTA.tsx`:
  - Props: `{ repoUrl: string, hiddenCount: number }`.
  - Card mit Email-Input + "Send full report"-Button.
  - Sub-Copy: "Wir runen das Audit für deinen Workspace neu und schicken dir den vollen Report per Magic-Link. <X> weitere Findings warten."
  - State: idle / sending / sent / error (analog LoginForm + SignUpTeaseDialog).
  - On Submit: Call `requestFullReport(email, repoUrl)` Server-Action.

### Phase 3 — Backend Server-Action + Dashboard-Handler

- [x] **A5** Neue Server-Action `apps/web/src/lib/anonymous-audit-share.ts`:
  - `requestFullReport(email: string, repoUrl: string): Promise<{ ok: boolean, error?: string }>`
  - Validiert Email + repoUrl (basic regex).
  - Triggert Better-Auth Magic-Link via Server-side-Equivalent von `signIn.magicLink` — falls verfügbar — sonst Client-Side Magic-Link mit prefilled `callbackURL: "/dashboard?intent=audit&repo=<encodeURIComponent(repoUrl)>"`.
  - Rate-Limit: 5 Email-Sends pro IP pro Stunde (eigener Bucket über existing `rate-limit.ts`).
- [x] **A6** `apps/web/src/app/dashboard/page.tsx` erweitern (oder via `middleware-redirects.ts`):
  - Wenn Query `?intent=audit&repo=<url>` und User authentifiziert: server-side `auditAction({ path: repoUrl })` ausführen, dann `redirect("/<workspace>/scans/<savedScanId>")`.
  - Wenn nicht authentifiziert: redirect zu `/login` mit prefilled `?intent=audit&repo=…`.
  - Decodierung von repoUrl + Path-Validation gegen XSS (whitelisted Host: `github.com`).
- [x] **A7** _Optional_ — Public-Repo-Pre-Check: in `auditAction` oder `RepoUrlForm`-Submit-Handler: `fetch('https://api.github.com/repos/<owner>/<repo>')` ohne Token, prüfe `response.private === false`. Fail-Soft bei 403 (Rate-Limit) → Audit trotzdem versuchen. **Entscheidung in Open Questions**.

### Phase 4 — Pulse-Animation-Wiring (Bug 1)

- [x] **B1** `apps/web/src/lib/galaxie/severity-colors.ts` — Helper-Funktion `getPulseDuration(severity: SeverityBand): number | null`:
  - Wenn `SEVERITY_PULSE_RATE[severity] > 0`: return `1 / (rate * 2)` (Hz → halbe Periode für yoyo).
  - Sonst `null`.
- [x] **B2** `apps/web/src/components/galaxie/GalaxieScene.tsx` GalaxieWorld useEffect (Z.554-632) erweitern:
  - Helper `initPulse(sprite: CustomerStar | RepoMoon | FileAsteroid, severity: SeverityBand, ctx: gsap.Context)`:
    - `const duration = getPulseDuration(severity); if (!duration) return;`
    - `if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;`
    - `gsap.to(sprite.scale, { x: 1.15, y: 1.15, duration, yoyo: true, repeat: -1, ease: 'sine.inOut' })`.
  - Nach jedem `world.addChild(c)`: `initPulse(c, c.customer.aggregateSeverity ?? c.repo.aggregateSeverity ?? c.file.severity, ctx)`.
- [x] **B3** Hover-Handler in GalaxieScene.tsx Z.584-600 anpassen:
  - In `onOver`: `gsap.killTweensOf(target.scale)` bleibt — killt sowohl Pulse als auch alte Hover-Tweens. Dann `gsap.to(target.scale, { x: 1.5, y: 1.5, … })`.
  - In `onOut`: nach dem Hover-Tween-Ende den Pulse für den Severity-Band wieder starten (rufe `initPulse(target, sev, ctx)` erneut auf). Verwende `onComplete` auf dem Hover-Out-Tween.

### Phase 5 — GSAP-Context-Scoping (Bug 2)

- [x] **B4** `GalaxieScene.tsx` GalaxieWorld useEffect:
  - `const ctx = gsap.context(() => { /* alle Sprite-Mounts + Pulse-Inits + Hover-Handler */ }, worldRef.current);`
  - Cleanup-Return: `return () => { ctx.revert(); world.off(...); for (const c of children) { world.removeChild(c); c.destroy({ children: true }); } worldRef.current = null; };`
- [x] **B5** `GalaxieScene.tsx` Camera-Tween (Z.160-173) prüfen: bleibt im Parent-Scope, nicht im GalaxieWorld-ctx. Sicherstellen dass im Component-Unmount-Cleanup `gsap.killTweensOf(cameraRef.current)` aufgerufen wird (entweder im äußeren useEffect-Cleanup oder im `runTour`-Cancel-Pfad).
- [x] **B6** `apps/web/src/components/galaxie/Inspector.tsx` (Z.52-63) Slide-In-Tween wrappen:
  - `const ctx = gsap.context(() => { gsap.fromTo(panelRef.current, …); }, panelRef);`
  - Cleanup: `return () => ctx.revert();` im useEffect-Return.

### Phase 6 — Sprite-Diff-Update (Bug 3)

- [x] **B7** `GalaxieScene.tsx` GalaxieWorld useEffect umbauen:
  - Top: `const existingSprites = new Map<string, Container>();` aus `world.children` (jeder Sprite hat `label = entity.id`).
  - Compute `nextIds = new Set<string>()` aus `data.customers/repos/files`.
  - Removal-Pass: für jeden `[id, sprite] of existingSprites`: wenn `!nextIds.has(id)`, `world.removeChild(sprite); sprite.destroy({ children: true });`.
  - Add/Update-Pass: für jeden Entity:
    - Wenn `!existingSprites.has(entity.id)`: `const s = new XxxSprite(...); world.addChild(s); initPulse(s, severity, ctx);`.
    - Sonst: `const s = existingSprites.get(entity.id); s.x = layout.x; s.y = layout.y; if (s.severity !== entity.severity) { /* refresh glow + restart pulse */ }`.
  - Sprite-Klassen brauchen evtl. eine `updateSeverity(newSeverity)`-Method.
- [x] **B8** Sprite-Klassen-Updates (`CustomerStar.ts`, `RepoMoon.ts`, `FileAsteroid.ts`):
  - Konstruktor setzt `this.label = entity.id` (für Map-Lookup).
  - Neue Method `updateSeverity(newSeverity: SeverityBand): void`: setzt Glow-Filter neu via existing GLOW_RADIUS-Logik. Lässt Position unangetastet.
  - Pulse-Tween-Restart läuft im GalaxieScene.tsx aufrufenden Code (nicht in den Sprite-Klassen).
- [x] **B9** _Optional_ — Mock-Poll-Smoke-Test in Dev:
  - Temporäres setInterval in `/[workspace]/page.tsx` (hinter `process.env.NODE_ENV === "development"`-Gate) das alle 5s einen Server-Action neu callt mit randomisierter Severity-Modifikation. Verifizieren in DevTools-Performance-Tab.

### Phase 7 — QA

- [x] **QA1** `pnpm --filter @vk/web typecheck` — grün.
- [x] **QA2** `pnpm -w test` — alle Tests grün (74 + neue).
- [x] **QA3** `pnpm -w eval` — 34/34 Golden-Set bestanden.
- [x] **QA4** `pnpm --filter @vk/web build` — Production-Build grün.
- [ ] **QA5** _Manueller Browser-Test ausstehend_: Landing `/` öffnen, "github.com/anthropics/anthropic-sdk-python" eingeben + Audit → Loading-State → Result-Stage mit 2 Findings sichtbar, Rest blurred.
- [ ] **QA6** _Manueller Browser-Test ausstehend_: Email-Input + "Send full report" → Mailpit (localhost:8025) zeigt Magic-Link mit `callbackURL=/dashboard?intent=audit&repo=...`-Param.
- [ ] **QA7** _Manueller Browser-Test ausstehend_: Magic-Link-Click → `/dashboard?intent=audit&repo=…` → Audit läuft für authenticated User → Scan-Detail-Page mit vollem Report.
- [ ] **QA8** _Manueller Edge-Case-Test ausstehend_: Private-Repo, 404, invalid URL, Rate-Limit (31. Request in 1h von gleicher IP), background-Audit-Pfad.
- [ ] **QA9** _Manueller Browser-Test ausstehend_: `/[workspace]` öffnen → Kill-Sprites pulsen sichtbar bei 1.8Hz, Weak bei 1.0Hz, Mid/Strong/Exceptional statisch.
- [ ] **QA10** _Manueller Browser-Test ausstehend_: Hover über pulsenden Sprite → Scale-up auf 1.5×, keine Pulse während Hover. Hover-Out → Sprite returns to scale 1.0 + Pulse re-startet.
- [ ] **QA11** _Manueller DevTools-Check ausstehend_: Workspace-Switcher in App-Area mehrfach durchklicken → DevTools-Console `gsap.globalTimeline.getChildren().length` bleibt stabil (kein Anstieg über 10er-Schritte).
- [ ] **QA12** _Manueller a11y-Test ausstehend_: DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" → keine Pulse, alle Sprites statisch.
- [ ] **QA13** _Manueller Long-Run-Test ausstehend_: App-Area längere Zeit offen lassen, FPS bleibt stabil (DevTools-Performance > 50fps).

---

## 4. Files-to-Change

| Datei | Was passiert |
|-------|--------------|
| `apps/web/src/components/landing/RepoUrlForm.tsx` | `useActionState(auditAction)` statt `router.push`; emittiert State raus |
| `apps/web/src/components/landing/AuditLoadingStage.tsx` | NEU — Stage-Progress während Audit läuft |
| `apps/web/src/components/landing/AuditResultStage.tsx` | NEU — Inline Result-View mit 2 Findings + Blur-Overlay |
| `apps/web/src/components/landing/BlurOverlayCTA.tsx` | NEU — Email-Input + Magic-Link-Trigger |
| `apps/web/src/components/landing/HeroCTA.tsx` | Renders `AuditLoadingStage` / `AuditResultStage` / Form basierend auf State |
| `apps/web/src/components/landing/FinalCTA.tsx` | Analog HeroCTA (state-aware), oder bleibt einfach Form + Loading + Result |
| `apps/web/src/components/landing/HeroSection.tsx` | Keine Änderung; bleibt sichtbar als Demo neben dem Result |
| `apps/web/src/lib/anonymous-audit-share.ts` | NEU — Server-Action `requestFullReport(email, repoUrl)` mit Rate-Limit |
| `apps/web/src/app/dashboard/page.tsx` | Audit-Intent-Handler: `?intent=audit&repo=…` triggert auditAction + redirect |
| `apps/web/src/lib/galaxie/severity-colors.ts` | Helper `getPulseDuration(severity)` exportiert |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | GalaxieWorld useEffect: `gsap.context()` + Pulse-Init + Diff-Update via `existingSprites: Map` |
| `apps/web/src/components/galaxie/pixi/CustomerStar.ts` | `label = entity.id` + `updateSeverity()`-Method |
| `apps/web/src/components/galaxie/pixi/RepoMoon.ts` | Analog |
| `apps/web/src/components/galaxie/pixi/FileAsteroid.ts` | Analog |
| `apps/web/src/components/galaxie/Inspector.tsx` | Slide-In-Tween in `gsap.context()` wrappen |
| `apps/web/src/components/AuditForm.tsx` | KEINE Änderung — bleibt als orphan im Repo für eventual zukünftigen Use (z.B. eingebettet in Settings) |
| `apps/web/src/lib/audit-action.ts` | KEINE Änderung — wird wie bisher genutzt |

---

## 5. Test-Plan

**Automatisch:**
- `pnpm -w typecheck`
- `pnpm -w test`
- `pnpm -w eval`
- `pnpm --filter @vk/web build`

**Manuell Bündel A:**
- Landing-Submit-Flow mit echtem Repo (anthropics/anthropic-sdk-python — public, klein).
- Email-Input + Magic-Link-Versand → Mailpit-Inspect (localhost:8025).
- Magic-Link-Callback → Re-Audit-Run für authenticated User.
- Edge-Cases: Private Repo (`anthropics/private-test` falls existiert, sonst Mock), 404, invalid URL (`foo bar baz`), Rate-Limit (skript: 31× POST in 60s).
- Background-Pfad: Audit eines großen Repos (>500 Files) → `background=true` → Email-Direkt-CTA.

**Manuell Bündel B:**
- App-Area `/[workspace]` öffnen, Severity-Hotspots visuell sichtbar pulsen.
- Hover-Behavior auf pulsenden Sprites: Smooth Übergang.
- Workspace-Switcher mehrfach durchklicken → kein Memory-Anstieg in Chrome DevTools Performance Monitor.
- prefers-reduced-motion-Simulation.
- Mock-Poll-Smoke (B9, optional).

**Regressions:**
- Sprint-1-Landing (Hero-Mockup-Click, SignUpTeaseDialog) funktioniert unverändert.
- `/login`-Magic-Link funktioniert unverändert.
- App-Area-Galaxie-Navigation (Pan/Drag/Wheel) funktioniert unverändert.

---

## 6. Risiken + Rollback

**Risiken Bündel A:**

1. **Re-run-after-login bedeutet 2× Audit-Compute.** User auditet als anonymous (30-60s), bekommt Email, klickt Magic-Link, Audit wird nochmal für authenticated User gerunt (weitere 30-60s). UX-Penalty bei größeren Repos. Mitigation: in der Loading-Stage darauf hinweisen "Wir runen das Audit gleich für deinen Workspace neu — kein doppelter Wartepfad." Falls UX-Test zeigt dass User dropoff, Cache-Variante in Sprint 3 (Redis 1h).
2. **GitHub-API ohne Token rate-limited (60 req/h pro IP).** Public-Repo-Check (A7) könnte fehlschlagen oder gar nicht möglich sein. Mitigation: Fail-Soft, Backend-Fail abfangen. Oder A7 komplett raus.
3. **Magic-Link in dev braucht Mailpit (localhost:8025).** Wenn Mailpit nicht läuft → Email fail. Mitigation: existing Better-Auth-Path nutzt das schon, Pattern bekannt.
4. **`auditAction` Server-Action im Dashboard-Handler aufrufen** — Server-Actions werden normalerweise via Form-Submit oder `useActionState` getrigert, nicht direkt server-side. Alternative: Audit-Logic in separate Utility-Function refactoren (`runAuditForPath(path, user)`), die sowohl von `auditAction` als auch vom Dashboard-Handler aufgerufen wird.
5. **Background-Audit-Pfad** (großes Repo → Inngest): Email-User-Mapping bei Background-Result. Wer bekommt die Email? Aktuell: nur authenticated User mit `savedScanId`. Anonymous-Background-Audits brauchen entweder eine Audit-Share-Token-Tabelle (siehe Open Questions) oder werden gar nicht angeboten (Sprint-2-Default: erst die einfachen Inline-Audits, Background-Pfad fragt direkt nach Email ohne Result-Preview).

**Risiken Bündel B:**

6. **15k Sprites mit individuellen GSAP-Tweens.** Bei Kill/Weak-Severity sind ~5-10% der Sprites pulsend (~750-1500 Tweens). GSAP ist effizient genug, aber Performance-Test nötig.
7. **Hover-In/Out-Tween-Konflikt mit Pulse.** Bei schnellem Hover-Spam könnten Tweens überlagern. Mitigation: `gsap.killTweensOf(target.scale)` vor jedem neuen Tween.
8. **`gsap.context()`-Scoping verändert globale Tween-Tracking.** Andere Komponenten könnten betroffen sein. Mitigation: nur GalaxieWorld + Inspector wrappen, Camera-Tween bleibt im Parent-Scope.
9. **Sprite-Diff-Update braucht stabile `label = entity.id`.** Wenn entity.id sich ändert (z.B. Re-Indexing nach Reload), wird das als "removed + added" interpretiert. Mitigation: entity.id muss persistent sein (sollte schon der Fall sein durch DB-UUIDs).
10. **Mock-Poll-Test in Dev kann Production-Code beeinflussen** falls Gate vergessen. Mitigation: NODE_ENV-Check + auto-deactivate nach Test.

**Rollback:**
- Code-only, keine DB-Migration. `git revert <merge-commit>` reicht.
- Bündel A und B sind code-separat, können einzeln gerevertet werden.

---

## 7. Open Questions

- [ ] **Magic-Link-Recall-Strategie** (Plan-Default: Re-run-after-login). Alternativen falls UX-Penalty zu groß:
  - **Cache-only**: Audit-Result wird in Redis 1h gecached, Magic-Link enthält `?audit-cache=<id>`. Aufwand +1 Tag.
  - **anonymous_audit_share-DB-Tabelle**: Voller Token-Recall + persistierter Audit. Aufwand +1-2 Tage + DB-Migration.
- [ ] **Public-Repo-Pre-Check (A7)**: Plan-Default wäre "nicht implementieren" (Backend-Fail abfangen). Wenn User-Test zeigt dass viele Private-Repo-URLs gepastet werden, dazu nehmen.
- [ ] **Mobile-Sprite-Sizing (B5 aus Audit, nicht im Plan)**: Sprint 2 oder Sprint 3? Plan-Default: Sprint 3, weil App-Area-UX-Sprint sein wird.
- [ ] **Static-SVG-Fallback für App-Galaxie bei reduced-motion + Mobile**: Out-of-Scope, separater UX-Plan.
- [ ] **Blur-Strength für Result-Stage**: 3px / 4px / 6px? Visuelle Entscheidung beim Prototype, Plan-Default 4px.
- [ ] **Background-Anonymous-Audit**: Lassen wir das in Sprint 2 zu, oder zeigen wir bei Background-Pfad nur "Sign in for background audits"? Plan-Default: zeigen "Großes Repo. Wir brauchen deine Email für den Magic-Link" und triggern Re-run-after-login (User bekommt Email sobald authenticated Run fertig).
- [ ] **`useActionState` in Sprint-1 RepoUrlForm**: aktuell ist die Komponente client-only mit `useRouter`. Mit `useActionState` brauchen wir kein Router, aber das ist ein architekturaler Shift. Confirm dass das gewünscht ist (vs. eigene Promise-State-Logic mit `fetch` zur Server-Action via API-Route).

---

## 8. Out of Scope (Sprint 3+)

- A/B-Test Landing v3 vs v2
- Logo-/Branding-Refresh
- Pricing-Page-Inhaltliche Änderungen
- Storybook für Landing/Galaxie
- i18n (Deutsch-Englisch-Toggle)
- `anonymous_audit_share`-DB-Tabelle mit persistentem Token-Recall
- Mobile-PixiJS-Replacement durch Static-SVG-Fallback
- Mobile-Sprite-Sizing in App-Area (B5 aus Audit)
- Inngest-Realtime-Stream für echte Audit-Stage-Progress (statt geschätzte 3-Step-UI)
- BipDrafts/Drift-Wiederherstellung (siehe ADR-0003)

---

## 9. Bezug zu Vorgänger-Plänen

- **v1**: `homepage-relaunch.md` (done/, ✅) — IA-Konsolidierung, Theme-Tokens, Statische Click-Galaxie.
- **v2**: `frontend-relaunch-v2.md` (done/, ✅) — Severity-Hue zurück, Auto-Tour, Hit-Areas, Mobile/a11y, Typography.
- **v3**: `landing-refactor-v3-static-mockup.md` (done/, ✅, 2026-05-19) — Statisches App-Mockup-Hero, Sprint-2-Items als Out-of-Scope markiert.
- **Dieser Plan**: adressiert die in v3 §9 als Sprint 2 markierten 6 Items.
