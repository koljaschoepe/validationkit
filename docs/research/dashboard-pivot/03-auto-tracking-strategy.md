# 03 — Auto-Tracking-Strategie für Customer-Repos

> Research-Agent A3 · 2026-05-17 · Skeptic-Mentor-Voice
> Frage: Wie merkt das Dashboard, dass sich ein angeschlossener Repo geändert hat — ohne dass der Customer jeden Audit manuell antriggert?

## TL;DR

**Ship in Phase 0.5 (zero new spend):** Polling via Inngest (Option 2) als Default für alle Repos + Hybrid-Notify-Endpoint (Option 3) als opt-in Latency-Upgrade.
**Defer auf Phase 1 / Agency-Tier:** GitHub-App-Webhooks (Option 1) — die App existiert als Code-Skelett, aber die Day-1-Mitigations (DPA, Trust-Center, Approver-Bridge, Read-Only-Default, ADR-0018 §14) sind 9–12 PD Aufwand. Vor 5 Agency-LOIs nicht canonical.

## Vergleichsmatrix

| Kriterium | 1) GitHub-App-Webhook | 2) Inngest-Polling | 3) Customer-CI-curl |
|---|---|---|---|
| **Setup-Friction (1–5)** | 4 — OAuth-Install + Repo-Auswahl + Approver-Bridge falls Org-Policies | 1 — Paste-URL, fertig | 2 — Customer addiert 1 Zeile in CI-YAML + API-Token kopieren |
| **Latency Push→Re-Audit** | ~5–15 sec (Webhook + Queue) | 1–6 h (konfigurierbar, default 2 h cron) | ~10–30 sec (curl + Queue) |
| **Private Repos** | Ja (einziger Pfad) | Nur public zipball ohne Token | Ja (Customer pusht selbst, kein Read-Access nötig) |
| **Free-Tier-Kosten** | GH App: 5 000 req/h pro Installation (komfortabel). Vercel /api/webhook: 1 invoke/push. | Inngest Free: 50 k step-runs/Monat. Bei 30 Repos × 12 polls/Tag × 30 Tage = 10 800 runs/Monat — **22% des Quotas, OK**. Bei 100 Repos kippt's. | Vercel-only, vernachlässigbar. |
| **Implementation-Effort** | 6–9 PD: push-Event-Parser (fehlt in `@vk/github-app/webhook.ts`, nur installation\* aktuell), Installation→Customer-Mapping, Day-1-Mitigations vorgeschaltet (9–12 PD parallel). **Gesamt: 15–21 PD.** | 2–3 PD: Inngest scheduled function, sha-compare gegen `repos.last_commit_sha`, enqueue audit. Komplett aus bestehendem `@vk/inngest`-Setup heraus. | 1–2 PD: `POST /api/notify-update` mit HMAC-Token-Auth + rate-limit + audit-enqueue. |
| **Funktioniert ohne SaaS-Account** | Nein (GH-App-Registry braucht Produktion-Domain für Callback) | **Ja** — lokal via Inngest-Dev-Server (Hardcore-Local-Only-Mode-kompatibel) | Ja, sobald `/api/notify-update` deployed |
| **Failure-Mode** | Webhook-Delivery-Retry 8× über 8h (GitHub-default). Aber: Mitigations-Schulden = ADR-Risiko Hoch/Hoch. | Silent miss falls Polling-Window verpasst (max 6h Delay). Akzeptabel. | Customer vergisst CI-Step → keine Updates → Customer denkt es funktioniert. Schlechtester Failure-Mode. |

## Konzession & Kritik

**Konzession:** Webhooks fühlen sich richtig an. Sie sind die "correct" Lösung im Lehrbuch, das `@vk/github-app`-Skelett liegt schon da, und für Agency-Customers mit Private-Repos gibt's keinen anderen Pfad.

**Kritik:** Aber heute, im Hardcore-Local-Only-Mode vor M3-Gate (5 Agency-LOIs), kostet die GitHub-App nicht nur die 6–9 PD Code — sie schleppt 9–12 PD Mitigations-Schulden mit (PRD §14, ADR-0018-Konstante 14). Das sind **15–21 PD vor dem ersten paying Agency-Customer**. Polling kostet 2–3 PD und ist beim 2h-Default unsichtbar für Indie-Hacker, deren Repo eh nicht alle 5 Minuten pushed. 1–6h Latency ist kein Defekt für Pre-Build-Validation-Wedge — da geht's um Wochen-Iterationen, nicht Minuten.

**Hybrid-Notify (Option 3)** ist die Skeptic-Mentor-Wette: Wer Latency will, bekommt eine API-Zeile in seine CI. Wer's nicht braucht, kriegt Polling. **Zero Friction für Default-User, Escape-Hatch für Power-User, ohne dass wir eine GitHub-App ohne Mitigations-Stack live nehmen.**

## Empfehlung Phase 0.5 (M0–M3, zero spend)

1. **Inngest-Polling** als Default (2–3 PD) — funktioniert lokal, deckt 100% Public-Repo-Indie-Use-Case.
2. **`/api/notify-update`-Endpoint** (1–2 PD) — HMAC-signed, Rate-limit, dokumentiert in Setup-Guide. Bonus: liefert Latency-Demo für Agency-Sales-Calls.
3. **GitHub-App-Webhooks: DEFER bis Agency-Gate gerissen (≥5 LOIs).** Erst dann lohnen sich die 15–21 PD inkl. Mitigations. Code-Skelett bleibt, `push`-Event-Parser steht als TODO in `webhook.ts`.

**Total Phase-0.5-Aufwand: 3–5 PD. Kein neuer SaaS-Account. Private-Repo-Limitation explizit dokumentiert als "Coming with GitHub App in Phase 1".**

---

*Files referenced:*
- `/Users/koljaschope/Documents/rohan/packages/github-app/src/webhook.ts` (existing skeleton, no `push` event handler yet)
- `/Users/koljaschope/Documents/rohan/packages/inngest/` (existing, ready for scheduled function)
- ADR-0018 §14 (Day-1-Mitigations Pflicht für GitHub App)
