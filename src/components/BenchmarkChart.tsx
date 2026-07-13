import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataPoint } from "../lib/types";
import { dateToTime, formatMonthYear, formatScore } from "../lib/format";
import { metricExplanation, metricLabel } from "../lib/benchmarkMetric";

interface Props {
  points: DataPoint[];
  unit: string;
  higherIsBetter: boolean;
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
  higherIsBetter: boolean;
}

function ChartTooltip({ active, payload, unit, higherIsBetter }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="card" style={{ padding: "8px 11px" }}>
      <strong>{row.model}</strong>
      {row.org && <span className="muted"> · {row.org}</span>}
      <div className="small">
        {metricLabel(unit, higherIsBetter)}: {formatScore(row.score, unit)}
      </div>
      <div className="small muted">Date: {formatMonthYear(row.date)}</div>
      <div className="small muted">{metricExplanation(unit, higherIsBetter)}</div>
    </div>
  );
}

export function BenchmarkChart({ points, unit, higherIsBetter, color, height = 240 }: Props) {
  if (points.length === 0) {
    return <p className="muted small">No curated data points yet.</p>;
  }

  const rows: Row[] = points.map((p) => ({
    t: dateToTime(p.achieved_on),
    score: Number(p.score),
    model: p.model_name,
    org: p.organization,
    date: p.achieved_on,
  }));

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="small muted">
        Score over time by year · {metricExplanation(unit, higherIsBetter)}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 18, bottom: 26, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => String(new Date(t).getUTCFullYear())}
            stroke="var(--chart-axis)"
            fontSize={12}
          >
            <Label value="Year" position="insideBottom" offset={-14} fill="var(--chart-axis)" />
          </XAxis>
          <YAxis stroke="var(--chart-axis)" fontSize={12} width={48}>
            <Label
              value={metricLabel(unit, higherIsBetter)}
              angle={-90}
              position="insideLeft"
              fill="var(--chart-axis)"
              style={{ textAnchor: "middle" }}
            />
          </YAxis>
          <Tooltip content={<ChartTooltip unit={unit} higherIsBetter={higherIsBetter} />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2.75}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
