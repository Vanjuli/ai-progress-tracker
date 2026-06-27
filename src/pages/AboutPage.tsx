import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <section className="section form-narrow">
      <h1>About</h1>
      <p>
        <strong>AI Progress Tracker</strong> charts how AI systems improve over time on
        public benchmarks, across fields like language, coding, vision, math, and
        speech. The goal is a broad, honest view of progress — not one lab's marketing.
      </p>

      <h2>How verification works</h2>
      <p className="muted">
        Anyone signed in can submit a data point (a model's score on a benchmark, with a
        date and ideally a source). New submissions are <em>pending</em> and don't appear
        on charts. The community then votes: enough net up-votes promote a submission to{" "}
        <strong>verified</strong> (it goes public); enough down-votes mark it{" "}
        <strong>rejected</strong>. This keeps the dataset broad while filtering out errors.
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
        Benchmark figures are real and sourced (each links to a paper or model card),
        though some recent ones on saturated benchmarks come from third parties.{" "}
        <strong>Market-value</strong> figures are sourced from Grand View Research market
        reports (current size plus forecast, with intermediate years interpolated).{" "}
        <strong>Popularity</strong> is a research-activity proxy: annual submission counts
        to each field's main arXiv category (cs.CL, cs.CV, cs.SE, eess.AS), pulled from the
        arXiv API. Always check original sources before relying on a number.
      </p>

      <div className="row" style={{ marginTop: 18 }}>
        <Link className="btn btn-primary" to="/submit">
          Contribute data
        </Link>
        <Link className="btn" to="/">
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
