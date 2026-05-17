# ValidationKit — Web-Layer-Architektur (Phase 2 parallel zu OSS)

**Datum:** 2026-05-14
**Status:** Architektur-Vorschlag, vor Phase-1-Implementation zu validieren
**Scope:** Wie laufen OSS-Framework (Claude Code Subagents) und Hosted Web App parallel, ohne Doppel-Codebase zu werden.

---

## 1. Architektur-Diagramm

```
+--------------------------------------------------------------------------+
|                          USER ENTRY POINTS                               |
|                                                                          |
|  +------------------+     +------------------+    +------------------+   |
|  | Non-Tech Founder |     | Power-User (CLI) |    | API Consumer     |   |
|  | -> Web Dashboard |     | -> Claude Code   |    | -> REST/SDK      |   |
|  +--------+---------+     +---------+--------+    +---------+--------+   |
|           |                         |                       |            |
+-----------|-------------------------|-----------------------|------------+
            |                         |                       |
            v                         v                       v
+-----------------------+   +-----------------------+   +-----------------+
|  apps/web (Next.js)   |   |  apps/cli (Node)      |   |  apps/api       |
|  - App Router         |   |  - Wraps Claude Code  |   |  (Route Handlers|
|  - Clerk Auth         |   |  - Reads .validation- |   |   in apps/web)  |
|  - Server Actions     |   |    kit/state.json     |   +--------+--------+
|  - Stripe Billing     |   |  - Optional sync to   |            |
|  - Real-time stream   |   |    web via SDK        |            |
|  - Persona library    |   +-----------+-----------+            |
+----------+------------+               |                        |
           |                            |                        |
           +-------------+--------------+------------------------+
                         |
                         v
        +-------------------------------------+
        |  packages/agents (shared core)      |
        |  - 8 Subagent definitions (.md +    |
        |    TS prompt templates)             |
        |  - Tool schemas (zod)               |
        |  - State schema (zod)               |
        |  - Pipeline DAG definition          |
        |  - Runner abstraction:              |
        |    * LocalRunner (CLI: Claude Code) |
        |    * WorkflowRunner (Web: WDK)      |
        +------------------+------------------+
                           |
                           v
        +-------------------------------------+
        |  Vercel Workflow DevKit (hosted)    |
        |  - DurableAgent per Subagent        |
        |  - Steps for tool calls             |
        |  - Hooks for human-in-loop          |
        |  - Streaming via getWritable()      |
        |  - Survives crashes / >5min runs    |
        +------------------+------------------+
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
+----------------+ +----------------+ +-----------------+
| AI Gateway     | | Neon Postgres  | | Integrations    |
| - claude-      | | (state, runs,  | | - Resend (mail) |
|   sonnet-4.6   | |  projects,     | | - Reddit/X API  |
| - failover gpt | |  personas,     | | - Vercel Deploy |
|   -5.4         | |  outreach)     | |   (fake-door)   |
| - usage tags   | | + Drizzle ORM  | | - Plausible/PH  |
+----------------+ +----------------+ +-----------------+
                           |
                           v
                  +----------------+
                  | Vercel Blob    |
                  | (reports PDF,  |
                  |  exports, logo |
                  |  fake-doors)   |
                  +----------------+
```

---

## 2. Monorepo-Layout

Begründung: ValidationKit muss zwei Frontends (Web + CLI) bedienen, die identische Agent-Logik teilen. Ein Turborepo-Monorepo mit pnpm workspaces ist 2026 der Standard für Vercel-Stacks und löst die "Doppel-Codebase"-Frage strukturell.

```
validationkit/
+-- apps/
|   +-- web/                          # Next.js 16 App Router (Hosted SaaS)
|   |   +-- app/
|   |   |   +-- (marketing)/          # Public landing, pricing, docs
|   |   |   +-- (dashboard)/          # Authed app
|   |   |   |   +-- projects/
|   |   |   |   +-- runs/[runId]/     # Live pipeline stream
|   |   |   |   +-- personas/
|   |   |   |   +-- reports/
|   |   |   |   +-- billing/
|   |   |   +-- api/
|   |   |       +-- workflow/[...]/   # Workflow DevKit routes
|   |   |       +-- webhooks/stripe/
|   |   |       +-- webhooks/clerk/
|   |   |       +-- integrations/oauth-callback/
|   |   +-- workflows/                # WDK workflow definitions
|   |   |   +-- run-pipeline.ts       # Master orchestrator
|   |   |   +-- agents/               # One file per DurableAgent
|   |   +-- middleware.ts             # Clerk auth
|   |
|   +-- cli/                          # OSS CLI (Phase 0 wrapper)
|       +-- bin/validationkit.ts      # `vk init`, `vk run`, `vk sync`
|       +-- src/
|           +-- claude-code-runner.ts # Spawns Claude Code with .claude/agents/
|           +-- sync.ts               # Optional: push state.json to web API
|
+-- packages/
|   +-- agents/                       # SINGLE SOURCE OF TRUTH for agent logic
|   |   +-- definitions/
|   |   |   +-- founder-interviewer.ts
|   |   |   +-- problem-explorer.ts
|   |   |   +-- solution-architect.ts
|   |   |   +-- persona-builder.ts
|   |   |   +-- synthetic-interviewer.ts
|   |   |   +-- skeptic-analyst.ts
|   |   |   +-- fake-door-launcher.ts
|   |   |   +-- outreach-strategist.ts
|   |   +-- tools/                    # Zod-typed tool schemas
|   |   +-- prompts/                  # System prompts (templated MD)
|   |   +-- schemas/                  # Zod state schemas
|   |   +-- runners/
|   |       +-- index.ts              # Runner interface
|   |       +-- local-runner.ts       # Generates .claude/agents/*.md files
|   |       +-- workflow-runner.ts    # Wraps DurableAgent
|   |
|   +-- sdk/                          # Public TypeScript SDK (npm publish)
|   |   +-- src/client.ts             # ValidationKit client (REST wrapper)
|   |
|   +-- ui/                           # shadcn/ui components shared web + docs
|   +-- db/                           # Drizzle schema + migrations (Neon)
|   +-- config/                       # tsconfig, eslint, tailwind presets
|
+-- turbo.json
+-- pnpm-workspace.yaml
```

**Kritische Design-Entscheidung — Runner-Abstraktion:** Jedes der 8 Subagents wird in `packages/agents/definitions/` als TypeScript-Modul definiert (Tools, Prompts, Schema, Inputs/Outputs). Es exportiert zwei Adapter:

- **LocalRunner** generiert beim `vk init` Befehl die `.claude/agents/*.md`-Dateien deterministisch aus den TS-Modulen. Das heißt: Die Markdown-Files im OSS-Repo werden **nicht** handgepflegt, sondern aus der gleichen Source kompiliert wie die hosted Variante.
- **WorkflowRunner** wrapped jedes Subagent in einen `DurableAgent` aus `@workflow/ai`.

So bleibt eine einzige Wahrheitsquelle für Prompts, Tools und Schemata. Updates am OSS-Framework propagieren via `pnpm build` automatisch in die hosted Variante.

---

## 3. Runtime-Wahl: Vercel Workflow DevKit

**Empfehlung:** **Workflow DevKit (WDK)** als primärer Runtime für hosted Pipelines.

### Vergleich der Optionen

| Kriterium | Vercel Workflows | Inngest | Trigger.dev | Eigene Queue (BullMQ + Redis) |
|---|---|---|---|---|
| Native Vercel-Integration | Ja, first-party | Externer SaaS | Externer SaaS | Eigene Infra nötig |
| AI-SDK-Integration | DurableAgent, getWritable streamen direkt nach UIMessage | Manuell | Manuell | Manuell |
| Step-Caching/Replay | Ja, automatisch | Ja | Ja | Selbst bauen |
| Crash-Sicherheit | Ja | Ja | Ja | Bedingt |
| Human-in-Loop (Hooks) | createHook nativ | Events | waitForEvent | Selbst bauen |
| Long-Run (Stunden/Tage) | Ja, kein Timeout | Ja | Ja | Bedingt |
| Vendor-Lock | Auf Vercel | Plattform-agnostisch | Plattform-agnostisch | Frei |
| Pricing 2026 | Inkludiert in Vercel-Funktions-Compute | Eigene Tier | Eigene Tier | Infra-Kosten |
| Setup-Aufwand | `withWorkflow()` in next.config | Mittel | Mittel | Hoch |
| Streaming live ins UI | Built-in via getReadable | Polling/SSE selbst | Polling/SSE selbst | Selbst |

### Warum WDK trotz Vendor-Lock

1. **DurableAgent ist purpose-built für genau diesen Use Case.** Die 8 ValidationKit-Subagents sind multi-step LLM-Agents mit Tool-Calls, die teils 5-30 Minuten laufen können (Synthetic Interviewer mit 50 Personas, Skeptic Analyst mit Cross-Validation). WDK kapselt Retry, Crash-Recovery, Replay und Streaming, ohne dass wir Workflow-Engineering selbst machen müssen.
2. **`getWritable<UIMessageChunk>()` streamt direkt in `useChat`.** Inngest/Trigger.dev erfordern für Live-UI-Streaming eine separate SSE-Schicht. Mit WDK ist es ein API-Pfad.
3. **Hooks ersetzen Human-in-Loop-Boilerplate.** Founder-Interview-Agent muss auf User-Antworten warten (potentiell tagelang). `createHook()` mit deterministischem Token (`hook-${runId}-q${n}`) ist genau dieses Pattern.
4. **Kein extra Service** — eine Dependency weniger, ein Dashboard weniger, eine Rechnung weniger. Für einen Solopreneur-Stack zählt das.
5. **Vercel-Sandbox für isolierten Code:** Falls User-spezifischer Code (z.B. custom Tool-Definitionen) ausgeführt werden muss, ergänzt Vercel Sandbox WDK perfekt.

**Wann Inngest/Trigger.dev besser wären:** Falls ValidationKit jemals self-hosted für Enterprise angeboten wird oder die Workflows AWS/GCP-First sein müssten. Das sind 50-Jahr-Skala-Fragen, nicht 12-Monats-Fragen. Migration ist via Runner-Abstraktion (`packages/agents/runners/`) möglich.

### WDK-Pattern für ValidationKit

```ts
// apps/web/workflows/run-pipeline.ts
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable, createHook } from "workflow";
import type { UIMessageChunk } from "ai";

// Step functions handle streaming and Node.js-side work.
// getWritable() must be called inside "use step" — never in workflow scope.
async function emitPipelineEvent(event: {
  phase: string;
  status: "start" | "complete";
}) {
  "use step";
  console.log(`[pipeline] ${event.phase}: ${event.status}`);
  const writer = getWritable<UIMessageChunk>({ namespace: "pipeline" }).getWriter();
  try {
    await writer.write({
      type: "data-pipeline-event",
      data: event,
    } as unknown as UIMessageChunk);
  } finally {
    writer.releaseLock();
  }
}

async function logInfo(message: string) {
  "use step";
  console.log(`[info] ${message}`);
  const writer = getWritable<{ level: string; message: string }>({
    namespace: "logs:info",
  }).getWriter();
  try {
    await writer.write({ level: "info", message });
  } finally {
    writer.releaseLock();
  }
}

export async function runPipeline(runId: string, projectId: string) {
  "use workflow";

  await logInfo(`Run ${runId} started for project ${projectId}`);

  // Phase 1: Founder Interview (mit Hooks fuer User-Antworten)
  await emitPipelineEvent({ phase: "founder-interview", status: "start" });
  const interviewResult = await runFounderInterview(runId);
  await emitPipelineEvent({ phase: "founder-interview", status: "complete" });

  // Phase 2: Problem Exploration (parallel zu Persona Building)
  await emitPipelineEvent({ phase: "exploration", status: "start" });
  const [problems, personas] = await Promise.all([
    runProblemExplorer(interviewResult),
    runPersonaBuilder(interviewResult),
  ]);
  await emitPipelineEvent({ phase: "exploration", status: "complete" });

  // Phase 3: Synthetic Interviews (high token cost, kann 20+ min laufen)
  await emitPipelineEvent({ phase: "synthetic-interviews", status: "start" });
  const interviews = await runSyntheticInterviewer(personas, problems);
  await emitPipelineEvent({ phase: "synthetic-interviews", status: "complete" });

  // Phase 4: Skeptic Analysis (Cross-validation)
  const analysis = await runSkepticAnalyst(interviews);

  // Phase 5: Fake-Door + Outreach (mit user approval via hook)
  const approval = createHook<{ approved: boolean }>({
    token: `approve-launch-${runId}`,
  });
  const { approved } = await approval;
  if (!approved) {
    await logInfo(`Run ${runId} cancelled by user`);
    return { status: "cancelled" };
  }

  await runFakeDoorLauncher(analysis);
  await runOutreachStrategist(analysis);

  await logInfo(`Run ${runId} completed successfully`);
  return { status: "complete", reportUrl: `/reports/${runId}` };
}
```

---

## 4. Auth, Billing, Storage Stack

### Auth: Clerk

**Empfehlung: Clerk** (native Vercel Marketplace Integration).

| Option | Pro | Contra |
|---|---|---|
| **Clerk** | Auto-provisionierte Env-Vars via Marketplace, Multi-Tenant-Orgs out-of-box, Email/OAuth/Magic-Link, Free-Tier 10k MAU, sub-100ms middleware | ~/mo bei Wachstum |
| Auth.js | Free, full control, gut bei Postgres-DB | Org/Team-Tier selbst bauen, mehr Wartung, geringer Velocity |
| WorkOS | Beste Enterprise-Auth (SSO, SCIM) | Overkill in Solopreneur-Phase, teurer |

**Begruendung:** ValidationKit Phase 2 zielt auf Solopreneurs + Small Teams (5er-Team-Plan). Clerk's Organisations-Feature mappt 1:1 auf ValidationKit-Projekte mit Co-Founder-Zugang. Marketplace-Provisioning bedeutet: `vercel link` + Clerk-Add-on installieren -> `CLERK_*` Env-Vars existieren automatisch in allen Environments. Migration zu Auth.js spaeter moeglich, falls Margen es erfordern (Schnittstelle: User-ID, Org-ID).

### Billing: Stripe (direkt, nicht via Marketplace)

**Pricing-Modell:**
- **Free:** 1 Projekt, 1 Pipeline-Run/Monat, mit ValidationKit-Branding
- **Indie ():** 3 Projekte, 10 Runs/Monat, Persona-Library, eigene Domains
- **Founder ():** unlimited Projekte, 50 Runs/Monat, API-Zugang, Outreach-Integration
- **Team ():** 5 Seats, 200 Runs/Monat, Custom Personas, Priority Support

**Usage-Tracking:** Jeder Workflow-Run schreibt in eine `runs` Tabelle mit `tokens_in`, `tokens_out`, `compute_seconds`. Bei Stripe nutzen wir **Subscription mit Metered Add-Ons** fuer Overage (z.B. 10 EUR / 10 Runs ueber Kontingent). AI Gateway gibt uns dafuer per `tags: ["user:${userId}", "feature:run", "tier:${plan}"]` exakte Token-Attribution.

**Webhook-Flow:**
1. Stripe `checkout.session.completed` -> setze Plan in DB
2. Stripe `invoice.paid` -> reset monthly usage counter
3. Stripe `customer.subscription.deleted` -> downgrade zu Free
4. WDK-Workflow prueft vor jedem Run das Kontingent via Step.

### Storage: Neon Postgres + Vercel Blob

**Neon (Marketplace):**
- `projects`, `runs`, `agents_executions`, `personas`, `interview_transcripts`, `outreach_drafts`, `users`, `orgs`, `usage_events`, `integrations` (OAuth-Tokens)
- Vector-Spalte mit `pgvector` fuer Persona-Similarity (Free-Tier ausreichend bis 200 MAU)
- Drizzle ORM in `packages/db/`, Migrations via `drizzle-kit`
- **Warum nicht Postgres on Vercel-Marketplace direkt mit Supabase?** Neon's Branching (preview deployments bekommen eigene DB-Branches) ist Killer-Feature fuer Multi-Env-Stripe-Testing.

**Vercel Blob:**
- Generated Reports (PDF/HTML)
- Fake-Door-Landing-Page-Assets
- Exportierte Persona-Profile als JSON

**Runtime Cache:**
- Hot data (Persona-Lookups, Pricing-Tier-Checks) via Vercel Runtime Cache
- 60s TTL fuer Dashboard-Aggregationen

### Real-time Agent Streaming

Pattern: `useChat` im Dashboard, das den WDK-Run als Quelle nutzt.

```ts
// apps/web/app/api/runs/[runId]/stream/route.ts
import { getRun } from "workflow/api";

export async function GET(req: Request, { params }) {
  const run = getRun(params.runId);
  const stream = run.getReadable({ namespace: "pipeline" });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

Dashboard nutzt `useChat<MyAgentUIMessage>` mit `transport: new DefaultChatTransport({ api: '/api/runs/${runId}/stream' })`. Bei Reload kann der Client mit `startIndex` an der letzten Stelle resumen (WDK speichert alle Stream-Events). Das **eliminiert** Polling-Hacks komplett.

### MCP / Integrationen (OAuth-Connections)

User verwalten OAuth-Verbindungen ueber `apps/web/(dashboard)/integrations/`:

- **Resend** — fuer Outreach-Mail-Send. Server-side Connection ueber API-Key, je User pro Org.
- **Reddit, X, Linear** — OAuth-2-Flow, Tokens encrypted in `integrations` Tabelle.
- **Vercel Deploy** — wird intern genutzt fuer Fake-Door-Pages (`vercel deploy` via API token), User sehen nur Domain.
- **Plausible/PostHog** — Analytics-Snippet auf Fake-Doors, Conversion-Tracking pro Run.

Jeder Integration-Adapter implementiert ein `Connector<TConfig>` Interface in `packages/agents/integrations/`. Adapter laufen als Step-Funktionen innerhalb der Workflows. So bleibt das OSS-Framework integrations-frei (Self-Host nutzt eigene API-Keys aus `.env`), waehrend Web-User OAuth-Flows nutzen.

---

## 5. Migrations-Plan

### Phase 0 (Woche 1 bis Woche 4): CLI-only OSS

- Erstelle Monorepo-Skelett mit `apps/cli` + `packages/agents`
- Schreibe alle 8 Subagent-Definitionen in TS
- `vk init` generiert `.claude/agents/*.md` aus den TS-Modulen
- State in `.validationkit/state.json` (lokal)
- Launch auf GitHub, Distribution via `npm install -g @validationkit/cli`
- Telemetrie: anonyme Pings via PostHog (opt-out)

### Phase 1 (Woche 5 bis Woche 10): Web Beta parallel

- `apps/web` Setup: Next.js 16, Clerk, Neon, Stripe Test Mode
- WorkflowRunner in `packages/agents` implementiert
- Erste 3 Workflows hosted: Founder Interview, Persona Builder, Synthetic Interviewer
- Dashboard mit Run-Liste + Live-Streaming
- Closed Beta mit 20 OSS-Power-Usern (gratis Founder-Tier fuer Feedback)

### Phase 2 (Woche 11 bis Woche 16): Public Launch

- Restliche 5 Subagents in WDK migriert
- Stripe Production, Pricing-Page, Self-Serve Onboarding
- Integrations: Resend, Reddit, Vercel-Deploy fuer Fake-Doors
- **CLI sync feature:** `vk sync --to-cloud` pusht lokalen State zur Web-App (Power-User-Bridge)
- Marketing-Push: Indie Hackers, Product Hunt, X

### Phase 3 (Monat 5 bis Monat 12): Plattform-Phase

- Persona-Marketplace (User verkaufen kuratierte Personas)
- Custom Subagent-SDK (User schreiben eigene Subagents in TS, deployen auf ValidationKit)
- Team-Tier mit Multi-Seat-Collaboration
- White-Label fuer Agenturen

### Phase 4 (Jahr 2+): Enterprise + Verticals

- WorkOS-Integration fuer Enterprise-SSO
- Vertical-Templates (B2B SaaS, Consumer Apps, Marketplaces)
- API-First-Tier mit Volume-Pricing

---

## 6. Open Risks

### R1 — WDK-Lock-in bei Plattform-Wechsel
WDK ist Vercel-spezifisch. Falls Vercel-Pricing eskaliert oder Enterprise-Kunden Self-Hosting wollen, ist Migration zu Inngest/Trigger.dev nicht-trivial. **Mitigation:** Runner-Abstraktion in `packages/agents/runners/` strikt durchhalten, sodass WorkflowRunner austauschbar bleibt. Keine WDK-Primitives (createHook, sleep) ausserhalb der Runner-Adapter verwenden.

### R2 — Doppel-Pflege trotz Monorepo
LocalRunner und WorkflowRunner muessen identisches Verhalten produzieren. Subtle Unterschiede (z.B. Claude Code Tool-Permissions vs. WDK-Step-Sandboxing) koennen User verwirren ("Web-Run gibt andere Ergebnisse als CLI-Run"). **Mitigation:** Snapshot-Tests gegen synthetische Inputs, gleicher Output. CI Job laeuft beide Runner durch und vergleicht Outputs auf Schema-Ebene.

### R3 — Token-Kosten-Eskalation bei Synthetic Interviewer
Bei 50 Personas x 30 Min Interview = ~1.5M Tokens / Run. Bei pro Run Founder-Tier reicht 3-4 Runs, dann negative Marge. **Mitigation:** AI Gateway Budget-Caps pro User, Pre-flight Token-Estimation als WDK-Step (Reject mit FatalError wenn Budget < Estimated). Haiku-4.5 fuer cheap interviewers, Sonnet-4.6 nur fuer Skeptic Analyst. Caching fuer wiederholte Persona-Prompts via Gateway `cacheControl`.

### R4 — Clerk-Migration-Schmerz bei Skalierung
Bei 50k MAU wird Clerk teuer (~10k EUR/mo). Wechsel zu Auth.js dann erfordert User-Data-Migration (Sessions, Org-Memberships). **Mitigation:** User-IDs als Clerk-IDs (`user_xxx`) speichern, aber in eigener `users` Tabelle spiegeln; Mapping-Layer baut Migration-Pfad ein. Erst ab nennenswertem MRR migrieren — Velocity > Kosten in Phase 1-2.

### R5 — Long-Running Workflows ueberlaufen User-Geduld
30-min Pipelines fuehlen sich fuer Web-User langsam an. **Mitigation:** Live-Streaming jedes Thoughts und Tool-Calls via namespaced streams (`logs:info` fuer Status, `pipeline` fuer Hauptergebnis), Email-Notification bei Run-Complete (Resend), progressive Disclosure von Teil-Ergebnissen (Personas zuerst sichtbar, dann Interviews, dann Report).

### R6 — Power-User-CLI vs. Web-Drift
OSS-User wollen Geschwindigkeit, Web-User wollen UI-Polish. Wenn neue Subagents erst im Web landen, fuehlt sich OSS abgehaengt. **Mitigation:** Goldene Regel — keine Subagent-Funktion in Production die nicht ueber LocalRunner laeuft. Web-only-Features sind Schicht-2 (Dashboard, Reports, Marketplace), nie Schicht-1 (Agent-Logik).

### R7 — OAuth-Token-Security bei Multi-Tenant
Resend/Reddit-Tokens werden in Postgres gespeichert. Bei Breach hat Angreifer Send-Rechte fuer alle User-Inboxes. **Mitigation:** Tokens encrypted-at-rest via Vercel KMS oder Neon's `pgcrypto`, niemals direkt in API-Responses zurueckgeben. Rate-Limiting auf Outreach-Send-Step in WDK (max 50 Mails / Stunde / User).

### R8 — Stripe Webhook + WDK Race Condition
User upgraded gerade, Stripe-Webhook noch unterwegs, WDK-Run startet mit altem Free-Tier-Limit. **Mitigation:** Plan-Check als WDK-Step mit Retry (3x mit exponential backoff), oder Pre-Step-Check via Server Action vor `start(runPipeline, ...)`. Idempotenz via Stripe Event-ID in DB.

---

## TL;DR Stack

| Layer | Wahl |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web Framework | Next.js 16 (App Router, Cache Components) |
| Auth | Clerk (Vercel Marketplace) |
| Database | Neon Postgres (Marketplace) + Drizzle |
| Blob | Vercel Blob |
| Runtime Cache | Vercel Runtime Cache |
| Workflow Engine | Vercel Workflow DevKit + DurableAgent |
| LLM Routing | Vercel AI Gateway (Claude Sonnet 4.6 primary, GPT-5.4 fallback) |
| Billing | Stripe direkt (Subscription + Metered Add-Ons) |
| Email | Resend (Marketplace) |
| Analytics | PostHog self-hosted + Plausible fuer Marketing |
| Deployment | Vercel (alles single-platform) |
| CLI | Node.js binary wrappt Claude Code, shared `packages/agents` |

Diese Architektur erlaubt 1 Codebase, 2 User-Personas (CLI-Power-User + Non-Tech-Founder), 4 Pricing-Tiers, und einen klaren 12-Monats-Pfad zur Plattform-Vision.
