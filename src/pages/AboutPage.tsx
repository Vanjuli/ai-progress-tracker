import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { pageTitle } from "../lib/seoText";

export function AboutPage() {
  return (
    <>
      <Seo
        title={pageTitle("About the AI benchmark and field data")}
        description="Learn how AI Progress Tracker collects benchmark results, arXiv research activity, market-value estimates, and source links for AI progress charts."
        path="/about"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]}
      />
      <section className="section form-narrow">
      <h1>About</h1>
      <p>
        <strong>AI Progress Tracker</strong> charts how AI systems improve over time on
        public benchmarks, across fields like language, coding, vision, math, and
        speech. The goal is a broad, honest view of progress — not one lab's marketing.
      </p>

      <h2>How the data is collected</h2>
      <p className="muted">
        The frontend is read-only. Benchmark rows are curated from linked public sources,
        and benchmark coverage is automatically supplemented from Epoch AI where available.
        Field popularity is automatically collected from arXiv category counts. Market-value
        figures come from Grand View Research reports, with intermediate forecast years
        interpolated where noted.
      </p>

      <h2>Popularity & market value</h2>
      <p className="muted">
        Alongside benchmarks, each field shows a <strong>popularity / usage</strong> trend
        and an estimated <strong>market value</strong> ("net worth") over time, so you can
        see not just how capable a field is but how fast it's growing and how much economic
        weight it carries.
      </p>

      <h2>A note on the data</h2>
      <p className="muted">
        Benchmark figures link to their source papers, model cards, reports, or datasets;
        some recent values on saturated benchmarks come from third-party aggregators or
        Epoch AI's benchmark dataset. <strong>Market-value</strong> figures are sourced from
        Grand View Research market reports. <strong>Popularity</strong> is a research-activity
        proxy: annual submission counts to each field's main arXiv category (cs.CL, cs.CV,
        cs.SE, eess.AS), pulled from the arXiv API. Always check original sources before
        relying on a number.
      </p>

      <div className="row" style={{ marginTop: 18 }}>
        <Link className="btn btn-primary" to="/compare">
          Compare fields
        </Link>
        <Link className="btn" to="/">
          Back to dashboard
        </Link>
      </div>
      </section>
    </>
  );
}
