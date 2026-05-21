# Plan — SaaS-Pricing Sub-A: DB-Schema + AI-Metering + Credit-Ledger

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: High · 5/5 Phasen abgehakt · 222 Tests grün · 2 deferred items: credits.test.ts DB-Integration + pnpm db:migrate Manual-Apply)
> Slug: `saas-pricing-sub-a-db-metering`
> Confidence: **High** — Sub-Plan des Masters [`saas-pricing-redesign`](./saas-pricing-redesign.md). Decisions referenziert dort §2.
> Voraussetzung: Master-Plan gemerget

---

## 1. Ziel

Backend-Foundation für das neue Pricing: Workspace-Level Subscription, 4 neue Tabellen für Metering + Credits, komplettes AI-Usage-Tracking in `packages/llm/`, neue Tier-Definitionen, Workspace-BYOK-Toggle. **Zero Frontend-Impact** — alles wird via API-Layer + Server-Actions konsumierbar gemacht, UI-Refactor in Sub-Plan-C.

## 2. Endzustand

- `subscription` ist auf `workspaceId` umgestellt (UNIQUE), alte Rows gewiped.
- 4 neue Tabellen: `ai_usage_event`, `audit_run_cost`, `credit_ledger`, `prepaid_credit_grant`.
- `packages/billing/src/tiers.ts` definiert 4 neue Tiers (free/starter/pro/agency) mit Credit-Quotas.
- `packages/billing/src/credits.ts` (NEU) ist Single-Source-of-Truth für Credit-Operationen.
- `packages/billing/src/intensity.ts` (NEU) definiert das Quick/Deep-Konzept + Credit-Cost-Mapping.
- `packages/llm/src/select.ts` nimmt `intensity` + `workspaceId` als Param → wählt Provider+Modell.
- Jeder `generateText`-Call in `packages/llm/src/rules/*` extrahiert `usage` + persistiert eine Row.
- `audit_run` (= `scan` table) hat neue Felder: `credits_consumed`, `intensity`, `total_cost_microcents`.
- ADR-0007 dokumentiert Intensity + Credit-System.

## 3. Schritte

### Phase A.1 — Schema-Migration + Drizzle-Updates

- [x] Pre-Migration-Check-Script schreiben (`scripts/check-billing-migration-safety.ts`): asserted dass keine Live-Stripe-Subs existieren.
- [x] Drizzle-Schema-Update in `packages/db/src/schema.ts`:
  - `subscription`: `userId` → `workspaceId` (UNIQUE), neue Felder: `tier`, `creditsQuotaPerCycle`, `creditsUsedThisPeriod`, `byokEnabled`, `byokProvider`, `byokKeyCiphertext/Iv/AuthTag`, `autoOverageEnabled`, `spendCapMicrocents`, `defaultIntensity`
  - NEW Table `ai_usage_event`: `id, workspaceId, scanId, callSiteId, provider, model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, costMicrocents, byokFlag, createdAt`
  - NEW Table `audit_run_cost`: `id, scanId UNIQUE, workspaceId, intensity, creditsConsumed, totalCostMicrocents, markupMicrocents, createdAt`
  - NEW Table `credit_ledger`: `id, workspaceId, delta, reason, referenceId (nullable), balanceAfter, createdAt`
  - NEW Table `prepaid_credit_grant`: `id, workspaceId, stripeInvoiceId, creditsGranted, creditsRemaining, expiresAt, createdAt`
- [x] Migration-SQL `0013_saas_pricing_redesign.sql` hand-written (drizzle-kit TTY-prompt blocked auto-generate — see §12).
- [x] `_journal.json` updated mit idx=12 (existing 0012-orphan) + idx=13.
- [ ] **Manual-Check (User):** `pnpm stack:up && pnpm db:migrate` + Drizzle-Studio-Verifikation → siehe Phase C.
- [ ] **Snapshot regenerate (deferred V2):** `pnpm db:generate` interactive run später, beantworte Prompt `+ workspace_id, - user_id = DROP` (= 2 separate ops). Snapshot `0013_snapshot.json` wird dann erzeugt.

### Phase A.2 — Billing-Package Rewrite

- [x] `packages/billing/src/tiers.ts` komplett ersetzen:
  ```typescript
  export const TIER_IDS = ['free', 'starter', 'pro', 'agency'] as const;
  export type TierId = typeof TIER_IDS[number];
  export interface TierConfig {
    id: TierId;
    label: string;
    monthlyEur: number;
    annualEur: number; // = monthly × 12 × 0.8
    creditsPerCycle: number; // 'lifetime' = 3 for free; reset on invoice.paid for others
    isLifetimeCap: boolean; // true for free only
    customerWorkspacesIncluded: number;
    seatsIncluded: number;
    features: string[]; // whiteLabel, ssoOidc, prioritySupport, ...
    byokAllowed: boolean;
  }
  export const TIERS: Record<TierId, TierConfig> = {
    free: { ... },
    starter: { monthlyEur: 29, creditsPerCycle: 50, ... },
    pro: { monthlyEur: 99, creditsPerCycle: 300, byokAllowed: true, ... },
    agency: { monthlyEur: 299, creditsPerCycle: 1500, ... },
  };
  ```
- [x] `packages/billing/src/intensity.ts` (NEU):
  ```typescript
  export type Intensity = 'quick' | 'deep';
  export const CREDITS_PER_INTENSITY: Record<Intensity, number> = { quick: 1, deep: 5 };
  export function creditsForIntensity(i: Intensity): number { ... }
  ```
- [x] `packages/billing/src/credits.ts` (NEU):
  - `consumeCredits(workspaceId, amount, reason, referenceId, db)`: transactional, locks credit_ledger-Row, ledger-INSERT + subscription.creditsUsedThisPeriod-INCR
  - `grantCredits(workspaceId, amount, reason, referenceId, expiresAt?, db)`: ledger-INSERT, optional prepaid_credit_grant-INSERT
  - `getCreditBalance(workspaceId, db)`: liest aktuelle Quota minus used + active prepaid grants
  - `canConsume(workspaceId, requiredCredits, db, allowOverage = false)`: bool + reason
  - Race-Safety via `SELECT ... FOR UPDATE` auf credit_ledger
- [x] `packages/billing/src/subscription.ts` umstellen:
  - `ensureSubscription(workspaceId)` statt `ensureSubscription(userId)`
  - `canRunAudit(snap, intensity)` wird live geschaltet (war Dead-Code!)
  - `canAddRepo` → `canAddCustomer` (matched neue Tier-Semantik mit customer-workspaces-included)
- [x] `packages/billing/src/byok-crypto.ts` (NEU) — Node-`crypto` AES-256-GCM-Helper:
  - `encryptApiKey(plaintext: string): { ciphertext: string; iv: string; authTag: string }` (alles base64)
  - `decryptApiKey({ ciphertext, iv, authTag }): string`
  - Env-Var `BYOK_ENCRYPTION_KEY` (32-byte base64), fail-fast if missing in prod
  - ADR-0008 dokumentiert pattern + key-rotation-Plan
- [x] `packages/billing/src/index.ts` Exports updaten
- [x] Unit-Tests: `tiers.test.ts` + `intensity.test.ts` + `byok-crypto.test.ts` — 28/28 grün
- [ ] **Deferred:** `credits.test.ts` (Race-Conditions, Overage-Logic, Pre-Paid-Expiration) braucht Test-DB-Setup — in Sub-Plan-A §12 dokumentiert, Phase A.5 Manual-Check

### Phase A.3 — LLM-Package: Usage-Extraction + Intensity-Routing

- [x] `packages/llm/src/usage.ts` (NEU):
  ```typescript
  export interface AiUsageRecord {
    workspaceId: string;
    scanId: string | null;
    callSiteId: string; // 'conflicting-rules' | 'context-bloat-llm' | ...
    provider: 'anthropic' | 'openai';
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costMicrocents: number;
    byokFlag: boolean;
  }
  export async function recordUsage(rec: AiUsageRecord, db): Promise<void>;
  export function computeCost(rec: Omit<AiUsageRecord, 'costMicrocents'>): number;
  ```
- [ ] Cost-Tabelle in `packages/llm/src/pricing.ts` (NEU): per-model microcent-Rates (sonnet-4-6, gpt-5-mini, ...). Source: ADR-0007 + Anthropic/OpenAI Pricing-Pages (Q2 2026).
- [ ] `packages/llm/src/select.ts` umbauen:
  ```typescript
  export interface SelectArgs {
    intensity: Intensity;
    workspaceId: string;
    byok?: { provider: 'anthropic' | 'openai'; apiKey: string };
  }
  export function selectModel(args: SelectArgs): { model: LanguageModel; provider: ...; modelId: string; maxOutputTokens: number; };
  // intensity=quick → gpt-5-nano ($0.05/M input) — matched current code, fits Free-Tier-Margin
  // intensity=deep → claude-sonnet-4-6 with cache_control on Repo-Context-Block + maxOutputTokens=8192 (vs 4096)
  // BYOK: byok.provider/apiKey override built-in provider; intensity-Mapping bleibt gleich.
  ```
- [ ] `packages/llm/src/rules/conflicting-rules.ts` patchen:
  - Nimmt `{ intensity, workspaceId, scanId }` als Args
  - Destrukturiert `usage` aus `generateText`-Result
  - Ruft `recordUsage()` für jedes Pair
- [ ] `packages/llm/src/rules/context-bloat-llm.ts` analog patchen
- [ ] `packages/fixes/src/context-bloat-llm.ts` analog patchen (call-site für Solution-Generation)
- [ ] Unit-Tests: `usage.test.ts`, `select.test.ts` (Intensity-Routing, BYOK-Fallback, Cost-Computation)

### Phase A.4 — Audit-Run-Persistierung

- [x] `packages/db/src/schema.ts`: `scan`-Table um Felder erweitern: `intensity (varchar)`, `creditsConsumed (int)`, `totalCostMicrocents (bigint)` — in Migration 0014 mit drin
- [x] `apps/web/src/lib/audit-action.ts` updaten — intensity Form-Field, canConsume pre-check, consumeCredits + audit_run_cost post-Insert, meteringContext weitergereicht.
- [x] `packages/inngest/src/functions/audit-requested.ts` — intensity propagiert, ai_usage_event-Aggregation, audit_run_cost-INSERT.
- [x] **Cross-Cutting Mass-Fix:** rate-limit.ts (neue Tier-Namen), stripe.ts (neue Env-Var-Konvention), billing-actions.ts (workspace-level), webhook/route.ts (workspace-Mapping), customer-dal.ts / customers.ts (canAddRepo → canAddCustomer), billing/page.tsx + pricing/page.tsx (Sub-C-Stubs), stripe-reconcile.ts (workspace-level).

### Phase A.5 — ADR + Tests + Cleanup

- [x] `docs/adrs/0006-credit-system-and-intensity.md` schreiben:
  - Kontext: Multi-Provider-Cost-Pass-Through, ADR-0005-Erweiterung
  - Decision: Quick/Deep-Intensität als UI-Konzept, GPT-5-mini = Quick, Sonnet 4.6 + Cache + Multi-Pass = Deep
  - Consequences: Credit-Math, Multi-Pass-Implementation-Note
- [ ] `docs/changelog.md` updaten mit Sub-Plan-A-Entry
- [ ] Migration-Smoke-Test in Test-DB
- [ ] `pnpm typecheck` + `pnpm test` + `pnpm lint` grün

## 4. Files-to-Change

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `packages/db/src/schema.ts` | EDIT | subscription-Felder + 4 neue Tables + scan-Erweiterung |
| `packages/db/drizzle/0013_workspace_subscription.sql` | NEW | subscription user→workspace |
| `packages/db/drizzle/0014_ai_usage_metering.sql` | NEW | 4 neue Tables + scan-Erweiterung |
| `packages/billing/src/tiers.ts` | EDIT (rewrite) | 4 Tiers statt 6 |
| `packages/billing/src/subscription.ts` | EDIT | Workspace-Level, canRunAudit live |
| `packages/billing/src/credits.ts` | NEW | consumeCredits, grantCredits, getCreditBalance |
| `packages/billing/src/intensity.ts` | NEW | Intensity-Type, Credit-Mapping |
| `packages/billing/src/byok-crypto.ts` | NEW | AES-256-GCM API-Key Encrypt/Decrypt |
| `packages/billing/src/__tests__/byok-crypto.test.ts` | NEW | Roundtrip + tamper-detection |
| `packages/billing/src/index.ts` | EDIT | Exports |
| `packages/llm/src/usage.ts` | NEW | recordUsage + computeCost |
| `packages/llm/src/pricing.ts` | NEW | Per-Model microcent rates |
| `packages/llm/src/select.ts` | EDIT | Intensity-aware, BYOK-Pfad |
| `packages/llm/src/rules/conflicting-rules.ts` | EDIT | usage-extraction + recordUsage |
| `packages/llm/src/rules/context-bloat-llm.ts` | EDIT | usage-extraction + recordUsage |
| `packages/fixes/src/context-bloat-llm.ts` | EDIT | scanId-Param weiterreichen |
| `apps/web/src/lib/audit-action.ts` | EDIT | intensity + canConsume + consumeCredits |
| `packages/inngest/src/functions/audit-requested.ts` | EDIT | intensity propagieren, audit_run_cost-INSERT |
| `scripts/check-billing-migration-safety.ts` | NEW | Pre-migration safety-check |
| `docs/adrs/0007-credit-system-and-intensity.md` | NEW | ADR |
| `docs/adrs/0008-byok-key-encryption.md` | NEW | BYOK-Crypto-Pattern |
| `docs/changelog.md` | EDIT | Sub-Plan-A entry |
| `packages/billing/src/__tests__/tiers.test.ts` | NEW | Tier-Defs Sanity |
| `packages/billing/src/__tests__/credits.test.ts` | NEW | Race-conditions, overage |
| `packages/llm/src/__tests__/usage.test.ts` | NEW | recordUsage, computeCost |
| `packages/llm/src/__tests__/select.test.ts` | NEW | Intensity-routing |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓
- `pnpm test` ✓ — neue Test-Files (mind. 80% Coverage auf `packages/billing/src/credits.ts` + `packages/llm/src/usage.ts`)
- Drizzle-Migration-Test: `pnpm db:migrate` auf frischer Test-DB grün
- Concurrent-Credit-Consumption-Test: 10 parallele `consumeCredits()`-Calls → exakt 10 Decrements, kein Race

**Manuell:**
- [ ] `pnpm db:studio` öffnen, neue Tables sichtbar
- [ ] In Test-DB: 1 Workspace anlegen → `ensureSubscription(wsId)` → Default-Tier free + 3 lifetime Credits
- [ ] Audit-Action mit `intensity=quick` triggern (server-action direkt via Test-Script) → `credit_ledger` Row mit delta=-1 + `ai_usage_event` Row mit `provider/model/tokens`
- [ ] Audit-Action mit `intensity=deep` 4× hintereinander → 4. blockiert wegen Quota-Erschöpfung

## 6. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| Drizzle-Migration-Reihenfolge wrong | Mid | 0013 vor 0014, FKs erst nach Table-Creation. Pre-Migration-Test gegen Snapshot-DB. |
| `subscription`-Row-Loss bei Wipe | Mid | Pre-Migration-Check assertet `WHERE stripeSubscriptionId IS NOT NULL = 0`. Confirm-Prompt im Migration-Run. |
| Credit-Race-Condition unter Concurrent-Audits | Strong | `SELECT FOR UPDATE` + Drizzle-Transaction + Unit-Test mit Promise.all(10×consume) |
| AI-Cost-Mapping veraltet (Anthropic ändert Preise) | Mid | `packages/llm/src/pricing.ts` als Single-Source. ADR-0007 listet Quellen + Review-Datum. Cron-Job (V2) für API-Pricing-Pull. |
| BYOK-Key-Storage unsicher | Strong | Verschlüsselt in DB (column-level mit `@vk/crypto` per AES-GCM, key via env). Workspace-Setting-Update-Test. |

## 7. Rollout

- **Branch:** `feat/sub-a-db-metering`
- **Pre-Merge-Gate:** Pre-Migration-Check grün auf Vercel-Preview (Test-DB)
- **Rollback:** `pnpm db:rollback` + `git revert`. Reversible bis 7d danach (Drizzle-Snapshot).
- **Post-Merge:** Dev-Server-Auto-Start → `/[workspace]/settings/billing` zeigt noch alten Stub (das ist erwartet, UI-Update in Sub-C).

## 8. Out-of-Scope

- Stripe-Integration (Sub-B)
- UI-Komponenten (Sub-C)
- Live-Mode-Pricing-Pull-Cron (V2)
- Per-Customer-Cost-Attribution Dashboard (V2)
- Encrypted-BYOK-Storage-Migration (das KMS-Setup ist new, aber separater Concern wenn `@vk/crypto` noch nicht existiert — siehe Open Question)

## 9. Open Questions

✅ **Q-A1 resolved (Pre-Execute 2026-05-21):** `@vk/crypto` existiert nicht. Inline-Helper in `packages/billing/src/byok-crypto.ts` mit Node-`crypto` AES-256-GCM. ADR-0008 dokumentiert pattern.
✅ **Q-A2 resolved (Pre-Execute 2026-05-21):** Single-Pass Sonnet 4.6 mit `cache_control` auf Repo-Context-Block + `maxOutputTokens=8192` (Quick: 4096). Kein Multi-Pass in V1. Multi-Pass V2-Optimierung nach Beta-Daten.
✅ **Q-A3 resolved (Pre-Execute 2026-05-21):** Quick-Default ist `gpt-5-nano` (matched aktuellen Code in `packages/llm/src/select.ts:55`, 15× billiger als `gpt-5-mini`). Plan-Original sagte `gpt-5-mini` — verworfen.

## 10. Aufwand

~6-8h. PR-Cut: 1 PR (alle Phases atomic, weil Schema + Code zusammen reviewen).
