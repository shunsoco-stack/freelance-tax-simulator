import { describe, expect, it } from "vitest";

import { calculateTaxEstimate } from "../calculator";
import { calculateScenarios } from "../scenarios";
import { rules2026 } from "../taxRules";
import { makeInput } from "./testFixtures";

describe("business income and blue-return deduction", () => {
  it("subtracts an allowed blue-return deduction from positive business profit", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        filingType: "blue",
        blueDeduction: 650_000,
        cumulativeRevenue: 5_000_000,
        cumulativeExpenses: 1_000_000,
      }),
      "actual",
    );

    expect(estimate.businessProfitBeforeBlue).toBe(4_000_000);
    expect(estimate.appliedBlueDeduction).toBe(650_000);
    expect(estimate.businessIncome).toBe(3_350_000);
  });

  it("does not apply a blue-return deduction to a white return", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        filingType: "white",
        blueDeduction: 650_000,
        cumulativeRevenue: 5_000_000,
        cumulativeExpenses: 1_000_000,
      }),
      "actual",
    );

    expect(estimate.appliedBlueDeduction).toBe(0);
    expect(estimate.businessIncome).toBe(4_000_000);
  });

  it("caps the blue-return deduction at positive business profit", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        filingType: "blue",
        blueDeduction: 650_000,
        cumulativeRevenue: 1_300_000,
        cumulativeExpenses: 1_000_000,
      }),
      "actual",
    );

    expect(estimate.appliedBlueDeduction).toBe(300_000);
    expect(estimate.businessIncome).toBe(0);
  });

  it("preserves a business loss without turning the blue deduction into a larger loss", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        filingType: "blue",
        blueDeduction: 650_000,
        cumulativeRevenue: 500_000,
        cumulativeExpenses: 1_000_000,
      }),
      "actual",
    );

    expect(estimate.businessProfitBeforeBlue).toBe(-500_000);
    expect(estimate.appliedBlueDeduction).toBe(0);
    expect(estimate.businessIncome).toBe(-500_000);
    expect(estimate.totalIncome).toBe(0);
  });
});

describe("2026 calendar-year national pension", () => {
  it("contains three FY2025 premiums and nine FY2026 premiums", () => {
    expect(rules2026.nationalPensionMonthly).toEqual([
      17_510,
      17_510,
      17_510,
      17_920,
      17_920,
      17_920,
      17_920,
      17_920,
      17_920,
      17_920,
      17_920,
      17_920,
    ]);
    expect(rules2026.nationalPensionMonthly.reduce((total, amount) => total + amount, 0)).toBe(
      213_810,
    );
  });

  it("adds the calendar-year pension to national health insurance", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        socialInsuranceMode: "national",
        nationalHealthInsuranceAnnual: 300_000,
        includeNationalPension: true,
      }),
      "actual",
    );

    expect(estimate.nationalPension).toBe(213_810);
    expect(estimate.nationalHealthInsurance).toBe(300_000);
    expect(estimate.totalSocialInsurance).toBe(513_810);
    expect(estimate.socialInsuranceDeduction).toBe(513_810);
  });

  it("excludes national premiums in employee-insurance mode", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        socialInsuranceMode: "employee",
        nationalHealthInsuranceAnnual: 300_000,
        employeeSocialInsuranceAnnual: 720_000,
        includeNationalPension: true,
      }),
      "actual",
    );

    expect(estimate.nationalPension).toBe(0);
    expect(estimate.nationalHealthInsurance).toBe(0);
    expect(estimate.employeeSocialInsurance).toBe(720_000);
    expect(estimate.totalSocialInsurance).toBe(720_000);
  });

  it("excludes every premium in no-insurance mode", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        socialInsuranceMode: "none",
        nationalHealthInsuranceAnnual: 300_000,
        employeeSocialInsuranceAnnual: 720_000,
        includeNationalPension: true,
      }),
      "actual",
    );

    expect(estimate.totalSocialInsurance).toBe(0);
  });
});

describe("aggregate estimate", () => {
  it("keeps the tax and burden totals internally consistent", () => {
    const estimate = calculateTaxEstimate(
      makeInput({
        currentMonth: 8,
        cumulativeRevenue: 8_000_000,
        cumulativeExpenses: 3_000_000,
        filingType: "blue",
        blueDeduction: 650_000,
        residentPerCapitaTaxApplies: true,
        businessTaxRate: 0.05,
        socialInsuranceMode: "national",
        nationalHealthInsuranceAnnual: 500_000,
        includeNationalPension: true,
        consumptionTaxMethod: "general",
        taxablePurchases: 3_000_000,
        reservedFunds: 800_000,
      }),
      "forecast",
    );

    expect(estimate.annualSales).toBe(12_000_000);
    expect(estimate.annualExpenses).toBe(4_500_000);
    expect(estimate.totalTax).toBe(
      estimate.incomeTax +
        estimate.reconstructionIncomeTax +
        estimate.residentTax +
        estimate.businessTax +
        estimate.consumptionTax,
    );
    expect(estimate.totalBurden).toBe(estimate.totalTax + estimate.totalSocialInsurance);
    expect(estimate.remainingToReserve).toBe(
      Math.max(0, estimate.totalBurden - 800_000),
    );
    expect(estimate.monthsRemaining).toBe(4);
    expect(estimate.monthlyReserveNeeded).toBe(
      Math.ceil(estimate.remainingToReserve / estimate.monthsRemaining),
    );
  });
});

describe("scenario comparison", () => {
  const input = makeInput({
    cumulativeRevenue: 12_000_000,
    cumulativeExpenses: 3_000_000,
    filingType: "blue",
    blueDeduction: 650_000,
    residentPerCapitaTaxApplies: true,
    businessTaxRate: 0.05,
    scenarioExpenseIncrease: 1_200_000,
    scenarioMutualAid: 600_000,
    scenarioIdeco: 300_000,
  });
  const scenarios = calculateScenarios(input);

  it("returns the four comparison scenarios in a stable order", () => {
    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "current",
      "expense",
      "mutual-aid",
      "ideco",
    ]);
  });

  it("keeps the current scenario equal to a direct forecast", () => {
    expect(scenarios[0].estimate).toEqual(calculateTaxEstimate(input, "forecast"));
    expect(scenarios[0].taxDifference).toBe(0);
    expect(scenarios[0].cashAfterContribution).toBe(scenarios[0].estimate.takeHome);
  });

  it("annualizes an added expense and includes it in take-home cash", () => {
    const current = scenarios[0];
    const expense = scenarios[1];

    expect(expense.estimate.annualExpenses - current.estimate.annualExpenses).toBe(1_200_000);
    expect(expense.additionalCashOut).toBe(1_200_000);
    expect(expense.cashAfterContribution).toBe(expense.estimate.takeHome);
    expect(expense.taxDifference).toBe(current.estimate.totalTax - expense.estimate.totalTax);
    expect(expense.taxDifference).toBeGreaterThan(0);
  });

  it("compares mutual-aid tax savings with the separate cash contribution", () => {
    const current = scenarios[0];
    const mutualAid = scenarios[2];

    expect(mutualAid.estimate.itemizedDeductions - current.estimate.itemizedDeductions).toBe(600_000);
    expect(mutualAid.cashAfterContribution).toBe(mutualAid.estimate.takeHome - 600_000);
    expect(mutualAid.taxDifference).toBe(
      current.estimate.totalTax - mutualAid.estimate.totalTax,
    );
    expect(mutualAid.taxDifference).toBeGreaterThan(0);
  });

  it("compares iDeCo tax savings with the separate cash contribution", () => {
    const current = scenarios[0];
    const ideco = scenarios[3];

    expect(ideco.estimate.itemizedDeductions - current.estimate.itemizedDeductions).toBe(300_000);
    expect(ideco.cashAfterContribution).toBe(ideco.estimate.takeHome - 300_000);
    expect(ideco.taxDifference).toBe(current.estimate.totalTax - ideco.estimate.totalTax);
    expect(ideco.taxDifference).toBeGreaterThan(0);
  });

  it("produces deterministic tax and cash comparisons for a white-return baseline", () => {
    const deterministicInput = makeInput({
      currentMonth: 6,
      filingType: "white",
      cumulativeRevenue: 3_000_000,
      cumulativeExpenses: 1_000_000,
      scenarioExpenseIncrease: 600_000,
      scenarioMutualAid: 840_000,
      scenarioIdeco: 276_000,
    });
    const results = calculateScenarios(deterministicInput);

    expect(
      results.map(({ estimate, taxDifference, cashAfterContribution }) => ({
        taxableIncome: estimate.taxableIncome,
        totalTax: estimate.totalTax,
        taxDifference,
        cashAfterContribution,
      })),
    ).toEqual([
      {
        taxableIncome: 2_960_000,
        totalTax: 559_668,
        taxDifference: 0,
        cashAfterContribution: 3_440_332,
      },
      {
        taxableIncome: 2_360_000,
        totalTax: 438_408,
        taxDifference: 121_260,
        cashAfterContribution: 2_961_592,
      },
      {
        taxableIncome: 2_120_000,
        totalTax: 389_904,
        taxDifference: 169_764,
        cashAfterContribution: 2_770_096,
      },
      {
        taxableIncome: 2_684_000,
        totalTax: 503_888,
        taxDifference: 55_780,
        cashAfterContribution: 3_220_112,
      },
    ]);
  });
});
