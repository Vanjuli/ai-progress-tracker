import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../context/AuthContext";
import { VoteButtons } from "../components/VoteButtons";
import { formatMonthYear, formatScore, formatUsdBillions, yearOf } from "../lib/format";
import { Benchmark, Field } from "../lib/types";

export function PendingPage() {
  const { user } = useAuth();
  const pending = useAsync(() => api.getPendingPoints(), []);
  const benchmarks = useAsync(() => api.getAllBenchmarks(), []);
  const votes = useAsync(() => api.getMyVotes(), []);

  const pendingMetrics = useAsync(() => api.getPendingMetrics(), []);
  const fields = useAsync(() => api.getFields(), []);
  const metricVotes = useAsync(() => api.getMyMetricVotes(), []);

  const byId: Record<string, Benchmark> = {};
  for (const b of benchmarks.data ?? []) byId[b.id] = b;
  const fieldById: Record<string, Field> = {};
  for (const f of fields.data ?? []) fieldById[f.id] = f;

  const onVote = async (dataPointId: string, value: 1 | -1) => {
    if (!user) return;
    await api.castVote(dataPointId, value, user.id);
    pending.reload();
    votes.reload();
  };
  const onMetricVote = async (metricId: string, value: 1 | -1) => {
    if (!user) return;
    await api.castMetricVote(metricId, value, user.id);
    pendingMetrics.reload();
    metricVotes.reload();
  };

  const metricLabel = (key: string) => (key === "market_value" ? "Market value" : "Popularity");
  const metricValue = (key: string, v: number) =>
    key === "market_value" ? formatUsdBillions(v) : `${v.toLocaleString()} papers/yr`;

  return (
    <section className="section">
      <h1>Verify submissions</h1>
      <p className="muted" style={{ maxWidth: 640 }}>
        Community submissions awaiting verification. Up-vote data that looks correct (ideally
        checking the source) and down-vote what looks wrong. Items publish once they reach the
        verification threshold.
      </p>

      {!user && (
        <div className="banner">
          <Link to="/signin">Sign in</Link> to cast votes.
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Benchmark results</h2>
      {pending.loading ? (
        <p className="muted">Loading…</p>
      ) : (pending.data ?? []).length === 0 ? (
        <p className="muted">No pending benchmark results.</p>
      ) : (
        <div className="grid">
          {(pending.data ?? []).map((p) => {
            const b = byId[p.benchmark_id];
            const myVote = votes.data?.[p.id] ?? 0;
            return (
              <div key={p.id} className="card stack">
                <div className="row between">
                  <strong>{p.model_name}</strong>
                  {b && <Link to={`/benchmark/${b.slug}`} className="small">{b.name}</Link>}
                </div>
                <div className="small muted">
                  {p.organization ?? "Unknown org"} · {formatMonthYear(p.achieved_on)}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {b ? formatScore(p.score, b.unit) : p.score}
                </div>
                {p.notes && <p className="small muted">{p.notes}</p>}
                {p.source_url && (
                  <a href={p.source_url} target="_blank" rel="noreferrer" className="small">Source ↗</a>
                )}
                <div className="row between" style={{ marginTop: 6 }}>
                  <VoteButtons score={p.vote_score} myVote={myVote} onVote={(v) => void onVote(p.id, v)} disabled={!user} showNeeded />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ marginTop: 32 }}>Field metrics</h2>
      {pendingMetrics.loading ? (
        <p className="muted">Loading…</p>
      ) : (pendingMetrics.data ?? []).length === 0 ? (
        <p className="muted">No pending metric submissions.</p>
      ) : (
        <div className="grid">
          {(pendingMetrics.data ?? []).map((m) => {
            const f = fieldById[m.field_id];
            const myVote = metricVotes.data?.[m.id] ?? 0;
            return (
              <div key={m.id} className="card stack">
                <div className="row between">
                  <strong>{metricLabel(m.metric_key)}</strong>
                  {f && (
                    <Link to={`/field/${f.slug}`} className="tag tag-field" style={{ background: f.color }}>
                      {f.name}
                    </Link>
                  )}
                </div>
                <div className="small muted">Year {yearOf(m.period)}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{metricValue(m.metric_key, m.value)}</div>
                {m.notes && <p className="small muted">{m.notes}</p>}
                {m.source_url && (
                  <a href={m.source_url} target="_blank" rel="noreferrer" className="small">Source ↗</a>
                )}
                <div className="row between" style={{ marginTop: 6 }}>
                  <VoteButtons score={m.vote_score ?? 0} myVote={myVote} onVote={(v) => void onMetricVote(m.id, v)} disabled={!user} showNeeded />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
