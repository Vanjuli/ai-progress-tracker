import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { MultiLineChart, YScale } from "../components/MultiLineChart";
import { MetricKey } from "../lib/types";
import { formatUsdBillions } from "../lib/format";
import { Seo } from "../components/Seo";
import { pageTitle } from "../lib/seoText";

export function ComparePage() {
  const fields = useAsync(() => api.getFields(), []);
  const metrics = useAsync(() => api.getFieldMetrics(), []);
  const [metricKey, setMetricKey] = useState<MetricKey>("market_value");
  const [yScale, setYScale] = useState<YScale>("linear");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const fieldList = fields.data ?? [];
  const metricList = metrics.data ?? [];
  const forMetric = useMemo(
    () => metricList.filter((m) => m.metric_key === metricKey),
    [metricList, metricKey]
  );
  const availableFields = useMemo(
    () => fieldList.filter((f) => forMetric.some((m) => m.field_id === f.id)),
    [fieldList, forMetric]
  );

  // Default to all fields that have data for the selected metric.
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const f of availableFields) next[f.id] = true;
    setSelected(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricKey, metrics.data, fields.data]);

  const selectedFields = availableFields.filter((f) => selected[f.id]);
  const fmt =
    metricKey === "market_value"
      ? (v: number) => formatUsdBillions(v)
      : (v: number) => v.toLocaleString();

  return (
    <>
      <Seo
        title={pageTitle("Compare AI fields by market value and research activity")}
        description="Compare AI fields on one chart, including market value and arXiv research activity trends for language, coding, vision, math, and speech."
        path="/compare"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Compare", url: "/compare" }]}
      />
      <section className="hero" style={{ paddingBottom: 12 }}>
        <h1>Compare fields</h1>
        <p>
          Overlay AI fields on one chart to compare how their market value or research
          activity has grown over time.
        </p>
      </section>

      <div className="compare-controls" aria-label="Comparison controls">
        <div className="row" style={{ gap: 8 }}>
          <span className="control-label">Metric</span>
          <button
            className={`btn ${metricKey === "market_value" ? "btn-primary" : ""}`}
            onClick={() => setMetricKey("market_value")}
          >
            Market value
          </button>
          <button
            className={`btn ${metricKey === "popularity" ? "btn-primary" : ""}`}
            onClick={() => setMetricKey("popularity")}
          >
            Popularity
          </button>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <span className="control-label">Y-axis scale</span>
          <button
            className={`btn ${yScale === "linear" ? "btn-primary" : ""}`}
            onClick={() => setYScale("linear")}
          >
            Linear
          </button>
          <button className={`btn ${yScale === "log" ? "btn-primary" : ""}`} onClick={() => setYScale("log")}>
            Log
          </button>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className="control-label">Fields</span>
          {availableFields.map((f) => (
            <label key={f.id} className="row field-toggle" style={{ gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!selected[f.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [f.id]: e.target.checked }))}
              />
              <span
                style={{ width: 10, height: 10, borderRadius: "50%", background: f.color, display: "inline-block" }}
              />
              <span className="small">{f.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card chart-card">
        {metrics.loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <MultiLineChart
            fields={selectedFields}
            metrics={forMetric}
            valueFormatter={fmt}
            height={380}
            markYearToDate={metricKey === "popularity"}
            yScale={yScale}
          />
        )}
        <p className="small muted" style={{ marginTop: 8 }}>
          {metricKey === "market_value"
            ? "Market figures come from separate industry research reports with differing scope definitions, so cross-field comparisons are approximate. Future forecast years are not shown; the current-year value is the report's estimate for the year in progress."
            : "Popularity values are annual arXiv submission counts per field category. Current-year points are YTD / year to date (in progress)."}
        </p>
      </div>
    </>
  );
}
