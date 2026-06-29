import { Link } from "react-router-dom";
import { Benchmark, Field } from "../lib/types";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { BenchmarkChart } from "./BenchmarkChart";
import { formatScore } from "../lib/format";

export function BenchmarkCard({ benchmark, field }: { benchmark: Benchmark; field?: Field }) {
  const { data: points, loading } = useAsync(
    () => api.getVerifiedPoints(benchmark.id),
    [benchmark.id]
  );
  const color = field?.color ?? "#6366f1";
  const latest = points && points.length ? points[points.length - 1] : null;

  return (
    <Link to={`/benchmark/${benchmark.slug}`} className="card card-link stack">
      <div className="row between">
        <h3 style={{ margin: 0 }}>{benchmark.name}</h3>
        {field && (
          <span className="tag tag-field" style={{ background: field.color }}>
            {field.name}
          </span>
        )}
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        {benchmark.description}
      </p>
      {loading ? (
        <p className="muted small">Loading…</p>
      ) : (
        <BenchmarkChart points={points ?? []} unit={benchmark.unit} color={color} height={180} />
      )}
      {latest && (
        <div className="small muted">
          Latest: {formatScore(latest.score, benchmark.unit)} · {latest.model_name}
        </div>
      )}
      <div className="small muted">
        Benchmark data includes {" "}
        <span aria-label="Epoch AI benchmark data credit">Epoch AI (CC-BY)</span> where available.
      </div>
    </Link>
  );
}
