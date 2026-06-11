# S2 — Payments & Credit-Ledger-Integrität · Second-Opinion Audit · 2026-06-10
Modell: Fabel 5 · Methode: static + targeted dynamic (real local Postgres) · read-only

## Threat-Model & In-Scope-Annahmen
**Angreifer / Akteure:**
- Zahlender Tenant-User, der den Geldpfad missbraucht (Free-Compute erschleichen, Overage konsumieren ohne zu zahlen).
- Nebenläufige Requests desselben Users (TOCTOU auf dem Credit-Pool).
- Stripe selbst als unzuverlässiger Zustellkanal (Duplikate, Out-of-Order, verspätete/verlorene Events).
- Böswilliges Nicht-Owner-Mitglied, das billing-relevante Schalter umlegt.

**Kronjuwelen:**
- Stripe-Geldpfad (Checkout → Subscription → Invoice → Credit-Grant → Overage-Metering → Invoice-Line).
- Interne Credit-Ledger-Buchhaltung (append-only, denormalisiertes `balance_after`-Invariant).
- Korrekte Leistungs-Erfüllung pro bezahltem Tier×Cycle (kein Geldverlust, keine Doppel-Belastung, keine Unter-Lieferung).

**In-Scope:** `api/stripe/webhook/route.ts`, `@vk/billing/credits.ts` + `subscription.ts` + `tiers.ts`, `audit-action.ts` (Reservierung/Verbrauch), `stripe-meters.ts`, `credit-aggregator.ts` (Flush + Cron), `prepaid-credit-expirer.ts`, `stripe-reconcile.ts`, `billing-actions.ts` (Checkout), `byok-crypto.ts`, `scripts/stripe-test-setup.ts`.

**Explizit out-of-scope (Known-Issues, nicht erneut gemeldet):** S3-01 (Webhook markiert Event vor Verarbeitung als gesehen → transienter Fehler verliert Event); Auth-IDOR `customers.ts`; `invoice.paid` liest entfernten `invoice.subscription` (Bundle B — hier bereits via `subscriptionIdFromInvoice` mit dahlia-Pfad gefixt, verifiziert); Auto-Overage `allowOverage`-Durchreichung (Bundle B — hier bereits live durchgereicht); pgvector. Live-Stripe-KYC und Domain sind User-extern.

**Dynamik-Constraints dieser Session:** Lokaler Stack lief (vk-postgres mit `validationkit` [19/19 Migrationen] + `validationkit_test` [16/19 Migrationen]). Stripe-CLI **nicht installiert** → kein echter `stripe trigger invoice.paid`. Der Monats-Grant wurde deshalb durch **direkte Funktions-Invokation gegen die echte Dev-DB** (Schema-Parität mit Prod) verifiziert, nicht durch einen End-to-End-Webhook-Roundtrip.

## Findings (Übersicht)
| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S2-01 | Kill | yes | Jahres-Abo erhält nur EINEN Cycle Credits für 12 Monate (1/12 der beworbenen Menge) | apps/web/src/app/api/stripe/webhook/route.ts:349-354 | verified |
| S2-02 | Weak | no | Credits werden NACH dem teuren LLM-Call verbraucht, nicht vorher reserviert → nebenläufige Requests verbrennen uneinbringliche AI-Kosten | apps/web/src/lib/audit-action.ts:351-366 | verified |
| S2-03 | Weak | no | Overage-Metered-Price nie an Subscription gehängt + `ai_markup` nie emittiert → konsumierte Overage ist unbillbar, AI-Kosten ungedeckt | apps/web/src/lib/billing-actions.ts:73 / credits.ts:220-229 | verified |
| S2-04 | Weak | no | `spendCapMicrocents` wird gespeichert, aber nirgends durchgesetzt → Auto-Overage ist effektiv unbegrenzt | apps/web/src/lib/workspace-ai-actions.ts:116-122 | verified |
| S2-05 | Weak | no | Verlorener `invoice.paid` (S3-01) wird von keinem Reconcile-Pfad geheilt → fehlende Monats-Credits sind permanent & unsichtbar | packages/inngest/src/functions/stripe-reconcile.ts:107-110 | verified |
| S2-06 | Mid | no | Auto-Overage-Schalter ist für jedes aktive Mitglied (nicht owner-gated) umlegbar → Nicht-Owner kann zahlungswirksamen Modus aktivieren | apps/web/src/lib/workspace-ai-actions.ts:99-113 | verified |

## Findings (Detail)

### S2-01 · Jahres-Abo erhält nur EINEN Cycle Credits für 12 Monate · Kill · go-live-blocker: yes
- **Evidenz:** `apps/web/src/app/api/stripe/webhook/route.ts:349-354`
  ```ts
  await grantCredits({
    workspaceId,
    amount: row.creditsQuotaPerCycle, // = TIERS[tier].creditsPerCycle, cycle-agnostisch
    reason: "monthly_grant",
    referenceId: invoice.id ?? null,
  });
  ```
  `creditsQuotaPerCycle` wird in `applyTierToWorkspace` (route.ts:445) ausschließlich aus `TIERS[tier].creditsPerCycle` gesetzt — der Billing-Cycle (`monthly`/`annual`) fließt nirgends ein. `tiers.ts` definiert z.B. Starter = 50 `creditsPerCycle`. Annual ist über `pricing/page.tsx:91` + `billing-actions.ts:39` (`createCheckoutSession(tier, cycle)`) + `priceIdFor(tier,"annual")` voll kaufbar; `stripe-test-setup.ts` provisioniert die Annual-Prices.
- **Impact/Exploit-Pfad:** Stripe stellt pro Abrechnungs-Intervall **eine** Rechnung; bei `annual` feuert `invoice.paid` also **einmal pro Jahr**. Ein Annual-Starter zahlt ~278 € (12×29 €×0,8) und bekommt **50 Credits für 12 Monate**, während ein Monthly-Starter 348 €/Jahr zahlt und 50×12 = 600 Credits erhält. Das Jahres-Abo ist billiger UND liefert 1/12 der beworbenen Leistung. Die Pricing-Seite bewirbt explizit „50 credits / month" + „≈ X / month, billed annually" (page.tsx:137) — eine zahlende Kundengruppe wird auf einem kaufbaren Pfad systematisch um 92 % unterversorgt.
- **Confidence:** high
- **Verifikation:** verified — Widerlegungs-Fragen: (1) „Sendet Stripe `invoice.paid` für Jahres-Abos monatlich?" → Nein, einmal pro Jahres-Intervall. (2) „Gibt es eine Annual-spezifische 12×-Credit-Logik?" → Nein, `applyTierToWorkspace` ist cycle-agnostisch; `grantCredits` bekommt nur `creditsQuotaPerCycle`. (3) „Ist `creditsPerCycle` als Jahres-Allotment gemeint?" → Nein, Pricing sagt „/ month". Alle Widerlegungen scheitern.
- **Launch-Block-Begründung:** Bezahlende Kunden auf einem buchbaren Tier×Cycle erhalten 1/12 der zugesicherten Leistung → garantierte Refund-/Chargeback-Welle und (DACH-B2B) UWG-Risiko irreführender Preisangabe. Money-/Delivery-Defekt auf dem Geldpfad.
- **Fix-Richtung (1 Satz):** Bei `annual` entweder den Grant mit 12 multiplizieren (Jahres-Allotment up-front) ODER für Annual-Subs eine monatliche Grant-Quelle einrichten (Stripe-Subscription-Schedule / eigener Monats-Cron) — oder Annual bis zum Fix aus Checkout + Pricing entfernen.

### S2-02 · Credits werden NACH dem LLM-Call verbraucht statt vorher reserviert · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/audit-action.ts:351-366`
  ```ts
  const report = await runAudit(probe, { includeLLM: true, ... }); // teuer, bezahlt AI-Kosten
  const credits = creditsForIntensity(actor.intensity);
  const consume = await consumeCredits({ workspaceId, amount: credits, ... }); // ERST hier reserviert
  if (!consume.allowed) { /* scan failed, Fehler — aber LLM-Kosten sind schon weg */ }
  ```
  Die Vorab-Prüfung `canConsume` (audit-action.ts:128) ist **read-only** (kein `FOR UPDATE`, keine Reservierung).
- **Impact/Exploit-Pfad:** Ein User mit 1 Credit feuert N nebenläufige Audits. Alle N passieren die nicht-reservierende `canConsume`-Vorprüfung, alle N laufen den teuren LLM-Call (das Unternehmen zahlt N× AI-Kosten, geloggt in `ai_usage_event`), erst danach serialisiert `consumeCredits` per `SELECT … FOR UPDATE` → 1 Verbrauch gelingt, N-1 schlagen fehl und markieren den Scan `failed`. Der Ledger bleibt korrekt (nur 1 Credit belastet), aber das Unternehmen hat N Audits real bezahlt und nur 1 eingenommen. Cost-Amplification, durch Rate-Limit (Free 30/h) gedeckelt, aber innerhalb des Fensters parallelisierbar.
- **Confidence:** high
- **Verifikation:** verified — (1) „Reservierung/Lock vor `runAudit`?" → Nein, nur read-only `canConsume`. (2) „Verhindert Rate-Limit Nebenläufigkeit?" → Es deckelt Requests/Stunde, nicht Gleichzeitigkeit innerhalb des Fensters. (3) „Wird der AI-Call bei fehlgeschlagenem Consume wirklich bezahlt?" → Ja, `runAudit` läuft vollständig vor `consumeCredits`. Der TOCTOU-Pool-Guard selbst funktioniert dynamisch (siehe Positiv-Befund), die Schwäche ist die **Reihenfolge** (reserve-after-run).
- **Fix-Richtung (1 Satz):** Vor dem LLM-Call atomar reservieren (Credit dekrementieren in einer Transaktion) und bei Audit-Fehler refunden — reserve-then-run statt run-then-charge.

### S2-03 · Overage-Metered-Price nie an Subscription gehängt; `ai_markup` nie emittiert · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/billing-actions.ts:73` (+ :183) erzeugt die Subscription ausschließlich mit dem lizenzierten Tier-Preis:
  ```ts
  line_items: [{ price: priceId, quantity: 1 }], // nur der Tier-Preis, kein metered item
  ```
  `meterPriceIdFor('overage')` / `STRIPE_PRICE_OVERAGE_CREDIT_EUR` hat **null Consumer** außerhalb von `stripe.ts` (grep bestätigt). `markupMicrocents` ist an beiden Schreibstellen hartkodiert `0` (audit-action.ts:390, audit-requested.ts:102); `submitMeterEvent(kind:'ai_markup')` wird nirgends produktiv aufgerufen.
- **Impact/Exploit-Pfad:** Der Overage-Pfad ist live: `consumeCredits` schreibt bei gedrainter Quota + `allowOverage` eine `reason='overage'`-Ledger-Zeile (credits.ts:220-229), der Cron/Flush (`credit-aggregator.ts`) sendet dafür Stripe-Meter-Events. Aber da der metered Price nie als Subscription-Item hängt, erzeugt Stripe **keine Rechnungs-Zeile** aus diesen Meter-Events → konsumierte Overage-Audits werden nie berechnet, obwohl die Pricing-FAQ „€0.30 each via Stripe" verspricht (pricing/page.tsx:241). Das Unternehmen trägt die AI-Kosten der Overage-Läufe ohne Gegenfinanzierung; die `ai_markup`-Umsatzschiene ist komplett toter Code.
- **Confidence:** mid (Code-Pfad sicher verifiziert; die Billing-Folge stützt sich auf Stripe-Standardsemantik „Meter-Usage ohne Subscription-Item wird nicht fakturiert", die ich ohne Live-Stripe-CLI nicht dynamisch bestätigen konnte).
- **Verifikation:** verified (Code) — (1) „Wird der metered Price beim Checkout angehängt?" → Nein. (2) „Im Webhook bei `subscription.created`?" → Nein, `handleSubscriptionUpdated` mutiert nur die DB. (3) „Irgendwo sonst (`subscriptions.update`/`items.create`)?" → grep: keine Treffer. go-live-blocker: no, weil `autoOverageEnabled` per Default `false` ist — **wird Kill, sobald ein Kunde Auto-Overage aktiviert** (uneinbringlicher, ungedeckelter AI-Aufwand, siehe S2-04).
- **Fix-Richtung (1 Satz):** Den metered Overage-Price beim Checkout/Subscription als zweites Subscription-Item anhängen (oder Overage-FAQ + Toggle bis zum Fix entfernen) und die `ai_markup`-Emission verdrahten oder die Meter/FAQ entfernen.

### S2-04 · `spendCapMicrocents` gespeichert, aber nie durchgesetzt · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/workspace-ai-actions.ts:116-122` (`setSpendCap` schreibt das Feld) — aber grep über `apps/web` + `packages/*` zeigt `spendCap*` nur in Schema (schema.ts:566), Snapshot (subscription.ts:99) und der UI; **keine Gate-Stelle** vergleicht je verbrauchte/projizierte Kosten gegen den Cap.
- **Impact/Exploit-Pfad:** Die UI verspricht eine Ausgaben-Obergrenze. Da sie nirgends ausgewertet wird, läuft Auto-Overage unbegrenzt weiter, auch wenn der Kunde einen Cap gesetzt hat. In Kombination mit S2-03 (Overage wird nicht berechnet) heißt das: ungedeckelter, uneinbringlicher AI-Aufwand auf Unternehmenskosten.
- **Confidence:** high
- **Verifikation:** verified — (1) „Liest irgendein Audit-/Consume-Gate den Cap?" → Nein, nur gespeichert/angezeigt. (2) „Setzt Stripe ihn durch?" → Nein, kein Stripe-Budget verdrahtet. (3) „Anderer Cron?" → Keiner referenziert das Feld.
- **Fix-Richtung (1 Satz):** Im Pre-Audit-Gate (`canConsume`/`resolveActor`) die laufenden Periodenkosten gegen `spendCapMicrocents` prüfen und Overage hart stoppen — oder das Cap-Feld aus der UI nehmen.

### S2-05 · Verlorener `invoice.paid` wird von keinem Reconcile-Pfad geheilt · Weak · go-live-blocker: no
- **Evidenz:** `packages/inngest/src/functions/stripe-reconcile.ts:107-110`
  ```ts
  const tierDrift = !dbRow || dbRow.tier !== tier;
  const statusDrift = !dbRow || dbRow.status !== sub.status;
  if (!tierDrift && !statusDrift) continue; // nur Tier/Status — Credits werden NIE abgeglichen
  ```
- **Impact/Exploit-Pfad:** Neuer Aspekt zu S3-01 (Event wird vor Verarbeitung als gesehen markiert): Schlägt `handleInvoicePaid` transient fehl (DB-Hiccup nach dem `stripe_event`-Insert), ist der Monats-Grant verloren. Ein manueller Stripe-Resend desselben `event.id` wird vom `stripe_event`-PK geblockt; der sekundäre Grant-Idempotenz-Index (`credit_ledger_monthly_grant_idem_idx`) würde einen Replay ohnehin als No-op behandeln. **Kein Selbstheilungs-Pfad** existiert: `stripe-reconcile` prüft nur Tier/Status, nie fehlende Credit-Grants; `prepaid-credit-expirer` nur Ablauf. Der zahlende Kunde sitzt für den Cycle ohne seine bezahlten Credits, und niemand bemerkt es.
- **Confidence:** mid
- **Verifikation:** verified — (1) „Re-granted ein Cron fehlende Monats-Credits?" → Nein. (2) „Kann ein Operator per Replay heilen?" → Nein (event-PK + Grant-Idempotenz blocken). (3) „Detektiert Reconcile die Lücke?" → Nein, nur Tier/Status. Als neuer Money-Aspekt zusätzlich zu S3-01 gemeldet, nicht als Dublette.
- **Fix-Richtung (1 Satz):** Reconcile um einen Credit-Grant-Abgleich erweitern (erwarteter vs. tatsächlicher `monthly_grant`-Ledger-Eintrag pro Cycle) oder S3-01 fixen (Event erst NACH erfolgreicher Verarbeitung als gesehen markieren).

### S2-06 · Auto-Overage-Schalter nicht owner-gated · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/workspace-ai-actions.ts:99-113` — `toggleAutoOverage` ruft `loadWorkspace` → `resolveWorkspaceFromSlug` (workspace-context.ts:38-51), das **jedes aktive Mitglied** (beliebige Rolle) durchlässt; kein `requireRole(['owner'])` wie beim Workspace-Delete.
- **Impact/Exploit-Pfad:** Ein einfaches `member` (nicht der Owner, der die Karte hinterlegt hat) kann zahlungswirksames Auto-Overage aktivieren und damit Kosten auf dem Tenant auslösen. Tenant-intern (kein Cross-Tenant-Leak), daher Mid statt Kill — aber Billing-Schalter gehören owner/admin-gated.
- **Confidence:** high
- **Verifikation:** verified — (1) „Owner-Gate vorhanden?" → Nein, nur Membership. (2) „Cross-Tenant?" → Nein, `resolveWorkspaceFromSlug` scoped korrekt auf Tenant. (3) „Anderer Guard upstream?" → Keiner. Bleibt drin als Mid (interne Privilege-Schwäche).
- **Fix-Richtung (1 Satz):** `toggleAutoOverage`/`setSpendCap`/`updateByokSettings` auf `requireRole(workspaceId, userId, ["owner","admin"])` heben.

## Positiv-Befunde (Strong / Exceptional — verifiziert)
- **`consumeCredits` Double-Spend-Guard (Exceptional).** `SELECT … FOR UPDATE` auf der Subscription-Zeile + Ledger-Insert in einer Transaktion (credits.ts:121-209). **Dynamisch gegen echte Postgres verifiziert:** bei Quota=1 und zwei parallelen `consumeCredits(1)` gewann genau einer (`c1.allowed=true, c2.allowed=false`), `creditsUsedThisPeriod` landete exakt auf 1. Kein Double-Spend.
- **Monats-Grant-Idempotenz (Strong).** **Dynamisch gegen die Dev-DB (19/19 Migrationen, Prod-Parität) verifiziert:** erster `grantCredits('monthly_grant', ref=invoice)` resettet `creditsUsedThisPeriod→0` und schreibt eine Ledger-Zeile (balance 50); ein Replay mit demselben `referenceId` ist dank `credit_ledger_monthly_grant_idem_idx` + bare `onConflictDoNothing` ein No-op (weiterhin 1 Zeile, balance 50).
- **Webhook-Idempotenz (Strong).** `stripe_event`-PK-Upsert mit `onConflictDoNothing` + früher `duplicate:true`-Return (route.ts:104-116) fängt echte Stripe-Retries des gleichen `event.id`.
- **Prepaid-Pack-Idempotenz (Strong).** `prepaid_credit_grant.stripeInvoiceId UNIQUE` + `onConflictDoNothing` → Ledger-Grant nur bei echtem Insert (route.ts:540-560).
- **Meter-Event-Doppel-Dedupe (Strong).** Stripe-seitiger `identifier` (= `credit_ledger.id`) + `stripe_meter_event_log`-Pre-Flight (stripe-meters.ts:41-71) schützen gegen Doppel-Flush, auch wenn Cron + `invoice.created`-Flush denselben Row gleichzeitig greifen.
- **BYOK-Crypto (Strong).** AES-256-GCM mit 96-bit-IV, 32-byte-Key-Validierung, AuthTag (byok-crypto.ts) — solide Column-Encryption.

## Geprüft & verworfen (refuted)
| Vermutung | Warum verworfen |
|-----------|-----------------|
| `invoice.paid` liest entfernten `invoice.subscription` (alter Bundle-B-Kill) | Bereits gefixt: `subscriptionIdFromInvoice` (route.ts:504-513) liest zuerst den dahlia-Pfad `parent.subscription_details.subscription`, Fallback Legacy. Code-verifiziert. |
| `allowOverage` wird nicht durchgereicht (alter Known-Issue) | Bereits live: Vorprüfung (audit-action.ts:128) und `consumeCredits` (366) reichen `actor.autoOverageEnabled` durch; Background-Pfad liest es frisch (audit-requested.ts:73-85). |
| Doppelter Cycle-Reset in `handleInvoicePaid` (route.ts:344 + grantCredits intern) verfälscht den Saldo | Harmlos: beide setzen `creditsUsedThisPeriod=0`; `grantCredits` berechnet `balance_after` nach dem Reset korrekt. Reiner Redundanz-Cleanup, keine Finding. |
| `customer.deleted` lässt tote Stripe-Refs hängen | Bereits behandelt: `handleCustomerDeleted` (route.ts:411-428) nullt Refs + downgradet auf free, idempotent. |
| Workspace-Delete lässt Stripe weiter abrechnen | `cancelWorkspaceStripeSubscription` (workspace-actions.ts:20-41) canceled vor dem Cascade, best-effort mit Logging. |

## Completeness self-check
- **Nicht erreicht/gelesen:** Kein echter End-to-End-`stripe trigger invoice.paid`-Roundtrip — Stripe-CLI ist in dieser Env nicht installiert. Der Monats-Grant wurde per Direkt-Funktionsaufruf gegen die Prod-parität-Dev-DB statt über die HTTP-Webhook-Kante verifiziert. Das Webhook→Grant-Wiring selbst (Signatur → `subscriptionIdFromInvoice` → `grantCredits`) ist nur statisch + über die Integration-Tests abgedeckt, und **kein Integration-Test deckt den `invoice.paid`/Monats-Grant-Pfad ab** (route.integration.test.ts testet nur checkout/deleted/payment_failed).
- **Unbestätigte Annahme:** S2-03 stützt sich auf Stripe-Standardsemantik (Meter-Events ohne angehängtes Subscription-Item erzeugen keine Rechnungs-Zeile); ohne Live-Stripe konnte ich die ausbleibende Fakturierung nicht beobachten — der Code-Pfad (kein metered Item beim Checkout) ist hingegen sicher. Die `validationkit_test`-DB hängt bei 16/19 Migrationen (fehlt u.a. der Monats-Grant-Idempotenz-Index) — Schema-Drift gehört in S3-Scope, beeinflusst aber, dass die Integration-Suite eine Grant-Idempotenz-Regression nicht fangen würde.
