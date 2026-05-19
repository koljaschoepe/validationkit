# Vision — ValidationKit Web-App

> Master-Vision für die Web-App in diesem Repo.
> Status: Mai 2026 — Galaxie-Refactor läuft.
> Wenn Repo widerspricht: ADR schreiben, dann Vision updaten oder Repo anpassen.

---

## Was bauen wir?

Eine **Multi-Tenant-SaaS-Web-App für AI-Consultancies**, die ihren Kunden helfen, **Context-Engineering-Files** (CLAUDE.md, AGENTS.md, .claude/agents/, .claude/skills/, .cursor/rules/, .windsurf/, .clinerules, .codex/, aider.conf.yml) über 5–30 Customer-Repos hinweg sauber, konsistent und produktiv zu halten.

Im Kern macht die App drei Dinge:

1. **Auditiert** Context-Files mit deterministischen Regeln (Unused agents, Duplicate guidance, Context bloat, Stale references, Token-Budget) + 1 LLM-Regel (Conflicting rules).
2. **Visualisiert** Findings + Drift räumlich (Galaxie-UI, siehe unten).
3. **Generiert + applied** Edit-Vorschläge via AI (Anthropic Claude Opus), als PR oder Direct-Commit — User schreibt nie Code.

Output-Konvention für alles: **Severity-Bänder** {Kill, Weak, Mid, Strong, Exceptional}, keine Fake-Scores.

## Persona

**"Agency-Lena"** — technische Lead-Person in einer AI-Consultancy / Boutique-Agency (8–25 Mitarbeitende). Sie:

- managed 5–30 Customer-Repos für ihre Kunden,
- betreibt Custom-Agent-Setups (Claude Code + Cursor + Codex + Gemini + Windsurf + Cline + Aider parallel je nach Kunden-Stack),
- muss Context-Engineering-Files konsistent halten, ohne dass jeder Customer-Dev die selben Regeln neu lernen muss,
- hat 2–4 Implementation-Devs unter sich,
- braucht Audit-Reports für Compliance + Drift-Erkennung über Zeit.

**Nicht-Persona (out of scope):**
- Indie-Founder-Validation-Wedge (lebt in einem separaten Framework des Users).
- Enterprise-Procurement (>500 MA) — irgendwann, nicht jetzt.
- Code-Refactoring-Tools (wir machen Context-Files, nicht App-Code).

## Capability-Set (geordnet nach Aufbau-Reihenfolge)

1. **Audit + Visualization** (Sprint G1): Multi-Repo-Audit + Galaxie-UI mit Severity-Hotspots.
2. **Drift-Detection** (Sprint G2): Diffs zwischen Repos sichtbar, als "Gravitations-Ströme" in der Galaxie.
3. **AI-Solution-Generation** (Sprint G3–G4): Pro Finding 1 Edit-Vorschlag via Anthropic Claude Opus Single-Pass mit Confidence-Self-Estimate.
4. **Zero-Code-Apply** (Sprint G5): PR (Default) oder Direct-Commit (pro Repo konfigurierbar) via GitHub-App. Kein User-Code-Edit.
5. **SaaS-Polish** (Sprint G6): Settings, Billing-Routing, Inline-Onboarding, Mobile-Tuning, Public-Demo.

## UI-Vision: Galaxie-Navigation

### Hierarchie (4 Zoom-Levels)

- **Level 1 — Galaxie-Overview**: alle Customers als Sonnen/Sterne, Größe = Repo-Count × Severity-Density, Farbe = Aggregate-Severity-Band.
- **Level 2 — Customer-System**: Sonne im Zentrum (Customer), Repo-Monde drumherum.
- **Level 3 — Repo-Mond**: Mond zentriert, File-Asteroiden im Orbit.
- **Level 4 — File-Detail**: Asteroid zentriert + Inspector-Panel mit Findings/Solutions/Apply.

### Severity-Encoding (visuell)

| Severity | Visual |
|---|---|
| Kill | Rote Supernova, pulsierend, zoom-unabhängig |
| Weak | Großer roter Planet/Mond, deutlicher Glow |
| Mid | Mittelgroßer orange-gelb, normaler Glow |
| Strong | Kleiner blauer Punkt, schwacher Glow |
| Exceptional | Goldener Stern mit Strahlenkranz, eigene "Achievement"-Konstellation |

**Orthogonale Achsen:**
- **Confidence (Low/Mid/High)** → Opacity (Geister-Planet bei Low)
- **Customer-Impact-Count** → Größe (mehr betroffene Repos → größerer Planet)
- **Age/Regressed-State** → Pulsing

### Affordances (verpflichtend)

- Mini-Map (unten-rechts, Click-to-Center)
- Cmd+K Universal-Search (Customer / Finding / File)
- Dot-Grid-Backdrop
- Zoom-Indikator + Keyboard-Shortcuts (Cmd+0/1/2/3/4)
- Workspace-Switcher (Topbar)
- Inline-Onboarding-Checklist (kein separater /onboarding-Page)

## Differenzierung (White-Space, Mai 2026)

Niemand am Markt kombiniert:
- **Multi-Tool Polyglot-Audit** (12 Vendor-Formate parallel)
- **Multi-Tenant Agency-Workspaces** (5–30 Customer-Repos pro Workspace)
- **Galaxie-Visualization** (räumliche Portfolio-Sicht über Customers)
- **Zero-Code-Apply via PR** (Finding → AI-Solution → 1-Click-PR)

Closest am Markt:
- **grekt.com** — OSS-CLI, kein Multi-Tenant, kein Web
- **GitHub Agent Control Plane** — governs runtime, nicht Context-File-Quality
- **Microsoft Agent 365** — Enterprise-Agent-Governance, falsche Persona
- **Cursor Team** — IDE-bound, Single-Tool, kein Cross-Customer
- **Cody Enterprise** — 10 Repos parallel, aber Code-Suche, nicht Context-Audit

Unsere Wette: die Kombination der 4 Achsen ist 6–12 Monate Lead, weil keiner einzeln genug Anreiz hat alle 4 zu bauen.

## Tech-Stack (load-bearing)

| Layer | Wahl | Begründung |
|---|---|---|
| Monorepo | Turborepo + pnpm | Solo-Dev-Standard |
| Web-Framework | Next.js 16 + App Router + Cache Components | RSC, Streaming, Server-Actions |
| Render-Stack (Canvas) | PixiJS v8 + `@pixi/react` | Single-Lib für 2D + WebGL, 10k+ Sprites @60fps |
| Animation (Canvas) | GSAP 3 Core | Animiert Pixi-Display-Objects direkt |
| Animation (UI-Chrome) | Motion (ex-Framer Motion) LazyMotion | ~4.6 KB, idiomatisch React |
| Auth | Better-Auth 1.6 + Organization-Plugin + Magic-Link (Resend) | Multi-Org out of box |
| DB | Neon Postgres + Drizzle + pgvector | Single-Table-Multi-Tenant via workspace_id + RLS |
| Cache | Vercel Runtime Cache + Redis (dev) | cacheTag-Pattern pro Workspace |
| Billing | Stripe direkt + Stripe Tax | kein Stripe-Reseller |
| Background | Inngest Cloud + Cron | Audit-Runs, Solution-Generation |
| LLM | @ai-sdk/anthropic direct | KEIN Vercel AI Gateway (Vendor-Lock-in-Vermeidung) |
| Email | Resend (prod), Mailpit (dev) | |
| Deploy | Vercel Fluid Compute | |
| Routing | URL-Slug `/[workspace]/...` | Solo-buildable, kein DNS-Setup |

## Multi-Tenant-Architektur

- **URL-Slug** `/[workspace]/...` (kein Subdomain)
- **Data Access Layer (DAL)** in `lib/dal/*.ts` mit `server-only`, jede Query nimmt `workspaceId` aus `getTenantContext(workspaceSlug)` (React.cache memoized)
- **Better-Auth Organization-Plugin** = Workspaces. `setActive(workspaceSlug)` server-side im Layout.
- **Cache-Tagging:** `workspace:<id>:<resource>` (feingranular) + `workspace:<id>` (bulk)
- **Slug-Hijacking-Schutz:** Layout validiert Membership, sonst `forbidden()`
- **pgvector:** Single-Table mit composite btree + RLS-Policy. Double-Belt (WHERE + RLS)

## Was NICHT in diesem Repo lebt

- **Customer-Outreach / Recruitment / Mom-Tests / BiP-Posts** — separates Framework
- **Pricing-Tiers / Sales-Sprints / LOIs / Validate-Wedge** — separates Framework
- **Strategie-PRDs / Pivot-Diskussionen** — separates Framework
- **Indie-Founder-Validation-Linie** — separates Framework

Wenn Refs auf diese Themen im Code/Doku auftauchen → flagging + Entfernen.

## Constraints (load-bearing)

- Severity-Bänder statt Vibe-Scores, immer.
- AI-Calls nur direkt zu Anthropic (kein AI Gateway).
- Zero-Code-UX bewahren: User klickt, schreibt nie Code.
- Solo-buildable bis weit ins Jahr (kein Sales-Hire bis ARR >$300k).
- Plan-First-Workflow: kein Code ohne Plan-File.
- Bei Architektur-Entscheidungen: ADR in `docs/adrs/`.

## Source-of-Truth-Anker

| Frage | Antwort lebt in |
|---|---|
| Warum bauen wir das? | `docs/vision.md` (dieses File) |
| Was wann (Sprint-Reihenfolge)? | `docs/roadmap/phase-galaxie.md` |
| Wie konkret (einzelnes Feature)? | `docs/plans/<slug>.md` |
| Warum diese Architektur-Entscheidung? | `docs/adrs/NNNN-*.md` |
| Repo-Kontext + Workflow für Claude? | `.claude/CLAUDE.md` |
| Aktuelle Sprint-Tasks? | `TODO.md` |

Wenn ein Doc widerspricht zur Code-Realität: **Repo-Realität gewinnt**, Doc wird updated.
