# A6 — Freemium Pricing für Per-Repo Dashboard

**Scope:** Wie führen Class-Leader 2026 ein Per-Resource-Freemium-Gate? Recommendation für ValidationKit-Dashboard.
**Date:** 2026-05-17. **Constraint:** PRD-Tiers $19 / $79 / $299 / $799. **Kein $99-Sandwich.**

## 1. Wie es Class-Leader machen (Severity-Banding der Lehren)

| Anbieter | Freemium-Gate | Paywall-Härte | Lehre für VK |
|---|---|---|---|
| **Vercel Hobby** | 1 Personal Team, non-commercial. Multi-Team = Pro $20/user. | **Hart** (Team-Switcher → Upgrade) + Soft-ToS. | **STRONG** — Persona-Gate ("personal" vs "team") konvertiert besser als reines Count-Gate. |
| **Sentry Dev** | 1 User, 5k Errors/mo, unbegrenzte Projekte. Team $26/mo entfernt User-Limit. | Weich an Volume, hart an Seat. | **MID** — Volume-Gate fairer als Count, aber für VK weniger lesbar. |
| **Plausible** | 30d-Trial, danach $9/mo 1 Site, $14/mo 3 Sites. | **Hart** (Site-Add blockt mit Upgrade-Modal). | **STRONG** — Per-Site=Per-Repo, Tier-Skala nach Resource-Count erprobt. |
| **Linear** | Free = 2 Teams + 250 Issues + unlimited Members. | Weich an Member, hart an Issue-Cap. | **STRONG** — Cap zwingt Power-User, lässt Casual gratis. |
| **PostHog** | 1M Events + 1 Projekt gratis, danach usage-based. | **Soft Cap** + Billing-Limit-Toggle. | **EXCEPTIONAL** — Billing-Cap-Toggle ist UX-Trust-Hebel; übernehmen. |
| **Snyk Free** | 200 Tests/mo private, unlimited public. | Hart bei Test-Quota. | **WEAK** — Tests/mo verwirrend (1 Repo = 3 Tests). |

**Pattern-Bündelung:**
1. **Resource-Count-Gate (Plausible, Vercel) > Volume-Gate (Snyk)** für nicht-technische Käufer — "1 Site/Repo" ist sofort verständlich.
2. **Hard-Gate beim Add-Versuch + Soft-Inline-Hint vorher** (Plausible-Pattern) ist Standard.
3. **Billing-Cap-Toggle** (PostHog) eliminiert die größte Trust-Bremse bei Usage-Komponenten.

## 2. Conversion-Floor — funktioniert 0–3 % für VK?

- 2026-Benchmark Freemium SaaS: Median **2–5 %**, gut **3–5 %**, exzellent **8–12 %** (First Page Sage, ChartMogul). 25 % <2.5 %.
- Dev-Tools mit Per-Resource-Gate (Vercel, Plausible) erreichen **6–9 %**, weil Repo #2 echten Geschäftsbedarf signalisiert.
- **PRD-Annahme 0–3 % konservativ-realistisch.** Sub-1.5 % macht ARPU vom Sprint-Revenue ($4.5k) abhängig, nicht PLG. **Severity: Mid.**

## 3. Recommendation für VK Dashboard

**Free Tier (`Solo Free`):** **1 Repo**, voller Audit, persistierte Scans, **30 Tage Retention**, 20 Audit-Runs/mo (Soft-Cap mit Re-Run-Hinweis). OSS-CLI bleibt unlimitiert lokal.

**Bezahltes Upgrade — eine Empfehlung, keine zwei Optionen:**

> **$19/mo `Solo Indie`** = **3 Repos**, 50 Runs/mo, 90 Tage Retention.
> **$79/mo `Solo Pro`** = **10 Repos** + Audit-Report, 250 Runs/mo, 1 Jahr Retention.

**Begründung Repo-Pack statt Per-Repo-Add-on ($X/Repo):** Plausible/Vercel-Pattern. Pro-Repo-Pricing (à la $5/Repo) erzeugt Mental-Accounting-Friction ("brauche ich wirklich ein 6.?"); Pack-Pricing kauft Headroom und reduziert Add-Friction. Per-Repo-Pricing-Tests (Snyk-Style) korrelieren mit höherer Abandon-Rate beim Add-Flow.

**Upgrade-CTA-Placement (Plausible+Vercel-Hybrid):**
- **Hard Gate:** "Add Repository"-Button im Dashboard öffnet Modal "Du nutzt 1 von 1 Free-Repos — Upgrade auf Solo Indie ($19/mo) für 3 Repos." Sekundär-Button "Zeig mir, was Solo Pro liefert".
- **Soft Hint:** Settings-Page-Badge "Free Tier — 1/1 Repos". Niemals Audit-Output blockieren (würde Trust killen — siehe PRD-Constraint Severity-Bänder/Skeptic-Mentor).
- **Niemals:** Audit-Result-Paywall, Drift-Detection-Paywall, Export-Paywall am Free-Repo. Free-Repo bleibt **vollwertig**.

**Graceful-Limit-UX:** Beim Versuch Repo #2 → Skeptic-Voice: *"Dein zweites Repo signalisiert Geschäftsbedarf — Solo Indie kostet $19/mo, weniger als ein Stripe-Test-Charge."* Concession-then-Critique-Pattern aus Brand-Voice.

**Anti-Pattern explizit vermeiden:** Sandwich $99, Usage-Charge-Surprise (PostHog-Billing-Cap-Toggle übernehmen), Per-Repo-à-la-carte, Test-Quota-Gate (Snyk-Verwirrung).

## 4. Open Questions für Founder

1. Free-Repo retention 30d (vorgeschlagen) vs **forever** wie Plausible-Site-bleibt-historisch? — Forever ist Trust-stärker, kostet nur Storage.
2. Billing-Cap-Toggle ab Phase 1 oder erst Phase 2? — Phase 1 reicht, da Tier-Caps fix sind.

**Sources:** [Plausible pricing](https://plausible.io/pricing), [Vercel Pro docs](https://vercel.com/docs/plans/pro-plan), [Sentry pricing](https://sentry.io/pricing/), [Linear pricing](https://linear.app/pricing), [PostHog pricing](https://posthog.com/pricing), [Snyk plans](https://snyk.io/plans/), [First Page Sage 2026 Freemium Report](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/), [Monetizely Dev-Tool-Pricing](https://www.getmonetizely.com/articles/how-to-price-code-quality-and-developer-tools-feature-gating-strategies-for-technical-saas-products).
