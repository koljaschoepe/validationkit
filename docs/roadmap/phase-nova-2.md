# Roadmap — Phase Nova-2

> Status: ✅ Done (Shell) — 2026-05-20
> Master-Plan: [docs/plans/done/nova-2-full-product.md](../plans/done/nova-2-full-product.md).
> Vision: [docs/vision.md](../vision.md).

Phase Nova-2 hat das Frontend auf Linear/Vercel-Niveau gehoben. Nachfolger zu Phase Galaxie (siehe `done/phase-galaxie.md`).

## Sprint-Übersicht

| Sprint | Inhalt | Status |
|--------|--------|--------|
| N2.1 — Foundation | 3-Tier OKLCH-Tokens + ui-vk Komponenten-Library (PageShell, PageHeader, EmptyState, SettingsLayout) | ✅ |
| N2.2 — Hero-Polish | SVG-Galaxie auf Landing (PixiJS für Hero deprecated, siehe [ADR-0004](../adrs/0004-landing-svg-stack.md)). Cooperative-Pan/Pinch, Lucide-Severity-Icons | ✅ |
| N2.3 — App-Pages-Refactor | Skip-Links, SiteNav active-state, Pricing/Billing/Login/Customers/Scans/Status/Trust auf neue Tokens | ✅ |
| N2.4 — Auth + Onboarding Shell | Better-Auth 1.6 + Magic-Link (Resend via SMTP), `/auth/verify`, ActivationChecklist (5 Items, DB-driven) | ✅ Shell |
| N2.5 — Settings-Restructure Shell | `/account/settings/*` (5 Sections) + `/[workspace]/settings/*` (10 Sections) | ✅ Shell |
| N2.6 — Mobile-Adaptation | RepoTreeView Accordion <768px, Vaul Bottom-Sheet Inspector, 44px touch-targets | ✅ |
| N2.7 — Quality | optimizePackageImports, font display:swap, GlobalMotionConfig, Lighthouse-CI thresholds | ✅ |

## Aktive Sub-Pläne (Backend zur Shell)

- `docs/plans/nova-2-live-audit-flow.md` — anonymes Audit auf Landing
- `docs/plans/nova-2-settings-backend.md` — DB-Schemas + APIs für die 6 NEW Settings-Sections
- `docs/plans/nova-2-a11y-deep-sweep.md` — axe-core Playwright + Demo-Recording

## Tech-Decisions in dieser Phase

- [ADR-0004 — Landing-Hero auf SVG + motion](../adrs/0004-landing-svg-stack.md) (Supersedes-Partial ADR-0002)
- Workspace-Routen unter `/[workspace]/...` konsolidiert (`docs/plans/done/workspace-route-consolidation.md`)

## Was als Nächstes ansteht

Phase Nova-3+ ist offen. Mögliche Themen:
- Render-Stack-Vereinheitlichung (Pixi → SVG oder umgekehrt für Workspace-Galaxie)
- Customer-Route-Naming-Fix (siehe `docs/plans/repo-health-and-workflow-overhaul.md` Phase 3.8)
- Beta-Launch Pre-Reqs (separater Plan)
