import { describe, expect, it } from "vitest";
import {
  ANNUAL_DISCOUNT,
  hasFeature,
  isPaidTier,
  monthlyEquivalent,
  priceForCycle,
  TIERS,
  tierConfig,
  type TierId,
} from "./tiers.js";

describe("TIERS catalog", () => {
  it("has exactly the 4 documented tiers", () => {
    expect(Object.keys(TIERS).sort()).toEqual([
      "agency",
      "free",
      "pro",
      "starter",
    ]);
  });

  it.each<[TierId, number, number]>([
    ["free", 0, 3],
    ["starter", 2900, 50],
    ["pro", 9900, 300],
    ["agency", 29900, 1500],
  ])("tier %s = €%i cents, %i credits/cycle", (id, monthly, credits) => {
    expect(TIERS[id].monthlyEurCents).toBe(monthly);
    expect(TIERS[id].creditsPerCycle).toBe(credits);
  });

  it("only free is lifetime-capped", () => {
    expect(TIERS.free.isLifetimeCap).toBe(true);
    for (const id of ["starter", "pro", "agency"] as const) {
      expect(TIERS[id].isLifetimeCap).toBe(false);
    }
  });

  it("BYOK is gated to Pro+", () => {
    expect(TIERS.free.byokAllowed).toBe(false);
    expect(TIERS.starter.byokAllowed).toBe(false);
    expect(TIERS.pro.byokAllowed).toBe(true);
    expect(TIERS.agency.byokAllowed).toBe(true);
  });
});

describe("priceForCycle", () => {
  it("free is zero on both cycles", () => {
    expect(priceForCycle(TIERS.free, "monthly")).toBe(0);
    expect(priceForCycle(TIERS.free, "annual")).toBe(0);
  });

  it("monthly price is the headline", () => {
    expect(priceForCycle(TIERS.starter, "monthly")).toBe(2900);
    expect(priceForCycle(TIERS.pro, "monthly")).toBe(9900);
  });

  it("annual is 12× monthly × (1 − discount)", () => {
    const expected = Math.round(2900 * 12 * (1 - ANNUAL_DISCOUNT));
    expect(priceForCycle(TIERS.starter, "annual")).toBe(expected);
    expect(ANNUAL_DISCOUNT).toBe(0.2);
  });

  it("monthlyEquivalent yields 80% of headline on annual", () => {
    expect(monthlyEquivalent(TIERS.starter, "monthly")).toBe(2900);
    const annual = monthlyEquivalent(TIERS.starter, "annual");
    expect(annual).toBeLessThan(2900);
    expect(annual).toBeGreaterThan(2300);
  });
});

describe("isPaidTier", () => {
  it("only free is unpaid", () => {
    expect(isPaidTier("free")).toBe(false);
    expect(isPaidTier("starter")).toBe(true);
    expect(isPaidTier("pro")).toBe(true);
    expect(isPaidTier("agency")).toBe(true);
  });
});

describe("tierConfig fallback", () => {
  it("falls back to free for unknown tier strings", () => {
    expect(tierConfig("legacy_solo_pro").id).toBe("free");
    expect(tierConfig("").id).toBe("free");
  });
});

describe("hasFeature", () => {
  it("Pro has white-label PDF, Starter does not", () => {
    expect(hasFeature(TIERS.pro, "white_label_pdf")).toBe(true);
    expect(hasFeature(TIERS.starter, "white_label_pdf")).toBe(false);
  });

  it("only agency has SSO + priority support", () => {
    expect(hasFeature(TIERS.agency, "sso_oidc")).toBe(true);
    expect(hasFeature(TIERS.pro, "sso_oidc")).toBe(false);
    expect(hasFeature(TIERS.agency, "priority_support")).toBe(true);
  });
});
