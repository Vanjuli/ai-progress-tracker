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
import { isYearToDate } from "../lib/metrics";

interface Props {
  fields: Field[]; // the selected fields to plot
  metrics: FieldMetric[]; // already filtered to a single metric_key
  valueFormatter: (v: number) => string;
  height?: number;
  markYearToDate?: boolean;
}

/** One line per field, sharing a year x-axis — for cross-field comparison. */
export function MultiLineChart({ fields, metrics, valueFormatter, height = 360, markYearToDate }: Props) {
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
    for (const f of fields) row[f.slug] = valueAt(f.id, year);
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 6 }}>
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
        <YAxis stroke="var(--chart-axis)" fontSize={12} width={58} tickFormatter={valueFormatter} />
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
            strokeWidth={2.5}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
