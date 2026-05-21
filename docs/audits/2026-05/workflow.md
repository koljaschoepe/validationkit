# Audit 2 — /plan + /execute Workflow

> 2026-05-21 · Subagent-Output. Tiefenanalyse des aktuellen `/plan`- und `/execute`-Slash-Command-Workflows mit Belegen aus 5 fertigen Plan-Files.

## Schwächen (alle adressiert in Phase 0)

1. **"Open Questions" wird zur Discovery-Müllhalde statt vorab geklärt.** Belege:
   - `docs/plans/done/nova-2-full-product.md:358–365` — Q-N2-A "React-Email oder simple HTML?" wurde im Plan-Body schon implementiert → Frage war fake.
   - `docs/plans/nova-2-live-audit-flow.md:104–111` — 4 load-bearing Architektur-Fragen, Plan setzt aber bereits Tarball + Cookie.
   - `docs/plans/nova-2-settings-backend.md:170–176` — 4 Security/Vendor-Pattern-Entscheidungen unterhalb der Schema-Definition.
2. **Plan committet sich heimlich vor Klärung.** `nova-2-full-product.md:31–34` "Plan-Ergänzung (nicht abgefragt, begründet)" — 3 Architektur-Entscheidungen explizit ohne Discovery.
3. **Discovery-Pattern bereits einmal erfolgreich, aber nicht im Command kodifiziert** (`landing-refactor-v3-static-mockup.md:38–49` zeigt 2 Runden AskUserQuestion).
4. **Risiken-Tabellen-Severity-Spalte inkonsistent** zwischen Plan-Files.
5. **Existing-Patterns-Sektion nur sporadisch** vorhanden.
6. **Test-Strategie generisch, nicht differenziert nach Risk-Tier.**
7. **Rollout-Strategie wird nie aktiv gefragt.**
8. **Confidence-Level/Annahmen fehlen explizit.**
9. **`/execute` startet keinen Dev-Server nach UI-Plänen** (entgegen `feedback_dev_server_after_execute.md`).
10. **`/execute` "blockiert" ist nicht definiert — Claude rät statt fragen.**

## Neuer Workflow (Phase 0 ✅)

- 4-Runden-Discovery mit Recommended-Option + Other-Freitext
- 13-Sektionen-Plan-File-Skelett (Confidence, Audit-Trail, Existing-Patterns, Alternativen, Rollout, Out-of-Scope sind Pflicht)
- Block-Resolver in /execute (raten verboten)
- Dev-Server-Auto-Start für UI-Pläne

## Adressiert in

- Phase 0.1: neuer `.claude/commands/plan.md` ✅
- Phase 0.2: neuer `.claude/commands/execute.md` ✅
- Phase 0.3: CLAUDE.md Workflow-Section ✅
- Phase 0.4/0.5: Live-Test deferred auf nächsten echten /plan-Call
