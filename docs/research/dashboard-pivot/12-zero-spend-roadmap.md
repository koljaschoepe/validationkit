# A12 — Zero-New-Spend Roadmap (Sprint 0.11–0.14)

> Research agent A12, ValidationKit Dashboard-Pivot. Date: 2026-05-17.
> Scope: Was kann gebaut, deployed, getestet werden, **ohne einen einzigen neuen Euro** auszugeben — und an welchen exakten Punkten muss erstmals Cash fliessen?

---

## TL;DR (Skeptic-Mentor-Voice)

Du hast 3–4 Wochen Solo-Build-Runway, in denen du **kein neues Konto, keinen neuen API-Key, keine neue Karte** brauchst. Du kannst in dieser Zeit ein **Phase-0.5-Produkt** abliefern, das ein Tester mit eigenem GitHub-Repo end-to-end durchklicken kann — **ohne dass eine einzige LLM-Anfrage feuert**. Das ist nicht "fertig". Das ist "vorzeigbar genug, um die 10 Agency-Discovery-Interviews und die ersten Mom-Tests damit zu führen, statt sie mit Mockups zu führen." Der erste Cash-Out ($5 Anthropic) kommt erst, wenn ein realer Tester nach LLM-Audit *fragt*.

---

## 1. Build-Now-Zero-Spend (Sprint 0.11–0.14, ~3–4 Wochen)

Sortiert nach ROI — **was bringt am schnellsten ein Tester-Klickerlebnis, ohne dass irgendwo eine Karte gezogen wird.**

### Sprint 0.11 — Dashboard-Shell sichtbar machen (Woche 1)

1. **Multi-Repo-Dashboard-UI** (siehe `01-multi-repo-dashboard-ux.md`)
   - Statische Route `/dashboard` mit Repo-Liste, Filter, Sortierung, Cards für jedes Repo.
   - **Was es NICHT tut:** Keine echten Repo-Daten — Seed-Fixtures aus `packages/db/seed/`.
   - Cost: $0. Stack: Next.js 16 + Cache Components + shadcn (lokal installiert, kein Registry-Account).

2. **Repo-Graph-Visualisierung** (siehe `02-graph-viz-library.md`)
   - `react-flow` oder `cytoscape` (OSS, MIT) — eine Repo zeigt Agent-Files als Knoten, Referenzen als Kanten.
   - **Was es NICHT tut:** Keine Cross-Vendor-Differenz-Hervorhebung (kommt mit Audit-LLM-Layer später).
   - Cost: $0.

3. **Onboarding-Flow** (Screen 1–4, frontend-only)
   - "Connect GitHub" → Mock-Button → Repo-URL-Input → Parse-Preview → Dashboard-Redirect.
   - **Was es NICHT tut:** Echte GitHub-App-Installation. Magic-Link landet nur in der Mailpit-Inbox (lokal) oder via `onboarding@resend.dev` an deine eigene Mail.
   - Cost: $0.

### Sprint 0.12 — Auto-Tracking ohne GitHub-App (Woche 2)

4. **Public-Repo-Polling-Infrastruktur** (siehe `03-auto-tracking-strategy.md`)
   - Inngest-Dev-Server lokal, Cron-Job alle 30 min, `git clone --depth 1` via public HTTPS (60 req/h unauth-Limit reicht für 5–10 Demo-Repos).
   - Parser läuft, Drift-Detection läuft, Findings landen in Neon Free Tier.
   - **Was es NICHT tut:** Keine private Repos, keine Webhook-Push-Updates (Polling-Only), kein OAuth.
   - Cost: $0.

5. **Webhook-Handler-Scaffolding**
   - Route `/api/webhooks/github` + HMAC-Signaturvalidierung + Event-Dispatcher.
   - Test mit `smee.io` (free) oder `gh webhook forward` (offiziell, free).
   - **Was es NICHT tut:** Empfängt nichts Echtes — kein GitHub-App registriert. Aber Code ist done.
   - Cost: $0.

### Sprint 0.13 — Audit-Report deterministisch (Woche 3)

6. **Fix-Suggestion deterministischer Teil** (PRD §13, Constraint 13)
   - 5/6 Audit-Kategorien rein regelbasiert: Unused-Agents, Duplicate-Guidance, Context-Bloat, Stale-References, Token-Budget.
   - AST über AGENTS.md/CLAUDE.md/SKILL.md mit existing `@vk/parser`.
   - **Was es NICHT tut:** Conflicting-Rules-Kategorie bleibt leer (braucht LLM). UI zeigt "LLM-Audit: enable in Settings →" als Placeholder.
   - Cost: $0.

7. **Multi-LLM-Abstraktionslayer (Code-only)**
   - `packages/llm/` mit Vercel-AI-SDK + Provider-Switch (Anthropic / Google / OpenAI).
   - Routes verdrahtet, Prompts geschrieben, Fixtures für Tests.
   - **Was es NICHT tut:** Kein Key gesetzt → jede LLM-Route returnt `501 LLM_NOT_CONFIGURED` mit Hint-UI.
   - Cost: $0.

### Sprint 0.14 — Polish + Tester-Readiness (Woche 4)

8. **Stripe Test-Mode-Integration**
   - Stripe-Account anlegen ist gratis, Test-Keys sind gratis, keine Karte nötig bis Live-Mode.
   - Checkout-Flow, Webhook-Handler, Subscription-Status — alles testbar mit Test-Karten (4242…).
   - **Was es NICHT tut:** Keine echten Charges. Kein Live-Key.
   - Cost: $0.

9. **E-Mail-Templates für 6 States**
   - Welcome, Magic-Link, Drift-Detected, Audit-Ready, Trial-Expiring, Invitation.
   - Resend Test-Domain `onboarding@resend.dev` → liefert nur an deine verifizierte Mail.
   - **Was es NICHT tut:** Kein Versand an Tester-Mails — die müssen lokal in Mailpit klicken oder du forwardest.
   - Cost: $0.

10. **Deterministische `/operations`-Demo-Flow für Recording**
    - 90-Sek-Screencast-Script: Repo connecten → Dashboard → Audit-Report → Drift-View.
    - Marketing-Asset für Build-in-Public-Cadence (Constraint 7 + Skeptic-Mentor-Voice).
    - Cost: $0.

---

## 2. Cash-Out-Trigger (sortiert by amount)

| Stufe | Spend | Auslöser | Was es freischaltet | Stop-or-Go-Frage |
|---|---|---|---|---|
| **$0 → $5** | Anthropic API Key (Pay-as-you-go) | Erster Tester sagt: "Was passiert wenn ich auf 'LLM-Audit' klicke?" | Conflicting-Rules-Kategorie + Audit-Synthesis | Hat der Tester bereits 1 vollständigen deterministischen Audit gesehen und Mehrwert bestätigt? Wenn nein → warten. |
| **$5 → $12** | `sondr.dev` / `validationkit.dev` Domain (Cloudflare $9.15/yr o.ä.) | Magic-Link soll an externe Tester-Mail gehen (nicht nur an deine) | Echte Magic-Links, eigener DNS, Resend Domain-Verifizierung | Hast du ≥3 Tester, die explizit zugesagt haben? Sonst bleib auf `onboarding@resend.dev`. Naming-Decision (M9–M12) noch offen → nicht voreilig kaufen. |
| **$12 → $30** | Vercel Pro ($20/mo) | Function-Timeout >10s wird zum Blocker (z.B. Audit-Synthesis über grosses Monorepo) | 60s Function-Limit + Team-Seats + Observability | Reisst Hobby-Limit *real* (nicht hypothetisch)? Wenn Cron-Job 8s braucht → bleib auf Hobby. |
| **$30+** | GitHub-App-Registration (free) + DPA-Review (Anwalt, $500–1500) + Stripe Live ($1 Test-Charge) | 5 Agency-LOIs unterschrieben (Phase-0-Gate aus PRD v3.1) | Production-Onboarding für zahlende Customers | ADR nötig. Constraint 14: 4 Day-1-Mitigations vorher fertig (9–12 PD). Keine Live-Mode-Aktivierung vor LOI #1. |

**Wichtig:** Stripe-Account-Anlage ist gratis. **Test-Mode** kostet nichts. Live-Mode kostet 1 € Test-Charge zur Verifikation. Das ist der harmloseste der vier Triggers — kommt aber trotzdem erst nach LOI #1.

---

## 3. Phase-0.5-Produkt am Ende der Zero-Spend-Phase

**5-Line-Vision:**

> ValidationKit Phase-0.5 ist eine **lokal-und-Vercel-Hobby-gehostete** Dashboard-App, in die ein Tester mit der URL eines **öffentlichen GitHub-Repos** einsteigen kann und in <5 Min sieht: **Agent-File-Inventar, Repo-Graph, deterministischer Audit-Report (5 von 6 Kategorien), Drift-History via Polling**. LLM-Features sind im UI **sichtbar als "Settings → Enable AI Audit"-Placeholder**, kosten aber bis zur Aktivierung nichts. Stripe ist im Test-Mode integriert — Tester können Checkout-Flow durchspielen, ohne dass echtes Geld fliesst. **Magic-Link** geht via Resend-Test-Domain an die eigene Inbox; externe Tester laufen vorerst über Local-Mailpit oder manuellen Link-Forward. Es ist nicht "verkaufsbereit" — es ist "Discovery-Interview-bereit": konkret genug, damit AI-Consultancy-CEOs in den 10 Discovery-Calls (PRD v3.1 Phase-0-Step #2) auf echtes UI klicken statt auf Figma-Mockups.

**Was der Tester am Ende der Zero-Spend-Phase NICHT bekommt** (ehrlich gesagt, damit Erwartung kalibriert ist):

- Keine LLM-augmentierten Findings (5/6 Kategorien deterministisch reichen für Discovery).
- Kein private-Repo-Support (Polling = public-only).
- Keine Multi-User-Workspaces mit Email-Invites an Drittpersonen.
- Keine Live-Subscriptions (Test-Mode-Only).
- Keine eigene Domain — Tester sehen `*.vercel.app`-URL.

**Was er aber bekommt, und das ist die Kategorie-Wette:** Ein Cross-Vendor-Inventory (AGENTS.md + CLAUDE.md + GEMINI.md + SKILL.md + .cursor/rules/*.mdc + .claude/agents/) als **einziges Tool am Markt**, das alle 5 MUST-Formate parst — und das deterministisch, ohne LLM-FP-Risiko (Constraint 12 + 13).

**Output für Discovery-Call:** "Hier ist meine offene URL. Klick durch dein eigenes Repo. Sag mir in 10 Min, was nutzlos ist und was du vermisst." Wenn 5/10 Agency-CEOs antworten "ich vermisse X" → X wird Sprint 0.15. Wenn 0/10 antworten → ADR-0017-Re-Open-Trigger anschauen.

---

*Word count: ~790. Brand voice: Skeptic-Mentor — Concession-then-Critique. Specificity: jede Dollar-Schwelle hat einen konkreten Trigger und eine Stop-Frage. Keine Fake-Precision-Scores. Sprint-Aufteilung folgt Phase-0-Konstellation aus PRD v3.1 + ADR-0018.*
