# 09 — Onboarding-Flow für validationkit.vercel.app

> Research-Agent A9 · 2026-05-17 · Skeptic-Mentor-Voice
> Frage: Wie kommt ein neuer Besucher von `validationkit.vercel.app` in ≤ 90 sec zum ersten "Aha"-Audit, und was sieht er danach auf `/scans`, `/customers`, `/drifts`, `/bip`?

## TL;DR

**Try-then-signup.** Anonymous-Audit bleibt der Default — Signup erst, wenn der User den Report speichern, einen zweiten Repo verbinden oder Drift tracken will. Empirisch ist Try-before-Signup in PLG-SaaS 2026 der Pfad mit der höchsten Aktivierung ([SaaSMag PLG 2026](https://www.saasmag.com/product-led-growth-next-chapter-saas-2026/), [Pixelswithin Benchmarks](https://pixelswithin.com/b2b-saas-conversion-benchmarks-2026/)). First-Value-Moment: **gerendeter Audit-Report < 60 sec nach Landing**, modelliert nach Vercel Import-Flow (~30–90 sec bis Deploy, [Vercel Docs](https://vercel.com/docs/deployments)) und Linear "first resolved issue in single session" ([Supademo Teardown](https://supademo.com/user-flow-examples/linear)).

## Was die 5 Vergleichs-Flows machen

| Produkt | Gate? | First-Value-Moment | Empty-State-Strategie | Tour? |
|---|---|---|---|---|
| **Vercel** | Sign-up via GitHub (OAuth, 1-click) | Import-Repo → Deploy 30–90 sec ([Vercel Docs](https://vercel.com/docs/git/vercel-for-github)) | Dashboard zeigt "Add New Project" Card als primären CTA | Nein |
| **Linear** | Workspace-Create gated | Create + Resolve First-Issue in selber Session ([Supademo](https://supademo.com/user-flow-examples/linear)) | Task-Checklist statt Tour: "Create issue / Use Cmd+K / Set priority" | Cmd+K-Modal vor Workspace-Fill |
| **Sentry** | Sign-up gated | Capture First Error im SDK ([Sentry Onboarding](https://docs.sentry.io/product/onboarding/)) | Framework-Picker → Install-Snippet → Wait-for-First-Event-Banner | Source-Map-Wizard |
| **Notion** | Sign-up gated | Template wählen, sofort tippen ([Appcues](https://goodux.appcues.com/blog/notions-lightweight-onboarding)) | Getting-Started-Page mit funktionalen Checkboxes (`/`-Slash lernen by doing) | Inline-Checklist |
| **Figma** | Sign-up gated | "Figma Basics"-File dropped in Workspace ([Appcues Figma](https://goodux.appcues.com/blog/figmas-animated-onboarding-flow)) | Starter-Content statt leerer Canvas | Opt-in animierte Tooltip-Tour |

**Muster:** 4 von 5 gated, aber alle 5 vermeiden leere Bildschirme. Notion + Figma drücken Sample-Content, Linear drückt Tasks, Sentry drückt einen "Wait-for-Event"-Pulse. Niemand zeigt ein leeres Dashboard ohne Sample-Path.

## Empfehlung ValidationKit (5-Step-Sequenz)

1. **Landing → Anonymous Audit (kein Gate).** GitHub-URL-Input + "Try with anthropic-cookbook" Sample-Button daneben. Ziel: < 60 sec bis Report. ([SaaS-Onboarding 2026: TTFV < 5 min](https://resources.rework.com/libraries/saas-growth/onboarding-time-to-value))
2. **Post-Audit-Banner (sticky):** "Save this report + track drift + add more repos → Sign in with GitHub (10 sec)." Signup als Value-Pull, nicht Gate. Vercel-Pattern: GitHub-OAuth-1-Click.
3. **Post-Signup `/scans` mit dem gerade gerunten Anonymous-Audit pre-populated.** Kein Reset-to-empty. Das ist der Linear-Move: User landet in ihrem Workspace, der bereits Inhalt hat.
4. **First-Time-User-Banner auf `/scans`:** Task-Checklist im Linear-Stil, 3 Items, dismissable: "✓ First audit · ☐ Add a 2nd repo · ☐ Enable drift tracking." Keine Modal-Tour.
5. **Next-CTA Priorität:** **"Add another customer-repo"** > "Run drift" > "Generate BiP". Begründung: zweiter Repo = "Aha, das skaliert über Customers" (= Agency-Wedge-Aktivierung, ADR-0018). Drift braucht 2 Scans desselben Repos zu unterschiedlichen Zeitpunkten — kein Tag-1-Aha. BiP ist Phase-1-Feature.

## Empty-State-Copy (eine ≤ 40-Wort-Zeile pro Surface)

- **`/scans` (0 scans):** "Du hast noch keinen Scan gespeichert. Paste eine GitHub-URL oben, oder probier's mit **anthropic-cookbook** — wir zeigen dir, was ein Audit für 4 200+ Skills findet."
- **`/customers` (0 customers):** "Customer = ein Repo, das du regelmäßig auditierst (deins, das deines Klienten, ein Benchmark). Verbinde den ersten — anonymer Audit zählt nicht, weil wir ohne Account nichts speichern."
- **`/drifts` (0 drifts):** "Drift braucht zwei Scans desselben Repos zu unterschiedlichen Zeitpunkten. Sobald dein erster Customer-Repo zweimal gepollt wurde (~2 h), erscheint hier der Diff. Manuell triggern: `Re-scan` auf der Customer-Page."
- **`/bip` (0 drafts):** "Build-in-Public-Drafts werden aus Audit-Findings generiert (Severity Strong/Exceptional). Run mindestens einen Audit, dann findest du hier Tweet-Length, LinkedIn-Length und Long-Form-Skeletons mit Citations."

## First-Time-User-Banner (auf `/scans` direkt nach Signup)

> **Willkommen. Dein anonymer Audit ist oben gespeichert.**
> Drei Dinge, die in den nächsten 5 Minuten Sinn machen:
> ① Ein zweites Repo verbinden — so siehst du, wie Cross-Vendor-Inventory aussieht.
> ② Drift einschalten (Polling alle 2 h, [siehe A3](./03-auto-tracking-strategy.md)).
> ③ Diesen Banner schließen, falls du nur den einen Report brauchtest.
> Kein Sales-Call, keine Email-Nudges. Du steuerst.

## Konzession & Kritik

**Konzession:** Gated Signup vereinfacht Analytics, lift PQL-Quality, und 4 von 5 Vergleichsprodukten machen's so. Für Agency-Tier ($299/$799) ist Sales-Call eh angefragt — da ist Gate kein Friction.

**Kritik:** Aber wir sind im Phase-0-Indie-Wedge mit Anonymous-Audit als load-bearing-Differenzierung gegen WorthBuild ($5/Report behind paywall) und Preuve.ai. Gated Signup würde diesen Wedge wegwerfen. Try-then-Signup ist der einzige Pfad, der Build-in-Public-Distribution ("share dein Audit-Result als URL") nicht abwürgt. Median Opt-in-Trial-Conversion 23.4 % in 2026 ([Userguiding PLG](https://userguiding.com/blog/state-of-plg-in-saas)) — wir lassen das Geld nicht liegen, indem wir gaten.

**Tour-Frage:** Keine Modal-Tour. Linear-Pattern (Task-Checklist auf dem realen Dashboard) ist überlegen, wenn die Surface so klein ist wie unsere (4 Routes). Tour first-class wäre Figma-Pattern und ist Overkill für ein Pre-Phase-2-Produkt.

## Implementations-Aufwand

| Item | PD |
|---|---|
| Sample-Button "Try anthropic-cookbook" auf Landing | 0.5 |
| Sticky Post-Audit-Banner mit OAuth-CTA | 1 |
| Anonymous-Audit→Account-Migration bei Signup (session→user_id) | 1.5 |
| First-Time-User-Banner + Task-Checklist-State (3 items, localStorage) | 1 |
| Empty-State-Copy in 4 Routes | 0.5 |
| **Total** | **4.5 PD** |

---

*Quellen sind inline verlinkt. Counter-Argumente und Re-Open-Trigger: falls Conversion-Rate Anonymous→Signup nach 50 Audits < 5 %, Re-Run mit Gate-Test.*
