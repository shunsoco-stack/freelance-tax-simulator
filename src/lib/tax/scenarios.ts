import { calculateTaxEstimate } from "./calculator";
import type { ScenarioResult, SimulatorInput } from "./types";

export function calculateScenarios(input: SimulatorInput): ScenarioResult[] {
  const current = calculateTaxEstimate(input, "forecast");

  const scenarios: Array<{
    id: ScenarioResult["id"];
    name: string;
    description: string;
    input: SimulatorInput;
    additionalCashOut: number;
    contributionOnly: boolean;
  }> = [
    {
      id: "current",
      name: "現在の予測",
      description: "入力中の条件",
      input,
      additionalCashOut: 0,
      contributionOnly: false,
    },
    {
      id: "expense",
      name: "追加支出",
      description: `必要経費を${input.scenarioExpenseIncrease.toLocaleString("ja-JP")}円追加`,
      input: {
        ...input,
        cumulativeExpenses:
          input.inputMode === "simple"
            ? input.cumulativeExpenses + (input.scenarioExpenseIncrease * input.currentMonth) / 12
            : input.cumulativeExpenses,
        expenseValues:
          input.inputMode === "detailed"
            ? {
                ...input.expenseValues,
                other:
                  input.expenseValues.other +
                  (input.scenarioExpenseIncrease * input.currentMonth) / 12,
              }
            : input.expenseValues,
      },
      additionalCashOut: input.scenarioExpenseIncrease,
      contributionOnly: false,
    },
    {
      id: "mutual-aid",
      name: "小規模企業共済",
      description: `年間掛金${input.scenarioMutualAid.toLocaleString("ja-JP")}円`,
      input: {
        ...input,
        deductions: {
          ...input.deductions,
          smallBusinessMutualAid:
            input.deductions.smallBusinessMutualAid + input.scenarioMutualAid,
        },
      },
      additionalCashOut: input.scenarioMutualAid,
      contributionOnly: true,
    },
    {
      id: "ideco",
      name: "iDeCo",
      description: `年間掛金${input.scenarioIdeco.toLocaleString("ja-JP")}円`,
      input: {
        ...input,
        deductions: {
          ...input.deductions,
          ideco: input.deductions.ideco + input.scenarioIdeco,
        },
      },
      additionalCashOut: input.scenarioIdeco,
      contributionOnly: true,
    },
  ];

  return scenarios.map((scenario) => {
    const estimate = calculateTaxEstimate(scenario.input, "forecast");
    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      estimate,
      additionalCashOut: scenario.additionalCashOut,
      cashAfterContribution:
        estimate.takeHome - (scenario.contributionOnly ? scenario.additionalCashOut : 0),
      taxDifference: current.totalTax - estimate.totalTax,
    };
  });
}
