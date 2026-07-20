import { Seo } from "../components/Seo";
import { ThoughtCard } from "../components/ThoughtCard";
import { pageTitle } from "../lib/seoText";
import { foodForThought } from "../lib/foodForThought";

export function FoodForThoughtPage() {
  return (
    <>
      <Seo
        title={pageTitle("Food for thought — global problems AI could help solve")}
        description="Hard numbers on global problems that are still unsolved — food waste, child labour, hunger, water access, education — and where AI could plausibly help. Curated from primary sources."
        path="/food-for-thought"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Food for Thought", url: "/food-for-thought" },
        ]}
      />
      <section className="hero">
        <h1>Food for thought</h1>
        <p>
          Beyond benchmarks: hard numbers on global problems that are still unsolved — and
          where AI could plausibly help. Hand-curated from primary sources; each card links
          to the report behind the statistic.
        </p>
      </section>
      <section className="section">
        <div className="grid">
          {foodForThought.map((entry) => (
            <ThoughtCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    </>
  );
}
