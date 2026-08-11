import type { BusinessTaxRate, TaxRules } from "./types";
import { clamp, floorToHundred, nonNegative } from "./utils";

export interface BusinessTaxResult {
  amount: number;
  taxableBase: number;
  ownerDeduction: number;
  businessMonths: number;
}

export function businessMonthsInYear(
  year: number,
  businessStartYear: number,
  businessStartMonth: number,
): number {
  if (businessStartYear < year) return 12;
  if (businessStartYear > year) return 0;
  return 13 - clamp(Math.trunc(businessStartMonth), 1, 12);
}

export function calculateBusinessTax(params: {
  profitBeforeBlueDeduction: number;
  rate: BusinessTaxRate;
  businessMonths: number;
  rules: TaxRules;
}): BusinessTaxResult {
  const months = clamp(Math.trunc(params.businessMonths), 0, 12);
  const ownerDeduction = params.rules.businessTax.ownerDeductionByMonths[months] ?? 0;
  if (months === 0) {
    return {
      amount: 0,
      taxableBase: 0,
      ownerDeduction,
      businessMonths: months,
    };
  }
  const taxableBase = nonNegative(params.profitBeforeBlueDeduction - ownerDeduction);
  return {
    amount: floorToHundred(taxableBase * params.rate),
    taxableBase,
    ownerDeduction,
    businessMonths: months,
  };
}
