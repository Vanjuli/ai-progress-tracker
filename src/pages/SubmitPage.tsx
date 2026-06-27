import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../context/AuthContext";
import { MetricKey } from "../lib/types";

type Mode = "benchmark" | "metric";

export function SubmitPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const benchmarks = useAsync(() => api.getAllBenchmarks(), []);
  const fields = useAsync(() => api.getFields(), []);

  const [mode, setMode] = useState<Mode>(params.get("metric") ? "metric" : "benchmark");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- benchmark form state ---
  const presetSlug = params.get("benchmark");
  const initialBenchmarkId = useMemo(() => {
    const list = benchmarks.data ?? [];
    return list.find((b) => b.slug === presetSlug)?.id ?? list[0]?.id ?? "";
  }, [benchmarks.data, presetSlug]);
  const [benchmarkId, setBenchmarkId] = useState("");
  const [modelName, setModelName] = useState("");
  const [organization, setOrganization] = useState("");
  const [score, setScore] = useState("");
  const [achievedOn, setAchievedOn] = useState("");

  // --- shared / metric form state ---
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const presetField = params.get("field");
  const initialFieldId = useMemo(() => {
    const list = fields.data ?? [];
    return list.find((f) => f.slug === presetField)?.id ?? list[0]?.id ?? "";
  }, [fields.data, presetField]);
  const [fieldId, setFieldId] = useState("");
  const [metricKey, setMetricKey] = useState<MetricKey>(
    (params.get("metric") as MetricKey) === "popularity" ? "popularity" : "market_value"
  );
  const [year, setYear] = useState("");
  const [value, setValue] = useState("");

  const effectiveBenchmarkId = benchmarkId || initialBenchmarkId;
  const effectiveFieldId = fieldId || initialFieldId;

  const fieldName = (id: string) => {
    const b = (benchmarks.data ?? []).find((x) => x.id === id);
    const f = (fields.data ?? []).find((x) => x.id === b?.field_id);
    return f?.name ?? "";
  };

  if (!user) {
    return (
      <section className="section">
        <h1>Submit data</h1>
        <p className="muted">You need to sign in before submitting data.</p>
        <Link className="btn btn-primary" to="/signin">
          Sign in
        </Link>
      </section>
    );
  }

  const submitBenchmark = async () => {
    const scoreNum = Number(score);
    if (!effectiveBenchmarkId) return setError("Please choose a benchmark.");
    if (!modelName.trim()) return setError("Model name is required.");
    if (!Number.isFinite(scoreNum)) return setError("Score must be a number.");
    if (!achievedOn) return setError("Please provide the date achieved.");
    await api.submitPoint(
      {
        benchmark_id: effectiveBenchmarkId,
        model_name: modelName.trim(),
        organization: organization.trim() || undefined,
        score: scoreNum,
        achieved_on: achievedOn,
        source_url: sourceUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      user.id
    );
  };

  const submitMetric = async () => {
    const valueNum = Number(value);
    const yearNum = Number(year);
    if (!effectiveFieldId) return setError("Please choose a field.");
    if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100)
      return setError("Please enter a valid year (e.g. 2026).");
    if (!Number.isFinite(valueNum) || valueNum < 0) return setError("Value must be a non-negative number.");
    await api.submitMetric(
      {
        field_id: effectiveFieldId,
        metric_key: metricKey,
        period: `${yearNum}-01-01`,
        value: valueNum,
        source_url: sourceUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      user.id
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "benchmark") await submitBenchmark();
      else await submitMetric();
      navigate("/pending");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        /duplicate|unique/i.test(msg)
          ? "A value for that field, metric, and year already exists — try a different year."
          : msg
      );
      setSubmitting(false);
    }
  };

  return (
    <section className="section form-narrow">
      <h1>Submit data</h1>

      <div className="row" style={{ gap: 8, marginBottom: 18 }}>
        <button
          type="button"
          className={`btn ${mode === "benchmark" ? "btn-primary" : ""}`}
          onClick={() => { setMode("benchmark"); setError(null); }}
        >
          Benchmark result
        </button>
        <button
          type="button"
          className={`btn ${mode === "metric" ? "btn-primary" : ""}`}
          onClick={() => { setMode("metric"); setError(null); }}
        >
          Field metric
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {mode === "benchmark" ? (
          <>
            <p className="muted">
              A model's score on a benchmark. Starts as <em>pending</em> until the community
              verifies it; a source link helps.
            </p>
            <div className="field-row">
              <label htmlFor="benchmark">Benchmark</label>
              <select id="benchmark" value={effectiveBenchmarkId} onChange={(e) => setBenchmarkId(e.target.value)}>
                {(benchmarks.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {fieldName(b.id)} — {b.name} ({b.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label htmlFor="model">Model name</label>
              <input id="model" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. GPT-5" />
            </div>
            <div className="field-row">
              <label htmlFor="org">Organization (optional)</label>
              <input id="org" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. OpenAI" />
            </div>
            <div className="row" style={{ gap: 16 }}>
              <div className="field-row" style={{ flex: 1 }}>
                <label htmlFor="score">Score</label>
                <input id="score" type="number" step="any" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 92.5" />
              </div>
              <div className="field-row" style={{ flex: 1 }}>
                <label htmlFor="date">Date achieved</label>
                <input id="date" type="date" value={achievedOn} onChange={(e) => setAchievedOn(e.target.value)} />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              A data point for a field's <strong>market value</strong> or <strong>popularity</strong>{" "}
              trend (one year). Useful for filling gaps or adding new years. Starts as{" "}
              <em>pending</em> until verified.
            </p>
            <div className="field-row">
              <label htmlFor="field">Field</label>
              <select id="field" value={effectiveFieldId} onChange={(e) => setFieldId(e.target.value)}>
                {(fields.data ?? []).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label htmlFor="metric">Metric</label>
              <select id="metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value as MetricKey)}>
                <option value="market_value">Market value (USD billions)</option>
                <option value="popularity">Popularity (annual research papers)</option>
              </select>
            </div>
            <div className="row" style={{ gap: 16 }}>
              <div className="field-row" style={{ flex: 1 }}>
                <label htmlFor="year">Year</label>
                <input id="year" type="number" step="1" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2026" />
              </div>
              <div className="field-row" style={{ flex: 1 }}>
                <label htmlFor="value">
                  {metricKey === "market_value" ? "Value (USD billions)" : "Value (annual count)"}
                </label>
                <input id="value" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder={metricKey === "market_value" ? "e.g. 120.5" : "e.g. 25000"} />
              </div>
            </div>
          </>
        )}

        <div className="field-row">
          <label htmlFor="source">Source URL (optional but encouraged)</label>
          <input id="source" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="field-row">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Method, caveats, etc." />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit for verification"}
        </button>
      </form>
    </section>
  );
}
