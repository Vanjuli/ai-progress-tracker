import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { BenchmarkChart } from "../components/BenchmarkChart";
import { StatusBadge } from "../components/StatusBadge";
import { formatMonthYear, formatScore } from "../lib/format";

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
  const verified = all.filter((p) => p.status === "verified");

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
            Unit: {b.unit} · {b.higher_is_better ? "higher is better" : "lower is better"}
          </span>
          {b.source_url && (
            <a href={b.source_url} target="_blank" rel="noreferrer">
              Reference ↗
            </a>
          )}
          <span className="spacer" />
          <Link className="btn btn-primary" to={`/submit?benchmark=${b.slug}`}>
            + Add a data point
          </Link>
        </div>
      </section>

      <div className="card">
        <BenchmarkChart points={verified} unit={b.unit} color={color} height={320} />
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
                <th>{b.name}</th>
                <th>Date</th>
                <th>Status</th>
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
                      <StatusBadge status={p.status} />
                    </td>
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
          Pending submissions appear here once you're signed in. Help confirm them on
          the <Link to="/pending">Verify</Link> page.
        </p>
      </section>
    </>
  );
}
