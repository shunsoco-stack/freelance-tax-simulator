import type { MonthlyProjectionRow, ProjectionMode, SimulatorInput } from "./types";
import { clamp, nonNegative, sum } from "./utils";

export interface ProjectedBusinessNumbers {
  sales: number;
  expenses: number;
  actualSales: number;
  actualExpenses: number;
}

interface BusinessMonthWindow {
  firstMonth: number;
  elapsedMonths: number;
  totalMonths: number;
}

function businessMonthWindow(input: SimulatorInput): BusinessMonthWindow {
  const currentMonth = clamp(Math.trunc(input.currentMonth), 1, 12);
  const firstMonth =
    input.businessStartYear < input.year
      ? 1
      : input.businessStartYear > input.year
        ? 13
        : clamp(Math.trunc(input.businessStartMonth), 1, 12);

  return {
    firstMonth,
    elapsedMonths:
      firstMonth <= currentMonth ? currentMonth - firstMonth + 1 : 0,
    totalMonths: firstMonth <= 12 ? 13 - firstMonth : 0,
  };
}

export function cumulativeBusinessNumbers(input: SimulatorInput): {
  revenue: number;
  expenses: number;
} {
  const month = clamp(Math.trunc(input.currentMonth), 1, 12);
  const { firstMonth } = businessMonthWindow(input);
  const revenueBase =
    input.inputMode === "detailed"
      ? sum(input.monthlyRevenue.slice(firstMonth - 1, month))
      : nonNegative(input.cumulativeRevenue);
  const expenses =
    input.inputMode === "detailed"
      ? sum(Object.values(input.expenseValues))
      : nonNegative(input.cumulativeExpenses);
  return {
    revenue: nonNegative(revenueBase + input.otherBusinessRevenue - input.salesReturns),
    expenses,
  };
}

export function projectBusinessNumbers(
  input: SimulatorInput,
  mode: ProjectionMode,
): ProjectedBusinessNumbers {
  const cumulative = cumulativeBusinessNumbers(input);
  const window = businessMonthWindow(input);

  if (mode === "actual") {
    return {
      sales: cumulative.revenue,
      expenses: cumulative.expenses,
      actualSales: cumulative.revenue,
      actualExpenses: cumulative.expenses,
    };
  }

  const sales =
    input.inputMode === "detailed"
      ? projectMonthlyRevenue(input, cumulative.revenue, window)
      : annualizeForBusinessWindow(cumulative.revenue, window);
  const expenses = annualizeForBusinessWindow(cumulative.expenses, window);

  return {
    sales,
    expenses,
    actualSales: cumulative.revenue,
    actualExpenses: cumulative.expenses,
  };
}

function annualizeForBusinessWindow(
  cumulativeAmount: number,
  window: BusinessMonthWindow,
): number {
  if (window.elapsedMonths === 0) return cumulativeAmount;
  return Math.round((cumulativeAmount / window.elapsedMonths) * window.totalMonths);
}

function projectMonthlyRevenue(
  input: SimulatorInput,
  cumulativeRevenue: number,
  window: BusinessMonthWindow,
): number {
  const month = clamp(Math.trunc(input.currentMonth), 1, 12);
  const enteredActual = sum(input.monthlyRevenue.slice(window.firstMonth - 1, month));
  const average = window.elapsedMonths > 0 ? enteredActual / window.elapsedMonths : 0;
  const future = input.monthlyRevenue
    .slice(month)
    .reduce((total, value, index) => {
      const monthNumber = month + index + 1;
      if (monthNumber < window.firstMonth) return total;
      return total + (value > 0 ? value : average);
    }, 0);
  const adjustments = cumulativeRevenue - enteredActual;
  return Math.round(enteredActual + future + adjustments);
}

export function buildMonthlyProjection(
  input: SimulatorInput,
  annualBurden: number,
): MonthlyProjectionRow[] {
  const month = clamp(Math.trunc(input.currentMonth), 1, 12);
  const cumulative = cumulativeBusinessNumbers(input);
  const window = businessMonthWindow(input);
  const enteredActualRevenue = sum(
    input.monthlyRevenue.slice(window.firstMonth - 1, month),
  );
  const averageRevenue =
    input.inputMode === "detailed"
      ? window.elapsedMonths > 0
        ? enteredActualRevenue / window.elapsedMonths
        : 0
      : window.elapsedMonths > 0
        ? cumulative.revenue / window.elapsedMonths
        : 0;
  const detailedRevenueAdjustment = cumulative.revenue - enteredActualRevenue;
  const averageExpenses =
    window.elapsedMonths > 0 ? cumulative.expenses / window.elapsedMonths : 0;

  const rows: MonthlyProjectionRow[] = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const isActual = monthNumber <= month;
    const isBusinessMonth = monthNumber >= window.firstMonth;
    const enteredRevenue = input.monthlyRevenue[index] ?? 0;
    const baseRevenue =
      !isBusinessMonth
        ? 0
        : input.inputMode === "detailed"
        ? enteredRevenue > 0 || isActual
          ? enteredRevenue
          : averageRevenue
        : averageRevenue;
    // Other business revenue and sales returns are annual/cumulative inputs,
    // not a new amount to repeat in every forecast month. Attach their net
    // adjustment once to the latest actual row so monthly rows reconcile to
    // projectBusinessNumbers while preserving all explicitly entered months.
    const revenue =
      input.inputMode === "detailed" &&
      window.elapsedMonths > 0 &&
      monthNumber === month
        ? baseRevenue + detailedRevenueAdjustment
        : baseRevenue;
    const expenses = isBusinessMonth ? averageExpenses : 0;
    return {
      month: monthNumber,
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      profit: Math.round(revenue - expenses),
      reserve: Math.round(annualBurden / 12),
      status: isActual ? "actual" : "forecast",
    };
  });

  // Rounding each displayed month independently can otherwise leave the
  // chart a few yen away from the headline annual forecast. Put that tiny
  // residual in the last active month so both views always reconcile.
  if (window.totalMonths > 0) {
    const annual = projectBusinessNumbers(input, "forecast");
    const reconciliationRow = rows[11];
    reconciliationRow.revenue +=
      annual.sales - rows.reduce((total, row) => total + row.revenue, 0);
    reconciliationRow.expenses +=
      annual.expenses - rows.reduce((total, row) => total + row.expenses, 0);
    reconciliationRow.profit = reconciliationRow.revenue - reconciliationRow.expenses;
  }

  return rows;
}
