import { describe, expect, it } from "vitest";

import {
  buildMonthlyProjection,
  cumulativeBusinessNumbers,
  projectBusinessNumbers,
} from "../projection";
import { EXPENSE_CATEGORIES, type ExpenseValues } from "../types";
import { makeInput } from "./testFixtures";

function expensesWith(other: number): ExpenseValues {
  return Object.fromEntries(
    EXPENSE_CATEGORIES.map((category) => [category, category === "other" ? other : 0]),
  ) as ExpenseValues;
}

describe("simple annual projection", () => {
  const input = makeInput({
    currentMonth: 4,
    cumulativeRevenue: 1_200_000,
    otherBusinessRevenue: 200_000,
    salesReturns: 100_000,
    cumulativeExpenses: 400_000,
  });

  it("nets other business revenue and sales returns into cumulative actuals", () => {
    expect(cumulativeBusinessNumbers(input)).toEqual({
      revenue: 1_300_000,
      expenses: 400_000,
    });
  });

  it("keeps cumulative numbers in actual mode", () => {
    expect(projectBusinessNumbers(input, "actual")).toEqual({
      sales: 1_300_000,
      expenses: 400_000,
      actualSales: 1_300_000,
      actualExpenses: 400_000,
    });
  });

  it("annualizes the pace through the current month in forecast mode", () => {
    expect(projectBusinessNumbers(input, "forecast")).toEqual({
      sales: 3_900_000,
      expenses: 1_200_000,
      actualSales: 1_300_000,
      actualExpenses: 400_000,
    });
  });

  it("builds twelve monthly rows whose totals reconcile to the forecast", () => {
    const rows = buildMonthlyProjection(input, 1_200_000);

    expect(rows).toHaveLength(12);
    expect(rows.slice(0, 4).every((row) => row.status === "actual")).toBe(true);
    expect(rows.slice(4).every((row) => row.status === "forecast")).toBe(true);
    expect(rows.reduce((total, row) => total + row.revenue, 0)).toBe(3_900_000);
    expect(rows.reduce((total, row) => total + row.expenses, 0)).toBe(1_200_000);
    expect(rows.every((row) => row.reserve === 100_000)).toBe(true);
  });

  it("absorbs per-row rounding in the final month so headline and rows still agree", () => {
    const unevenInput = makeInput({
      currentMonth: 3,
      cumulativeRevenue: 1_000_000,
      cumulativeExpenses: 500_001,
    });
    const rows = buildMonthlyProjection(unevenInput, 0);
    const forecast = projectBusinessNumbers(unevenInput, "forecast");

    expect(rows.reduce((total, row) => total + row.revenue, 0)).toBe(forecast.sales);
    expect(rows.reduce((total, row) => total + row.expenses, 0)).toBe(forecast.expenses);
  });
});

describe("detailed annual and monthly projection", () => {
  const monthlyRevenue = [
    100_000,
    200_000,
    300_000,
    0,
    500_000,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ];
  const input = makeInput({
    currentMonth: 3,
    inputMode: "detailed",
    monthlyRevenue,
    otherBusinessRevenue: 60_000,
    salesReturns: 10_000,
    expenseValues: expensesWith(300_000),
  });

  it("uses entered months and category totals for cumulative actuals", () => {
    expect(cumulativeBusinessNumbers(input)).toEqual({
      revenue: 650_000,
      expenses: 300_000,
    });
  });

  it("keeps entered future months and fills blank future months with the actual average", () => {
    expect(projectBusinessNumbers(input, "forecast")).toEqual({
      sales: 2_750_000,
      expenses: 1_200_000,
      actualSales: 650_000,
      actualExpenses: 300_000,
    });
  });

  it("preserves entered detailed months and distinguishes actual from forecast rows", () => {
    const rows = buildMonthlyProjection(input, 600_000);

    expect(rows[0]).toMatchObject({ month: 1, revenue: 100_000, status: "actual" });
    expect(rows[1]).toMatchObject({ month: 2, revenue: 200_000, status: "actual" });
    expect(rows[2]).toMatchObject({ month: 3, revenue: 350_000, status: "actual" });
    expect(rows[3]).toMatchObject({ month: 4, revenue: 200_000, status: "forecast" });
    expect(rows[4]).toMatchObject({ month: 5, revenue: 500_000, status: "forecast" });
    expect(rows.every((row) => row.reserve === 50_000)).toBe(true);
  });

  it("reconciles detailed monthly rows to the annual forecast", () => {
    const rows = buildMonthlyProjection(input, 600_000);
    const forecast = projectBusinessNumbers(input, "forecast");

    expect(rows.reduce((total, row) => total + row.revenue, 0)).toBe(forecast.sales);
    expect(rows.reduce((total, row) => total + row.expenses, 0)).toBe(forecast.expenses);
  });
});

describe("projection for a business opened during 2026", () => {
  it("annualizes only across operating months and leaves pre-opening rows at zero", () => {
    const input = makeInput({
      currentMonth: 8,
      businessStartYear: 2026,
      businessStartMonth: 7,
      cumulativeRevenue: 2_000_000,
      cumulativeExpenses: 600_000,
    });

    expect(projectBusinessNumbers(input, "forecast")).toEqual({
      sales: 6_000_000,
      expenses: 1_800_000,
      actualSales: 2_000_000,
      actualExpenses: 600_000,
    });

    const rows = buildMonthlyProjection(input, 600_000);
    expect(rows.slice(0, 6).every((row) => row.revenue === 0 && row.expenses === 0)).toBe(true);
    expect(rows.slice(6).every((row) => row.revenue === 1_000_000)).toBe(true);
    expect(rows.slice(6).every((row) => row.expenses === 300_000)).toBe(true);
    expect(rows.reduce((total, row) => total + row.revenue, 0)).toBe(6_000_000);
    expect(rows.reduce((total, row) => total + row.expenses, 0)).toBe(1_800_000);
  });

  it("ignores detailed revenue entered before the opening month", () => {
    const monthlyRevenue = Array(12).fill(0);
    monthlyRevenue[0] = 999_999;
    monthlyRevenue[6] = 800_000;
    monthlyRevenue[7] = 1_200_000;
    const input = makeInput({
      currentMonth: 8,
      businessStartYear: 2026,
      businessStartMonth: 7,
      inputMode: "detailed",
      monthlyRevenue,
    });

    expect(cumulativeBusinessNumbers(input).revenue).toBe(2_000_000);
    expect(projectBusinessNumbers(input, "forecast").sales).toBe(6_000_000);
    expect(buildMonthlyProjection(input, 0)[0].revenue).toBe(0);
  });
});
