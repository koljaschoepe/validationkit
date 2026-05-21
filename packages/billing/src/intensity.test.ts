import { describe, expect, it } from "vitest";
import {
  CREDITS_PER_INTENSITY,
  creditsForIntensity,
  DEFAULT_INTENSITY,
  INTENSITIES,
  isIntensity,
} from "./intensity.js";

describe("intensity", () => {
  it("ships exactly Quick + Deep (no Express, Ultra etc.)", () => {
    expect(INTENSITIES).toEqual(["quick", "deep"]);
  });

  it("Quick=1, Deep=5 credit ratio", () => {
    expect(CREDITS_PER_INTENSITY.quick).toBe(1);
    expect(CREDITS_PER_INTENSITY.deep).toBe(5);
  });

  it("creditsForIntensity is a thin lookup", () => {
    expect(creditsForIntensity("quick")).toBe(1);
    expect(creditsForIntensity("deep")).toBe(5);
  });

  it("default is quick (cheaper for first-touch)", () => {
    expect(DEFAULT_INTENSITY).toBe("quick");
  });

  it("isIntensity is strict", () => {
    expect(isIntensity("quick")).toBe(true);
    expect(isIntensity("deep")).toBe(true);
    expect(isIntensity("Deep")).toBe(false);
    expect(isIntensity("Quick")).toBe(false);
    expect(isIntensity(undefined)).toBe(false);
    expect(isIntensity(null)).toBe(false);
    expect(isIntensity(1)).toBe(false);
  });
});
