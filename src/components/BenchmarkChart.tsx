import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataPoint } from "../lib/types";
import { dateToTime, formatMonthYear, formatScore } from "../lib/format";

interface Props {
  points: DataPoint[];
  unit: string;
  color: string;
  height?: number;
}

interface Row {
  t: number;
  score: number;
  model: string;
  org: string | null;
  date: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  unit: string;
}

function ChartTooltip({ active, payload, unit }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="card" style={{ padding: "8px 11px" }}>
      <strong>{row.model}</strong>
      {row.org && <span className="muted"> · {row.org}</span>}
      <div className="small">
        {formatScore(row.score, unit)} — {formatMonthYear(row.date)}
      </div>
    </div>
  );
}

export function BenchmarkChart({ points, unit, color, height = 240 }: Props) {
  if (points.length === 0) {
    return <p className="muted small">No verified data yet — be the first to add some.</p>;
  }

  const rows: Row[] = points.map((p) => ({
    t: dateToTime(p.achieved_on),
    score: Number(p.score),
    model: p.model_name,
    org: p.organization,
    date: p.achieved_on,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 14, bottom: 4, left: -10 }}>
        <CartesianGrid stroke="#262c3a" strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(t: number) => String(new Date(t).getUTCFullYear())}
          stroke="#9aa3b2"
          fontSize={12}
        />
        <YAxis stroke="#9aa3b2" fontSize={12} width={42} />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
