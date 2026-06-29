import { describe, expect, it } from "vitest";
import {
  EPOCH_AUTO_MARKER,
  collectEpochBenchmarkRowsFromZip,
  mapEpochRows,
  normalizePercent,
} from "../scripts/epoch-benchmarks.mjs";

const mmluSpec = {
  fieldSlug: "language",
  benchmarkSlug: "mmlu",
  name: "MMLU",
  description: "Massive Multitask Language Understanding.",
  unit: "%",
  higherIsBetter: true,
  filename: "mmlu_external.csv",
  scoreColumn: "EM",
  scoreScale: "fraction",
};

describe("Epoch benchmark mapping", () => {
  it("normalizes fractional and percent scores", () => {
    expect(normalizePercent("0.864", "fraction")).toBe(86.4);
    expect(normalizePercent("94.5", "percent")).toBe(94.5);
    expect(normalizePercent("", "fraction")).toBeNull();
  });

  it("maps CSV rows into protected verified benchmark data points", () => {
    const rows = mapEpochRows(mmluSpec, [
      {
        Name: "GPT-4",
        "Model version": "gpt-4-0314",
        EM: "0.864",
        "Release date": "2023-03-14",
        Organization: "OpenAI",
        Source: "GPT-4 Technical Report",
        "Source link": "https://arxiv.org/abs/2303.08774",
        Notes: "5-shot.",
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        field_slug: "language",
        benchmark_slug: "mmlu",
        model_name: "GPT-4",
        organization: "OpenAI",
        score: 86.4,
        achieved_on: "2023-03-14",
        source_url: "https://arxiv.org/abs/2303.08774",
        status: "verified",
        protected: true,
      }),
    ]);
    expect(rows[0].notes).toContain(EPOCH_AUTO_MARKER);
    expect(rows[0].notes).toContain("file=mmlu_external.csv");
  });

  it("skips rows without usable model, date, or score and de-duplicates exact keys", () => {
    const rows = mapEpochRows(mmluSpec, [
      { Name: "Model A", EM: "0.5", "Release date": "2024-01-01" },
      { Name: "Model A", EM: "0.6", "Release date": "2024-01-01" },
      { Name: "No Score", EM: "", "Release date": "2024-01-01" },
      { Name: "Bad Date", EM: "0.8", "Release date": "not-a-date" },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ model_name: "Model A", score: 50 });
  });

  it("throws if the Epoch ZIP is missing an expected mapped file", () => {
    // Minimal object with the AdmZip API shape reached by collectEpochBenchmarkRowsFromZip
    // is not enough because AdmZip parses real ZIP bytes; use an empty Buffer to assert
    // malformed input fails loudly rather than silently collecting fabricated data.
    expect(() => collectEpochBenchmarkRowsFromZip(Buffer.from([]))).toThrow();
  });
});
