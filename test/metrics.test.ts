import { describe, it, expect } from "vitest";
import {
  growthPct,
  latestValue,
  firstValue,
  startYear,
  sumByPeriod,
  cagrPct,
  isYearToDate,
} from "../src/lib/metrics";

const series = [
  { period: "2020-01-01", value: 10 },
  { period: "2022-01-01", value: 40 },
  { period: "2021-01-01", value: 20 },
];

describe("series helpers", () => {
  it("finds first and latest by period regardless of input order", () => {
    expect(firstValue(series)).toBe(10);
    expect(latestValue(series)).toBe(40);
    expect(startYear(series)).toBe(2020);
  });

  it("computes total growth percentage", () => {
    expect(growthPct(series)).toBe(300); // 10 -> 40
  });

  it("returns null growth for empty or zero-start series", () => {
    expect(growthPct([])).toBeNull();
    expect(growthPct([{ period: "2020-01-01", value: 0 }])).toBeNull();
  });

  it("computes a positive CAGR over the span", () => {
    const c = cagrPct(series);
    expect(c).not.toBeNull();
    expect(c as number).toBeGreaterThan(0);
  });

  it("sums multiple series point-wise by period", () => {
    const total = sumByPeriod([
      [
        { period: "2020-01-01", value: 1 },
        { period: "2021-01-01", value: 2 },
      ],
      [
        { period: "2020-01-01", value: 10 },
        { period: "2021-01-01", value: 20 },
      ],
    ]);
    expect(total).toEqual([
      { period: "2020-01-01", value: 11 },
      { period: "2021-01-01", value: 22 },
    ]);
  });

  it("identifies current-year data points as year-to-date", () => {
    const now = new Date("2026-06-27T12:00:00Z");

    expect(isYearToDate("2026-01-01", now)).toBe(true);
    expect(isYearToDate("2026-12-31", now)).toBe(true);
    expect(isYearToDate("2025-01-01", now)).toBe(false);
    expect(isYearToDate("not-a-date", now)).toBe(false);
  });

  it("can exclude the current year from growth calculations", () => {
    const now = new Date("2026-06-27T12:00:00Z");
    const withPartialYear = [
      { period: "2024-01-01", value: 100 },
      { period: "2025-01-01", value: 200 },
      { period: "2026-01-01", value: 80 },
    ];

    expect(growthPct(withPartialYear)).toBe(-20);
    expect(growthPct(withPartialYear, { excludeYearToDate: true, now })).toBe(100);
  });
});
