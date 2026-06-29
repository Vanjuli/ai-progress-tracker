import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { BenchmarkChart } from "../components/BenchmarkChart";
import { formatMonthYear, formatScore } from "../lib/format";
import { metricExplanation, metricLabel } from "../lib/benchmarkMetric";

export function BenchmarkPage() {
  const { slug } = useParams<{ slug: string }>();
  const benchmark = useAsync(() => api.getBenchmarkBySlug(slug ?? ""), [slug]);
  const fields = useAsync(() => api.getFields(), []);
  const b = benchmark.data;
  const points = useAsync(() => (b ? api.getPoints(b.id) : Promise.resolve([])), [b?.id]);

  if (benchmark.loading) return <p className="section muted">Loading…</p>;
  if (!b) return <p className="section">Benchmark not found. <Link to="/">Back to dashboard</Link></p>;

  const field = (fields.data ?? []).find((f) => f.id === b.field_id);
  const color = field?.color ?? "#6366f1";
  const all = points.data ?? [];

  return (
    <>
      <section className="hero" style={{ paddingBottom: 12 }}>
        <Link to="/" className="small muted">
          ← Dashboard
        </Link>
        <div className="row between" style={{ marginTop: 8 }}>
          <h1 style={{ margin: 0 }}>{b.name}</h1>
          {field && (
            <Link
              to={`/field/${field.slug}`}
              className="tag tag-field"
              style={{ background: field.color }}
            >
              {field.name}
            </Link>
          )}
        </div>
        <p>{b.description}</p>
        <div className="row small">
          <span className="muted">
            {metricExplanation(b.unit, b.higher_is_better)}
          </span>
          {b.source_url && (
            <a href={b.source_url} target="_blank" rel="noreferrer">
              Reference ↗
            </a>
          )}
          <a href="https://epoch.ai" target="_blank" rel="noreferrer">
            Benchmark data includes Epoch AI (CC-BY) where available ↗
          </a>
        </div>
      </section>

      <div className="card">
        <div className="stack" style={{ gap: 6, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{b.name} score over time</h2>
          <p className="muted" style={{ margin: 0 }}>{b.description}</p>
          <p className="small" style={{ margin: 0 }}>
            <strong>{metricExplanation(b.unit, b.higher_is_better)}</strong>
          </p>
        </div>
        <BenchmarkChart
          points={all}
          unit={b.unit}
          higherIsBetter={b.higher_is_better}
          color={color}
          height={320}
        />
      </div>

      <section className="section">
        <h2>Data points</h2>
        {points.loading ? (
          <p className="muted">Loading…</p>
        ) : all.length === 0 ? (
          <p className="muted">No data yet.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Model</th>
                <th>Organization</th>
                <th>{metricLabel(b.unit, b.higher_is_better)}</th>
                <th>Date (year)</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {[...all]
                .sort((a, c) => c.achieved_on.localeCompare(a.achieved_on))
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.model_name}</td>
                    <td className="muted">{p.organization ?? "—"}</td>
                    <td>{formatScore(p.score, b.unit)}</td>
                    <td className="muted">{formatMonthYear(p.achieved_on)}</td>
                    <td>
                      {p.source_url ? (
                        <a href={p.source_url} target="_blank" rel="noreferrer">
                          link ↗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        <p className="small muted" style={{ marginTop: 12 }}>
          Showing curated verified data points only. Check the linked sources for methodology
          and reporting details.
        </p>
      </section>
    </>
  );
}
