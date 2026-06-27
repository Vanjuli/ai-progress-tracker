import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../context/AuthContext";
import { BenchmarkCard } from "../components/BenchmarkCard";
import { FieldOverviewCard } from "../components/FieldOverviewCard";
import { StackedMarketChart } from "../components/StackedMarketChart";
import { TrendStat } from "../components/TrendStat";
import { Field } from "../lib/types";
import {
  fieldSeries,
  growthPct,
  isYearToDate,
  latestValue,
  startYear,
  sumByPeriod,
} from "../lib/metrics";
import { formatUsdBillions } from "../lib/format";

export function HomePage() {
  const { demo } = useAuth();
  const fields = useAsync(() => api.getFields(), []);
  const benchmarks = useAsync(() => api.getAllBenchmarks(), []);
  const metrics = useAsync(() => api.getFieldMetrics(), []);

  const fieldList = fields.data ?? [];
  const metricList = metrics.data ?? [];
  const fieldById: Record<string, Field> = {};
  for (const f of fieldList) fieldById[f.id] = f;

  // Aggregate "State of AI" figures.
  const marketSerieses = fieldList.map((f) => fieldSeries(metricList, f.id, "market_value"));
  const popSerieses = fieldList.map((f) => fieldSeries(metricList, f.id, "popularity"));
  const totalMarket = sumByPeriod(marketSerieses);
  const totalPop = sumByPeriod(popSerieses);
  const totalMarketLatest = latestValue(totalMarket);
  const totalPopLatestPoint = totalPop[totalPop.length - 1] ?? null;
  const totalPopLatestYtd = totalPopLatestPoint ? isYearToDate(totalPopLatestPoint.period) : false;
  const since = startYear(totalMarket);
  const popSince = startYear(totalPop);

  // Fastest-growing field by market value.
  let fastest: { name: string; growth: number } | null = null;
  for (const f of fieldList) {
    const g = growthPct(fieldSeries(metricList, f.id, "market_value"));
    if (g != null && (!fastest || g > fastest.growth)) fastest = { name: f.name, growth: g };
  }

  const sinceCaption = since ? `since ${since}` : undefined;
  const popSinceCaption = popSince ? `since ${popSince}` : undefined;
  const popTrendCaption = totalPopLatestYtd
    ? [popSinceCaption, "current year is YTD"].filter(Boolean).join(" · ")
    : popSinceCaption;

  return (
    <>
      <section className="hero">
        <h1>Tracking AI progress, together</h1>
        <p>
          How fast is AI really improving — and growing? This dashboard charts benchmark
          performance, popularity, and market value across AI fields over time, built
          from data the community submits and verifies.
        </p>
        <div className="row" style={{ marginTop: 18 }}>
          <Link className="btn btn-primary" to="/submit">
            Submit a data point
          </Link>
          <Link className="btn" to="/pending">
            Help verify submissions
          </Link>
        </div>
      </section>

      {demo && (
        <div className="banner">
          You're viewing <strong>demo mode</strong> with bundled sample data. Voting and
          submissions are saved only in this browser. Connect a Supabase project (see the
          README) to go live with real accounts and a shared database.
        </div>
      )}

      <section className="section">
        <h2>State of AI</h2>
        {metrics.loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <div className="grid">
              <TrendStat
                label="Total AI market value"
                value={totalMarketLatest != null ? formatUsdBillions(totalMarketLatest) : "—"}
                growth={growthPct(totalMarket)}
                caption={sinceCaption}
                valueColor="#a5b4fc"
              />
              <TrendStat
                label="AI research output (arXiv papers/yr)"
                value={
                  latestValue(totalPop) != null
                    ? `${Math.round(latestValue(totalPop)!).toLocaleString()}${totalPopLatestYtd ? " YTD" : ""}`
                    : "—"
                }
                growth={growthPct(totalPop, { excludeYearToDate: true })}
                caption={popTrendCaption}
                valueColor="#6ee7b7"
              />
              <TrendStat
                label="Fastest-growing field"
                value={fastest ? fastest.name : "—"}
                growth={fastest ? fastest.growth : null}
                caption="by market value"
              />
            </div>

            <div className="card" style={{ marginTop: 18 }}>
              <div className="row between">
                <h3 style={{ margin: 0 }}>Market value by field over time</h3>
                <span className="small muted">USD billions · market size &amp; forecast (Grand View Research)</span>
              </div>
              <StackedMarketChart fields={fieldList} metrics={metricList} height={300} />
            </div>
          </>
        )}
      </section>

      <section className="section">
        <h2>Fields</h2>
        {fields.loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="grid">
            {fieldList.map((f) => (
              <FieldOverviewCard key={f.id} field={f} metrics={metricList} />
            ))}
          </div>
        )}
      </section>

      {benchmarks.error && <p className="error">Failed to load data: {benchmarks.error}</p>}

      <section className="section">
        <h2>Benchmarks</h2>
        {benchmarks.loading ? (
          <p className="muted">Loading benchmarks…</p>
        ) : (
          <div className="grid">
            {(benchmarks.data ?? []).map((b) => (
              <BenchmarkCard key={b.id} benchmark={b} field={fieldById[b.field_id]} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
