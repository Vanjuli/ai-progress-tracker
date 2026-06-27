import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Field, FieldMetric } from "../lib/types";
import { formatUsdBillions, yearOf } from "../lib/format";

interface Props {
  fields: Field[];
  metrics: FieldMetric[];
  height?: number;
}

/** Stacked area of market value (USD billions) by field over time. */
export function StackedMarketChart({ fields, metrics, height = 300 }: Props) {
  const market = metrics.filter((m) => m.metric_key === "market_value");
  if (market.length === 0) return <p className="muted small">No market data.</p>;

  const years = Array.from(new Set(market.map((m) => yearOf(m.period)))).sort((a, b) => a - b);

  const valueAt = (fieldId: string, year: number): number =>
    market.find((m) => m.field_id === fieldId && yearOf(m.period) === year)?.value ?? 0;

  const rows = years.map((year) => {
    const row: Record<string, number> = { year };
    for (const f of fields) row[f.slug] = valueAt(f.id, year);
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="#262c3a" strokeDasharray="3 3" />
        <XAxis dataKey="year" stroke="#9aa3b2" fontSize={12} />
        <YAxis
          stroke="#9aa3b2"
          fontSize={12}
          width={52}
          tickFormatter={(v: number) => formatUsdBillions(v)}
        />
        <Tooltip
          contentStyle={{ background: "#141821", border: "1px solid #262c3a", borderRadius: 8 }}
          formatter={(value: number, name: string) => [formatUsdBillions(value), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {fields.map((f) => (
          <Area
            key={f.id}
            type="monotone"
            dataKey={f.slug}
            name={f.name}
            stackId="1"
            stroke={f.color}
            fill={f.color}
            fillOpacity={0.5}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
