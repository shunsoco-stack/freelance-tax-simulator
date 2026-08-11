import { describe, expect, it } from "vitest";

import {
  calculateBasicDeduction,
  calculateIncomeTax,
  calculateReconstructionIncomeTax,
} from "../incomeTax";
import { getTaxRules, rules2026 } from "../taxRules";
import { SUPPORTED_TAX_YEARS } from "../types";

describe("2026 tax rules", () => {
  it("exposes 2026 as the only supported and selected rule set", () => {
    expect(SUPPORTED_TAX_YEARS).toEqual([2026]);
    expect(getTaxRules(2026)).toBe(rules2026);
    expect(rules2026.year).toBe(2026);
  });

  it("keeps the 2026 rate, deduction, and social-insurance constants together", () => {
    expect(rules2026.incomeTaxBrackets).toEqual([
      { upTo: 1_949_000, rate: 0.05, deduction: 0 },
      { upTo: 3_299_000, rate: 0.1, deduction: 97_500 },
      { upTo: 6_949_000, rate: 0.2, deduction: 427_500 },
      { upTo: 8_999_000, rate: 0.23, deduction: 636_000 },
      { upTo: 17_999_000, rate: 0.33, deduction: 1_536_000 },
      { upTo: 39_999_000, rate: 0.4, deduction: 2_796_000 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.45, deduction: 4_796_000 },
    ]);
    expect(rules2026.reconstructionIncomeTaxRate).toBe(0.021);
    expect(rules2026.blueDeductions).toEqual([0, 100_000, 550_000, 650_000]);
    expect(rules2026.residentTax).toEqual({
      incomeRate: 0.1,
      basicDeductions: [
        { upTo: 24_000_000, amount: 430_000 },
        { upTo: 24_500_000, amount: 290_000 },
        { upTo: 25_000_000, amount: 150_000 },
        { upTo: Number.POSITIVE_INFINITY, amount: 0 },
      ],
      perCapitaTax: 4_000,
      forestEnvironmentTax: 1_000,
    });
    expect(rules2026.businessTax.supportedRates).toEqual([0, 0.03, 0.04, 0.05]);
    expect(rules2026.consumptionTax.standardRate).toBe(0.1);
    expect(rules2026.consumptionTax.twoTenthsAvailableThrough).toBe(2026);
  });
});

describe("calculateBasicDeduction", () => {
  it.each([
    [4_890_000, 1_040_000, 670_000],
    [6_550_000, 670_000, 620_000],
    [23_500_000, 620_000, 480_000],
    [24_000_000, 480_000, 320_000],
    [24_500_000, 320_000, 160_000],
    [25_000_000, 160_000, 0],
  ])(
    "uses the configured deduction immediately before, at, and after %,i yen",
    (boundary, atBoundary, afterBoundary) => {
      expect(calculateBasicDeduction(boundary - 1, rules2026)).toBe(atBoundary);
      expect(calculateBasicDeduction(boundary, rules2026)).toBe(atBoundary);
      expect(calculateBasicDeduction(boundary + 1, rules2026)).toBe(afterBoundary);
    },
  );

  it("handles zero, negative, and non-finite income without crossing a bracket", () => {
    expect(calculateBasicDeduction(0, rules2026)).toBe(1_040_000);
    expect(calculateBasicDeduction(-1, rules2026)).toBe(1_040_000);
    expect(calculateBasicDeduction(Number.POSITIVE_INFINITY, rules2026)).toBe(0);
  });
});

describe("calculateIncomeTax", () => {
  it.each([
    [1_950_000, 97_450, 97_500, 97_600],
    [3_300_000, 232_400, 232_500, 232_700],
    [6_950_000, 962_300, 962_500, 962_730],
    [9_000_000, 1_433_770, 1_434_000, 1_434_330],
    [18_000_000, 4_403_670, 4_404_000, 4_404_400],
    [40_000_000, 13_203_600, 13_204_000, 13_204_450],
  ])(
    "is continuous immediately before, at, and after the %,i yen progressive boundary",
    (boundary, beforeTax, boundaryTax, firstCrossingTax) => {
      expect(calculateIncomeTax(boundary - 1, rules2026)).toBe(beforeTax);
      expect(calculateIncomeTax(boundary, rules2026)).toBe(boundaryTax);
      expect(calculateIncomeTax(boundary + 1, rules2026)).toBe(boundaryTax);
      expect(calculateIncomeTax(boundary + 1_000, rules2026)).toBe(firstCrossingTax);
    },
  );

  it("floors taxable income to a thousand yen before applying the bracket", () => {
    expect(calculateIncomeTax(1_949_000, rules2026)).toBe(97_450);
    expect(calculateIncomeTax(1_949_999, rules2026)).toBe(97_450);
  });

  it("applies the highest bracket and never returns a negative amount", () => {
    expect(calculateIncomeTax(50_000_000, rules2026)).toBe(17_704_000);
    expect(calculateIncomeTax(-1_000_000, rules2026)).toBe(0);
  });
});

describe("calculateReconstructionIncomeTax", () => {
  it.each([
    [0, 0],
    [97_500, 2_047],
    [1_000_000, 21_000],
    [-100, 0],
  ])("calculates 2.1%% of an income-tax amount of %,i yen", (incomeTax, expected) => {
    expect(calculateReconstructionIncomeTax(incomeTax, rules2026)).toBe(expected);
  });
});
