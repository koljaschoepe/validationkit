# Bundle H — Billing/Credits als Premium-Surface (NEU)

> Master: `../saas-premium-overhaul.md` · Severity: **Strong** · Effort: **M**
> Status: 🔵 Draft · Confidence: Mid · Quelle: Completeness-Critic #3

## 1. Ziel

Der Plan heißt „SaaS **Premium** Overhaul", adressierte aber NULL am Geld-/Wert-Erlebnis. Für eine 200+€/Monat-Latte wird Premium maßgeblich am **Bezahl-Touchpoint** entschieden: Credit-Pack-Modal, Usage-Meter-Transparenz, Upgrade-Pfad, Rechnungs-/Quota-States.

## 2. Discovery-Entscheidungen (offen)

- Reconciliation mit `frontend-pre-ga-polish.md` (BuyCreditPackModal-Mount) + `saas-pricing-redesign` (done) — was existiert schon, was fehlt an Politur?
- Usage-Meter: Live-Verbrauch vs. Abrechnungs-Periode — welche Darstellung?

## 3. Vorgeschlagene Richtung (Hypothese)

- Billing-Settings-Page als premium Surface: klarer Plan-Status, Credit-Stand mit Heat/Trend, „Buy more"-Pfad ohne Reibung, transparente Usage-Breakdown.
- Empty-/Error-/Quota-exceeded-States handlungsleitend (deutsch).

## 4. ⚠️ Scope-Achtung

Berührt potenziell Stripe-/Billing-Logik → falls Backend/Schema nötig, **eigenes Plan-File mit DB-Migration-Sektion** (Constraint). Reiner UI-/Copy-Polish ist safe; Geld-Pfad-Änderungen NICHT über Nacht autonom.

## 5. Out-of-Scope

Stripe-Tier-/Preis-Änderungen · Webhook-Logik · alles am Live-Geld-Pfad ohne separaten Plan.
