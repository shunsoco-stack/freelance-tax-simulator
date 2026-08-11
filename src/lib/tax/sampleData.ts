import {
  DEDUCTION_KEYS,
  EXPENSE_CATEGORIES,
  type DeductionValues,
  type ExpenseValues,
  type SimulatorInput,
} from "./types";

function emptyExpenses(): ExpenseValues {
  return Object.fromEntries(EXPENSE_CATEGORIES.map((key) => [key, 0])) as ExpenseValues;
}

function emptyDeductions(): DeductionValues {
  return Object.fromEntries(DEDUCTION_KEYS.map((key) => [key, 0])) as DeductionValues;
}

const sampleProfiles = {
  3_000_000: { expenseRate: 0.38, healthInsurance: 250_000, blueDeduction: 100_000 as const },
  6_000_000: { expenseRate: 0.34, healthInsurance: 420_000, blueDeduction: 650_000 as const },
  10_000_000: { expenseRate: 0.36, healthInsurance: 650_000, blueDeduction: 650_000 as const },
  15_000_000: { expenseRate: 0.38, healthInsurance: 850_000, blueDeduction: 650_000 as const },
};

export type SampleRevenue = keyof typeof sampleProfiles;

export function createSampleInput(annualRevenue: SampleRevenue = 6_000_000): SimulatorInput {
  const currentMonth = 8;
  const profile = sampleProfiles[annualRevenue];
  const annualExpenses = Math.round(annualRevenue * profile.expenseRate);
  const elapsedRevenue = Math.round((annualRevenue * currentMonth) / 12);
  const elapsedExpenses = Math.round((annualExpenses * currentMonth) / 12);
  const expenseValues = emptyExpenses();
  const expenseShares: Array<[keyof ExpenseValues, number]> = [
    ["purchases", 0.12],
    ["outsourcing", 0.22],
    ["rent", 0.2],
    ["utilities", 0.04],
    ["communications", 0.06],
    ["advertising", 0.08],
    ["supplies", 0.06],
    ["travel", 0.06],
    ["fees", 0.08],
    ["other", 0.08],
  ];
  expenseShares.forEach(([key, share]) => {
    expenseValues[key] = Math.round(elapsedExpenses * share);
  });

  const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
    if (index >= currentMonth) return 0;
    const seasonalFactor = [0.88, 0.94, 1.02, 0.98, 1.08, 1.04, 0.96, 1.1][index] ?? 1;
    return Math.round((annualRevenue / 12) * seasonalFactor);
  });
  const actualMonthlyTotal = monthlyRevenue.reduce((total, value) => total + value, 0);
  monthlyRevenue[currentMonth - 1] += elapsedRevenue - actualMonthlyTotal;

  const deductions = emptyDeductions();
  deductions.lifeInsurance = annualRevenue >= 6_000_000 ? 40_000 : 20_000;
  deductions.medical = annualRevenue === 3_000_000 ? 0 : 50_000;

  const isConsumptionTaxSample = annualRevenue >= 10_000_000;

  return {
    year: 2026,
    currentMonth,
    businessStartYear: 2022,
    businessStartMonth: 4,
    prefecture: "東京都",
    municipality: "新宿区",
    age: 35,
    filingType: "blue",
    blueDeduction: profile.blueDeduction,
    inputMode: "simple",
    cumulativeRevenue: elapsedRevenue,
    monthlyRevenue,
    otherBusinessRevenue: 0,
    salesReturns: 0,
    cumulativeExpenses: elapsedExpenses,
    expenseValues,
    salaryIncome: 0,
    otherIncome: 0,
    deductions,
    hometownDonation: 0,
    socialInsuranceMode: "national",
    nationalHealthInsuranceAnnual: profile.healthInsurance,
    employeeSocialInsuranceAnnual: 0,
    includeNationalPension: true,
    residentPerCapitaTaxApplies: true,
    businessTaxRate: 0.05,
    consumptionTaxMethod: isConsumptionTaxSample
      ? annualRevenue === 10_000_000
        ? "two-tenths"
        : "simplified"
      : "exempt",
    invoiceRegistered: isConsumptionTaxSample,
    taxableBecauseOfInvoice: annualRevenue === 10_000_000,
    taxablePurchases: Math.round(annualExpenses * 0.72),
    simplifiedBusinessType: 5,
    reservedFunds: Math.round(annualRevenue * 0.08),
    scenarioExpenseIncrease: 500_000,
    scenarioMutualAid: 840_000,
    scenarioIdeco: 276_000,
  };
}

export function createBlankInput(): SimulatorInput {
  return {
    ...createSampleInput(),
    currentMonth: 8,
    businessStartYear: 2026,
    businessStartMonth: 1,
    cumulativeRevenue: 0,
    monthlyRevenue: Array(12).fill(0),
    cumulativeExpenses: 0,
    expenseValues: emptyExpenses(),
    deductions: emptyDeductions(),
    nationalHealthInsuranceAnnual: 0,
    reservedFunds: 0,
    consumptionTaxMethod: "exempt",
    invoiceRegistered: false,
    taxableBecauseOfInvoice: false,
    taxablePurchases: 0,
  };
}
