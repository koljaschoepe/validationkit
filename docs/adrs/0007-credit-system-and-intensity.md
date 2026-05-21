---
id: 0007
title: Credit-System + Quick/Deep-Intensity statt Modell-Namen-UX
status: accepted
date: 2026-05-21
---

# ADR-0007 — Credit-System + Quick/Deep-Intensity

> Datum: 2026-05-21
> Status: ✅ Accepted
> Entscheider: User-Decisions Q3.1 + Q4.1 (siehe `docs/plans/saas-pricing-redesign.md` §2)

---

## Kontext

Der SaaS-Pricing-Redesign (Master `saas-pricing-redesign`, Sub-Plan-A) tauscht die alte
„Runs pro Monat"-Quota gegen ein **Credit-System** und führt eine
**Intensity-Wahl** beim Audit-Trigger ein. Die Hintergründe:

1. **Cost-Pass-Through erlaubt nicht „Flatrate × N":** Audit-Cost variiert
   nach Modell (Sonnet 4.6 ≈ 9 c, GPT-5-nano ≈ 0.07 c bei 15k/3k Tokens) und
   Cache-Hit-Rate. Ein einziger „audits/month"-Wert verbirgt Marge-Volatilität.
2. **Modell-Namen sind eine schlechte Customer-UX:** „GPT-5-nano vs Sonnet 4.6"
   ist niemandes Mental-Model bei einer Audit-Plattform. Cursor-Skandal
   (Juni 2025) zeigt, dass intransparente Modell-Verbrauchs-Mathe Reputation
   verbrennt.
3. **ADR-0005** legte Anthropic primär + OpenAI Fallback fest, ohne Quality-
   /Cost-Tradeoff-Knob.

## Entscheidung

**Two-Knob-System.**

### Credit
Die Workspace-Quota wird in **Credits** ausgedrückt:

| Tier    | Credits / Cycle |
|---------|-----------------|
| Free    | 3 (Lifetime, no reset) |
| Starter | 50 / month      |
| Pro     | 300 / month     |
| Agency  | 1500 / month    |

Overage wird zum Stripe-Meter-Rate **€0.30/Credit** abgerechnet (Sub-Plan-B).
Pre-Paid-Packs (100 = €25, 500 = €99) sind separat kaufbar und verfallen
nach 12 Monaten.

### Intensity
Beim Audit-Trigger wählt der Nutzer **Quick** oder **Deep**:

| Intensity | Credits | Model              | maxOutputTokens | Caching     |
|-----------|---------|--------------------|-----------------|-------------|
| Quick     | 1       | `gpt-5-nano`       | 4096            | impliziert  |
| Deep      | 5       | `claude-sonnet-4-6`| 8192            | `cache_control` Repo-Context (1h-TTL) |

Free-Tier zwingt Quick (UI greyed-out Deep + Upgrade-Hint).

BYOK (Sub-Plan-A `byokEnabled` Flag, Pro+) überschreibt den Provider, nicht
das Modell-Mapping.

## Begründung

- **5x-Multiplikator** matched grob die reale Cost-Ratio: Sonnet 4.6 mit
  cache_control (Annahme: 80% Cache-Hit-Rate) ≈ 3 c/Audit, GPT-5-nano ≈ 0.5 c —
  Ratio 6x. 5x verteilt Marge symmetrisch und gibt Power-User keinen Anreiz,
  Quick zu „missbrauchen".
- **Single-Pass Deep statt 2-Pass** (Master-Plan §2 Q3.1): V1 hat keinen
  Multi-Pass-Loop. Sonnet 4.6 mit `maxOutputTokens=8192` und Prompt-Caching
  liefert ausreichend Quality, ist deterministisch in Cost, und kein
  Refactor-Hot-Spot. Multi-Pass V2-Optimierung nach Beta-Daten möglich.
- **gpt-5-nano statt gpt-5-mini** (Master-Plan §2 Q3.4): 15× billiger
  ($0.20/M vs $0.75/M input), matched bestehenden Code in
  `packages/llm/src/select.ts:55`. Cost-Diff zu Sonnet+Cache (~28% nach Cache)
  ist ohnehin klein — Quality-Differenz primär bei Edge-Cases.
- **Lifetime-Cap Free statt monthly reset** (Master-Plan §2 Q3.2): klassisches
  Trial-Pattern, sauberer Conversion-Hook für Agency-Lena-Persona, vermeidet
  Free-Tier-Cost-Explosion durch monatlich neu auflebende Quota-Misuse.

## Konsequenzen

### Positiv
- Cost-Pass-Through ist sauber: `ai_usage_event.cost_microcents` × tier-rate
  → Stripe-Meter-Event mit klar attributierbarer Customer-Marge.
- Intensity ist intuitiv ("Quick" vs "Deep") — kein Modell-Naming-Bullshit.
- Free-Tier-Cost ist hart begrenzt (3 × 1 Credit × ≤1 c) ≈ 3 USD-Cent total
  pro Workspace-Lifetime.
- Pricing-Disclosure ist kommunizierbar: 1 Credit ≈ 1 Quick-Audit ≈ €0.20
  pass-through.

### Negativ / Risiken
- **Cache-Hit-Rate-Annahme:** Wenn real <50% statt 80%, schiebt sich Deep-Cost
  von 3 c auf 6 c — Marge auf €0.30/Overage-Credit wird eng. Risiko
  dokumentiert in Master-Plan §9, Mitigation = Dashboard mit 7d-Rolling-
  Cache-Hit-Rate (Sub-Plan-C).
- **gpt-5-nano-Quality bei Code-Audit:** Eval-Set fehlt. Free-Tier-User
  könnte schwächere Findings sehen. Mitigation = Quick-Tier-Tooltip
  „lighter analysis — upgrade for Deep".
- **BYOK-Quality-Mix:** BYOK-User auf Quick-Intensity nutzt sein eigenes
  GPT-5-nano-Quota, nicht unseres. `byok_flag=true` markiert die Row, Marge =
  0 in Stripe-Meter-Submission (Sub-Plan-B).

## Implementation-Notes

- `packages/billing/src/intensity.ts` ist Source-of-Truth für die
  Credit-Ratios. Tests in `intensity.test.ts`.
- `packages/llm/src/pricing.ts` ist Source-of-Truth für Per-Model-Rates.
  **Review-Trigger:** Anthropic / OpenAI Pricing-Page-Changelog ping; manuelle
  Aktualisierung. V2 = Cron-Job, der die Pricing-API zieht (Sub-Plan-V2).
- `packages/llm/src/select.ts` mappt Intensity → Modell + Provider + BYOK-
  Override. Tests in `select.test.ts` covern Happy-Path, Fallback, Disabled,
  BYOK.

## Reviews

- 2026-05-21: Pricing-Rates initial reviewed (Anthropic / OpenAI public
  pricing pages). Nächste Review beim nächsten Pricing-Change.

## Referenzen

- `docs/plans/saas-pricing-redesign.md` (Master)
- `docs/plans/saas-pricing-sub-a-db-metering.md`
- ADR-0005 (LLM Multi-Provider)
- ADR-0008 (BYOK-Key-Encryption)
