# Audit 4 — Tech-Stack & Dependency Drift

> 2026-05-21 · Subagent-Output. Alle `package.json` Files + Lockfile geprüft.

## KILL

1. **`@react-spring/web@^10.0.3`** in `apps/web/package.json:17` — **0 Imports im Code**. → Phase 2.1a.
2. **`@xyflow/react@^12.10.2`** in `apps/web/package.json:30` — **0 Imports**. → Phase 2.1a.
3. **`shadcn@^4.7.0`** in `apps/web/package.json:51` als **Runtime-dep** — ist ein CLI-Tool, gehört in devDeps. → Phase 2.1b.

## WEAK

4. **`gray-matter`** wird in `apps/web/next.config.ts` genutzt, aber **nicht in `apps/web/package.json` deklariert**. Hoisted aus root devDep — brittle in pnpm strict mode. → Phase 2.1c.
5. **`packages/auth/package.json` L29–37** — React/React-DOM/types in `dependencies` statt devDeps + peerDeps. Lib-Package-Antipattern, Doppel-React-Instanzen-Risiko. → Phase 2.1f.
6. **`lucide-react@^1.16.0`** in `apps/web/package.json:41` — verdächtig, originale Library liegt bei 0.4xx. Identität verifizieren (`pnpm view lucide-react versions`). → Phase 2.1d.
7. **`resend` SDK nicht installiert**, CLAUDE.md sagt aber "Resend (prod)". Code nutzt `nodemailer` zu `smtp.resend.com`. → Phase 1.17 (Email-Zeile in CLAUDE.md klarifiziert) ✅.

## MID

8. **PixiJS-Cluster** (`pixi.js`, `@pixi/react`, `pixi-filters`, `gsap`) — nur noch in `/[workspace]/galaxie` aktiv, nicht mehr in Landing. Bundle-Cost ~100KB. Hold bis Nova-3+ Migration.
9. **zod 3 vs 4 Drift im Tree**: `@vk/llm` pinnt v3, Inngest zieht v4 transitiv. → Phase 2.1e (zod auf v4).
10. **@types/node-Drift** `^22.10.2` vs `^22.19.19` (apps/web).
11. **turbo.json ohne `inputs`/`globalDependencies`/env-Hashing** — Cache zu konservativ. → Phase 2.6.

## STRONG

- `motion@12` als framer-motion-Nachfolger ohne framer-motion-Restbestand.
- Internes Versioning `0.0.20` synchron über alle 12 packages.
- drizzle-orm/drizzle-kit Versions-Paar konsistent.

## EXCEPTIONAL

- Single-source pnpm-workspace, alle internen `workspace:*`-Links, Node-Pinning auf 22 + pnpm 10.18.1 im Root.

## Adressiert in

- Phase 1.17 (Email-Zeile) ✅
- Phase 2.1a–f (Tech-Stack-Cleanup) — in Arbeit
- Phase 2.6 (turbo.json) — pending
