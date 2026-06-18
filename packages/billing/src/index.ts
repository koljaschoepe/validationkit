export {
  TIERS,
  ANNUAL_DISCOUNT,
  isPaidTier,
  tierConfig,
  priceForCycle,
  monthlyEquivalent,
  hasFeature,
  type TierId,
  type TierConfig,
  type BillingCycle,
  type TierFeature,
} from "./tiers.js";

export {
  INTENSITIES,
  CREDITS_PER_INTENSITY,
  DEFAULT_INTENSITY,
  creditsForIntensity,
  isIntensity,
  type Intensity,
} from "./intensity.js";

export {
  encryptApiKey,
  decryptApiKey,
  isByokConfigured,
  type EncryptedKey,
} from "./byok-crypto.js";

export {
  consumeCredits,
  refundCredits,
  grantCredits,
  getCreditBalance,
  canConsume,
  resetCycleQuota,
  latestLedgerEntry,
  defaultQuotaForTier,
  type CreditBalance,
  type CreditReason,
  type ConsumeResult,
  type ConsumeDebitLine,
  type CanConsumeResult,
} from "./credits.js";

export {
  ensureSubscription,
  isPaid,
  countActiveRepos,
  countActiveCustomers,
  canAddCustomer,
  canRunAudit,
  type SubscriptionSnapshot,
  type QuotaCheck,
} from "./subscription.js";
