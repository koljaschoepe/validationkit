# A5 — Design-System-Audit für VK-Dashboard-Pivot

**Datum:** 2026-05-17
**Scope:** Next.js 16 + App Router + RSC-kompatibel, dark-by-default, operational-tool-aesthetic.
**Baseline:** ~340 LOC hand-rolled CSS in `apps/web/src/app/globals.css` (CSS-Variablen + Severity-Pills via `data-sev`).

## Severity-Verdict-Matrix

| Option | Bundle | Dark | TS-Strict | Coverage | RSC | Lizenz | 2026-Status | Mig-Risk | **Verdict** |
|---|---|---|---|---|---|---|---|---|---|
| **shadcn/ui** | nur genutzte Komponenten (~5–40 KB) | nativ via Tailwind `dark:` + CSS-vars | ja, strict-clean | sidebar, command, data-table, form (RHF+Zod), dialog, sonner — alle vorhanden | RSC-first, "use client" nur wo nötig | MIT | aktiv, v3-Registry, "Blocks", v0-Integration | **niedrig** (CSS-vars 1:1 mappbar) | **Strong** |
| **HeroUI** | ~120–180 KB gzipped (framer-motion-Pflicht) | gut, aber light-first Defaults | ja | dashboard-fokussiert, Sidebar+Table+Modal solide, kein Command-Palette nativ | "use client" überall (framer-motion + React-Aria-Hooks) | MIT | aktiv, NextUI→HeroUI-Rename Q3-2025 | mittel (Re-Brand-Friction, opinionated Theme) | **Mid** |
| **Mantine** | ~80–140 KB gzipped Core+Hooks | ja, MantineProvider | ja | sehr breit, eigene Data-Table, Spotlight (=Command), Notifications, Forms | "use client" überall (Context-heavy) | MIT | v8 (2025), sehr aktiv | mittel-hoch (eigenes CSS-Layer-System, Tailwind-Konflikt) | **Mid** |
| **Tailwind UI / Catalyst** | nur genutzte Komponenten | ja | ja | sehr breit, Catalyst ist React+TS, App-Templates vorhanden | RSC-kompatibel | **paid $299–$799 one-time** | aktiv (Tailwind Labs) | niedrig | **Weak** (Cost-Constraint: Hardcore-Local-Only-Mode, kein $-Spend vor Phase-0-Gate) |
| **Vercel Geist UI** | klein | ja, Vercel-Aesthetic | ja | begrenzt: Button, Input, Tabs, Toast — **kein** Data-Table, **kein** Command-Palette, **keine** Sidebar | RSC-kompatibel | MIT (`@vercel/geist`) | **internal-first**, public-API instabil, sparse docs | hoch (Eigenbau für 60% der Komponenten nötig) | **Kill** |

## Detail-Notes (Top-3)

**shadcn/ui** (Tailwind v4 + Next 16 support Q1-2026): Copy-paste → kein npm-dep, Code in `components/ui/`. CSS-vars (`--background`, `--destructive`) mappen 1:1 auf Severity-Palette. Data-Table = TanStack v8. Command-Palette = cmdk. Form = RHF+Zod (PRD §16 stack-kompatibel). Sonner für Toasts. v0.dev generiert shadcn-Code. Blocks (Dashboard-01, Sidebar-07) liefern Layout-Vorlagen. **Severity-Bänder bleiben unangetastet** via CVA-Variants `<Badge variant="kill">`.

**HeroUI** (v2.6 Feb-2026): Schicker out-of-the-box, aber framer-motion + React-Aria zwingen "use client" überall. Bricht RSC-Spirit von Next 16 Cache-Components. Light-Default-Tokens. Kein Command-Palette.

**Mantine** (v8 Jan-2026): Größtes Eco-System, eigene Data-Table, Spotlight = Command. Aber: Mantine-CSS-Layer kollidiert mit Tailwind v4 (Tailwind ist indirekt via AI SDK examples bereits drin). Doppel-Styling-Layer ist Solo-Constraint-Bruch.

## Empfehlung: **shadcn/ui**

**Begründung:**
1. **RSC-native** — kritisch für Next 16 Cache-Components (PRD §16).
2. **Zero-Lock-in** — Code im Repo, kein npm-supply-chain-Vektor (Trust-Center-Argument).
3. **Severity-Bänder überleben 1:1** via CVA.
4. **Hardcore-Local-Only-Mode-konform** — kein $-Spend.
5. **Stack-Kohärenz** — RHF+Zod+TanStack+cmdk+sonner = exakt PRD §16/§17.
6. **v0.dev** generiert shadcn-Code → AI-assisted-Redesign.

**Skeptic-Note:** Nicht-skinning-out-of-the-box. Wer "fertig-dashboard-in-1-Tag" sucht, nimmt HeroUI und zahlt mit RSC-Schulden.

## Migration-Cost-Estimate

| Task | PD |
|---|---|
| `pnpm dlx shadcn@latest init` + Tailwind v4 + CSS-vars-Mapping (Severity-Palette) | 0.5 |
| Components installieren: button, input, card, table, dialog, sidebar, command, form, badge, sonner, tabs | 0.5 |
| Severity-Badge-CVA-Variant (Kill/Weak/Mid/Strong/Exceptional) + Finding-Card-Komponente | 1.0 |
| Dashboard-Block-Adaption (Sidebar-07 + Dashboard-01 → VK-Routen `/validate`, `/operations`) | 1.5 |
| Bestehende Pages (`/`, validate-Form, inventory-Table) auf neue Primitives umziehen | 1.5 |
| Globals.css-Cleanup (340 LOC → ~40 LOC nur Severity-Tokens + Font-Defaults) | 0.5 |
| Mobile-Responsive-Audit (Card-Grid-Fallback für Tables <md) | 0.5 |
| **Total** | **6 PD** |

Risiko-Puffer: +2 PD (Tailwind-v4-Edge-Cases, Next-16-RSC-Boundary-Friction).
**Realistisch: 8 PD = 1.5 Solo-Wochen.**

## Citations

- shadcn/ui: https://ui.shadcn.com/docs (Next 16 + Tailwind v4, 2026-02)
- shadcn Blocks: https://ui.shadcn.com/blocks
- HeroUI v2.6: https://heroui.com/docs (NextUI-Rename Q3-2025, v2.6 Feb-2026)
- Mantine v8: https://mantine.dev/changelog/8-0-0/ (Jan-2026)
- Tailwind UI Catalyst: https://tailwindui.com/templates/catalyst ($299)
- Vercel Geist: https://vercel.com/geist
- TanStack Table v8: https://tanstack.com/table/latest; cmdk: https://cmdk.paco.me
