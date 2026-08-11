import type { TaxRules } from "./types";
import { floorToThousand, nonNegative } from "./utils";

export function calculateBasicDeduction(totalIncome: number, rules: TaxRules): number {
  return rules.basicDeductions.find((bracket) => totalIncome <= bracket.upTo)?.amount ?? 0;
}

export function calculateIncomeTax(taxableIncome: number, rules: TaxRules): number {
  const roundedTaxableIncome = floorToThousand(taxableIncome);
  const bracket = rules.incomeTaxBrackets.find((entry) => roundedTaxableIncome <= entry.upTo);
  if (!bracket) return 0;
  return Math.floor(nonNegative(roundedTaxableIncome * bracket.rate - bracket.deduction));
}

export function calculateReconstructionIncomeTax(incomeTax: number, rules: TaxRules): number {
  return Math.floor(nonNegative(incomeTax) * rules.reconstructionIncomeTaxRate);
}
