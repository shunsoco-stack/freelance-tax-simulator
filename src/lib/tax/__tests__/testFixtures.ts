import { createBlankInput } from "../sampleData";
import type { SimulatorInput } from "../types";

export function makeInput(overrides: Partial<SimulatorInput> = {}): SimulatorInput {
  return {
    ...createBlankInput(),
    currentMonth: 12,
    businessStartYear: 2020,
    businessStartMonth: 1,
    inputMode: "simple",
    cumulativeRevenue: 0,
    cumulativeExpenses: 0,
    salaryIncome: 0,
    otherIncome: 0,
    socialInsuranceMode: "none",
    nationalHealthInsuranceAnnual: 0,
    employeeSocialInsuranceAnnual: 0,
    includeNationalPension: false,
    residentPerCapitaTaxApplies: false,
    businessTaxRate: 0,
    consumptionTaxMethod: "exempt",
    invoiceRegistered: false,
    taxableBecauseOfInvoice: false,
    taxablePurchases: 0,
    reservedFunds: 0,
    ...overrides,
  };
}
