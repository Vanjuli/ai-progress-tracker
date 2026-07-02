import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Field, FieldMetric } from "../lib/types";
import { yearOf } from "../lib/format";
import { isYearToDate, logScaleDomain, logScaleValue } from "../lib/metrics";

export type YScale = "linear" | "log";

interface Props {
  fields: Field[]; // the selected fields to plot
  metrics: FieldMetric[]; // already filtered to a single metric_key
  valueFormatter: (v: number) => string;
  height?: number;
  markYearToDate?: boolean;
  yScale?: YScale;
}

/** One line per field, sharing a year x-axis — for cross-field comparison. */
export function MultiLineChart({ fields, metrics, valueFormatter, height = 360, markYearToDate, yScale = "linear" }: Props) {
  if (fields.length === 0) return <p className="muted small">Select at least one field to compare.</p>;

  const years = Array.from(new Set(metrics.map((m) => yearOf(m.period)))).sort((a, b) => a - b);
  const valueAt = (fieldId: string, year: number): number | null => {
    const m = metrics.find((mm) => mm.field_id === fieldId && yearOf(mm.period) === year);
    return m ? Number(m.value) : null;
  };
  const rows = years.map((year) => {
    const row: Record<string, number | boolean | null> = {
      year,
      ytd: !!markYearToDate && metrics.some((m) => yearOf(m.period) === year && isYearToDate(m.period)),
    };
    for (const f of fields) {
      const value = valueAt(f.id, year);
      row[f.slug] = yScale === "log" ? logScaleValue(value) : value;
    }
    return row;
  });

  const yValues = rows.flatMap((row) => fields.map((f) => row[f.slug] as number | null));
  const yAxisProps =
    yScale === "log"
      ? { scale: "log" as const, domain: logScaleDomain(yValues), allowDataOverflow: false }
      : {};

  return (
    <div className="chart-scroll">
      <div className="chart-min" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          stroke="var(--chart-axis)"
          fontSize={12}
          tickFormatter={(y) => {
            const row = rows.find((r) => r.year === y);
            return row?.ytd ? `${y} YTD` : String(y);
          }}
        />
        <YAxis stroke="var(--chart-axis)" fontSize={12} width={58} tickFormatter={valueFormatter} {...yAxisProps} />
        <Tooltip
          contentStyle={{
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
          }}
          formatter={(v: number, n: string) => [valueFormatter(v), n]}
          labelFormatter={(l) => {
            const row = rows.find((r) => r.year === l);
            return row?.ytd ? `Year ${l} YTD — year to date (in progress)` : `Year ${l}`;
          }}
        />
        <Legend wrapperStyle={{ color: "var(--text-dim)", fontSize: 12 }} />
        {fields.map((f) => (
          <Line
            key={f.id}
            type="monotone"
            dataKey={f.slug}
            name={f.name}
            stroke={f.color}
            strokeWidth={2.75}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
