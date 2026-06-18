# Vision — ValidationKit Web-App

> Master-Vision für die Web-App in diesem Repo.
> Status: Juni 2026 — Production-Launch-Readiness läuft. (Die frühere Galaxie-Canvas-UI wurde 2026-06-10 retired → SolarListView-Triage-Konsole.)
> Wenn Repo widerspricht: ADR schreiben, dann Vision updaten oder Repo anpassen.

---

## Was bauen wir?

Eine **Multi-Tenant-SaaS-Web-App für AI-Consultancies**, die ihren Kunden helfen, **Context-Engineering-Files** (CLAUDE.md, AGENTS.md, .claude/agents/, .claude/skills/, .cursor/rules/, .windsurf/, .clinerules, .codex/, aider.conf.yml) über 5–30 Customer-Repos hinweg sauber, konsistent und produktiv zu halten.

Im Kern macht die App drei Dinge:

1. **Auditiert** Context-Files mit deterministischen Regeln (Unused agents, Duplicate guidance, Context bloat, Stale references, Token-Budget) + 1 LLM-Regel (Conflicting rules).
2. **Triagiert** Findings in einer Severity-Konsole (SolarListView, siehe unten) — gruppiert nach Repo + Kunde, sortiert nach Severity.
3. **Generiert + applied** Edit-Vorschläge via AI (Anthropic Claude Opus), als PR oder Direct-Commit — User schreibt nie Code.

> **Pivot Mai 2026 — Homepage-Relaunch (ADR-0003):** Drift-Detection / Repo-Compare wurde abgebaut. Multi-Repo-Audit bleibt, aber das explizite Zwei-Repo-Vergleichs-Feature (frühere Sprint G2 Sekundärfunktion) ist out — siehe `docs/adrs/0003-drop-compare-feature.md`.

Output-Konvention für alles: **Severity-Bänder** {Kill, Weak, Mid, Strong, Exceptional}, keine Fake-Scores.

## Persona

**"Agency-Lena"** — technische Lead-Person in einer AI-Consultancy / Boutique-Agency (8–25 Mitarbeitende). Sie:

- managed 5–30 Customer-Repos für ihre Kunden,
- betreibt Custom-Agent-Setups (Claude Code + Cursor + Codex + Gemini + Windsurf + Cline + Aider parallel je nach Kunden-Stack),
- muss Context-Engineering-Files konsistent halten, ohne dass jeder Customer-Dev die selben Regeln neu lernen muss,
- hat 2–4 Implementation-Devs unter sich,
- braucht Audit-Reports für Compliance über Zeit.

**Nicht-Persona (out of scope):**
- Indie-Founder-Validation-Wedge (lebt in einem separaten Framework des Users).
- Enterprise-Procurement (>500 MA) — irgendwann, nicht jetzt.
- Code-Refactoring-Tools (wir machen Context-Files, nicht App-Code).

## Capability-Set (geordnet nach Aufbau-Reihenfolge)

1. **Audit + Triage-Konsole** (Sprint G1, UI 2026-06-10 von Galaxie auf SolarListView umgestellt): Multi-Repo-Audit + Severity-Triage-Konsole.
2. **Customer-Migration + Data-Binding** (Sprint G2): Echt-Daten aus DB, Customer-Layer, DAL. _Hinweis: die ursprünglich als Sekundärfunktion vorgesehene Repo-Compare/Drift-Detection wurde im Homepage-Relaunch (Mai 2026, ADR-0003) abgebaut. Multi-Repo bleibt._
3. **AI-Solution-Generation** (Sprint G3–G4): Pro Finding 1 Edit-Vorschlag via Anthropic Claude Opus Single-Pass mit Confidence-Self-Estimate.
4. **Zero-Code-Apply** (Sprint G5): PR (Default) oder Direct-Commit (pro Repo konfigurierbar) via GitHub-App. Kein User-Code-Edit.
5. **SaaS-Polish** (Sprint G6): Settings, Billing-Routing, Inline-Onboarding, Mobile-Tuning, Public-Demo.

## UI: SolarListView-Triage-Konsole

> **History:** Die ursprüngliche Vision war eine räumliche "Galaxie"-Canvas
> (Customer = Sonne, Repo = Mond, File = Asteroid, Severity als räumliche
> Hotspots). Diese wurde 2026-06-10 retired — der PixiJS-Stack (pixi.js,
> @pixi/react, pixi-filters, GSAP) ist komplett aus Code + Deps entfernt. Die
> Datenmodell-Lüge (Canvas-Nodes ≙ Findings) und die A11y-Kosten (Canvas ist
> nicht keyboard-/screenreader-nativ) haben den Pivot getrieben. Persona Lenas
> Job ist Triage über 5–30 Repos — "was brennt, fix das zuerst" — eine
> sortierbare Rangliste, die sie LIEST, keine räumliche Suche.

### Aktuelles Modell — keyboard-/screenreader-native Severity-Triage

Die Workspace-Ansicht ist eine Konsole (`SolarListView`), die Findings als
sortierbare Triage-Liste rendert statt als Canvas:

- **Gruppierung** über genau zwei Achsen: **Repo** und **Kunde** (Organisation).
  Folders nesten innerhalb eines Repos.
- **Triage-Sort** pro Gruppe: Kill-Count zuerst, dann Weak, dann Total — die
  brennendste Gruppe steht oben.
- **"In 3 Sekunden"-Glyph** pro Zeile: ein ruhiger Worst-Severity-Dot +
  Kill-Count. Calm-by-default — nur Kill schreit.
- **Severity** und **Regel** sind **Filter** (Chips bzw. "Regel"-Disclosure),
  keine räumlichen Encodings mehr.
- **Inspector**: Click auf ein File öffnet das Inspector-Panel mit
  Findings / Solutions / Apply — derselbe Inspector über alle Renderer.
- **Mobile-List** ≤ 639 px als native Liste.

### Severity-Encoding (3-Farben-System, 2026-06-10)

Striktes 3-Akzent-System statt 5-Farb-Heatbar: **Rot = negativ / Orange =
neutral / Grün = positiv**. `SeverityBadge` = 1px-Hairline-Pills, nur Kill
gefüllt. SSOT in `severity-colors.ts` (Var-Mapper auf `globals.css`-Tokens, kein
Hex-Duplikat). Confidence (Low/Mid/High) und Customer-Impact-Count bleiben
load-bearing Metadaten am Finding, werden aber als Text/Badge gezeigt, nicht als
Opacity/Größe.

### Affordances (verpflichtend)

- Cmd+K Universal-Search (Customer / Finding / File)
- Severity- + Regel-Filter über der Liste
- Workspace-Switcher (Topbar)
- Inline-Onboarding-Checklist (kein separater /onboarding-Page)
- Voll keyboard-/screenreader-navigierbar (war der Haupttreiber des Galaxie-Retire)

### Landing-Hero

Der Landing-Hero ist ein durchgehendes Konsolen-Surface (`ConsoleSurface`):
Portfolio-Liste → Repo-Tree + Inspector-Drill, Animationen via `motion/react`.
Anon-Audit via `vk:audit-repo`-Event über die RepoUrlPill.

## Differenzierung (White-Space, Mai 2026)

Niemand am Markt kombiniert:
- **Multi-Tool Polyglot-Audit** (12 Vendor-Formate parallel)
- **Multi-Tenant Agency-Workspaces** (5–30 Customer-Repos pro Workspace)
- **Portfolio-Triage-Konsole** (keyboard-native Severity-Ranking über Customers + Repos)
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
| Render-Stack (Landing/Hero) | `ConsoleSurface` (DOM) + `motion/react` | Durchgehendes Konsolen-Surface, kein Pixi-Bundle (Galaxie-Retire 2026-06-10) |
| Render-Stack (Workspace-Konsole) | DOM-Liste (`SolarListView`) | Keyboard-/screenreader-native Triage-Liste — PixiJS v8/GSAP 2026-06-10 komplett entfernt (Code + Deps) |
| Animation (UI-Chrome) | Motion (`motion/react`) | Idiomatisch React, kein Canvas-Layer mehr |
| Auth | Better-Auth 1.6 + Magic-Link (Resend, via nodemailer-SMTP) | Solo-Setup; Workspaces in eigenen Drizzle-Tabellen (kein Better-Auth Org-Plugin — siehe ADR-0006) |
| DB | Neon Postgres + Drizzle + pgvector | Single-Table-Multi-Tenant via workspace_id + RLS |
| Cache | Vercel Runtime Cache + Redis (dev) | cacheTag-Pattern pro Workspace |
| Billing | Stripe direkt + Stripe Tax | kein Stripe-Reseller |
| Background | Inngest Cloud + Cron | Audit-Runs, Solution-Generation |
| LLM | @ai-sdk/anthropic primary + @ai-sdk/openai opt-in Fallback | Direct-Provider only, KEIN Vercel AI Gateway (siehe ADR-0005) |
| Email | Resend (prod), Mailpit (dev) | |
| Deploy | Vercel Fluid Compute | |
| Routing | URL-Slug `/[workspace]/...` | Solo-buildable, kein DNS-Setup |

## Multi-Tenant-Architektur

- **URL-Slug** `/[workspace]/...` (kein Subdomain)
- **Data Access Layer (DAL)** in `lib/dal/*.ts` mit `server-only`, jede Query nimmt `workspaceId` aus `getTenantContext(workspaceSlug)` (React.cache memoized)
- **Workspaces** in eigener Drizzle-`workspace`-Tabelle + `membership`-Join-Table (kein Better-Auth Organization-Plugin — siehe ADR-0006 für Build-vs-Buy-Begründung). Membership-Gate im `[workspace]/layout.tsx` (`listUserWorkspaces(userId)`).
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
| Was wann (Sprint-Reihenfolge)? | `docs/plans/production-launch-readiness.md` (aktive Phase); `docs/roadmap/done/` (abgeschlossen) |
| Wie konkret (einzelnes Feature)? | `docs/plans/<slug>.md` |
| Warum diese Architektur-Entscheidung? | `docs/adrs/NNNN-*.md` |
| Repo-Kontext + Workflow für Claude? | `.claude/CLAUDE.md` |
| Aktuelle Sprint-Tasks? | `TODO.md` |

Wenn ein Doc widerspricht zur Code-Realität: **Repo-Realität gewinnt**, Doc wird updated.
