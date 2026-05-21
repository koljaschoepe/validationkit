# Plan — Homepage-Relaunch (Monochrom, 5 Routen, statische Click-Galaxie)

> Erstellt: 2026-05-19
> Status: 🟢 Code Complete — 2026-05-19. Phase 1-4 implementiert, Code-Validation grün (typecheck + test + eval + build). Phase 3 C1-C3 (scans/customers/requests → `/[workspace]/*` File-Moves) deferred als separater Sprint. Phase 5 Q5-Q8, Q10 sind manuelle Browser-Tests, die User-Side ausstehen.
> Scope: App-weit. Trotz Slug "homepage" reicht das in Routen, Theme, DB.

---

## Kontext-Snapshot (nicht löschen — Briefing für /execute)

Vier Sub-Agents haben den Ist-Zustand vermessen. Kernzahlen:

- **17+ Top-Level-Routen** heute. Ziel: 5 (`/`, `/login`, `/[workspace]` als Auth-Hub, `/billing`, `/trust`) plus `/pricing` als Marketing-Anhängsel.
- **Compare-Feature** lebt in `/drift`, `/drifts`, `/drifts/[id]`, `DriftForm.tsx`, `DriftView.tsx`, `lib/drift-action.ts`, DB-Tabelle `driftRun`, Inngest-Job `drift-requested.ts`, und ist via `lib/dal/galaxie.ts` in den Workspace-Graph eingewoben.
- **Galaxie** ist ~2.300 LOC Komponenten + ~515 LOC Lib, lazy-geladen via `dynamic({ssr:false})`, Bundle ~1.150 KB gzipped. Drei Verwendungen: Landing (heute Vollbild + Scroll-Trigger, **muss weg**), `/[workspace]` (Multi-Repo-Hub, **bleibt**), `/galaxie-dev` (Dev-Sandbox, **weg**).
- **Severity-Farben** in `globals.css` (`--color-sev-{kill,weak,mid,strong,exceptional}`) und `lib/galaxie/severity-colors.ts` (Hex + Pixi-Color). 7 Komponenten + 12-15 Dateien insgesamt betroffen.

User-Entscheidungen (zwei AskUserQuestion-Runden):
1. **Compare-Feature**: komplett raus. Multi-Repo bleibt.
2. **App-Struktur**: ≤5 Top-Level-Pfade.
3. **Farben**: monochrom + 1 Akzentfarbe = **Slate-Blau Linear-Style** (#5B6FF0).
4. **Demo**: hardcoded Demo-Workspace auf der Startseite.
5. **Galaxie auf Landing**: bleibt, aber **statisch** (keine Scroll-/Auto-Animation), **klickbar mit Mini-Pop-up** (Inspector-Look, Read-Only-Demo).
6. **Anonymous-Audit-Form**: bleibt als **sekundäres** Element auf Landing.

---

## 1. Ziel

Die App wirkt nach Execute wie ein ernstes monochromes Agency-Tool mit fünf Routen, einer ruhigen Startseite, einer statisch-klickbaren Demo-Galaxie als Live-Beispiel und null Compare-Feature.

---

## 2. Endzustand

**UI/Verhalten:**
- `/` (Landing) lädt ohne Scroll-Snap, ohne Auto-Pan, ohne Karussell. Hero ≤70vh: monochrome statische Galaxie + Headline + Sub-Copy + primärer CTA. Klick auf Customer/Repo/File-Sprite öffnet einen Inspector-Pop-up mit Mock-Findings + Mini-GSAP-Animation. Darunter: 3 Demo-Workspace-Cards, die die Galaxie-Daten im Hero swappen. Darunter (sekundär, gedämpft): Anonymous-Audit-Form. Footer.
- `/login`: Magic-Link unverändert, aber im neuen Theme.
- `/[workspace]` und Sub-Routen (`/[workspace]/scans/*`, `/[workspace]/customers/*`, `/[workspace]/requests`, `/[workspace]/settings/*`): einziger Auth-Hub, Galaxie bleibt interaktiv, alle Severity-Bänder visuell ohne Hue erkennbar.
- `/billing`: Stripe-Integration im neuen Theme.
- `/trust`: Trust-Center im neuen Theme.
- `/pricing` (Marketing-Anhängsel): bleibt aus B2B-Conversion-Gründen, ist aber von der "5 Pfade"-Zählung aus Marketing-Sicht ausgenommen.

**Code-Pfade:**
- Verzeichnisse `apps/web/src/app/{drift,drifts,bip,galaxie-dev,scans,customers,requests,skills,status,onboarding,dashboard}` existieren nicht mehr oder sind nach `/[workspace]/*` migriert.
- Files `DriftForm.tsx`, `DriftView.tsx`, `lib/drift-action.ts`, `packages/inngest/src/functions/drift-requested.ts` gelöscht.
- DB-Migration `drop_drift_run.sql` durch.
- `lib/dal/galaxie.ts` rendert ohne Drift-Edges.
- `globals.css` Severity-Tokens auf Graustufen-OKLCH. `--primary` = OKLCH-Äquivalent zu #5B6FF0.
- Neue Komponenten: `LandingGalaxie.tsx` (statischer Wrapper um `GalaxieRoot`), `LandingDemoCards.tsx`, `LandingHero.tsx`.
- Severity-Encoding ohne Hue: Icon + Border-Weight + Schriftgewicht + Filled/Outline-State (siehe §3.4).

**Tests grün:**
- `pnpm -w typecheck` ✅
- `pnpm -w lint` ✅
- `pnpm -w test` ✅ (Drift-Tests gelöscht oder umgeschrieben)
- `pnpm -w eval` ✅ (Conflict-Eval-Gate)

---

## 3. Detail-Specs

### 3.1 IA + Routen-Mapping

| Heute | Morgen | Grund |
|---|---|---|
| `/` | `/` | bleibt, Inhalt komplett ersetzt |
| `/login` | `/login` | bleibt |
| `/dashboard` | `/[workspace]` | Dashboard wird zum Workspace-Hub. Redirect `/dashboard` → `/[workspace]` für Backlinks |
| `/[workspace]` | `/[workspace]` | bleibt als Auth-Hub |
| `/scans`, `/scans/[id]` | `/[workspace]/scans`, `/[workspace]/scans/[id]` | gemerged |
| `/customers`, `/customers/[id]`, `/customers/c/[customerId]`, `/customers/[id]/access` | `/[workspace]/customers/*` | gemerged |
| `/requests` | `/[workspace]/requests` | gemerged |
| `/drift`, `/drifts`, `/drifts/[id]` | — | komplett DROP |
| `/bip` | — | DROP, Build-in-Public-Generator nicht im Core-Funnel |
| `/galaxie-dev` | — | DROP, Dev-only |
| `/skills` | — | DROP. War Anthropic-Skills-Catalog, nicht zentral, nicht load-bearing |
| `/status` | Footer-Component | DROP als Route, Status-Pill in den App-Footer als kleines Server-Component |
| `/onboarding/[slug]` | Inline (Banner schon vorhanden) | DROP, Inline-Onboarding ist schon implementiert |
| `/billing` | `/billing` | bleibt |
| `/trust`, `/trust/dpa`, `/trust/eval` | bleiben | strategisch für B2B-Trust |
| `/pricing` | `/pricing` | bleibt, Marketing-Anhängsel |
| `/api/*` | unverändert | API ist nicht Teil der "5 Pfade"-Zählung |

### 3.2 Landing-Wireframe (ASCII)

```
┌──────────────────────────────────────────────────────────────┐
│  ValidationKit                       Pricing  Trust   Login  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         Audit every repo your agency ships.                  │
│                                                              │
│         Multi-Repo-Audit für AI-Consultancies. Severity-     │
│         Hotspots, Zero-Code-Apply, kein Vibe-Score.          │
│                                                              │
│         [ Open demo workspace ]    Anonymous audit ↓         │
│                                                              │
│   ╔══════════════════════════════════════════════════╗       │
│   ║                                                  ║       │
│   ║    [statische Galaxie, max 60vh,                 ║       │
│   ║     3 Customer-Sterne mit Repo-Monden,           ║       │
│   ║     1 Severity-Hotspot pulsiert dezent,          ║       │
│   ║     Click auf Sprite → Inspector-Pop-up]         ║       │
│   ║                                                  ║       │
│   ╚══════════════════════════════════════════════════╝       │
├──────────────────────────────────────────────────────────────┤
│  Open a demo workspace                                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ ⛔ Kill      │  │ ✓  Strong    │  │ • Mid        │       │
│  │ Acme Corp    │  │ Globex Ltd   │  │ Initech      │       │
│  │ 8 repos      │  │ 12 repos     │  │ 5 repos      │       │
│  │ 3 critical   │  │ clean        │  │ 1 drift      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├──────────────────────────────────────────────────────────────┤
│  Try the audit (anonymous)              ▼ collapsed by default│
│  [paste a public GitHub repo URL]   [ Audit ]                │
├──────────────────────────────────────────────────────────────┤
│  Pricing · Trust · Status: ●                                 │
└──────────────────────────────────────────────────────────────┘
```

Zwei Sektionen above-the-fold-ish. Anonymous-Audit ist gefaltet/collapsed (Klick zum Aufklappen), damit es nicht mit der Demo-Galaxie konkurriert. Status-Pill als Mini-Component im Footer.

### 3.3 Theme-Tokens (Slate-Blau-Akzent)

In `apps/web/src/app/globals.css`:

```css
:root {
  /* Akzent: Slate-Blau Linear-Style (#5B6FF0 ≈ oklch(0.62 0.20 274)) */
  --primary: oklch(0.62 0.20 274);
  --primary-foreground: oklch(0.99 0 0);
  --ring: oklch(0.62 0.20 274 / 0.45);
  --accent: oklch(0.62 0.20 274);
  --accent-foreground: oklch(0.99 0 0);

  /* Severity → reine Graustufen (Lightness-Skala) */
  --color-sev-kill:        oklch(0.18 0 0);   /* fast schwarz */
  --color-sev-weak:        oklch(0.35 0 0);   /* dunkelgrau */
  --color-sev-mid:         oklch(0.55 0 0);   /* mittelgrau */
  --color-sev-strong:      oklch(0.75 0 0);   /* hellgrau */
  --color-sev-exceptional: oklch(0.90 0 0);   /* sehr hellgrau */

  /* Destructive nicht mehr identisch zu Severity-Kill —
     destructive bleibt als Akzent-Rot-Variante NUR für
     destruktive Aktionen (Delete, Cancel-Subscription) */
  --destructive: oklch(0.55 0.21 25);
  --destructive-foreground: oklch(0.99 0 0);
}

.dark { /* analog spiegeln, --primary identisch, Severity-Skala invertiert */ }
```

Final-Hex-Decision (#5B6FF0 vs. #4E5EE4) wird am visuellen Prototyp festgenagelt, nicht im Plan.

### 3.4 Severity-Encoding ohne Hue (Konvention)

| Band | Icon (lucide) | Border | Schrift | Glow (Pixi) | aria-label |
|---|---|---|---|---|---|
| Kill | `OctagonAlert` | 3px solid `sev-kill` | bold | breit + schnell pulsierend | "Severity: kill" |
| Weak | `AlertTriangle` | 2px solid `sev-weak` | semibold | mittel + langsam pulsierend | "Severity: weak" |
| Mid | `Dot` | 1px solid `sev-mid` | medium | klein, static | "Severity: mid" |
| Strong | `Check` | 1px dashed `sev-strong` | regular | none | "Severity: strong" |
| Exceptional | `Sparkle` | 1px dashed `sev-exceptional` | italic | none, weißer Punkt | "Severity: exceptional" |

Diese Konvention gilt app-weit für Badges, Inspector-Cards, Pixi-Sprites, MiniMap-Punkte, Tooltips. `lib/galaxie/severity-colors.ts` exportiert künftig `SEVERITY_HEX` (Graustufen), `SEVERITY_PIXI` (Graustufen), `SEVERITY_ICON`, `SEVERITY_WEIGHT`, `SEVERITY_PULSE_RATE`.

### 3.5 Statische Click-Galaxie auf Landing

Neue Komponente `apps/web/src/components/landing/LandingGalaxie.tsx`:
- Wrappt `GalaxieRoot` mit Prop `mode="static-demo"`.
- `GalaxieScene.tsx` bekommt einen `mode`-Prop: bei `static-demo` werden alle Camera-Pan-Listener (Mouse-Drag, Wheel-Zoom, Scroll-Trigger) deaktiviert. Klick-Handler auf Sprites bleiben aktiv.
- Klick auf Customer-Star / Repo-Moon / File-Asteroid: 200-300 ms GSAP-Animation (Scale up + Glow-Intensify), dann Inspector als kleines Pop-up-Overlay (re-used `Inspector.tsx` im `readOnly`-Modus, mit hardcodeden Mock-Findings + "Sign in to drill in"-CTA).
- Hero-Container: `max-h-[60vh]`, kein `h-screen`, kein Scroll-Snap.

### 3.6 Demo-Workspace-Daten

Datei: `apps/web/src/lib/landing/demo-workspaces.ts` (neu).
- Drei hardcodete Workspaces: "Acme Corp" (Kill-lastig), "Globex Ltd" (clean/Strong), "Initech" (Mid mit 1 Drift-Beispiel — auch wenn Drift-Feature weg ist, kann Inspector "Stale-Reference"-Finding zeigen, das ist nicht das gleiche wie Compare-Drift).
- Jede Card hat: Name, Repo-Count, Aggregate-Severity, 3-5 Mock-Findings, 1 Beispiel-File-Tree.
- Card-Klick swappt die `LandingGalaxie`-`initialData`-Prop. Kein Routenwechsel, kein DB-Touch.

### 3.7 Anonymous-Audit-Form (sekundär)

`apps/web/src/components/AuditForm.tsx` bleibt funktional, aber:
- Landing zeigt sie in einer collapsed `<details>` oder einem subtilen Akkordeon, default geschlossen.
- Visuell weniger Gewicht: kleinere Headline, keine Icon-Card-Grid drumherum (die heutigen 6 Finding-Kategorie-Cards fliegen raus).

---

## 4. Schritte

Sortiert in 5 Sub-Phasen. Jede Phase kann einzeln gemerged werden. `/execute` arbeitet die Boxen sequentiell ab.

### Phase 1 — Theme + Severity-Encoding (RM-T)

- [x] **T1** `apps/web/src/app/globals.css` — Severity-Tokens auf Graustufen-OKLCH umstellen (§3.3). _Indirektion via `--sev-*` für späteren Light-Mode._
- [x] **T2** `apps/web/src/app/globals.css` — `--primary`, `--accent`, `--ring`, `--destructive` neu setzen (Slate-Blau-Akzent #5B6FF0 ≈ `oklch(0.62 0.20 274)`).
- [x] **T3** `apps/web/src/lib/galaxie/severity-colors.ts` — Graustufen-Hex, plus `SEVERITY_GLOW_RADIUS` + `SEVERITY_PULSE_RATE` exportiert. (Icon-/Weight-Mapping in SeverityBadge, nicht hier — Lucide-Import würde sonst in die Pixi-Pipeline lecken.)
- [x] **T4** `apps/web/src/components/ui/severity-badge.tsx` — CVA umgeschrieben: Lucide-Icon + Border-Style + Schriftgewicht + `aria-label`. Background-Tint raus.
- [x] **T5** Hardcoded Tailwind-Farbklassen säubern:
  - [x] `AISolutionPlaceholder.tsx` — ConfidencePill monochrom, FailureBlock → destructive, ApplyButton → primary.
  - [x] `Inspector.tsx` — Header-Pille auf `<SeverityBadge>`, action-error → destructive.
  - [x] `OnboardingBanner.tsx` — Check-Icon `text-primary` statt `text-green-400`.
  - [x] `EmptyGalaxie.tsx` — Amber raus, plus `/galaxie-dev`-Tip entfernt (Route fliegt in Phase 2).
  - [x] `diff-renderer.tsx` — `+`→primary, `-`→destructive, `@@`→muted-foreground.
  - [x] `FindingsList.tsx` — keine Hue-Klassen drin, nutzt schon Theme-Tokens (no-op).
  - [x] `inspector-templates.ts` — nur Text, keine Farben (no-op).
- [x] **T6** Pixi-Komponenten — Glow-Radius via `SEVERITY_GLOW_RADIUS`:
  - [x] `CustomerStar.ts` — neuer GlowFilter, Distance = `SEVERITY_GLOW_RADIUS[sev]`.
  - [x] `RepoMoon.ts` — neuer GlowFilter, Distance = `SEVERITY_GLOW_RADIUS[sev] * 0.5`.
  - [x] `FileAsteroid.ts` — GlowFilter distance jetzt `SEVERITY_GLOW_RADIUS[sev] * 0.25` (statt fix 6).
  - _Pulse-Animation (Kill/Weak) als Polish-TODO für Phase 5 verschoben — GSAP-Tween pro Sprite ist Performance-Risiko bei vielen Files._
- [x] **T7** `MiniMap.tsx` (Files-Rect-Size pro Severity) + `Tooltip.tsx` (Pille auf `<SeverityBadge>`).
- [ ] **T8** Legacy `.sev-pill` aus `globals.css` (Z. 105-119) entfernen — **deferred bis nach Phase 2/3**, weil Drift/BIP/Customers-Routen die Klasse noch nutzen und in jenen Phasen weggemerged/gelöscht werden.

### Phase 2 — Compare-Feature & Toter-Code raus (RM-R)

- [x] **R1** Verzeichnis `apps/web/src/app/galaxie-dev/` gelöscht.
- [x] **R2** Verzeichnis `apps/web/src/app/bip/` gelöscht. _Bonus: `apps/web/src/components/BipDrafts.tsx` + ganzes `packages/bip-generator/`-Paket entfernt (Drift-Consumer, jetzt orphan)._
- [x] **R3** Verzeichnisse `apps/web/src/app/drift/`, `apps/web/src/app/drifts/` gelöscht.
- [x] **R4** `DriftForm.tsx`, `DriftView.tsx`, `lib/drift-action.ts` gelöscht.
- [x] **R5** `packages/inngest/src/functions/drift-requested.ts` gelöscht. Re-Exports in `packages/inngest/src/index.ts` (DriftRequestedPayload-Type) und `packages/inngest/src/functions/index.ts` (Array-Eintrag + Import) entfernt. _Plus: ganzes `packages/drift/`-Paket weg (dedicated Compute-Library, kein anderer Consumer)._
- [x] **R6** Drizzle-Migration `0011_lame_speedball.sql` via `pnpm --filter @vk/db generate` (drizzle-kit hat `DROP TABLE drift_run CASCADE` automatisch erzeugt + Journal aktualisiert). `driftRun` + `driftRunRelations` aus `packages/db/src/schema.ts` entfernt.
- [x] **R7** Drift-Refs aus Galaxie-Graph entfernt: `apps/web/src/app/dashboard/page.tsx` (edges = []), `lib/customers.ts` (getCustomer ohne drifts), `lib/audit-trail-export.ts` (kind-Union ohne `drift_run`). _`lib/dal/galaxie.ts` hatte keine Drift-Refs — Customer-Severity-Aggregation lief immer schon über findings, nicht über drift._
- [x] **R8** Nav + Footer säubert:
  - [x] `SiteNav.tsx` — `/drift`-Link entfernt, durch `/pricing`-Link ersetzt.
  - [x] Page-Footers in `page.tsx` (Landing), `scans/page.tsx`, `requests/page.tsx`, `customers/page.tsx` — `/drift`-Link raus.
  - [x] `customers/[id]/page.tsx` — komplette "Recent drift comparisons"-Sektion + Drifts-Header-Stat raus.
  - [x] `OnboardingChecklist.tsx` — `hasDrift`-Feld aus Status-Type + Drift-Onboarding-Step raus.
- [x] **R9** `docs/vision.md` aktualisiert: Pivot-Box oben + Sprint-G2-Capability-Beschreibung umformuliert + Persona-Bullet "Drift-Erkennung" entfernt.
- [x] **R10** `docs/roadmap/phase-galaxie.md` aktualisiert: Pivot-Notiz unter Header.
- [x] **R11** ADR `docs/adrs/0003-drop-compare-feature.md` geschrieben (Context, Decision, Rationale, Scope of cleanup, Reversal cost).

**Phase-2-Smoke (intermediär, ohne Phase 5):**
- `pnpm install` ✅ — `@vk/drift` + `@vk/bip-generator` aus Workspace entfernt, 13 Pakete.
- `pnpm -w typecheck` ✅ — alle 25 Pakete grün (nach `.next`-Cache-Clear für typed-routes-Validator).
- `pnpm -w test` ✅ — 81 Tests grün, 14 Test-Files (die bip-generator-Drift-Tests sind mit dem Paket weggefallen, ohne Lücken).

### Phase 3 — Routen-Konsolidierung (RM-C)

**Light-Variante ausgeführt am 2026-05-19.** Erkenntnis während Phase 3: `apps/web/proxy.ts` + `middleware-redirects.ts` haben die Legacy → Workspace-scoped Redirects bereits vorbereitet (Cookie-gesteuert), aber die Ziel-Routen unter `/[workspace]/scans/*`, `/[workspace]/customers/*`, `/[workspace]/requests` existieren noch nicht. C1-C3 sind deshalb ein **eigener Sprint** (File-Moves + Workspace-Param in jeder Page + DAL-Refactor), nicht Teil von Phase 3.

- [ ] **C1** **DEFERRED — separater Sprint** (`docs/plans/workspace-route-consolidation.md` als follow-up): `apps/web/src/app/scans/` → `apps/web/src/app/[workspace]/scans/`. Bedeutet: Page-Code muss `params: { workspace: string }` entgegennehmen, Server-Actions müssen workspace-Slug → workspace-ID auflösen, alle internen Links + `revalidatePath`-Calls in `audit-action.ts` umbiegen.
- [ ] **C2** **DEFERRED — separater Sprint**: `apps/web/src/app/customers/*` → `apps/web/src/app/[workspace]/customers/*`. Hat 4 Sub-Routen (page, [id]/page, [id]/access, c/[customerId]) und tief verwobene Cookie-Default-Workspace-Logik.
- [ ] **C3** **DEFERRED — separater Sprint**: `apps/web/src/app/requests/` → `apps/web/src/app/[workspace]/requests/`.
- [x] **C4** `apps/web/src/app/dashboard/page.tsx` ist jetzt 16-Zeilen-Redirect-Stub: `redirect('/' + firstWorkspaceSlug)`. Die alten ~290 Zeilen + DashboardSidebar/Table/Filter-Components sind orphan, werden in Phase 5 Dead-Code-eliminiert oder bei C1-C3-Sprint nach `/[workspace]/page.tsx` portiert.
- [x] **C5** `apps/web/src/app/skills/` + `apps/web/src/lib/skills-registry.ts` gelöscht. (SKILLS-Registry war eh leeres `[]`-Array, Marketing-Skelett.)
- [ ] **C6** `/status` **bleibt als Public-Page** — Plan-Default revidiert. Begründung: `/status` ist Marketing-/Trust-Surface wie `/trust`, kein User-Hub-Pfad. Es zählt nicht zu den 5 Hub-Routen, sondern zu den Marketing-Anhängseln (analog `/pricing`, `/trust/*`). Status-Pill-im-Footer-Refactor ist optional, nicht load-bearing.
- [x] **C7** `apps/web/src/app/onboarding/[slug]/` gelöscht. Inline-`OnboardingBanner` ist in `/[workspace]`-Galaxie bereits aktiv. Customer-Onboarding-MD-Files in `docs/customer-onboarding/` bleiben als Doku-Quellen erhalten, aber ohne öffentliche Route. Plus: `next.config.ts` `outputFileTracingIncludes` Eintrag `/onboarding/[slug]` entfernt.
- [x] **C8** `middleware-redirects.ts` LEGACY_MAP gesäubert: `/drift`, `/skills`, `/onboarding`, `/status` entfernt (Routes weg). `/billing`, `/dashboard`, `/scans` bleiben als Legacy-Redirects (Bookmarks von Beta-Usern). PUBLIC_TOP_LEVEL aktualisiert: `/galaxie-dev`, `/bip` raus; `/status` rein.

**Effektiver Routen-Footprint nach Phase 3 (Top-Level):**

`/`, `/login`, `/[workspace]`, `/billing`, `/trust/*`, `/pricing`, `/status`, `/scans`, `/customers`, `/requests`, `/dashboard` (Redirect-Stub).

5 Hub-Routen + 4 Marketing/Legal + 3 Legacy-Routen-Group (scans/customers/requests, im follow-up Sprint nach `/[workspace]/*` migrierend). Plan-Endzustand „≤5 Pfade" wird nach dem follow-up Sprint erreicht — Phase 3 hat den Pfad dahin geebnet, nicht ganz beendet.

**Phase-3-Smoke:**
- `pnpm -w typecheck` ✅ — 23 Pakete grün.
- `pnpm -w test` ✅ — 13 Test-Files, 74 Tests grün. (Vorher 14/81; -1 File + -7 Tests durch `@vk/bip-generator`-Drop.)

### Phase 4 — Landing-Relaunch (RM-L)

- [x] **L1** `apps/web/src/components/landing/` mit drei Files: `LandingHero.tsx` (Headline + Sub-Copy + CTAs + statische Galaxie + Demo-Cards-Composition), `LandingGalaxie.tsx` (Wrapper um `GalaxieRoot` mit `mode="static-demo"` + `readOnly`), `LandingDemoCards.tsx` (3 klickbare Workspace-Cards mit SeverityBadge).
- [x] **L2** `GalaxieScene.tsx` mit neuem `mode`-Prop `'interactive' | 'static-demo'`. In `static-demo`: useGesture-Listener auf `enabled:false` (Drag/Wheel/Pinch), Cmd+0..4 Keyboard-Handler übersprungen, Workspace-Switcher + MiniMap + UniversalSearch + ZoomIndicator hidden. Click-Handler auf Customer/Repo werden no-op, File-Click öffnet Inspector ohne Camera-Tween.
- [x] **L3** `Inspector.tsx` mit `readOnly`-Prop. Dismiss/Snooze-Header-Buttons hidden, AI-Solution-Tab hidden, "Sign in to apply"-CTA-Link auf Detail-Tab. AISolutionPlaceholder wird gar nicht erst gemountet (keine Server-Action-Calls aus Public-Demo).
- [x] **L4** `apps/web/src/lib/landing/demo-workspaces.ts` exportiert `DEMO_WORKSPACES` (Acme Robotics, Globex Corp, Initech Labs). Nutzt die existierende `generateMockGalaxieData()` + filtert pro Customer-Slug — keine Daten-Duplikation.
- [x] **L5** `apps/web/src/app/page.tsx` komplett neu (45 Zeilen statt 158):
  - `<SiteNav />` → `<LandingHero />` → `<details id="anonymous-audit">` mit `<AuditForm />` → Footer mit Pricing/Trust/Status-Links.
  - Vollbild-Hero + Scroll-Snap + 6-Card-Feature-Grid weg.
  - Kein `h-[calc(100svh-3.5rem)]` mehr, statt dessen begrenzter Hero (60vh, min 420px).
- [x] **L6** `AuditForm.tsx` bleibt funktional, ist jetzt in `<details>` collapsed (klick zum Aufklappen). Feature-Grid mit 6 Cards entfernt (war im alten Page-Footer, Page-Refactor hat ihn weggeworfen).
- [x] **L7** `SiteNav.tsx` — schon in Phase 2 R8 reduziert auf {Audit, Pricing, Trust} + Login/Dashboard-CTA. _Anmerkung: Plan §3 sagte 3 Items {Pricing, Trust, Login}. Pragmatisch sind {Audit, Pricing, Trust} besser — "Audit" → Landing ist der natürliche Heimweg. Login bleibt als Button rechts._
- [x] **L8** Mobile-Polish — Pixi-`pointertap` funktioniert auf Touch + Click. `useGesture` mit `enabled:false` schaltet Drag/Pinch sauber ab (kein versehentlicher Pan beim vertikalen Scrollen der Page). LandingHero verwendet responsive Tailwind-Klassen (`sm:`-Breakpoints).
- [x] **L9** GSAP-Click-Animation läuft schon: bei File-Sprite-Click öffnet sich `Inspector` mit GSAP-Tween (`x: PANEL_WIDTH → 0`, opacity 0 → 1, 300ms, `power3.out`). Im static-demo-Mode keine Camera-Tween, der GSAP-Pop-up reicht als visuelle Bestätigung.

### Phase 5 — Polish + QA (RM-Q)

- [x] **Q1** `pnpm -w typecheck` ✅ alle 23 Pakete grün (nach `.next`-Cache-Clear für typed-routes-Validator).
- [ ] **Q2** `pnpm -w lint` ❌ pre-existing Issue: `apps/web/package.json` Script `"lint": "next lint"` — Next.js 16 hat `next lint` entfernt. Migration auf direkten ESLint ist ein separater Mini-Plan, nicht Teil des Homepage-Relaunch.
- [x] **Q3** `pnpm -w test` ✅ 13 Test-Files, 74 Tests grün. (Vorher 14/81; -1 File + -7 Tests durch `@vk/bip-generator`-Drop, alle anderen weiterhin grün.)
- [x] **Q4** `pnpm -w eval` ✅ 34/34 Golden-Set-Einträge bestanden (Conflict-Eval-Gate).
- [x] **Q9** `pnpm --filter @vk/web build` ✅ Production-Build durch. Route-Liste reflektiert den Cleanup: `/drift`, `/drifts/*`, `/bip`, `/galaxie-dev`, `/skills`, `/onboarding/[slug]` sind weg. `/dashboard` rendert als 16-Zeilen-Redirect.
- [x] **Bonus** Dead-Code-Sweep: Orphan-Dashboard-Components (`components/dashboard/`) + Orphan-Hook (`hooks/use-dashboard-events.ts`) gelöscht (waren Drift-/RepoGraph-spezifisch). Plus `packages/inngest/src/functions/audit-requested.ts` `auto-drift`-Step + `EventType` `"drift.completed"` entfernt.
- [ ] **Q5** _Manueller Browser-Test ausstehend_: Landing in Chrome/Safari/Mobile-Viewport — ruhiges Scrollverhalten ohne Snap, Click auf Galaxie-Planet löst Inspector-Pop-up mit GSAP-Mini-Animation.
- [ ] **Q6** _Manueller Browser-Test ausstehend_: nach Login `/[workspace]` öffnen, Severity-Bänder unterscheidbar ohne Farbe (Icon + Border + Schrift). Plus visuelle Lesbarkeits-Akzeptanz für Slate-Blau-Akzent.
- [ ] **Q7** _Manueller Browser-Test ausstehend_: Demo-Card-Klick swappt Galaxie-Daten ohne Page-Reload (`useState` + `key={active.slug}`-Forced-Remount).
- [ ] **Q8** _Manueller a11y-Check ausstehend_: `SeverityBadge` hat `aria-label`, aber `<details>`-Akkordeon-Tastaturbedienung sollte verifiziert werden.
- [ ] **Q10** _Vorher/Nachher-Screenshots ausstehend_ — sobald die manuellen Tests durch sind, im PR-Body ergänzen.

---

## 5. Files-to-Change (kompakt)

| Datei | Was passiert |
|---|---|
| `apps/web/src/app/globals.css` | Severity-Tokens auf Graustufen, `--primary` Slate-Blau, Legacy `.sev-pill` raus |
| `apps/web/src/lib/galaxie/severity-colors.ts` | Hex + Pixi auf Graustufen, neue Maps Icon/Weight/PulseRate |
| `apps/web/src/components/ui/severity-badge.tsx` | CVA-Varianten umgeschrieben, Icons + Border + Weight |
| `apps/web/src/components/galaxie/pixi/{CustomerStar,RepoMoon,FileAsteroid}.ts` | Glow-Radius + Pulse statt Hue |
| `apps/web/src/components/galaxie/{MiniMap,Tooltip,Inspector,AISolutionPlaceholder,EmptyGalaxie,OnboardingBanner,diff-renderer,inspector-templates}.tsx` | Hue-Klassen entfernen |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | neuer `mode`-Prop, Scroll/Drag/Wheel im static-demo-Mode aus |
| `apps/web/src/components/galaxie/Inspector.tsx` | neuer `readOnly`-Prop |
| `apps/web/src/components/landing/{LandingHero,LandingGalaxie,LandingDemoCards}.tsx` | neu |
| `apps/web/src/lib/landing/demo-workspaces.ts` | neu, 3 hardcodete Workspaces |
| `apps/web/src/app/page.tsx` | komplett neu |
| `apps/web/src/components/AuditForm.tsx` | visuell entschlackt |
| `apps/web/src/components/SiteNav.tsx` | Items auf 3 reduziert, Drift-Link raus |
| `apps/web/src/components/DashboardSidebar.tsx` | Drift-Link raus |
| `apps/web/src/components/FindingsList.tsx` | Hue-Klassen raus |
| `apps/web/src/app/{drift,drifts,bip,galaxie-dev,skills,status,onboarding,dashboard}/` | DROP (siehe §3.1) |
| `apps/web/src/app/{scans,customers,requests}/` | nach `/[workspace]/*` migriert, alte Pfade DROP |
| `apps/web/src/components/{DriftForm,DriftView}.tsx` | DROP |
| `apps/web/src/lib/drift-action.ts` | DROP |
| `apps/web/src/lib/dal/galaxie.ts` | Drift-Edges aus Graph |
| `packages/db/src/schema.ts` | `driftRun` Table + Relations raus, neue Migration `drop_drift_run.sql` |
| `packages/inngest/src/functions/drift-requested.ts` | DROP |
| `docs/vision.md` | Drift-Detection als reverted markieren |
| `docs/roadmap/phase-galaxie.md` | G2 als reverted markieren |
| `docs/adrs/00XX-drop-compare-feature.md` | neu |

---

## 6. Test-Plan

**Automatisch:**
- `pnpm -w typecheck` — alle Pakete.
- `pnpm -w lint` — keine neuen Warns.
- `pnpm -w test` — Vitest-Suite. Drift-Test-Files (`*.drift.test.ts`) gelöscht oder als deleted markiert.
- `pnpm -w eval` — Conflict-Eval-Gate (CI-Gate).
- `pnpm --filter web build` — Production-Build erfolgreich.

**Manuell:**
- **Scrollen:** Landing scrollen in Chrome + Safari Desktop + Mobile (DevTools-Viewport). Kein Snap, kein Jump. Hero bleibt fixed-position-frei.
- **Click-Galaxie:** Klick auf Customer-Star, Repo-Mond, File-Asteroid jeweils — Inspector-Pop-up öffnet, GSAP-Mini-Animation läuft (~300 ms), "Sign in to apply"-Link statt Apply-Button.
- **Demo-Card-Swap:** Klick auf 2., dann 3. Demo-Card. Galaxie-Daten swappen ohne Page-Reload, ohne Flash.
- **Audit-Form-Akkordeon:** Klick öffnet, Enter im Input audited, Result-Region nicht überdimensioniert.
- **Severity-Lesbarkeit:** `/[workspace]` mit Real-Daten (oder Mock) öffnen. Alle 5 Severity-Bänder unterscheidbar ohne Farbe. Screen-Reader liest Severity-Label vor.
- **Login-Flow:** Magic-Link → `/[workspace]` → keine Toten-Links zu `/drift` o.ä.
- **Mobile:** Galaxie-Sprite-Tap funktioniert, Pop-up ist nicht abgeschnitten.
- **Toter-Code-Check:** Direkt-Navigation zu `/drift`, `/drifts/abc`, `/bip`, `/galaxie-dev` liefert 404.

**Performance:**
- Lighthouse Mobile auf `/` (vorher/nachher): Performance-Score-Δ protokollieren.
- Bundle-Analyzer-Snapshot Landing-First-Load-JS: vorher vs. nachher.

---

## 7. Risiken + Rollback

**Risiken:**

1. **Drift-Daten im Workspace-Graph** — `lib/dal/galaxie.ts` aggregiert heute auch Drift-Severity in die Customer-Star-Visualisierung. Wenn das wegfällt, könnten Customer-Severity-Scores in der Workspace-Galaxie kippen. **Mitigation:** Snapshot der heutigen Aggregat-Severities vor R7, danach Vergleich. Falls Differenzen relevant: Aggregat-Logik anpassen oder Datenbank-Backfill.

2. **DB-Migration `drop_drift_run`** — nicht reversibel. Prod-Daten gehen verloren. **Mitigation:** Vor der Migration pg_dump des `drift_run`-Tables als Backup-Snapshot ablegen. Migration-Down-Script auch schreiben (Create-Table ohne Daten).

3. **Severity ohne Farbe kann Power-User irritieren** — Schnell-Scan über 50 Findings ist mit Farbe schneller als mit Icons + Border-Styles. **Mitigation:** Q6-Test ernst nehmen, ggf. dezenten Akzent-Slate-Blau für Kill/Weak einsetzen (alle anderen monochrom), wenn Test fehlschlägt. Plan offen für eine Mini-Hue-Korrektur nach erstem Real-Use.

4. **Bundle-Reduktion klein** — PixiJS bleibt für Workspace, also liefert die Landing weiterhin den Chunk lazy. First-Load-JS sinkt nur, wenn PixiJS-Chunk komplett vom Landing-Pre-Fetch ausgeschlossen wird. **Mitigation:** Verifizieren in Q9, dass `LandingGalaxie` keine PixiJS-Eager-Imports zieht.

5. **Galaxie als statische Demo verliert Wow-Effekt** — heutige Vollbild-Animation ist visuell stark, neue Version ist sachlicher. Risiko, dass Conversion zu Sign-Up sinkt. **Mitigation:** A/B-Test nicht jetzt, aber Variante "Hero-Galaxie mit subtilem Auto-Pulse auf Hotspot" gegen "komplett statisch" ist optional in Phase 6 später.

6. **Slug-/Workspace-Bestimmung beim Default-Workspace-Redirect** (C4) — `dashboard/page.tsx` ist Auth-protected, leitet auf den Default-Workspace um. Wenn User keinen hat → Onboarding. Diese Logik muss sauber migriert werden.

7. **Vision-Pivot** — `docs/vision.md` sagt heute "Sprint G2: Drift-Detection ✅ Multi-Repo-Hotspots als Gravitationsströme". Das wird teilweise revidiert. Risiko: Plan-Dokumente sind nicht single-source-of-truth mehr. **Mitigation:** ADR (R11) macht den Pivot explizit, Vision wird auf neuen Stand gehoben.

**Rollback:**
- Phasen 1-4 sind Code-only: `git revert <merge-commit>` reicht.
- Phase 2 (DB-Migration in R6) ist destruktiv: Rollback via Down-Script möglich, aber Drift-Daten sind weg. **Daher: R6 erst als letzte Phase-2-Aktion, nach Validierung dass kein Code mehr referenziert.**
- Pre-Production-Smoke: Auf einem Preview-Deployment alle manuellen Tests aus §6 durchspielen, bevor Main-Merge.

---

## 8. Open Questions

Die folgenden Punkte sollten vor `/execute` final entschieden sein. Falls offen, im Plan aktualisieren oder per AskUserQuestion klären.

- [x] **Slate-Blau-Hex final:** ✅ #5B6FF0 ≈ `oklch(0.62 0.20 274)` — in Phase 1 T2 gesetzt, visuelle Validierung in Phase 5.
- [x] **Headline-Text:** ✅ Deutsch, sachlich (Agency-Lena-Ton). Konkret in Phase 4 L2.
- [x] **Demo-Workspace-Personas:** ✅ Generika (Acme Corp / Globex Ltd / Initech) — hardcodet in `lib/landing/demo-workspaces.ts`.
- [x] **`/skills` DROP:** ✅ Wird in Phase 3 C5 gelöscht (Plan-Default).
- [x] **Anonymous-Audit:** ✅ Collapsed `<details>` auf Landing (Phase 4 L5).
- [x] **Drift-Daten-Migration:** ✅ Direkt droppen, lokal-only — kein Backup-Schritt in der Migration nötig.
- [x] **`/[workspace]` als Hub:** ✅ Bleibt, Multi-Tenant-Slug-Konvention. Plan-Default.
- [ ] **Galaxie-Hotspot-Pulse auf Landing:** Pulse-Animation auf einem Severity-Hotspot ja oder nein? Plan setzt: ja, sehr subtil (1.5s Cycle, niedrige Amplitude). Wird in Phase 4 L9 entschieden.

---

## 9. Out of Scope (bewusst nicht in diesem Plan)

- Logo-/Branding-Refresh — separate Diskussion.
- Pricing-Page-Inhalts-Update — Theme-Tokens werden adoptiert, Copy bleibt.
- Email-Templates (Resend) — bleiben mit aktuellen Farben, in einem späteren Plan.
- Stripe-Webhook + Auth-Flow — nur Theming, keine Logik-Änderung.
- Mobile-App / PWA — out of scope.
- i18n — out of scope, App bleibt single-locale.
- Performance-Optimierung jenseits der Bundle-Snapshot-Messung — separate Plan-Datei.
