import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { BenchmarkCard } from "../components/BenchmarkCard";
import { FieldOverviewCard } from "../components/FieldOverviewCard";
import { StackedMarketChart } from "../components/StackedMarketChart";
import { TrendStat } from "../components/TrendStat";
import { Article, Field } from "../lib/types";
import {
  fieldSeries,
  growthPct,
  isYearToDate,
  latestValue,
  startYear,
  sumByPeriod,
} from "../lib/metrics";
import { formatUsdBillions } from "../lib/format";
import { Seo } from "../components/Seo";
import { pageTitle } from "../lib/seoText";

export function HomePage() {
  const fields = useAsync(() => api.getFields(), []);
  const benchmarks = useAsync(() => api.getAllBenchmarks(), []);
  const metrics = useAsync(() => api.getFieldMetrics(), []);
  const articles = useAsync(() => api.getArticles(4), []);
  const [selectedTopic, setSelectedTopic] = useState("All topics");

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
  const articleList = articles.data ?? [];
  const topicOptions = useMemo(() => {
    const topics = new Set<string>();
    for (const article of articleList) {
      for (const topic of article.topics ?? []) topics.add(topic);
    }
    return ["All topics", ...Array.from(topics).sort()];
  }, [articleList]);
  const filteredArticles = selectedTopic === "All topics"
    ? articleList
    : articleList.filter((article) => (article.topics ?? []).includes(selectedTopic));
  const articleGroups: Array<{ category: Article["category"]; label: string; articles: Article[] }> = [
    { category: "trending", label: "Trending", articles: filteredArticles.filter((article) => article.category === "trending") },
    { category: "research", label: "Research", articles: filteredArticles.filter((article) => article.category === "research") },
    { category: "official", label: "Official", articles: filteredArticles.filter((article) => article.category === "official") },
  ];

  return (
    <>
      <Seo
        title={pageTitle("Track AI benchmark and field progress over time")}
        description="Track AI progress across language, coding, vision, math, and speech with curated benchmark charts, research activity, and market-value trends."
        path="/"
      />
      <section className="hero">
        <h1>Tracking AI progress from curated sources</h1>
        <p>
          How fast is AI really improving — and growing? This dashboard charts benchmark
          performance, research popularity, and market value across AI fields over time,
          using curated benchmark data and automatically collected field popularity from
          arXiv, with benchmark coverage supplemented by Epoch AI where available.
        </p>
        <div className="row" style={{ marginTop: 18 }}>
          <Link className="btn btn-primary" to="/compare">
            Compare fields
          </Link>
          <Link className="btn" to="/about">
            Learn about the data
          </Link>
        </div>
      </section>

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
        <div className="row between">
          <div>
            <h2>Latest in AI</h2>
            <p className="muted" style={{ marginTop: -4 }}>
              Fresh AI research, lab announcements, and high-signal community links collected daily.
            </p>
          </div>
          <label className="topic-filter small">
            Topic
            <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </label>
        </div>
        {articles.loading ? (
          <p className="muted">Loading latest articles…</p>
        ) : articles.error ? (
          <p className="error">Failed to load latest articles: {articles.error}</p>
        ) : (
          <div className="article-groups">
            {articleGroups.map((group) => (
              <div key={group.category} className="article-group">
                <div className="row between article-group-heading">
                  <h3>{group.label}</h3>
                  <span className="small muted">{group.articles.length} shown</span>
                </div>
                {group.articles.length > 0 ? (
                  <div className="article-grid">
                    {group.articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <p className="muted small">No {group.label.toLowerCase()} articles match this topic.</p>
                )}
              </div>
            ))}
          </div>
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


function ArticleCard({ article }: { article: Article }) {
  const date = article.published_at ? new Date(article.published_at) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Date unknown";
  const categoryLabel = {
    trending: "Trending",
    research: "Research",
    official: "Official",
  }[article.category];

  return (
    <a className="card article-card" href={article.url} target="_blank" rel="noreferrer">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <span className={`tag article-tag article-tag-${article.category}`}>{categoryLabel}</span>
        {article.score != null && <span className="small muted">{article.score.toLocaleString()} pts</span>}
      </div>
      <h3>{article.title}</h3>
      {article.topics.length > 0 && (
        <div className="topic-tags">
          {article.topics.map((topic) => (
            <span key={topic} className="topic-tag">{topic}</span>
          ))}
        </div>
      )}
      {article.summary && <p className="muted small">{article.summary}</p>}
      <div className="small muted article-meta">
        <span>{article.author || article.source}</span>
        <span>·</span>
        <span>{dateLabel}</span>
      </div>
    </a>
  );
}
