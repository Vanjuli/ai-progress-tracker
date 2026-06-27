import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { isYearToDate, SeriesPoint } from "../lib/metrics";
import { yearOf } from "../lib/format";

interface Props {
  series: SeriesPoint[];
  color: string;
  height?: number;
  compact?: boolean;
  valueFormatter?: (v: number) => string;
  markYearToDate?: boolean;
}

interface Row {
  year: number;
  value: number;
  ytd: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  format: (v: number) => string;
}

function AreaTooltip({ active, payload, format }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="card" style={{ padding: "6px 10px" }}>
      <strong>{format(row.value)}</strong>
      <div className="small muted">
        {row.year}{row.ytd ? " YTD" : ""}
      </div>
      {row.ytd && <div className="small muted">year to date (in progress)</div>}
    </div>
  );
}

export function MetricArea({ series, color, height = 200, compact, valueFormatter, markYearToDate }: Props) {
  const fmt = valueFormatter ?? ((v: number) => String(v));
  if (series.length === 0) return <p className="muted small">No data.</p>;

  const rows: Row[] = [...series]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((p) => ({
      year: yearOf(p.period),
      value: p.value,
      ytd: !!markYearToDate && isYearToDate(p.period),
    }));

  const gradientId = `grad-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: compact ? 0 : -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        {!compact && <CartesianGrid stroke="#262c3a" strokeDasharray="3 3" />}
        {!compact && (
          <XAxis
            dataKey="year"
            stroke="#9aa3b2"
            fontSize={12}
            tickFormatter={(y) => {
              const row = rows.find((r) => r.year === y);
              return row?.ytd ? `${y} YTD` : String(y);
            }}
          />
        )}
        {!compact && <YAxis stroke="#9aa3b2" fontSize={12} width={46} tickFormatter={fmt} />}
        <Tooltip content={<AreaTooltip format={fmt} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
