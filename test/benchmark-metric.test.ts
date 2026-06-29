import { describe, expect, it } from "vitest";
import { metricExplanation, metricLabel } from "../src/lib/benchmarkMetric";

describe("benchmark metric labels", () => {
  it("explains percent accuracy scores as problems solved correctly", () => {
    expect(metricLabel("%", true)).toBe("Accuracy");
    expect(metricExplanation("%", true)).toBe(
      "Accuracy — % of problems solved correctly (higher is better)"
    );
  });

  it("explains WER percent scores as lower-is-better word error rate", () => {
    expect(metricLabel("% WER", false)).toBe("Word error rate");
    expect(metricExplanation("% WER", false)).toBe("Word error rate — % (lower is better)");
  });

  it("falls back to score for non-percent units while preserving direction", () => {
    expect(metricExplanation("Elo", true)).toBe("Score — Elo (higher is better)");
    expect(metricExplanation("seconds", false)).toBe("Score — seconds (lower is better)");
  });
});
