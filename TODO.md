# TODO — Free-Form Ideen-Capture

> Volatile. Source-of-Truth ist `.claude/CLAUDE.md` + `docs/roadmap/` + `docs/plans/`.
> Ideen, die >1h Work oder strategisch sind → in `docs/plans/<slug>.md` promoten.

---

## Phase-History

- Phase 0 (Foundation, 11 Sprints): `docs/plans/done/phase-0-history.md`
- Phase Galaxie (G1–G6): `docs/roadmap/done/phase-galaxie.md`
- Phase Nova-2 (Shell): `docs/roadmap/phase-nova-2.md`
- Repo-Health-Pass 2026-05: `docs/plans/repo-health-and-workflow-overhaul.md`

## Beta-Launch Pre-Reqs (User-Side)

- [ ] **GitHub-App registrieren** (~30 min Walkthrough — Setup-Doku in Phase 3.2 `docs/operations/deploy.md` zu schreiben). Setzt `GITHUB_APP_ID/CLIENT_ID/PRIVATE_KEY` in `.env.local` (prod: Vercel-Env).
- [ ] **Vercel-Account + Deploy**: Repo connecten, Env-Vars setzen, Domain claimen.
- [ ] **Stripe-Webhook**: URL in Stripe-Dashboard auf `<domain>/api/stripe/webhook` setzen.
- [ ] **Manueller Lighthouse-Audit-Run**: `apps/web/scripts/lighthouse-audit.sh` gegen Prod-URL. Goal ≥85 Desktop.
- [ ] **Drift-Cleanup-Verifikation** (Phase 1.14 dieser Repo-Health-Pass): nach Migration 0012 `SELECT count(*) FROM repo WHERE canonical_repo_id IS NOT NULL` — wenn Spalte schon gedroppt, fertig.

## Aktive Sub-Pläne (Nova-2 Backend-Gaps)

- `docs/plans/nova-2-live-audit-flow.md` — anonymes Audit auf Landing
- `docs/plans/nova-2-settings-backend.md` — 6 Sections noch Shell; Danger-Zone hat Priorität (Mis-Selling-Risk)
- `docs/plans/nova-2-a11y-deep-sweep.md` — axe-core + Playwright

## Re-Open-Triggers (würden neue Phase auslösen)

- W6 Galaxie Mobile <30fps → Reduced-Motion-Toggle-Sprint
- LLM-Solution accept-rate <70% → Multi-Pass-Upgrade
- Konkurrent shippt vergleichbare Galaxie → Differentiator-Audit

## Parking-Lot

- npm-Namespace `validationkit` reservieren (nach Gate-Pass)
- Domain-WHOIS-Check
- Customer-Route-Naming-Fix (`/customers/[id]` ist semantisch ein Repo) — Phase 3.8 als Sub-Plan
- **ESLint Flat-Config-Setup** — Next 16 hat `next lint` entfernt, neuer Lint-Stack via `eslint@9` flat-config + `@next/eslint-plugin-next` muss aufgesetzt werden. Husky ist installiert und wartet auf lint-staged-Config. → Eigener Sub-Plan `/plan eslint-flat-config-setup`.
- `@vk/fixes` → `@vk/audit/fixes` Sub-Export-Merge — Phase 2.3b (optional, OPTIONAL)
- Stripe Test-Mode Setup
- AAIF-Silver-Membership-Antrag (separates Framework)

---

*Update-Pattern: Idee einfangen, später ins richtige Doc promoten. Keine Sorgfalt erforderlich.*
