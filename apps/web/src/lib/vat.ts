/**
 * Per-country VAT rates for the EU-27 + UK. Used by the public /billing page
 * to show VAT-inclusive prices when the request originates from an EU IP.
 *
 * Source of truth: EU Commission "VAT rates applied in the Member States",
 * accessed 2026-05. https://taxation-customs.ec.europa.eu/taxation/vat/vat-rates_en
 * (per A5 + ADR-0020 EU geo-IP VAT-inclusive display).
 *
 * Live VAT collection happens via Stripe Tax — these rates are display-only
 * (so a Berlin tester sees "€30/mo (incl. 19% VAT)" instead of a "$25 net"
 * sticker that becomes €30 at checkout, +12% conversion per Profitwell 2025).
 */

const EU_VAT_RATES: Record<string, number> = {
  AT: 0.20,
  BE: 0.21,
  BG: 0.20,
  CY: 0.19,
  CZ: 0.21,
  DE: 0.19,
  DK: 0.25,
  EE: 0.22,
  ES: 0.21,
  FI: 0.255,
  FR: 0.20,
  GR: 0.24,
  HR: 0.25,
  HU: 0.27,
  IE: 0.23,
  IT: 0.22,
  LT: 0.21,
  LU: 0.17,
  LV: 0.21,
  MT: 0.18,
  NL: 0.21,
  PL: 0.23,
  PT: 0.23,
  RO: 0.19,
  SE: 0.25,
  SI: 0.22,
  SK: 0.23,
  GB: 0.20,
};

export interface VatContext {
  country: string | null;
  rate: number;
  /** Display "incl. VAT" labels and gross prices. */
  inclusive: boolean;
}

export function resolveVatContext(country: string | null): VatContext {
  if (!country) return { country: null, rate: 0, inclusive: false };
  const upper = country.toUpperCase();
  const rate = EU_VAT_RATES[upper];
  if (!rate) return { country: upper, rate: 0, inclusive: false };
  return { country: upper, rate, inclusive: true };
}

export function applyVat(netUsd: number, ctx: VatContext): number {
  if (!ctx.inclusive || netUsd === 0) return netUsd;
  return Math.round(netUsd * (1 + ctx.rate));
}
