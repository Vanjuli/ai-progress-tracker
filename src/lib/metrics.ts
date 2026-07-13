// Pure helpers for time-series metrics (popularity, market value). Tested.

import { FieldMetric, MetricKey } from "./types";

export interface SeriesPoint {
  period: string; // ISO date
  value: number;
}

/** Extract a sorted {period, value} series for one field + metric. */
export function fieldSeries(
  metrics: FieldMetric[],
  fieldId: string,
  key: MetricKey
): SeriesPoint[] {
  return sortSeries(
    metrics
      .filter((m) => m.field_id === fieldId && m.metric_key === key)
      .map((m) => ({ period: m.period, value: m.value }))
  );
}

/** Sort ascending by period (does not mutate the input). */
export function sortSeries<T extends { period: string }>(series: T[]): T[] {
  return [...series].sort((a, b) => a.period.localeCompare(b.period));
}

export function firstValue(series: SeriesPoint[]): number | null {
  const s = sortSeries(series);
  return s.length ? s[0].value : null;
}

export function latestValue(series: SeriesPoint[]): number | null {
  const s = sortSeries(series);
  return s.length ? s[s.length - 1].value : null;
}

/** True when a yearly metric period belongs to the current calendar year. */
export function isYearToDate(period: string, now = new Date()): boolean {
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCFullYear() === now.getUTCFullYear();
}

/** True when a yearly metric period lies in a future calendar year (a forecast). */
export function isForecastPeriod(period: string, now = new Date()): boolean {
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCFullYear() > now.getUTCFullYear();
}

/** Drop forecast-year points so charts and stats stop at the current point in time. */
export function excludeForecasts<T extends { period: string }>(items: T[], now = new Date()): T[] {
  return items.filter((item) => !isForecastPeriod(item.period, now));
}

/** Recharts log scales can only plot finite positive numbers. */
export function logScaleValue(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/**
 * A stable positive domain for log charts. Falls back to a small generic range
 * when every selected point is zero, negative, or missing.
 */
export function logScaleDomain(values: Array<number | null | undefined>): [number, number] {
  const positives = values.filter((v): v is number => logScaleValue(v) !== null);
  if (positives.length === 0) return [1, 10];

  const min = Math.min(...positives);
  const max = Math.max(...positives);
  let lower = Math.pow(10, Math.floor(Math.log10(min)));
  let upper = Math.pow(10, Math.ceil(Math.log10(max)));
  if (lower === upper) {
    lower /= 10;
    upper *= 10;
  }
  return [lower, upper];
}

export interface GrowthOptions {
  /** Exclude the current in-progress year so YTD data is not compared to full prior years. */
  excludeYearToDate?: boolean;
  now?: Date;
}

function growthSeries(series: SeriesPoint[], options?: GrowthOptions): SeriesPoint[] {
  const sorted = sortSeries(series);
  if (!options?.excludeYearToDate) return sorted;
  return sorted.filter((point) => !isYearToDate(point.period, options.now));
}

/**
 * Total percentage growth from the first to the latest point.
 * Returns null when it can't be computed (empty series or a zero start).
 */
export function growthPct(series: SeriesPoint[], options?: GrowthOptions): number | null {
  const s = growthSeries(series, options);
  const first = firstValue(s);
  const last = latestValue(s);
  if (first === null || last === null || first === 0) return null;
  return ((last - first) / first) * 100;
}

/** Compound annual growth rate (%) across the series' span, or null. */
export function cagrPct(series: SeriesPoint[]): number | null {
  const s = sortSeries(series);
  if (s.length < 2) return null;
  const first = s[0].value;
  const last = s[s.length - 1].value;
  const years =
    (new Date(s[s.length - 1].period).getTime() - new Date(s[0].period).getTime()) /
    (365.25 * 24 * 3600 * 1000);
  if (first <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

/** Year label of the earliest point, for "since YYYY" captions. */
export function startYear(series: SeriesPoint[]): number | null {
  const f = sortSeries(series)[0];
  return f ? new Date(f.period).getUTCFullYear() : null;
}

/** Sum two series point-wise by period (assumes matching periods); used for totals. */
export function sumByPeriod(serieses: SeriesPoint[][]): SeriesPoint[] {
  const totals = new Map<string, number>();
  for (const series of serieses) {
    for (const p of series) {
      totals.set(p.period, (totals.get(p.period) ?? 0) + p.value);
    }
  }
  return sortSeries(
    Array.from(totals, ([period, value]) => ({ period, value }))
  );
}
