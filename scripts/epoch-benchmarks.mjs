import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

export const EPOCH_DATASET_URL = "https://epoch.ai/data/benchmark_data.zip";
export const EPOCH_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const EPOCH_AUTO_MARKER = "auto-collected:epoch-benchmark";

export const EPOCH_BENCHMARK_SPECS = [
  {
    fieldSlug: "language",
    benchmarkSlug: "mmlu",
    name: "MMLU",
    description: "Massive Multitask Language Understanding (57 subjects).",
    unit: "%",
    higherIsBetter: true,
    filename: "mmlu_external.csv",
    scoreColumn: "EM",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "language",
    benchmarkSlug: "gpqa-diamond",
    name: "GPQA Diamond",
    description: "Graduate-level Google-proof Q&A, Diamond subset.",
    unit: "%",
    higherIsBetter: true,
    filename: "gpqa_diamond.csv",
    scoreColumn: "mean_score",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "language",
    benchmarkSlug: "simpleqa-verified",
    name: "SimpleQA Verified",
    description: "Factual question answering benchmark with verified answers.",
    unit: "%",
    higherIsBetter: true,
    filename: "simpleqa_verified.csv",
    scoreColumn: "mean_score",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "math",
    benchmarkSlug: "gsm8k",
    name: "GSM8K",
    description: "Grade-school math word problems (GSM8K); distinct from the competition-math MATH and AIME-style benchmarks.",
    unit: "%",
    higherIsBetter: true,
    filename: "gsm8k_external.csv",
    scoreColumn: "EM",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "math",
    benchmarkSlug: "math-level-5",
    name: "MATH Level 5",
    description: "Only the hardest Level 5 subset of the Hendrycks MATH competition-math benchmark, not the full MATH benchmark.",
    unit: "%",
    higherIsBetter: true,
    filename: "math_level_5.csv",
    scoreColumn: "mean_score",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "math",
    benchmarkSlug: "otis-mock-aime-2024-2025",
    name: "OTIS Mock AIME 2024-2025",
    description: "MOCK AIME-style mathematics problems from OTIS, 2024-2025; not the official AIME exam.",
    unit: "%",
    higherIsBetter: true,
    filename: "otis_mock_aime_2024_2025.csv",
    scoreColumn: "mean_score",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "coding",
    benchmarkSlug: "swe-bench-verified",
    name: "SWE-bench Verified",
    description: "Verified subset of SWE-bench for real-world software-engineering tasks.",
    unit: "%",
    higherIsBetter: true,
    filename: "swe_bench_verified.csv",
    scoreColumn: "mean_score",
    scoreScale: "fraction",
  },
  {
    fieldSlug: "coding",
    benchmarkSlug: "aider-polyglot",
    name: "Aider Polyglot",
    description: "Aider polyglot code-editing benchmark across multiple programming languages.",
    unit: "%",
    higherIsBetter: true,
    filename: "aider_polyglot_external.csv",
    scoreColumn: "Percent correct",
    scoreScale: "percent",
  },
];

export function parseCsv(text) {
  return parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

export function normalizePercent(value, scale) {
  const number = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(number)) return null;
  const percent = scale === "fraction" ? number * 100 : number;
  return Number(percent.toFixed(4));
}

export function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

function firstNonEmpty(row, columns) {
  for (const column of columns) {
    const value = row[column];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function firstUrl(row, columns) {
  const url = firstNonEmpty(row, columns);
  return /^https?:\/\//i.test(url) ? url : "";
}

export function mapEpochRows(spec, csvRows) {
  const rows = [];
  const seen = new Set();

  for (const row of csvRows) {
    const score = normalizePercent(row[spec.scoreColumn], spec.scoreScale);
    const achievedOn = firstNonEmpty(row, ["Release date", "Date of evaluation", "Started at"])
      .slice(0, 10);
    const modelName = firstNonEmpty(row, ["Name", "Model version", "Model", "model"]);

    if (score === null || !isIsoDate(achievedOn) || !modelName) continue;

    const organization = firstNonEmpty(row, ["Organization", "Provider"]);
    const originalSource = firstUrl(row, ["Source link", "Source", "Log viewer", "Logs"]);
    const sourceLabel = firstNonEmpty(row, ["Source"]);
    const rowNotes = firstNonEmpty(row, ["Notes"]);
    const key = `${spec.benchmarkSlug}\u0000${modelName}\u0000${achievedOn}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      field_slug: spec.fieldSlug,
      benchmark_slug: spec.benchmarkSlug,
      benchmark_name: spec.name,
      benchmark_description: spec.description,
      unit: spec.unit,
      higher_is_better: spec.higherIsBetter,
      benchmark_source_url: EPOCH_DATASET_URL,
      model_name: modelName,
      organization: organization || null,
      score,
      achieved_on: achievedOn,
      source_url: originalSource || EPOCH_DATASET_URL,
      notes: [
        EPOCH_AUTO_MARKER,
        `Epoch AI dataset=${EPOCH_DATASET_URL}`,
        `file=${spec.filename}`,
        `score_column=${spec.scoreColumn}`,
        sourceLabel && !/^https?:\/\//i.test(sourceLabel) ? `original_source=${sourceLabel}` : "",
        rowNotes ? `row_notes=${rowNotes}` : "",
      ]
        .filter(Boolean)
        .join("; "),
      status: "verified",
      protected: true,
    });
  }

  return rows;
}

export async function fetchEpochZipBuffer(fetchImpl = fetch) {
  const response = await fetchImpl(EPOCH_DATASET_URL, {
    headers: {
      "User-Agent": "AIProgressTracker/1.0 (+https://aiprogresstracker.org)",
      Accept: "application/zip, application/octet-stream, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Epoch AI benchmark data download failed: HTTP ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function collectEpochBenchmarkRowsFromZip(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = new Map(zip.getEntries().map((entry) => [entry.entryName, entry]));
  const rows = [];
  const fileSummaries = [];

  for (const spec of EPOCH_BENCHMARK_SPECS) {
    const entry = entries.get(spec.filename);
    if (!entry) {
      throw new Error(`Epoch AI dataset is missing expected file ${spec.filename}`);
    }
    const csvRows = parseCsv(entry.getData().toString("utf8"));
    const mappedRows = mapEpochRows(spec, csvRows);
    rows.push(...mappedRows);
    fileSummaries.push({
      file: spec.filename,
      benchmark_slug: spec.benchmarkSlug,
      field_slug: spec.fieldSlug,
      input_rows: csvRows.length,
      mapped_rows: mappedRows.length,
      columns: csvRows.length > 0 ? Object.keys(csvRows[0]) : [],
    });
  }

  return { rows, fileSummaries };
}

export async function collectEpochBenchmarkRows(fetchImpl = fetch) {
  const zipBuffer = await fetchEpochZipBuffer(fetchImpl);
  return collectEpochBenchmarkRowsFromZip(zipBuffer);
}
