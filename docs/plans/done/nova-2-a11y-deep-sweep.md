# Plan — Nova-2 A11y Deep-Sweep

> Erstellt: 2026-05-20
> Status: 🟡 In Review · Sub-Plan zu `nova-2-full-product.md` Phase 7
> Slug: `nova-2-a11y-deep-sweep`

## 1. Ziel

Die A11y-Items aus Phase 7, die in der Quick-Win-Session nicht passten — weil sie entweder grosse Refactors oder neue CI-Setup-Arbeiten sind. Beta-Launch-blocker: nein (Lighthouse-A11y ≥95 ist auch ohne diese Items erreichbar). Nice-to-have für Procurement-Audits.

---

## 2. Schritte

### 2.1 Native `<dialog>` statt Custom-Modal (Radix-Refactor)

- [ ] Audit aller Dialog-Konsumenten: `SignUpTeaseDialog`, `ApiKeyModal`, `LogoutDialog` etc.
- [ ] Evaluation: Behalten wir Radix-UI Dialog (das viele A11y-Sachen schon richtig macht — aria-modal, focus-trap, ESC) oder migrieren auf nativ `<dialog>` mit `showModal()` API?
- [ ] Wenn Migration: `components/ui/dialog.tsx` neu schreiben gegen native `<dialog>`-Element + Focus-Trap-Polyfill für nicht-Chrome-Browser.
- [ ] Alle Consumer testen — Radix-Specific-Props wie `modal={false}` haben kein native-Äquivalent.

**Empfehlung:** Skippen. Radix-UI Dialog ist a11y-best-practice in 2025/2026. Native-`<dialog>` ist erst ab Chrome 122 stabil — bricht ältere Browser. Lighthouse-A11y interessiert das nicht.

### 2.2 axe-core Playwright

- [ ] `pnpm add -D @axe-core/playwright @playwright/test` (im apps/web Workspace)
- [ ] `apps/web/playwright.config.ts` — Targets: chromium + iphone-13-Sim
- [ ] `apps/web/tests/a11y/critical-routes.spec.ts` — axe-scan auf /, /login, /pricing, /dashboard, /[workspace]/customers/[id]
- [ ] CI-Integration: `pnpm a11y` → fail-build wenn `violations.length > 0`
- [ ] Optional: Threshold-Allowlist für bekannte Radix-issues, die wir akzeptieren

### 2.3 aria-live-Region für Toast/SSE

- [ ] Sonner-Toaster: bereits aria-live (laut sonner-source). Verify.
- [ ] SSE-Stream-Updates auf der Galaxie: aria-live-Region wenn Findings dynamisch reinkommen
- [ ] Tooltip-Mounts: kein Focus-Steal

### 2.4 Severity = Icon + Pattern + Color

- [ ] Sphere.tsx: Icon ist schon eingebaut (Phase 2). ✓
- [ ] SeverityBadge: aktuell nur Color. Add Lucide-Icon prefix (AlertCircle/AlertTriangle/CheckCircle/Sparkles).
- [ ] Optional: SVG-Pattern-Fill (Streifen/Punkte) bei Kill/Weak für Color-Blind-Differentiation in der Galaxie.

### 2.5 Demo-Recording

- [ ] 90s Loom-Recording: Landing-Hero → Klick Finding → Apply-Mock → Pricing → Sign-In
- [ ] In `/trust` als "Watch demo"-Link einbetten
- [ ] User-Aktion (kein Code)

---

## 3. Files-to-Change

| Datei | Aktion |
|---|---|
| `apps/web/playwright.config.ts` | NEU |
| `apps/web/tests/a11y/critical-routes.spec.ts` | NEU |
| `apps/web/src/components/ui/severity-badge.tsx` | UPDATE — Icon-Präfix |
| `apps/web/package.json` | ADD @axe-core/playwright + @playwright/test |
| (Demo) `docs/marketing/demo-90s.mp4` (oder Loom-Link) | NEU |

---

## 4. Test-Plan

- Manual: VoiceOver-Walkthrough auf Landing + Login + Dashboard
- Manual: Reduced-Motion via System-Settings
- Manual: Forced-Colors via Chrome DevTools
- Automated: `pnpm a11y` → 0 violations auf 5 Routes

---

## 5. Empfehlung

- **Definitiv jetzt machen** (kleine Aufwände, hoher A11y-Wert):
  - SeverityBadge mit Icon-Prefix (~10 min)
- **Post-Beta-Launch** (mehr Aufwand, audit-readiness):
  - axe-core Playwright Setup (~2-3 h)
  - Demo-Recording (~1 h)
- **Skip** (überholt durch Radix-best-practice):
  - Native-`<dialog>` Migration

---

## 6. Open Questions

- **Q-A11Y-1**: Welche Playwright-Version pinnen? @playwright/test major-version-Pinning kann CI-Schwankungen ausschließen.
- **Q-A11Y-2**: Demo-Recording — selbst aufnehmen oder im Beta-Launch-Marketing-Sprint mitlaufen lassen?
