import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { BenchmarkCard } from "../components/BenchmarkCard";
import { MetricArea } from "../components/MetricArea";
import { fieldSeries, growthPct, isYearToDate, latestValue, startYear } from "../lib/metrics";
import { formatGrowth, formatUsdBillions } from "../lib/format";
import { Seo } from "../components/Seo";
import { fieldSeoDescription, pageTitle } from "../lib/seoText";

export function FieldPage() {
  const { slug } = useParams<{ slug: string }>();
  const field = useAsync(() => api.getFieldBySlug(slug ?? ""), [slug]);
  const benchmarks = useAsync(() => api.getAllBenchmarks(), []);
  const metrics = useAsync(() => api.getFieldMetrics(), []);
  const asrRankings = useAsync(() => (slug === "speech" ? api.getAsrRankings(15) : Promise.resolve([])), [slug]);

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
  const popLatestPoint = pop[pop.length - 1] ?? null;
  const popLatestYtd = popLatestPoint ? isYearToDate(popLatestPoint.period) : false;
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
      <Seo
        title={pageTitle(`${f.name} AI progress benchmarks and trends`)}
        description={fieldSeoDescription(f.name, f.description)}
        path={`/field/${f.slug}`}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Fields", url: "/" }, { name: f.name, url: `/field/${f.slug}` }]}
      />
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
                    color: (growthPct(pop, { excludeYearToDate: true }) ?? 0) >= 0 ? "var(--good)" : "var(--bad)",
                    fontWeight: 700,
                  }}
                >
                  {formatGrowth(growthPct(pop, { excludeYearToDate: true }))} {sinceCaption}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {popLatest != null ? Math.round(popLatest).toLocaleString() : "—"}
                <span className="small muted" style={{ fontWeight: 400 }}>
                  {" "}
                  papers/yr
                  {popLatestYtd ? " YTD" : ""}
                </span>
              </div>
              {pop.length > 0 ? (
                <MetricArea series={pop} color={f.color} height={200} markYearToDate />
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
              {popLatestYtd && (
                <span className="small muted">
                  Current-year popularity is year to date (in progress); growth excludes the partial year.
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
                  Market size through the current year ·{" "}
                  <a href={marketSource} target="_blank" rel="noreferrer">
                    Grand View Research ↗
                  </a>
                </span>
              )}
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            Market value: Grand View Research, shown through the current year only. Popularity: annual
            arXiv submissions in the field's main category — a research-activity proxy.
            See the <Link to="/about">About</Link> page for source details.
          </p>
        </section>
      )}


      {f.slug === "speech" && (
        <section className="section">
          <div className="card stack">
            <div className="row between" style={{ alignItems: "flex-start" }}>
              <div>
                <h2 style={{ marginTop: 0 }}>Current ASR Leaderboard</h2>
                <p className="small muted" style={{ marginTop: 4 }}>
                  Lower average WER is better. This is a current snapshot, not an over-time chart; WER is
                  averaged across the available English short-form datasets for each model. Source: {" "}
                  <a
                    href="https://huggingface.co/spaces/hf-audio/open_asr_leaderboard"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Hugging Face Open ASR Leaderboard ↗
                  </a>
                  .
                </p>
              </div>
            </div>
            {asrRankings.loading ? (
              <p className="muted small">Loading current ASR ranking…</p>
            ) : asrRankings.data && asrRankings.data.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Model</th>
                      <th>Avg WER</th>
                      <th>RTFx</th>
                      <th>Datasets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asrRankings.data.map((row, index) => (
                      <tr key={row.id ?? row.model}>
                        <td>{index + 1}</td>
                        <td>{row.model}</td>
                        <td>{row.avg_wer.toFixed(2)}%</td>
                        <td>{row.rtfx != null ? row.rtfx.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</td>
                        <td>{row.datasets_count ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted small">No current ASR leaderboard snapshot is available yet.</p>
            )}
          </div>
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
