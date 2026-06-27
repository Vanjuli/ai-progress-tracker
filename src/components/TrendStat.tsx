import { formatGrowth } from "../lib/format";

interface Props {
  label: string;
  value: string;
  growth?: number | null;
  caption?: string;
  valueColor?: string;
}

export function TrendStat({ label, value, growth, caption, valueColor }: Props) {
  const positive = (growth ?? 0) >= 0;
  return (
    <div className="card stack" style={{ gap: 6 }}>
      <div className="small muted">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: valueColor }}>{value}</div>
      {growth != null ? (
        <div
          className="small"
          style={{ color: positive ? "var(--good)" : "var(--bad)", fontWeight: 700 }}
        >
          {formatGrowth(growth)}{" "}
          {caption && (
            <span className="muted" style={{ fontWeight: 400 }}>
              {caption}
            </span>
          )}
        </div>
      ) : (
        caption && <div className="small muted">{caption}</div>
      )}
    </div>
  );
}
