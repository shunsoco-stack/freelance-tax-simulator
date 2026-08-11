import type { TaxRules, TaxYear } from "../types";
import { rules2026 } from "./2026";

const rulesByYear: Record<TaxYear, TaxRules> = {
  2026: rules2026,
};

export function getTaxRules(year: TaxYear): TaxRules {
  return rulesByYear[year];
}

export { rules2026 };
