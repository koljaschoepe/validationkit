# Audit Sub-2 — Dependencies

> Generated: 2026-05-21
> Domain: Outdated · Duplicates · Unused · Security · Lockfile-Konsistenz
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- **Workspaces**: 1 app (`@vk/web`) + 11 packages (`@vk/audit`, `auth`, `billing`, `core`, `db`, `fixes`, `github-app`, `inngest`, `llm`, `parser`, `pr-workflow`)
- **Total deps** (direct, deduped across workspaces): ~58 prod + ~17 dev (root-level types/tooling counted once)
- **Outdated**: 15 packages flagged by `pnpm outdated -r`
  - **Major drift**: 7 (`@types/diff` 6→8, `@types/node` 22→25, `@types/nodemailer` 6→8, `diff` 7→9, `dotenv-cli` 7→11, `nodemailer` 6→8, `typescript` 5→6, `vitest` 3→4)
  - **Minor**: 1 (`motion` 12.39→12.40)
  - **Patch**: 5 (`@types/react`, `ai`, `postcss`, `tsx`, `shadcn`)
  - **Deprecated**: 1 (`@react-email/components@1.0.12` — npm-deprecated)
- **Vulnerabilities** (via `pnpm audit`): **7 advisories** — **1 high · 4 moderate · 2 low**
- **Lockfile dupes**: 4 esbuild versions (0.18.20/0.25.12/0.27.7/0.28.0); 17 other packages with 2 versions each (zod 3+4, postcss 8.4+8.5, diff 7+8, cookie 0.7+1.1, etc.)
- **Unused deps** (after false-positive filtering): 3 (`@vk/core` in `@vk/db` and `@vk/github-app`, `@octokit/webhooks` in `@vk/github-app`)
- **Workspace-protocol**: ✅ alle 23 internen `@vk/*`-Refs nutzen `workspace:*` (geprüft in jeder package.json)
- **Engines / packageManager**: `node >=22` + `pnpm@10.18.1` + `.nvmrc=22` — konsistent

**Net**: Repo ist fundamental gesund (1 lockfile, alle Major-Versions pro Package singulär resolved, workspace-protocol diszipliniert, engines/packageManager gepinnt). **3 echte Action-Items**: (1) `nodemailer` High-CVE patchen, (2) deprecated `@react-email/components@1.0.12` updaten, (3) `lucide-react@^1.16.0`-Pin verifizieren (sus — v1 erst in 2026 released, vorher 0.x).

---

## Findings

### [Kill] FN-01 — nodemailer 6.10.1 hat 1× High-CVE + 2× Moderate + 1× Low (CVE-2025-14874)
**File/Package:** `packages/auth/package.json` → `"nodemailer": "^6.9.16"` (resolved: 6.10.1)
**Issue:** Direkter prod-dep mit 4 offenen Advisories:
- **GHSA-rcmh-qjqh-p98v** (CVSS 7.5, **high**, CVE-2025-14874) — addressparser-Recursion → DoS via crafted header; patched in `>=7.0.11`
- **GHSA-mm7p-fcc7-pg87** (moderate, CVE-2025-13033) — Email misrouting via quoted local-part mit `@`; patched in `>=7.0.7`
- **GHSA-vvjj-xcjg-gr5g** (moderate) — SMTP-Command-Injection via CRLF im `name`-Option (EHLO/HELO); patched in `>=8.0.5`
- **GHSA-c7w3-x93f-qmm8** (low) — SMTP-Command-Injection via `envelope.size` CRLF; patched in `>=8.0.4`

**Why Kill:** Live-System sendet Magic-Link-Auth + Transactional über `nodemailer` an Resend-SMTP (siehe `packages/auth/src/email.ts` Pattern). High-CVE auf Mail-Path = direkter Crash-/Spoofing-Vektor. Major-Bump 6→8 ist Breaking (Promise-first APIs ab v7), aber notwendig.

**Suggested Fix:**
```bash
pnpm --filter @vk/auth add nodemailer@^8.0.7 @types/nodemailer@^8.0.0
```
Smoke-Test: Login mit Magic-Link via Mailpit (dev) + `pnpm --filter @vk/auth typecheck`. v7→v8 API ist largely compat (sendMail-Signatur unverändert), aber Stream-Transport-Edge-Cases prüfen.

---

### [Strong] FN-02 — @react-email/components 1.0.12 ist auf npm DEPRECATED
**File/Package:** `packages/auth/package.json` → `"@react-email/components": "^1.0.12"`
**Issue:** `pnpm outdated -r` meldet explizit `1.0.12 => Deprecated`. Zusätzlich werden 21 transitive `@react-email/*`-Subpackages deprecated (siehe `pnpm dedupe`-Warnung: body, button, code-block, container, font, head, heading, hr, html, img, link, markdown, preview, row, section, tailwind, text). Aktuelle stable line ist `@react-email/components@0.5.x` oder `>=0.6` (1.0.x war ein experimenteller Branch, deprecated zugunsten 0.x). Auch `@react-email/render@^2.0.8` ist EOL.
**Why Strong:** Direkter Production-Dependency-Path für `MagicLinkEmail`-Templates (Phase Nova-2). Deprecated = keine Security-Patches + Tailwind-v4-Inkompat-Risiko bei nächstem Tailwind-Bump.
**Suggested Fix:** Recherche notwendig — entweder Downgrade auf `@react-email/components@^0.0.36` (stable) oder Migration auf neuen `react-email`-Monorepo-Layout. Plan-File empfehlen, **kein hot-fix**.

---

### [Strong] FN-03 — lucide-react ^1.16.0 verdächtig (legacy 0.x stable, 1.x potentiell Squat oder neuer Release)
**File/Package:** `apps/web/package.json` → `"lucide-react": "^1.16.0"`
**Issue:** lucide-react war historisch auf 0.x (z.B. 0.460+). Ein `1.16.0`-Major-Release wäre 2026 möglich, aber das `^1.16.0`-Range ist auffällig genau weil das versch. Lucide-Forks/-Squats gab. Resolved-Version: `1.16.0` mit `react@19.2.6` peer.
**Why Strong:** Wenn das ein Supply-Chain-Squat ist → kritisches Risiko. Wenn legitim → ok, aber Pinning auf `1.16.0` (ohne `^`) bis offizieller v1-Major bestätigt ist.
**Suggested Fix:** `pnpm view lucide-react versions --json | tail -30` checken + npm-Maintainer-Identity verifizieren. Falls confirmed legit: behalten. Falls suspect: `pnpm --filter @vk/web add lucide-react@^0.460.0` (letzter bekannter 0.x-Stable).

---

### [Strong] FN-04 — TypeScript 5.7.2 (declared) vs 5.9.3 (resolved) — Major 6.0.3 verfügbar
**File/Package:** Alle 13 workspaces deklarieren `"typescript": "^5.7.2"`; lockfile resolved zu `5.9.3` (single version ✅)
**Issue:** TS 6 ist seit ~Q1 2026 released (siehe `pnpm outdated`: `5.9.3 => 6.0.3`). 5.9 ist letzter LTS-Branch. Major-Bump bringt strict-mode-Defaults, `verbatimModuleSyntax`-Required-Changes, neue `--noUncheckedIndexedAccess`-Defaults.
**Why Strong:** Bleibt heute funktional, aber Drift wächst pro Quartal. Drizzle 0.45 + Next 16 + better-auth 1.6 sind alle TS6-getestet.
**Suggested Fix:** Plan-File für TS-6-Migration nach next Sub-Plan-Slot. Codemod via `@typescript/upgrade-codemod` falls vorhanden. Kein Hot-Fix.

---

### [Strong] FN-05 — Vitest 3.2.4 → Major 4.1.7 verfügbar
**File/Package:** Root + `@vk/web` deklarieren `"vitest": "^3.0.0"` / `"^3.2.4"`
**Issue:** Vitest 4 ist released (Q1 2026). Breaking: neue Pool-API, V8-Coverage-Default, `vi.spyOn`-Tightening.
**Why Strong:** Test-Infra ist load-bearing für Eval-Gate (`pnpm eval:conflicts`). Bleibt heute funktional aber jede Minor-Patch in 3.x verzögert sich.
**Suggested Fix:** Mit FN-04 (TS6) batchen — beide sind Test/Build-Infra. Sub-Plan vorschlagen.

---

### [Mid] FN-06 — esbuild@0.18.20 (transitiv) hat CVE GHSA-67mh-4wv8-2f99 (moderate)
**File/Package:** `packages/db>drizzle-kit>@esbuild-kit/esm-loader>@esbuild-kit/core-utils>esbuild@0.18.20`
**Issue:** Dev-Server-CORS-Misconfig erlaubt Cross-Origin-Reads. Patched in `>=0.25.0`.
**Why Mid:** Nur transitiv via veraltetem `@esbuild-kit/*`-Chain (ebenfalls deprecated subdep!) — ausschließlich in `drizzle-kit generate/migrate/studio` aktiv (CLI-tooling, dev-only). Trotzdem: 3 weitere esbuild-Versionen liegen im Tree (0.25.12, 0.27.7, 0.28.0) — Bloat + Verwirrung.
**Suggested Fix:** `drizzle-kit` auf neueste Major upgraden (`0.31.10 → latest`), das eliminiert den `@esbuild-kit/*`-Pfad. Pin via `pnpm.overrides` falls drizzle-kit nicht schnell upstream-fixed:
```json
"pnpm": { "overrides": { "esbuild": "^0.28.0" } }
```

---

### [Mid] FN-07 — diff@7.0.0 hat Low-CVE (GHSA-73rr-hh4g-fpgx) + Major 9 verfügbar
**File/Package:** `packages/fixes/package.json` → `"diff": "^7.0.0"`, `"@types/diff": "^6.0.0"`
**Issue:** jsdiff `parsePatch`/`applyPatch` Infinite-Loop bei `\r  `-Headers → DoS. CVSS-Score 0 (low), patched in `>=8.0.3`. Currently 2 versions im Lockfile (7.0.0 direct, 8.0.4 transitive).
**Why Mid:** `@vk/fixes` parsed LLM-generated Patches — exakt der Vector. Low-Severity weil Repo-Owner kontrolliert Input, aber wenn Audit-Flow user-controlled-PR-Content parsed → höher.
**Suggested Fix:**
```bash
pnpm --filter @vk/fixes add diff@^9.0.0 @types/diff@^8.0.0
```
Major 7→9 ist eine Compat-Welle (mostly ESM-strict), schnell verifizierbar via `@vk/fixes` Tests.

---

### [Mid] FN-08 — postcss 8.5.14 hat Moderate-CVE GHSA-qx2v-qp2m-jg93 (transitiv via Next)
**File/Package:** `apps/web/package.json` → `"postcss": "^8.5.14"` (direct, dedup-resolved 8.5.14); Next 16.2.6 hat 8.4.31 transitiv
**Issue:** PostCSS XSS via unescaped `</style>` in Stringify-Output; patched in `>=8.5.10`. Direkter `postcss@8.5.14` ist ok (patched), aber `apps__web>next>postcss@8.4.31` ist die vulnerable Instanz im Lockfile.
**Why Mid:** Next-internes PostCSS für CSS-Pipeline. Patch ist Patch-Bump (`8.5.15` available), aber das resolved sich erst wenn Next selbst seinen PostCSS-Pin bumpt.
**Suggested Fix:** `pnpm.overrides` setzen:
```json
"pnpm": { "overrides": { "postcss": "^8.5.15" } }
```
Plus: `apps/web` direct-dep auf `8.5.15` bumpen (`pnpm outdated` flagged: `8.5.14 => 8.5.15`).

---

### [Mid] FN-09 — Unused dep: `@octokit/webhooks` in `@vk/github-app`
**File/Package:** `packages/github-app/package.json`
**Issue:** Depcheck meldet `@octokit/webhooks` als unused — grep über `packages/github-app/src` bestätigt: kein Import. Wahrscheinlich Pre-Implementation-Stub für Webhook-Verifying.
**Why Mid:** Toter Code zieht ~80 kB Lockfile-Bloat. Bei Github-App-Integration vermutlich später nötig, also nicht zwingend Kill.
**Suggested Fix:** Wenn Github-App-Webhook-Path im aktuellen Phasen-Scope: Keep + Issue-Tracker. Sonst: `pnpm --filter @vk/github-app remove @octokit/webhooks`.

---

### [Mid] FN-10 — Unused workspace-deps: `@vk/core` in `@vk/db` und `@vk/github-app`
**File/Package:** `packages/db/package.json`, `packages/github-app/package.json`
**Issue:** Beide Pakete deklarieren `"@vk/core": "workspace:*"` — depcheck + grep bestätigen: kein Import.
**Why Mid:** False-Coupling im Workspace-Graph → Turborepo baut sie umsonst neu, wenn `@vk/core` ändert.
**Suggested Fix:**
```bash
pnpm --filter @vk/db remove @vk/core
pnpm --filter @vk/github-app remove @vk/core
```
Build-Graph wird flacher, Turbo-Cache-Hits steigen.

---

### [Mid] FN-11 — @types/node 22.10.2 (declared) vs 22.19.19 (resolved) — Major 25 verfügbar
**File/Package:** Alle 13 workspaces nutzen `"@types/node": "^22.10.2"` oder `^22.19.19`
**Issue:** Inkonsistente Caret-Range-Floor: web nutzt `^22.19.19`, alle anderen `^22.10.2`. `pnpm outdated` zeigt: `22.19.19 => 25.9.1` (Major drift).
**Why Mid:** Engines pinnt `node>=22.0.0` aber types sind 3 Major hinter Node-25-LTS (vermutlich aktuell, falls Node-25 stable). Bei dist-tagged `node@latest` driften APIs (Crypto, Fetch, WebStreams).
**Suggested Fix:** Erst `.nvmrc` definitiv setzen (heute nur `22`). Falls Repo auf Node 24 LTS umzieht: `pnpm -r add -D @types/node@^24.0.0`. Sonst: alle Workspaces auf `^22.19.19` harmonisieren (single floor).

---

### [Mid] FN-12 — Zod 3.25.76 + 4.4.3 parallel im Lockfile (Dupe)
**File/Package:** `packages/llm/package.json` deklariert `"zod": "^4.4.3"` (direct, prod). `zod@3.25.76` kommt transitiv (vermutlich via Inngest/better-auth).
**Issue:** 2 Zod-Major-Versions im Bundle. Zod v4 ist Breaking gegen v3 (neue `.parse`-API, removed `.deepPartial`, etc.). Schema-Cross-Boundary zwischen `@vk/llm` (v4) und `@vk/inngest` (transitiv v3) ist fragil.
**Why Mid:** Funktioniert solang Schemas innerhalb Package-Boundary bleiben. Bundle-Bloat ~50kB doppelt. Bei nächstem better-auth/inngest-Bump kann sich das von selbst auflösen.
**Suggested Fix:** Audit, ob `@vk/inngest`-Schemas Zod direkt benutzen oder nur transitiv. Falls direkt: `pnpm --filter @vk/inngest add zod@^4.4.3`. Sonst `pnpm.overrides` für zod auf v4.

---

### [Mid] FN-13 — dotenv-cli 7.4.4 → Major 11.0.0 (Drift 4 Majors)
**File/Package:** root + `packages/db/package.json`
**Issue:** `pnpm outdated`: `7.4.4 => 11.0.0`. 4 Major-Bumps hinten.
**Why Mid:** CLI-Tool, nur in `db:generate`/`db:migrate`/`db:studio` + `stripe:setup-test` aktiv. Breaking-Changes typischerweise nur CLI-Flag-Renames.
**Suggested Fix:**
```bash
pnpm -w add -D dotenv-cli@^11.0.0
pnpm --filter @vk/db add -D dotenv-cli@^11.0.0
```
Smoke-Test: `pnpm db:generate` läuft durch.

---

### [Mid] FN-14 — @types/diff 6.0.0 → 8.0.0 + @types/nodemailer 6.4.23 → 8.0.0 (Major drift)
**File/Package:** `packages/fixes/package.json`, `packages/auth/package.json`
**Issue:** Type-defs hinken 2 Major-Versions hinter Runtime-Libs (diff 7→9 in FN-07, nodemailer 6→8 in FN-01).
**Why Mid:** Triviale Folge der Runtime-Upgrades — wird mit FN-01 + FN-07 zusammen erschlagen.
**Suggested Fix:** Im selben Commit wie FN-01/FN-07.

---

### [Weak] FN-15 — Outdated patch/minor: ai, motion, postcss, tsx, shadcn, @types/react
**File/Package:** `@vk/llm` (`ai 6.0.184 → 6.0.189`), `@vk/web` (`motion 12.39 → 12.40`, `postcss 8.5.14 → 8.5.15`, `shadcn 4.7 → 4.8`, `@types/react 19.2.14 → 19.2.15`), root+db (`tsx 4.22.0 → 4.22.3`)
**Issue:** 6 Pakete mit Minor/Patch-Drift. Alle low-risk Bumps.
**Why Weak:** Patches/Minors sind in SemVer non-breaking. `^`-Ranges hätten das eigentlich auto-resolved — Lockfile ist nur fixed weil kein `pnpm update` lief.
**Suggested Fix:**
```bash
pnpm -r update
pnpm install   # write new lockfile
```
Plus Smoke: `pnpm typecheck && pnpm test`.

---

### [Weak] FN-16 — Multi-Dupes: esbuild (4×), cookie (2×), scheduler (2×), path-to-regexp (2×), dotenv (2×), semver (2×)
**File/Package:** `pnpm-lock.yaml`
**Issue:** Lockfile-Scan zeigt 17+ Pakete mit 2 parallel resolved Versionen. Davon kritisch betrachtet:
- `esbuild` 4× (0.18 / 0.25 / 0.27 / 0.28) — FN-06 deckt 0.18 ab
- `cookie` 0.7.2 + 1.1.1 — Next vs Better-Auth
- `scheduler` 0.25.0 + 0.27.0 — React 18-Reste vs React 19
- `path-to-regexp` 6.3.0 + 8.4.2 — Next-internal vs Express/Hono
- `dotenv` 16.6.1 + 17.4.2 — dotenv-cli vs nodejs-runtime
- `semver` 6.3.1 + 7.8.0 — Klassischer Build-Tool-Dupe

**Why Weak:** Alle transitiv, alle in unterschiedlichen Bundles (Server vs Client). Bundle-Size-Impact <100kB gzipped total. Pre-`pnpm dedupe`-Check meldet keine **resolvable** dupes (lockfile ist deduped given current constraints).
**Suggested Fix:** Akzeptieren. Bei nächstem Major-Bump-Pass: Re-run `pnpm dedupe`. Optional: `pnpm.overrides` für `cookie`/`semver` setzen falls Bundle-Size-Goal getriggert.

---

### [Exceptional] FN-17 — Workspace-Protocol-Diszipliniert + Single-Pin auf allen Major-Versions
**File/Package:** Alle 12 `package.json`-Files
**Issue (positiv):**
- **Alle 23 internen `@vk/*`-Refs** nutzen `workspace:*` — kein Drift, kein `latest`-Anti-Pattern.
- **React 19.2.6** singulär resolved im ganzen Tree (kein 18.x-Rest).
- **Next 16.2.6, Drizzle 0.45.2, Stripe 22.1.1, Inngest 4.4.0, better-auth 1.6.11, Tailwind 4.3.0** — alle 1 Version, keine Doppel-Pins.
- **`packageManager: pnpm@10.18.1`** explizit gepinnt (no Corepack-Drift).
- **`engines.node >=22.0.0`** + `.nvmrc=22` konsistent.
- **devDeps vs prod-deps Hygiene** sauber: kein eslint/vitest in prod-deps, `@types/*` durchgängig in devDeps.

**Why Exceptional:** Solo-Dev-Setup auf Senior-Niveau. Macht Future-Upgrades (TS6, Vitest4, React 20) deutlich risikoärmer als typische Multi-Maintainer-Repos.

---

## Aktion-Priorität (sortiert)

| Priorität | Finding | Effort | Why |
|-----------|---------|--------|-----|
| **P0 — sofort** | FN-01 (nodemailer 6→8) | 30 min | High-CVE auf Mail-Path |
| **P0 — sofort** | FN-03 (lucide-react Pin verifizieren) | 10 min | Supply-Chain-Risiko falls Squat |
| **P1 — diese Woche** | FN-02 (react-email deprecated) | 1–2 h Recherche + Migration | Deprecated = kein Patch-Pfad |
| **P1 — diese Woche** | FN-08 (postcss CVE via Next) | 5 min via overrides | Bundle-Sicherheit |
| **P1 — diese Woche** | FN-15 (Patch-/Minor-Update-Sweep) | 15 min | `pnpm -r update` |
| **P2 — Sub-Plan** | FN-04 + FN-05 (TS6 + Vitest4) | 1–2 Sessions | Test/Build-Infra-Major |
| **P2 — Sub-Plan** | FN-06 (drizzle-kit + esbuild-overrides) | 30 min | Dev-CVE + Cleanup |
| **P3 — Cleanup** | FN-09/FN-10 (Unused deps removen) | 10 min | Build-Graph straffen |
| **P3 — Cleanup** | FN-07 + FN-14 (diff 7→9 + types) | 20 min | Low-CVE + types-Drift |
| **P3 — Cleanup** | FN-11 (@types/node harmonisieren) | 5 min | Cosmetic |
| **P3 — Cleanup** | FN-12 (zod-dupe) | 20 min | Bundle-Bloat |
| **P3 — Cleanup** | FN-13 (dotenv-cli 7→11) | 5 min | CLI-tooling-Drift |

## Out-of-Scope (für Sub-3..12 oder eigene Audits)

- Bundle-Size-Analyse (z.B. `next build` + `@next/bundle-analyzer`) → Sub-Perf-Audit
- npm-Provenance-Checks pro Direct-Dep → eigenes Supply-Chain-Audit
- Renovate/Dependabot-Setup → DX-Audit
- CSP / Subresource-Integrity → Security-Audit
