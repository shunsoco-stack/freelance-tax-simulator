import { businessMonthsInYear, calculateBusinessTax } from "./businessTax";
import { calculateConsumptionTax } from "./consumptionTax";
import {
  calculateBasicDeduction,
  calculateIncomeTax,
  calculateReconstructionIncomeTax,
} from "./incomeTax";
import { projectBusinessNumbers } from "./projection";
import { calculateResidenceTax } from "./residenceTax";
import { getTaxRules } from "./taxRules";
import { DEDUCTION_KEYS, type ProjectionMode, type SimulatorInput, type TaxEstimate } from "./types";
import { clamp, nonNegative, safeRate, sum } from "./utils";

export function calculateTaxEstimate(
  input: SimulatorInput,
  mode: ProjectionMode = "forecast",
): TaxEstimate {
  const rules = getTaxRules(input.year);
  const projected = projectBusinessNumbers(input, mode);
  const businessProfitBeforeBlue = projected.sales - projected.expenses;
  const requestedBlueDeduction = input.filingType === "blue" ? input.blueDeduction : 0;
  const appliedBlueDeduction = Math.min(nonNegative(businessProfitBeforeBlue), requestedBlueDeduction);
  const businessIncome = businessProfitBeforeBlue - appliedBlueDeduction;
  const totalIncome = nonNegative(businessIncome + input.salaryIncome + input.otherIncome);

  const nationalPension =
    input.socialInsuranceMode === "national" && input.includeNationalPension
      ? sum(rules.nationalPensionMonthly)
      : 0;
  const nationalHealthInsurance =
    input.socialInsuranceMode === "national" ? nonNegative(input.nationalHealthInsuranceAnnual) : 0;
  const employeeSocialInsurance =
    input.socialInsuranceMode === "employee" ? nonNegative(input.employeeSocialInsuranceAnnual) : 0;
  const totalSocialInsurance =
    nationalPension + nationalHealthInsurance + employeeSocialInsurance;

  const itemizedDeductions = DEDUCTION_KEYS.reduce(
    (total, key) => total + nonNegative(input.deductions[key]),
    0,
  );
  const basicDeduction = calculateBasicDeduction(totalIncome, rules);
  const totalDeductions = basicDeduction + totalSocialInsurance + itemizedDeductions;
  const taxableIncome = nonNegative(totalIncome - totalDeductions);
  const incomeTax = calculateIncomeTax(taxableIncome, rules);
  const reconstructionIncomeTax = calculateReconstructionIncomeTax(incomeTax, rules);

  const resident = calculateResidenceTax({
    totalIncome,
    commonDeductions: totalSocialInsurance + itemizedDeductions,
    perCapitaTaxApplies: input.residentPerCapitaTaxApplies,
    rules,
  });

  const months = businessMonthsInYear(
    input.year,
    input.businessStartYear,
    input.businessStartMonth,
  );
  const businessTaxResult = calculateBusinessTax({
    profitBeforeBlueDeduction: businessProfitBeforeBlue,
    rate: input.businessTaxRate,
    businessMonths: months,
    rules,
  });

  const consumptionTaxDetail = calculateConsumptionTax({
    taxableSales: projected.sales,
    taxablePurchases: input.taxablePurchases,
    method: input.consumptionTaxMethod,
    simplifiedBusinessType: input.simplifiedBusinessType,
    invoiceRegistered: input.invoiceRegistered,
    taxableBecauseOfInvoice: input.taxableBecauseOfInvoice,
    rules,
  });

  const totalTax =
    incomeTax +
    reconstructionIncomeTax +
    resident.total +
    businessTaxResult.amount +
    consumptionTaxDetail.amount;
  const totalBurden = totalTax + totalSocialInsurance;
  const takeHome = businessProfitBeforeBlue + input.salaryIncome + input.otherIncome - totalBurden;
  const monthsRemaining = Math.max(1, 12 - clamp(Math.trunc(input.currentMonth), 1, 12));
  const remainingToReserve = nonNegative(totalBurden - input.reservedFunds);

  const caveats = [
    "住民税は標準税率での概算です。調整控除・非課税判定・自治体独自の税額は反映していません。",
    "国民健康保険は自治体・世帯構成で差が大きいため、自動計算せず入力額を使用します。",
    "給与所得は給与収入ではなく、給与所得控除後の所得額を入力する方式です。",
    "ふるさと納税の住民税特例控除、住宅ローン控除、分離課税、予定納税、源泉徴収済額は対象外です。",
  ];
  if (!consumptionTaxDetail.supported) {
    caveats.unshift("選択した消費税特例は自己確認条件を満たしていないため0円表示です。公的情報を確認してください。");
  }

  return {
    mode,
    year: input.year,
    annualSales: projected.sales,
    annualExpenses: projected.expenses,
    businessProfitBeforeBlue,
    appliedBlueDeduction,
    businessIncome,
    salaryIncome: nonNegative(input.salaryIncome),
    otherIncome: nonNegative(input.otherIncome),
    totalIncome,
    basicDeduction,
    socialInsuranceDeduction: totalSocialInsurance,
    itemizedDeductions,
    totalDeductions,
    taxableIncome,
    incomeTax,
    reconstructionIncomeTax,
    residentIncomeTax: resident.incomeTax,
    residentPerCapitaTax: resident.perCapitaTax,
    forestEnvironmentTax: resident.forestEnvironmentTax,
    residentTax: resident.total,
    businessTax: businessTaxResult.amount,
    businessTaxOwnerDeduction: businessTaxResult.ownerDeduction,
    consumptionTax: consumptionTaxDetail.amount,
    consumptionTaxDetail,
    nationalHealthInsurance,
    nationalPension,
    employeeSocialInsurance,
    totalSocialInsurance,
    totalTax,
    totalBurden,
    takeHome,
    monthlyReserveNeeded: Math.ceil(remainingToReserve / monthsRemaining),
    remainingToReserve,
    monthsRemaining,
    taxToSalesRate: safeRate(totalTax, projected.sales),
    taxToIncomeRate: safeRate(totalTax, totalIncome),
    totalBurdenRate: safeRate(totalBurden, totalIncome),
    caveats,
  };
}
