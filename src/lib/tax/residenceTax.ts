import type { TaxRules } from "./types";
import { floorToHundred, floorToThousand, nonNegative } from "./utils";

export interface ResidenceTaxResult {
  taxableIncome: number;
  incomeTax: number;
  perCapitaTax: number;
  forestEnvironmentTax: number;
  total: number;
}

export function calculateResidenceTax(params: {
  totalIncome: number;
  commonDeductions: number;
  perCapitaTaxApplies: boolean;
  rules: TaxRules;
}): ResidenceTaxResult {
  const { totalIncome, commonDeductions, perCapitaTaxApplies, rules } = params;
  const basicDeduction =
    rules.residentTax.basicDeductions.find((bracket) => totalIncome <= bracket.upTo)?.amount ?? 0;
  const taxableIncome = floorToThousand(
    nonNegative(totalIncome - basicDeduction - commonDeductions),
  );
  const incomeTax = floorToHundred(taxableIncome * rules.residentTax.incomeRate);
  const perCapitaTax = perCapitaTaxApplies ? rules.residentTax.perCapitaTax : 0;
  const forestEnvironmentTax = perCapitaTaxApplies ? rules.residentTax.forestEnvironmentTax : 0;

  return {
    taxableIncome,
    incomeTax,
    perCapitaTax,
    forestEnvironmentTax,
    total: incomeTax + perCapitaTax + forestEnvironmentTax,
  };
}
