// Small display helpers.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2023-03-14" -> "Mar 2023" */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  return `${MONTHS[(m - 1) % 12]} ${y}`;
}

/** Numeric timestamp for an ISO date, used as the chart's x-axis value. */
export function dateToTime(iso: string): number {
  return new Date(iso + "T00:00:00Z").getTime();
}

/** Year of an ISO date string. */
export function yearOf(iso: string): number {
  return new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).getUTCFullYear();
}

/** Market value given in USD billions -> "$260B" / "$1.2T". */
export function formatUsdBillions(billions: number): string {
  if (billions >= 1000) return `$${(billions / 1000).toFixed(billions >= 10000 ? 0 : 1)}T`;
  if (billions >= 10) return `$${Math.round(billions)}B`;
  if (billions >= 1) return `$${billions.toFixed(1)}B`;
  return `$${Math.round(billions * 1000)}M`;
}

/** Signed percentage with an arrow, e.g. "▲ +340%". */
export function formatGrowth(pct: number | null): string {
  if (pct === null) return "—";
  const arrow = pct >= 0 ? "▲" : "▼";
  const sign = pct >= 0 ? "+" : "";
  return `${arrow} ${sign}${Math.round(pct)}%`;
}

export function formatMetricValue(value: number, unit: string): string {
  if (unit === "USD_billion") return formatUsdBillions(value);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatScore(score: number, unit: string): string {
  const n = Number.isInteger(score) ? score : Number(score.toFixed(2));
  if (unit === "%") return `${n}%`;
  if (unit.startsWith("%")) return `${n}${unit.slice(1) ? " " + unit.slice(1).trim() : "%"}`;
  return `${n} ${unit}`.trim();
}
