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

interface Props {
  fields: Field[]; // the selected fields to plot
  metrics: FieldMetric[]; // already filtered to a single metric_key
  valueFormatter: (v: number) => string;
  height?: number;
}

/** One line per field, sharing a year x-axis — for cross-field comparison. */
export function MultiLineChart({ fields, metrics, valueFormatter, height = 360 }: Props) {
  if (fields.length === 0) return <p className="muted small">Select at least one field to compare.</p>;

  const years = Array.from(new Set(metrics.map((m) => yearOf(m.period)))).sort((a, b) => a - b);
  const valueAt = (fieldId: string, year: number): number | null => {
    const m = metrics.find((mm) => mm.field_id === fieldId && yearOf(mm.period) === year);
    return m ? Number(m.value) : null;
  };
  const rows = years.map((year) => {
    const row: Record<string, number | null> = { year };
    for (const f of fields) row[f.slug] = valueAt(f.id, year);
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 6 }}>
        <CartesianGrid stroke="#262c3a" strokeDasharray="3 3" />
        <XAxis dataKey="year" stroke="#9aa3b2" fontSize={12} />
        <YAxis stroke="#9aa3b2" fontSize={12} width={58} tickFormatter={valueFormatter} />
        <Tooltip
          contentStyle={{ background: "#141821", border: "1px solid #262c3a", borderRadius: 8 }}
          formatter={(v: number, n: string) => [valueFormatter(v), n]}
          labelFormatter={(l) => `Year ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
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
