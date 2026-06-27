import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { BenchmarkCard } from "../components/BenchmarkCard";
import { MetricArea } from "../components/MetricArea";
import { fieldSeries, growthPct, latestValue, startYear } from "../lib/metrics";
import { formatGrowth, formatUsdBillions } from "../lib/format";

export function FieldPage() {
  const { slug } = useParams<{ slug: string }>();
  const field = useAsync(() => api.getFieldBySlug(slug ?? ""), [slug]);
  const benchmarks = useAsync(() => api.getAllBenchmarks(), []);
  const metrics = useAsync(() => api.getFieldMetrics(), []);

  if (field.loading) return <p className="section muted">Loading…</p>;
  if (!field.data)
    return (
      <p className="section">
        Field not found. <Link to="/">Back to dashboard</Link>
      </p>
    );

  const f = field.data;
  const fieldBenchmarks = (benchmarks.data ?? []).filter((b) => b.field_id === f.id);
  const metricList = metrics.data ?? [];
  const market = fieldSeries(metricList, f.id, "market_value");
  const pop = fieldSeries(metricList, f.id, "popularity");
  const netWorth = latestValue(market);
  const popLatest = latestValue(pop);
  const marketSource =
    metricList.find((m) => m.field_id === f.id && m.metric_key === "market_value")?.source_url ??
    null;
  const popSource =
    metricList.find((m) => m.field_id === f.id && m.metric_key === "popularity")?.source_url ??
    null;
  const since = startYear(pop);
  const sinceCaption = since ? `since ${since}` : "";

  return (
    <>
      <section className="hero">
        <Link to="/" className="small muted">
          ← Dashboard
        </Link>
        <div className="row" style={{ gap: 10, marginTop: 8 }}>
          <span
            style={{ width: 14, height: 14, borderRadius: "50%", background: f.color }}
          />
          <h1 style={{ margin: 0 }}>{f.name}</h1>
        </div>
        <p>{f.description}</p>
      </section>

      {metricList.length > 0 && (
        <section className="section">
          <div className="grid">
            <div className="card stack">
              <div className="row between">
                <h3 style={{ margin: 0 }}>Popularity & usage</h3>
                <span
                  className="small"
                  style={{
                    color: (growthPct(pop) ?? 0) >= 0 ? "var(--good)" : "var(--bad)",
                    fontWeight: 700,
                  }}
                >
                  {formatGrowth(growthPct(pop))} {sinceCaption}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {popLatest != null ? Math.round(popLatest).toLocaleString() : "—"}
                <span className="small muted" style={{ fontWeight: 400 }}>
                  {" "}
                  papers/yr
                </span>
              </div>
              {pop.length > 0 ? (
                <MetricArea series={pop} color={f.color} height={200} />
              ) : (
                <p className="muted small">No distinct arXiv category for this field.</p>
              )}
              {popSource && (
                <span className="small muted">
                  Annual arXiv submissions ·{" "}
                  <a href={popSource} target="_blank" rel="noreferrer">
                    arXiv ↗
                  </a>
                </span>
              )}
            </div>

            <div className="card stack">
              <div className="row between">
                <h3 style={{ margin: 0 }}>Market value (net worth)</h3>
                <span
                  className="small"
                  style={{
                    color: (growthPct(market) ?? 0) >= 0 ? "var(--good)" : "var(--bad)",
                    fontWeight: 700,
                  }}
                >
                  {formatGrowth(growthPct(market))} {sinceCaption}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {netWorth != null ? formatUsdBillions(netWorth) : "—"}
              </div>
              {market.length > 0 ? (
                <MetricArea
                  series={market}
                  color={f.color}
                  height={200}
                  valueFormatter={(v) => formatUsdBillions(v)}
                />
              ) : (
                <p className="muted small">No distinct market segment for this field.</p>
              )}
              {marketSource && (
                <span className="small muted">
                  Market size &amp; forecast ·{" "}
                  <a href={marketSource} target="_blank" rel="noreferrer">
                    Grand View Research ↗
                  </a>
                </span>
              )}
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            Market value: Grand View Research (size &amp; forecast). Popularity: annual
            arXiv submissions in the field's main category — a research-activity proxy.
            See the <Link to="/about">About</Link> page ·{" "}
            <Link to={`/submit?metric=market_value&field=${f.slug}`}>Suggest a figure</Link>
          </p>
        </section>
      )}

      <section className="section">
        <h2>Benchmarks</h2>
        <div className="grid">
          {fieldBenchmarks.map((b) => (
            <BenchmarkCard key={b.id} benchmark={b} field={f} />
          ))}
        </div>
      </section>
    </>
  );
}
