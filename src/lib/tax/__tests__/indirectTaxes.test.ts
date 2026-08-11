import { describe, expect, it } from "vitest";

import { businessMonthsInYear, calculateBusinessTax } from "../businessTax";
import { calculateConsumptionTax } from "../consumptionTax";
import { calculateResidenceTax } from "../residenceTax";
import { rules2026 } from "../taxRules";

describe("businessMonthsInYear", () => {
  it.each([
    [2025, 7, 12],
    [2026, 1, 12],
    [2026, 4, 9],
    [2026, 12, 1],
    [2027, 1, 0],
  ])(
    "returns %i months for a business starting in %i/%i",
    (businessStartYear, businessStartMonth, expected) => {
      expect(businessMonthsInYear(2026, businessStartYear, businessStartMonth)).toBe(expected);
    },
  );
});

describe("calculateBusinessTax", () => {
  it.each([
    [12, 2_900_000, 100_000, 5_000],
    [9, 2_175_000, 825_000, 41_200],
    [6, 1_450_000, 1_550_000, 77_500],
    [1, 242_000, 2_758_000, 137_900],
  ])(
    "applies the %i-month owner deduction before the five-percent rate",
    (businessMonths, ownerDeduction, taxableBase, amount) => {
      expect(
        calculateBusinessTax({
          profitBeforeBlueDeduction: 3_000_000,
          rate: 0.05,
          businessMonths,
          rules: rules2026,
        }),
      ).toEqual({ amount, taxableBase, ownerDeduction, businessMonths });
    },
  );

  it("uses profit before the blue-return deduction and floors tax to a hundred yen", () => {
    const result = calculateBusinessTax({
      profitBeforeBlueDeduction: 3_000_999,
      rate: 0.03,
      businessMonths: 12,
      rules: rules2026,
    });

    expect(result.taxableBase).toBe(100_999);
    expect(result.amount).toBe(3_000);
  });

  it("does not create tax when the owner deduction absorbs all profit", () => {
    expect(
      calculateBusinessTax({
        profitBeforeBlueDeduction: 2_000_000,
        rate: 0.05,
        businessMonths: 12,
        rules: rules2026,
      }).amount,
    ).toBe(0);
  });

  it("does not tax supplied profit when there are no business months in the year", () => {
    expect(
      calculateBusinessTax({
        profitBeforeBlueDeduction: 3_000_000,
        rate: 0.05,
        businessMonths: 0,
        rules: rules2026,
      }),
    ).toEqual({
      amount: 0,
      taxableBase: 0,
      ownerDeduction: 0,
      businessMonths: 0,
    });
  });
});

describe("calculateResidenceTax", () => {
  it("subtracts the resident basic and common deductions and applies standard levies", () => {
    expect(
      calculateResidenceTax({
        totalIncome: 3_000_999,
        commonDeductions: 500_499,
        perCapitaTaxApplies: true,
        rules: rules2026,
      }),
    ).toEqual({
      taxableIncome: 2_070_000,
      incomeTax: 207_000,
      perCapitaTax: 4_000,
      forestEnvironmentTax: 1_000,
      total: 212_000,
    });
  });

  it("omits both fixed levies when per-capita tax does not apply", () => {
    const result = calculateResidenceTax({
      totalIncome: 1_000_000,
      commonDeductions: 0,
      perCapitaTaxApplies: false,
      rules: rules2026,
    });

    expect(result).toEqual({
      taxableIncome: 570_000,
      incomeTax: 57_000,
      perCapitaTax: 0,
      forestEnvironmentTax: 0,
      total: 57_000,
    });
  });

  it("does not produce negative taxable income or income-based tax", () => {
    expect(
      calculateResidenceTax({
        totalIncome: 300_000,
        commonDeductions: 100_000,
        perCapitaTaxApplies: true,
        rules: rules2026,
      }),
    ).toEqual({
      taxableIncome: 0,
      incomeTax: 0,
      perCapitaTax: 4_000,
      forestEnvironmentTax: 1_000,
      total: 5_000,
    });
  });

  it.each([
    [24_000_000, 2_357_000],
    [24_000_001, 2_371_000],
    [24_500_000, 2_421_000],
    [24_500_001, 2_435_000],
    [25_000_000, 2_485_000],
    [25_000_001, 2_500_000],
  ])(
    "uses the high-income resident basic-deduction band at %,i yen",
    (totalIncome, expectedIncomeTax) => {
      const result = calculateResidenceTax({
        totalIncome,
        commonDeductions: 0,
        perCapitaTaxApplies: false,
        rules: rules2026,
      });

      expect(result.incomeTax).toBe(expectedIncomeTax);
    },
  );
});

const consumptionBase = {
  taxableSales: 11_000_000,
  taxablePurchases: 4_400_000,
  simplifiedBusinessType: 5 as const,
  invoiceRegistered: true,
  taxableBecauseOfInvoice: true,
  rules: rules2026,
};

describe("calculateConsumptionTax", () => {
  it("supports the exempt method while still exposing the tax included in sales", () => {
    const result = calculateConsumptionTax({
      ...consumptionBase,
      method: "exempt",
      invoiceRegistered: false,
      taxableBecauseOfInvoice: false,
    });

    expect(result).toMatchObject({
      amount: 0,
      outputTax: 1_000_000,
      inputTaxCredit: 0,
      method: "exempt",
      supported: true,
    });
  });

  it("marks the exempt method unsupported for an invoice-registered business", () => {
    const result = calculateConsumptionTax({ ...consumptionBase, method: "exempt" });

    expect(result).toMatchObject({
      amount: 0,
      outputTax: 1_000_000,
      inputTaxCredit: 0,
      method: "exempt",
      supported: false,
    });
  });

  it("uses tax included in taxable sales and purchases for the general method", () => {
    const result = calculateConsumptionTax({ ...consumptionBase, method: "general" });

    expect(result).toMatchObject({
      amount: 600_000,
      outputTax: 1_000_000,
      inputTaxCredit: 400_000,
      method: "general",
      supported: true,
    });
  });

  it("keeps exact tax-inclusive amounts stable across taxable methods", () => {
    const exactBase = {
      ...consumptionBase,
      taxableSales: 1_100_000,
      taxablePurchases: 550_000,
    };

    expect(calculateConsumptionTax({ ...exactBase, method: "general" })).toMatchObject({
      outputTax: 100_000,
      inputTaxCredit: 50_000,
      amount: 50_000,
    });
    expect(
      calculateConsumptionTax({
        ...exactBase,
        method: "simplified",
        simplifiedBusinessType: 5,
      }),
    ).toMatchObject({ outputTax: 100_000, inputTaxCredit: 50_000, amount: 50_000 });
    expect(calculateConsumptionTax({ ...exactBase, method: "two-tenths" })).toMatchObject({
      outputTax: 100_000,
      inputTaxCredit: 80_000,
      amount: 20_000,
    });
  });

  it.each([
    [1, 900_000, 100_000],
    [2, 800_000, 200_000],
    [3, 700_000, 300_000],
    [4, 600_000, 400_000],
    [5, 500_000, 500_000],
    [6, 400_000, 600_000],
  ] as const)(
    "uses the deemed purchase ratio for simplified business type %i",
    (simplifiedBusinessType, inputTaxCredit, amount) => {
      const result = calculateConsumptionTax({
        ...consumptionBase,
        method: "simplified",
        simplifiedBusinessType,
      });

      expect(result).toMatchObject({
        amount,
        outputTax: 1_000_000,
        inputTaxCredit,
        method: "simplified",
        supported: true,
      });
    },
  );

  it("applies the two-tenths special rule only when its invoice conditions are met", () => {
    const result = calculateConsumptionTax({ ...consumptionBase, method: "two-tenths" });

    expect(result).toMatchObject({
      amount: 200_000,
      outputTax: 1_000_000,
      inputTaxCredit: 800_000,
      method: "two-tenths",
      supported: true,
    });
  });

  it("reconciles the two-tenths payment and credit for an odd output-tax amount", () => {
    const result = calculateConsumptionTax({
      ...consumptionBase,
      taxableSales: 1_100_011,
      method: "two-tenths",
    });

    expect(result.outputTax).toBe(100_001);
    expect(result.amount).toBe(20_000);
    expect(result.inputTaxCredit).toBe(80_001);
    expect(result.amount + result.inputTaxCredit).toBe(result.outputTax);
  });

  it.each([
    [false, true],
    [true, false],
    [false, false],
  ])(
    "rejects two-tenths when invoiceRegistered=%s and taxableBecauseOfInvoice=%s",
    (invoiceRegistered, taxableBecauseOfInvoice) => {
      const result = calculateConsumptionTax({
        ...consumptionBase,
        method: "two-tenths",
        invoiceRegistered,
        taxableBecauseOfInvoice,
      });

      expect(result).toMatchObject({
        amount: 0,
        outputTax: 1_000_000,
        inputTaxCredit: 0,
        method: "two-tenths",
        supported: false,
      });
    },
  );

  it("never creates a negative general-method payment when purchases exceed sales", () => {
    const result = calculateConsumptionTax({
      ...consumptionBase,
      taxablePurchases: 22_000_000,
      method: "general",
    });

    expect(result.amount).toBe(0);
    expect(result.inputTaxCredit).toBe(2_000_000);
  });
});
