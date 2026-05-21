# Audit 8 — Dead-Code apps/web

> 2026-05-21 · Subagent-Output.

## KILL — keine

Nach den Refactors (workspace-route-consolidation, Nova-2) ist nichts hard-broken. Alle stale Imports clean. Galaxie + Nova-2 haben weniger Dead-Code-Schaden hinterlassen als bei zwei Phase-Folgen üblich.

## WEAK — löschbare Files (~400 LOC + 2 Deps)

| Pfad | Begründung |
|------|-----------|
| `apps/web/src/components/AuditForm.tsx` | 200 LOC, 0 Mounts; HeroSection ersetzt Funktion |
| `apps/web/src/components/ui-vk/Card.tsx` | 0 externe Consumer; shadcn-Card wird flächendeckend genutzt |
| `apps/web/src/components/ui-vk/SectionHeader.tsx` | 0 externe Consumer |
| `apps/web/src/components/ui-vk/StatTile.tsx` | 0 externe Consumer |
| `apps/web/src/components/ui-vk/Hairline.tsx` | 0 externe Consumer |
| `apps/web/src/components/ui-vk/KeyboardHint.tsx` | 0 externe Consumer (inkl. KeyboardSequence) |
| `apps/web/src/app/dashboard/loading.tsx` | nie reachable (Page ist sync redirect) |
| `apps/web/src/app/[workspace]/settings/user/page.tsx` | edge-redirect in next.config.ts shadowt |
| **Body** von `OnboardingBanner.tsx` | Function-Export tot, nur `type OnboardingState` behalten |
| `apps/web/package.json` `@xyflow/react` | 0 Imports |
| `apps/web/package.json` `@react-spring/web` | 0 Imports |

→ **Phase 2.2 (apps/web Sweep) + Phase 2.1a (Deps).**

## MID

1. **Card-Duplikat**: `ui/card` (shadcn) vs `ui-vk/Card`. → Phase 2.2b löscht ui-vk/Card; CLAUDE.md-Konvention ergänzt in Phase 2.2f.
2. **Route-Naming-Drift unter `customers/`**: `/[workspace]/customers/[id]` = Repo (falsch!) statt Customer. → Phase 3.8 Sub-Plan.
3. **ui-vk Barrel oversized** (8 von 12 Exports ohne Consumer). → Phase 2.2b.
4. **Loading-Hygiene asymmetrisch**. → Phase 3.9 `<PageSkeleton>` Helper.

## STRONG

- **Cleaner Routes-Refactor:** null stale Imports zu den 15 gelöschten Pfaden. Auch keine vergessenen `<Link href>` ohne workspace-Prefix.
- **`middleware-redirects.ts`** ist Vorbild-Artefakt mit Tests + Mapping-Tabelle.
- **API-Surface tight** — 7 Routes, alle externe Integrations-Endpoints oder Webhooks. Keine UI-Stubs.

## EXCEPTIONAL

- **Phase Galaxie + Nova-2 haben weniger Dead-Code-Schaden als üblich.** Sauberes `git rm` statt "auskommentieren". Severity 0 Kill / 6 Weak / 5 Mid — bei Refactors dieser Größe oft das 5-fache.
- **`SiteNavLinks.tsx`-Split** (Server-Parent + Client-Child) ist exemplarisch für die App-Router-Boundary.

## Adressiert in

- Phase 2.1a (Deps cleanup) — pending
- Phase 2.2a–f (Dead-Code Sweep) — pending
- Phase 3.8 (Customer-Route-Rename) — Phase 3 als eigener Sub-Plan
- Phase 3.9 (Loading-Hygiene) — pending
