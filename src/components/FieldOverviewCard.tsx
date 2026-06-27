import { Link } from "react-router-dom";
import { Field, FieldMetric } from "../lib/types";
import { fieldSeries, growthPct, isYearToDate, latestValue, startYear } from "../lib/metrics";
import { formatGrowth, formatUsdBillions } from "../lib/format";
import { MetricArea } from "./MetricArea";

export function FieldOverviewCard({ field, metrics }: { field: Field; metrics: FieldMetric[] }) {
  const market = fieldSeries(metrics, field.id, "market_value");
  const pop = fieldSeries(metrics, field.id, "popularity");
  const netWorth = latestValue(market);
  const popGrowth = growthPct(pop, { excludeYearToDate: true });
  const popLatestPoint = pop[pop.length - 1] ?? null;
  const popLatestYtd = popLatestPoint ? isYearToDate(popLatestPoint.period) : false;
  const since = startYear(pop);

  return (
    <Link to={`/field/${field.slug}`} className="card card-link stack">
      <div className="row" style={{ gap: 8 }}>
        <span
          style={{ width: 10, height: 10, borderRadius: "50%", background: field.color }}
        />
        <h3 style={{ margin: 0 }}>{field.name}</h3>
      </div>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 0 }}>
          <span className="small muted">Market value</span>
          <span style={{ fontSize: 22, fontWeight: 800 }}>
            {netWorth != null ? formatUsdBillions(netWorth) : "—"}
          </span>
        </div>
        <div className="stack" style={{ gap: 0, textAlign: "right" }}>
          <span className="small muted">Popularity</span>
          <span
            className="small"
            style={{
              color: (popGrowth ?? 0) >= 0 ? "var(--good)" : "var(--bad)",
              fontWeight: 700,
            }}
          >
            {formatGrowth(popGrowth)}
          </span>
        </div>
      </div>
      <MetricArea series={pop} color={field.color} height={68} compact markYearToDate />
      <span className="small muted">
        Usage trend since {since ?? "—"}{popLatestYtd ? " · current year YTD" : ""}
      </span>
    </Link>
  );
}
