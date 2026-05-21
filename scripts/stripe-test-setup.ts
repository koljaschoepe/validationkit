/**
 * Bootstrap Stripe Test-Mode with everything Sub-Plan-B needs:
 *
 *   1 Product           — prod_validation (lookup_key: vk_validation_product)
 *   8 licensed Prices   — 4 tiers × 2 cycles (monthly + annual)
 *   2 metered Prices    — audit-credit overage + AI-cost-markup microcents
 *   2 Meters            — mtr_audit_credit_overage, mtr_ai_cost_markup_microcents
 *   2 one-time Prices   — pre-paid credit packs (100, 500)
 *
 * Everything is idempotent via lookup_keys + Stripe-side search APIs. Re-runs
 * skip what already exists and only create the gaps. Output: writes/updates
 * `.env.stripe-test-mode.generated` in repo root with every resolved ID; the
 * founder merges those into `.env.local` before starting the dev server.
 *
 * Usage:
 *   pnpm stripe:setup-test
 *
 * Requires STRIPE_SECRET_KEY (sk_test_...) in .env or .env.local.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import Stripe from "stripe";

const PRODUCT_LOOKUP_KEY = "vk_validation_product";

// Tier × cycle base prices (licensed). Inline-mirrored from @vk/billing/tiers.ts
// to keep this script tsx-runnable without depending on the workspace build.
// Drift-check: TIER_PRICES_EUR_CENTS must match TIERS[*].monthlyEurCents.
const ANNUAL_DISCOUNT = 0.2;
type Cycle = "monthly" | "annual";
const PAID_TIERS = ["starter", "pro", "agency"] as const;
const TIER_PRICES_EUR_CENTS: Record<(typeof PAID_TIERS)[number], number> = {
  starter: 2900,
  pro: 9900,
  agency: 29900,
};
const TIER_LABELS: Record<(typeof PAID_TIERS)[number], string> = {
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

// Credit-pack lookup keys + amounts. One-time payment.
const PREPAID_PACKS = [
  { lookupKey: "vk_pack_100_credits_eur", credits: 100, amountCents: 2500 },
  { lookupKey: "vk_pack_500_credits_eur", credits: 500, amountCents: 9900 },
] as const;

const METERS = [
  {
    displayName: "Audit credit overage",
    eventName: "audit_credit_overage",
    /** Sub-Plan-A.consumeCredits ledger reason='overage' triggers events. */
    valuePayloadKey: "value",
    customerPayloadKey: "stripe_customer_id",
  },
  {
    displayName: "AI cost markup (microcents)",
    eventName: "ai_cost_markup_microcents",
    valuePayloadKey: "value",
    customerPayloadKey: "stripe_customer_id",
  },
] as const;

const METER_PRICES = [
  {
    lookupKey: "vk_overage_credit_eur",
    /** 30 cents per credit (€0.30 = 30 unit_amount). */
    unitAmount: 30,
    eventName: "audit_credit_overage",
  },
  {
    lookupKey: "vk_ai_markup_microcent_eur",
    /** 1 cent per 100 microcents = 0.01 unit_amount per microcent. We use
     *  unit_amount_decimal to keep sub-cent precision; this Price bills the
     *  raw microcent value, so each microcent costs 0.01 cent. */
    unitAmount: 0, // overridden by unit_amount_decimal below
    eventName: "ai_cost_markup_microcents",
  },
] as const;

interface ResolvedIds {
  product: string;
  tierPrices: Record<string, string>; // e.g. STRIPE_PRICE_STARTER_MONTHLY → price_xxx
  prepaidPackPrices: Record<string, string>; // STRIPE_PRICE_PACK_100 → price_xxx
  meterPrices: Record<string, string>; // STRIPE_PRICE_OVERAGE_CREDIT, STRIPE_PRICE_AI_MARKUP_MICROCENT
  meterIds: Record<string, string>; // STRIPE_METER_OVERAGE → mtr_xxx
}

function loadStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Drop a `sk_test_...` key in .env.local.",
    );
  }
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "STRIPE_SECRET_KEY is not a test-mode key (must start with sk_test_).",
    );
  }
  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: { name: "ValidationKit", version: "0.0.20" },
  });
}

async function findOrCreateProduct(stripe: Stripe): Promise<string> {
  const existing = await stripe.products.list({ limit: 100, active: true });
  const match = existing.data.find(
    (p) => (p.metadata as Record<string, string>).lookup_key === PRODUCT_LOOKUP_KEY,
  );
  if (match) {
    process.stdout.write(`product:  reuse ${match.id}\n`);
    return match.id;
  }
  const created = await stripe.products.create({
    name: "ValidationKit",
    description: "Multi-customer AGENTS.md / CLAUDE.md / SKILL.md audit platform.",
    metadata: { lookup_key: PRODUCT_LOOKUP_KEY },
  });
  process.stdout.write(`product:  create ${created.id}\n`);
  return created.id;
}

async function findPriceByLookupKey(
  stripe: Stripe,
  lookupKey: string,
): Promise<Stripe.Price | null> {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return res.data[0] ?? null;
}

async function findOrCreateTierPrice(
  stripe: Stripe,
  productId: string,
  tier: (typeof PAID_TIERS)[number],
  cycle: Cycle,
): Promise<string> {
  const lookupKey = `vk_${tier}_base_eur_${cycle}`;
  const existing = await findPriceByLookupKey(stripe, lookupKey);
  if (existing) {
    process.stdout.write(`price:    reuse ${lookupKey} ${existing.id}\n`);
    return existing.id;
  }
  const monthlyCents = TIER_PRICES_EUR_CENTS[tier];
  const amount =
    cycle === "monthly"
      ? monthlyCents
      : Math.round(monthlyCents * 12 * (1 - ANNUAL_DISCOUNT));
  const created = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: "eur",
    recurring: { interval: cycle === "monthly" ? "month" : "year" },
    lookup_key: lookupKey,
    nickname: `${TIER_LABELS[tier]} — ${cycle}`,
    metadata: { tier, cycle },
  });
  process.stdout.write(`price:    create ${lookupKey} ${created.id}\n`);
  return created.id;
}

async function findOrCreatePackPrice(
  stripe: Stripe,
  productId: string,
  pack: (typeof PREPAID_PACKS)[number],
): Promise<string> {
  const existing = await findPriceByLookupKey(stripe, pack.lookupKey);
  if (existing) {
    process.stdout.write(`price:    reuse ${pack.lookupKey} ${existing.id}\n`);
    return existing.id;
  }
  const created = await stripe.prices.create({
    product: productId,
    unit_amount: pack.amountCents,
    currency: "eur",
    lookup_key: pack.lookupKey,
    nickname: `${pack.credits} credits prepaid pack`,
    metadata: { credits: String(pack.credits), kind: "prepaid_pack" },
  });
  process.stdout.write(`price:    create ${pack.lookupKey} ${created.id}\n`);
  return created.id;
}

async function findOrCreateMeter(
  stripe: Stripe,
  meter: (typeof METERS)[number],
): Promise<string> {
  const list = await stripe.billing.meters.list({ limit: 100 });
  const match = list.data.find((m) => m.event_name === meter.eventName);
  if (match) {
    process.stdout.write(`meter:    reuse ${meter.eventName} ${match.id}\n`);
    return match.id;
  }
  const created = await stripe.billing.meters.create({
    display_name: meter.displayName,
    event_name: meter.eventName,
    default_aggregation: { formula: "sum" },
    customer_mapping: {
      event_payload_key: meter.customerPayloadKey,
      type: "by_id",
    },
    value_settings: { event_payload_key: meter.valuePayloadKey },
  });
  process.stdout.write(`meter:    create ${meter.eventName} ${created.id}\n`);
  return created.id;
}

async function findOrCreateMeterPrice(
  stripe: Stripe,
  productId: string,
  meterPrice: (typeof METER_PRICES)[number],
  meterId: string,
): Promise<string> {
  const existing = await findPriceByLookupKey(stripe, meterPrice.lookupKey);
  if (existing) {
    process.stdout.write(
      `price:    reuse ${meterPrice.lookupKey} ${existing.id}\n`,
    );
    return existing.id;
  }
  const isMicrocent = meterPrice.eventName === "ai_cost_markup_microcents";
  // AI-markup price: 1 cent per 100 microcents → transform_quantity divides
  // the submitted microcent total by 100, then bills 1 cent per unit. The
  // markup-meter is declared in Sub-Plan-B but only flushed in Sub-Plan-C
  // once the disclosure copy is live; this is the wired-but-dormant state.
  const created = await stripe.prices.create({
    product: productId,
    currency: "eur",
    billing_scheme: "per_unit",
    unit_amount: isMicrocent ? 1 : meterPrice.unitAmount,
    ...(isMicrocent
      ? { transform_quantity: { divide_by: 100, round: "up" as const } }
      : {}),
    recurring: {
      interval: "month",
      usage_type: "metered",
      meter: meterId,
    },
    lookup_key: meterPrice.lookupKey,
    nickname:
      meterPrice.lookupKey === "vk_overage_credit_eur"
        ? "Overage: 0.30 EUR / credit"
        : "AI markup: 1 cent / 100 microcents",
    metadata: { meterEvent: meterPrice.eventName },
  });
  process.stdout.write(
    `price:    create ${meterPrice.lookupKey} ${created.id}\n`,
  );
  return created.id;
}

function envLines(ids: ResolvedIds): string {
  const lines: string[] = [
    "# Auto-generated by `pnpm stripe:setup-test` — do not edit by hand.",
    `STRIPE_PRODUCT_ID=${ids.product}`,
    "",
    "# Tier base prices",
  ];
  for (const [key, value] of Object.entries(ids.tierPrices).sort()) {
    lines.push(`${key}=${value}`);
  }
  lines.push("", "# Pre-paid credit packs");
  for (const [key, value] of Object.entries(ids.prepaidPackPrices).sort()) {
    lines.push(`${key}=${value}`);
  }
  lines.push("", "# Meters + metered prices");
  for (const [key, value] of Object.entries(ids.meterIds).sort()) {
    lines.push(`${key}=${value}`);
  }
  for (const [key, value] of Object.entries(ids.meterPrices).sort()) {
    lines.push(`${key}=${value}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const stripe = loadStripe();
  process.stdout.write("Stripe test-mode setup — provisioning…\n\n");

  const productId = await findOrCreateProduct(stripe);

  const tierPrices: Record<string, string> = {};
  for (const tier of PAID_TIERS) {
    for (const cycle of ["monthly", "annual"] as const) {
      const id = await findOrCreateTierPrice(stripe, productId, tier, cycle);
      const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${cycle.toUpperCase()}`;
      tierPrices[envKey] = id;
    }
  }

  const prepaidPackPrices: Record<string, string> = {};
  for (const pack of PREPAID_PACKS) {
    const id = await findOrCreatePackPrice(stripe, productId, pack);
    const sizeMatch = pack.lookupKey.match(/pack_(\d+)/);
    const envKey = `STRIPE_PRICE_PACK_${sizeMatch ? sizeMatch[1] : "X"}`;
    prepaidPackPrices[envKey] = id;
  }

  const meterIds: Record<string, string> = {};
  for (const meter of METERS) {
    const id = await findOrCreateMeter(stripe, meter);
    const envKey = `STRIPE_METER_${meter.eventName.toUpperCase()}`;
    meterIds[envKey] = id;
  }

  const meterPrices: Record<string, string> = {};
  for (const meterPrice of METER_PRICES) {
    const meterId = meterIds[`STRIPE_METER_${meterPrice.eventName.toUpperCase()}`];
    if (!meterId) {
      throw new Error(`Meter id missing for ${meterPrice.eventName}`);
    }
    const id = await findOrCreateMeterPrice(
      stripe,
      productId,
      meterPrice,
      meterId,
    );
    const envKey = meterPrice.lookupKey
      .replace(/^vk_/, "STRIPE_PRICE_")
      .toUpperCase();
    meterPrices[envKey] = id;
  }

  const ids: ResolvedIds = {
    product: productId,
    tierPrices,
    prepaidPackPrices,
    meterPrices,
    meterIds,
  };

  const outputPath = path.resolve(".env.stripe-test-mode.generated");
  await writeFile(outputPath, envLines(ids), "utf8");

  process.stdout.write(
    `\n✓ Wrote ${outputPath}\n  Merge these env vars into .env.local before \`pnpm dev\`.\n`,
  );
}

await main();
