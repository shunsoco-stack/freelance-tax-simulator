export const SUPPORTED_TAX_YEARS = [2026] as const;
export type TaxYear = (typeof SUPPORTED_TAX_YEARS)[number];

export type FilingType = "blue" | "white";
export type BlueDeduction = 0 | 100_000 | 550_000 | 650_000;
export type InputMode = "simple" | "detailed";
export type SocialInsuranceMode = "national" | "employee" | "none";
export type ConsumptionTaxMethod = "exempt" | "general" | "simplified" | "two-tenths";
export type BusinessTaxRate = 0 | 0.03 | 0.04 | 0.05;
export type ProjectionMode = "actual" | "forecast";

export const EXPENSE_CATEGORIES = [
  "purchases",
  "outsourcing",
  "rent",
  "utilities",
  "communications",
  "advertising",
  "supplies",
  "travel",
  "entertainment",
  "vehicles",
  "meetings",
  "fees",
  "taxes",
  "depreciation",
  "familySalary",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type ExpenseValues = Record<ExpenseCategory, number>;

export const DEDUCTION_KEYS = [
  "smallBusinessMutualAid",
  "ideco",
  "lifeInsurance",
  "earthquakeInsurance",
  "medical",
  "spouse",
  "spouseSpecial",
  "dependents",
  "donations",
  "disability",
  "singleParent",
  "widow",
  "workingStudent",
  "casualty",
  "other",
] as const;

export type DeductionKey = (typeof DEDUCTION_KEYS)[number];
export type DeductionValues = Record<DeductionKey, number>;

export interface SimulatorInput {
  year: TaxYear;
  currentMonth: number;
  businessStartYear: number;
  businessStartMonth: number;
  prefecture: string;
  municipality: string;
  age: number;
  filingType: FilingType;
  blueDeduction: BlueDeduction;
  inputMode: InputMode;
  cumulativeRevenue: number;
  monthlyRevenue: number[];
  otherBusinessRevenue: number;
  salesReturns: number;
  cumulativeExpenses: number;
  expenseValues: ExpenseValues;
  salaryIncome: number;
  otherIncome: number;
  deductions: DeductionValues;
  hometownDonation: number;
  socialInsuranceMode: SocialInsuranceMode;
  nationalHealthInsuranceAnnual: number;
  employeeSocialInsuranceAnnual: number;
  includeNationalPension: boolean;
  residentPerCapitaTaxApplies: boolean;
  businessTaxRate: BusinessTaxRate;
  consumptionTaxMethod: ConsumptionTaxMethod;
  invoiceRegistered: boolean;
  taxableBecauseOfInvoice: boolean;
  taxablePurchases: number;
  simplifiedBusinessType: 1 | 2 | 3 | 4 | 5 | 6;
  reservedFunds: number;
  scenarioExpenseIncrease: number;
  scenarioMutualAid: number;
  scenarioIdeco: number;
}

export interface TaxSource {
  title: string;
  publisher: string;
  url: string;
  checkedAt: string;
}

export interface BasicDeductionBracket {
  upTo: number;
  amount: number;
}

export interface IncomeTaxBracket {
  upTo: number;
  rate: number;
  deduction: number;
}

export interface TaxRules {
  year: TaxYear;
  label: string;
  verifiedAt: string;
  basicDeductions: BasicDeductionBracket[];
  incomeTaxBrackets: IncomeTaxBracket[];
  reconstructionIncomeTaxRate: number;
  blueDeductions: BlueDeduction[];
  residentTax: {
    incomeRate: number;
    basicDeductions: BasicDeductionBracket[];
    perCapitaTax: number;
    forestEnvironmentTax: number;
  };
  businessTax: {
    ownerDeductionByMonths: number[];
    supportedRates: BusinessTaxRate[];
  };
  consumptionTax: {
    standardRate: number;
    simplifiedPurchaseRatios: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
    twoTenthsAvailableThrough: TaxYear;
  };
  nationalPensionMonthly: number[];
  sources: TaxSource[];
}

export interface ConsumptionTaxResult {
  amount: number;
  outputTax: number;
  inputTaxCredit: number;
  method: ConsumptionTaxMethod;
  supported: boolean;
  explanation: string;
}

export interface TaxEstimate {
  mode: ProjectionMode;
  year: TaxYear;
  annualSales: number;
  annualExpenses: number;
  businessProfitBeforeBlue: number;
  appliedBlueDeduction: number;
  businessIncome: number;
  salaryIncome: number;
  otherIncome: number;
  totalIncome: number;
  basicDeduction: number;
  socialInsuranceDeduction: number;
  itemizedDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  reconstructionIncomeTax: number;
  residentIncomeTax: number;
  residentPerCapitaTax: number;
  forestEnvironmentTax: number;
  residentTax: number;
  businessTax: number;
  businessTaxOwnerDeduction: number;
  consumptionTax: number;
  consumptionTaxDetail: ConsumptionTaxResult;
  nationalHealthInsurance: number;
  nationalPension: number;
  employeeSocialInsurance: number;
  totalSocialInsurance: number;
  totalTax: number;
  totalBurden: number;
  takeHome: number;
  monthlyReserveNeeded: number;
  remainingToReserve: number;
  monthsRemaining: number;
  taxToSalesRate: number;
  taxToIncomeRate: number;
  totalBurdenRate: number;
  caveats: string[];
}

export interface MonthlyProjectionRow {
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
  reserve: number;
  status: "actual" | "forecast";
}

export interface ScenarioResult {
  id: "current" | "expense" | "mutual-aid" | "ideco";
  name: string;
  description: string;
  estimate: TaxEstimate;
  additionalCashOut: number;
  cashAfterContribution: number;
  taxDifference: number;
}
