import type { ConsumptionTaxMethod, ConsumptionTaxResult, TaxRules } from "./types";
import { nonNegative } from "./utils";

function includedTax(amount: number, rate: number): number {
  // Convert the configured decimal rate to an integer ratio before flooring.
  // Directly evaluating `amount * 0.1 / 1.1` can turn an exact 1,000,000
  // yen result into 999,999.999... because of binary floating-point error.
  const scale = 10_000;
  const rateUnits = Math.round(nonNegative(rate) * scale);
  if (rateUnits === 0) return 0;
  return Math.floor((nonNegative(amount) * rateUnits) / (scale + rateUnits));
}

export function calculateConsumptionTax(params: {
  taxableSales: number;
  taxablePurchases: number;
  method: ConsumptionTaxMethod;
  simplifiedBusinessType: 1 | 2 | 3 | 4 | 5 | 6;
  invoiceRegistered: boolean;
  taxableBecauseOfInvoice: boolean;
  rules: TaxRules;
}): ConsumptionTaxResult {
  const { rules, method } = params;
  const outputTax = includedTax(params.taxableSales, rules.consumptionTax.standardRate);

  if (method === "exempt") {
    return {
      amount: 0,
      outputTax,
      inputTaxCredit: 0,
      method,
      supported: !params.invoiceRegistered,
      explanation: "免税事業者として消費税の納付額を0円で表示しています。課税事業者に該当しないか確認してください。",
    };
  }

  if (method === "two-tenths") {
    const eligible =
      params.invoiceRegistered &&
      params.taxableBecauseOfInvoice &&
      rules.year <= rules.consumptionTax.twoTenthsAvailableThrough;
    const amount = eligible ? Math.floor(outputTax * 0.2) : 0;
    return {
      amount,
      outputTax,
      inputTaxCredit: eligible ? outputTax - amount : 0,
      method,
      supported: eligible,
      explanation: eligible
        ? "インボイス登録を機に免税事業者から課税事業者になった、という自己申告に基づき売上税額の2割で概算しています。"
        : "2割特例の自己確認条件を満たしていないため、自動計算の対象外です。",
    };
  }

  if (method === "simplified") {
    const ratio = rules.consumptionTax.simplifiedPurchaseRatios[params.simplifiedBusinessType];
    const inputTaxCredit = Math.floor(outputTax * ratio);
    return {
      amount: nonNegative(outputTax - inputTaxCredit),
      outputTax,
      inputTaxCredit,
      method,
      supported: true,
      explanation: `第${params.simplifiedBusinessType}種事業のみなし仕入率${Math.round(ratio * 100)}%を使った概算です。複数事業区分は対象外です。`,
    };
  }

  const inputTaxCredit = includedTax(params.taxablePurchases, rules.consumptionTax.standardRate);
  return {
    amount: nonNegative(outputTax - inputTaxCredit),
    outputTax,
    inputTaxCredit,
    method,
    supported: true,
    explanation:
      "売上・課税仕入れがすべて標準税率10%の税込金額で、仕入税額控除を全額受けられる前提の概算です。非課税・不課税取引や軽減税率は対象外です。",
  };
}
