// Bundled sample data for offline DEMO MODE (when no Supabase keys are set).
// Mirrors supabase/seed.sql so the preview matches the real seeded database.
// Figures are approximate, illustrative starting points.

import { Benchmark, DataPoint, Field, FieldMetric } from "./types";

export const demoFields: Field[] = [
  { id: "f-language", slug: "language", name: "Language & Reasoning", description: "Knowledge, comprehension, and reasoning in large language models.", color: "#6366f1", sort_order: 1 },
  { id: "f-coding", slug: "coding", name: "Code Generation", description: "Writing correct, functional code from natural-language prompts.", color: "#10b981", sort_order: 2 },
  { id: "f-vision", slug: "vision", name: "Computer Vision", description: "Image classification, detection, and visual understanding.", color: "#f59e0b", sort_order: 3 },
  { id: "f-math", slug: "math", name: "Mathematics", description: "Multi-step mathematical problem solving.", color: "#ef4444", sort_order: 4 },
  { id: "f-speech", slug: "speech", name: "Speech Recognition", description: "Transcribing spoken audio to text.", color: "#06b6d4", sort_order: 5 },
];

export const demoBenchmarks: Benchmark[] = [
  { id: "b-mmlu", field_id: "f-language", slug: "mmlu", name: "MMLU", description: "Massive Multitask Language Understanding (57 subjects).", unit: "%", higher_is_better: true, source_url: "https://paperswithcode.com/sota/multi-task-language-understanding-on-mmlu" },
  { id: "b-humaneval", field_id: "f-coding", slug: "humaneval", name: "HumanEval", description: "Functional correctness of generated Python (pass@1).", unit: "%", higher_is_better: true, source_url: "https://paperswithcode.com/sota/code-generation-on-humaneval" },
  { id: "b-imagenet", field_id: "f-vision", slug: "imagenet", name: "ImageNet Top-1", description: "Top-1 classification accuracy on ImageNet.", unit: "%", higher_is_better: true, source_url: "https://paperswithcode.com/sota/image-classification-on-imagenet" },
  { id: "b-gsm8k", field_id: "f-math", slug: "gsm8k", name: "GSM8K", description: "Grade-school math word problems (GSM8K); distinct from the competition-math MATH and AIME-style benchmarks.", unit: "%", higher_is_better: true, source_url: "https://paperswithcode.com/sota/arithmetic-reasoning-on-gsm8k" },
  { id: "b-math-comp", field_id: "f-math", slug: "math-comp", name: "MATH", description: "The full Hendrycks MATH competition-math benchmark across all difficulty levels; distinct from the Epoch MATH Level 5 subset.", unit: "%", higher_is_better: true, source_url: "https://arxiv.org/abs/2103.03874" },
  { id: "b-aime", field_id: "f-math", slug: "aime-2024", name: "AIME 2024", description: "The official 2024 American Invitational Mathematics Examination (AIME), not a mock AIME-style benchmark.", unit: "%", higher_is_better: true, source_url: "https://openai.com/index/learning-to-reason-with-llms/" },
  { id: "b-librispeech", field_id: "f-speech", slug: "librispeech", name: "LibriSpeech WER", description: "Word error rate on LibriSpeech test-clean (lower is better).", unit: "% WER", higher_is_better: false, source_url: "https://paperswithcode.com/sota/speech-recognition-on-librispeech-test-clean" },
];

interface SeedPoint {
  b: string;
  model: string;
  org: string;
  score: number;
  date: string;
  src: string;
  note: string;
}

// Real, sourced figures (mirrors supabase/seed.sql). `note` records the
// evaluation method/conditions — these benchmarks are not always apples-to-apples.
const seedPoints: SeedPoint[] = [
  { b: "b-mmlu", model: "GPT-3", org: "OpenAI", score: 43.9, date: "2020-09-07", src: "https://arxiv.org/abs/2009.03300", note: "Few-shot (original MMLU paper)." },
  { b: "b-mmlu", model: "GPT-4", org: "OpenAI", score: 86.4, date: "2023-03-14", src: "https://arxiv.org/abs/2303.08774", note: "5-shot." },
  { b: "b-mmlu", model: "Gemini Ultra 1.0", org: "Google", score: 90.0, date: "2023-12-06", src: "https://arxiv.org/abs/2312.11805", note: "CoT@32 majority vote; first past ~89.8% human-expert estimate." },
  { b: "b-mmlu", model: "Claude 3 Opus", org: "Anthropic", score: 86.8, date: "2024-03-04", src: "https://www.anthropic.com/news/claude-3-family", note: "5-shot." },
  { b: "b-mmlu", model: "GPT-5", org: "OpenAI", score: 92.5, date: "2025-08-07", src: "https://llm-stats.com/benchmarks/mmlu", note: "Third-party aggregate; labs now report MMLU-Pro. Verify." },
  { b: "b-humaneval", model: "Codex (12B)", org: "OpenAI", score: 28.8, date: "2021-07-07", src: "https://arxiv.org/abs/2107.03374", note: "12B model, temp 0.2." },
  { b: "b-humaneval", model: "GPT-4", org: "OpenAI", score: 67.0, date: "2023-03-14", src: "https://arxiv.org/abs/2303.08774", note: "Canonical tech-report value (0-shot)." },
  { b: "b-humaneval", model: "GPT-4o", org: "OpenAI", score: 90.2, date: "2024-05-13", src: "https://en.wikipedia.org/wiki/GPT-4o", note: "Widely reported; secondary source." },
  { b: "b-humaneval", model: "DeepSeek-Coder-V2", org: "DeepSeek", score: 90.2, date: "2024-06-17", src: "https://arxiv.org/abs/2406.11931", note: "Instruct model." },
  { b: "b-humaneval", model: "Claude Opus 4", org: "Anthropic", score: 94.5, date: "2025-05-01", src: "https://www.anthropic.com/news/claude-4", note: "Third-party study; vendors report SWE-bench now. Verify." },
  { b: "b-imagenet", model: "AlexNet", org: "Univ. of Toronto", score: 63.3, date: "2012-09-30", src: "https://en.wikipedia.org/wiki/AlexNet", note: "Top-1 derived from paper's top-5 error; ImageNet-only." },
  { b: "b-imagenet", model: "ResNet-152", org: "Microsoft Research", score: 78.6, date: "2015-12-10", src: "https://arxiv.org/abs/1512.03385", note: "Single-crop top-1; ImageNet-only." },
  { b: "b-imagenet", model: "EfficientNet-B7", org: "Google Brain", score: 84.3, date: "2019-05-28", src: "https://arxiv.org/abs/1905.11946", note: "ImageNet-only." },
  { b: "b-imagenet", model: "ViT-H/14", org: "Google Research", score: 88.55, date: "2020-10-22", src: "https://arxiv.org/abs/2010.11929", note: "Pretrained on JFT-300M." },
  { b: "b-imagenet", model: "CoAtNet-7", org: "Google Research", score: 90.88, date: "2021-06-09", src: "https://arxiv.org/abs/2106.04803", note: "Pretrained on JFT-3B." },
  { b: "b-imagenet", model: "CoCa", org: "Google Research", score: 91.0, date: "2022-05-04", src: "https://arxiv.org/abs/2205.01917", note: "Image-text pretraining (JFT + ALIGN)." },
  { b: "b-gsm8k", model: "GPT-3 175B", org: "OpenAI", score: 55.0, date: "2021-10-27", src: "https://arxiv.org/abs/2110.14168", note: "Fine-tuned + verifiers (best-of-N)." },
  { b: "b-gsm8k", model: "PaLM 540B", org: "Google", score: 74.4, date: "2022-03-21", src: "https://arxiv.org/abs/2203.11171", note: "8-shot CoT + self-consistency (maj@40)." },
  { b: "b-gsm8k", model: "GPT-4", org: "OpenAI", score: 92.0, date: "2023-03-14", src: "https://arxiv.org/abs/2303.08774", note: "5-shot CoT." },
  { b: "b-gsm8k", model: "Gemini Ultra 1.0", org: "Google", score: 94.4, date: "2023-12-06", src: "https://arxiv.org/abs/2312.11805", note: "CoT maj1@32." },
  { b: "b-gsm8k", model: "Claude 3.5 Sonnet", org: "Anthropic", score: 96.4, date: "2024-06-20", src: "https://www.anthropic.com/news/claude-3-5-sonnet", note: "0-shot CoT." },
  { b: "b-gsm8k", model: "Llama 3.1 405B", org: "Meta", score: 96.8, date: "2024-07-23", src: "https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md", note: "8-shot CoT." },
  { b: "b-math-comp", model: "Minerva 540B", org: "Google", score: 50.3, date: "2022-06-29", src: "https://arxiv.org/abs/2206.14858", note: "Math-specialized; majority voting." },
  { b: "b-math-comp", model: "GPT-4", org: "OpenAI", score: 42.5, date: "2023-03-14", src: "https://arxiv.org/abs/2303.08774", note: "Few-shot, general model." },
  { b: "b-math-comp", model: "GPT-4o", org: "OpenAI", score: 76.6, date: "2024-05-13", src: "https://openai.com/index/hello-gpt-4o/", note: "General model." },
  { b: "b-math-comp", model: "o1", org: "OpenAI", score: 94.8, date: "2024-09-12", src: "https://openai.com/index/learning-to-reason-with-llms/", note: "RL reasoning model." },
  { b: "b-aime", model: "GPT-4o", org: "OpenAI", score: 12.0, date: "2024-05-13", src: "https://openai.com/index/learning-to-reason-with-llms/", note: "Avg 1.8/15 problems." },
  { b: "b-aime", model: "o1", org: "OpenAI", score: 74.4, date: "2024-09-12", src: "https://openai.com/index/learning-to-reason-with-llms/", note: "Single sample per problem." },
  { b: "b-aime", model: "o3", org: "OpenAI", score: 96.7, date: "2024-12-20", src: "https://www.datacamp.com/blog/o3-openai", note: "OpenAI o3 (Dec 2024); third-party report." },
  { b: "b-librispeech", model: "Deep Speech 2", org: "Baidu Research", score: 5.33, date: "2015-12-08", src: "https://arxiv.org/abs/1512.02595", note: "With external LM." },
  { b: "b-librispeech", model: "Conformer (L)", org: "Google", score: 1.9, date: "2020-05-16", src: "https://arxiv.org/abs/2005.08100", note: "With LM (no-LM ~2.1%)." },
  { b: "b-librispeech", model: "wav2vec 2.0", org: "Meta", score: 1.8, date: "2020-06-20", src: "https://arxiv.org/abs/2006.11477", note: "LARGE, with LM." },
  { b: "b-librispeech", model: "Conformer + Noisy Student", org: "Google Brain", score: 1.4, date: "2020-10-20", src: "https://arxiv.org/abs/2010.10504", note: "Semi-supervised." },
  { b: "b-librispeech", model: "Whisper (large)", org: "OpenAI", score: 2.5, date: "2022-12-06", src: "https://arxiv.org/abs/2212.04356", note: "Zero-shot (not fine-tuned) - reflects robustness." },
  { b: "b-librispeech", model: "Zipformer-L", org: "Xiaomi / k2", score: 2.0, date: "2023-10-17", src: "https://arxiv.org/abs/2310.11230", note: "No external LM." },
];

const verified: DataPoint[] = seedPoints.map((p, i) => ({
  id: `d-${i + 1}`,
  benchmark_id: p.b,
  model_name: p.model,
  organization: p.org,
  score: p.score,
  achieved_on: p.date,
  source_url: p.src,
  notes: p.note,
  submitted_by: null,
  status: "verified",
  vote_score: 3,
  protected: true,
  created_at: p.date + "T00:00:00Z",
}));

// A couple of community submissions awaiting verification, to demonstrate voting.
const pending: DataPoint[] = [
  {
    id: "d-pending-1",
    benchmark_id: "b-mmlu",
    model_name: "Llama 3.1 405B",
    organization: "Meta",
    score: 88.6,
    achieved_on: "2024-07-23",
    source_url: "https://ai.meta.com/blog/meta-llama-3-1/",
    notes: "Reported in the Llama 3.1 release.",
    submitted_by: null,
    status: "pending",
    vote_score: 1,
    protected: false,
    created_at: "2024-07-24T00:00:00Z",
  },
  {
    id: "d-pending-2",
    benchmark_id: "b-humaneval",
    model_name: "DeepSeek-Coder V2",
    organization: "DeepSeek",
    score: 90.2,
    achieved_on: "2024-06-17",
    source_url: "https://github.com/deepseek-ai/DeepSeek-Coder-V2",
    notes: null,
    submitted_by: null,
    status: "pending",
    vote_score: 0,
    protected: false,
    created_at: "2024-06-18T00:00:00Z",
  },
];

export const demoDataPoints: DataPoint[] = [...verified, ...pending];

// ---- Field metrics: popularity index + market value (USD billions) --------
// Illustrative yearly estimates (2018-2025) mirroring supabase/seed.sql.

// MARKET VALUE — real figures from Grand View Research (USD billions). Yearly points
// are geometrically interpolated between GVR's reported real endpoints. Mathematics
// has no distinct market segment, so it carries no market-value series.
const GVR: Record<string, string> = {
  "f-language": "https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report",
  "f-vision": "https://www.grandviewresearch.com/industry-analysis/computer-vision-market",
  "f-speech": "https://www.grandviewresearch.com/industry-analysis/voice-recognition-market",
  "f-coding": "https://www.grandviewresearch.com/industry-analysis/ai-code-tools-market-report",
};

const marketValuePoints: Record<string, Array<[number, number]>> = {
  "f-language": [[2024, 59.7], [2025, 83.3], [2026, 116.2], [2027, 162.0], [2028, 226.0], [2029, 315.3], [2030, 439.85]],
  "f-vision": [[2024, 19.82], [2025, 23.7], [2026, 28.4], [2027, 34.0], [2028, 40.7], [2029, 48.7], [2030, 58.29]],
  "f-speech": [[2023, 20.25], [2024, 23.7], [2025, 27.2], [2026, 31.1], [2027, 35.7], [2028, 40.9], [2029, 46.8], [2030, 53.67]],
  "f-coding": [[2023, 4.86], [2024, 6.18], [2025, 7.85], [2026, 9.98], [2027, 12.68], [2028, 16.1], [2029, 20.5], [2030, 26.03]],
};

// POPULARITY — REAL proxy: annual submission counts to the field's main arXiv
// category (a research-activity measure), pulled from the arXiv API. Mathematics has
// no clean AI-specific category, so it carries no popularity series.
const ARXIV: Record<string, string> = {
  "f-language": "https://arxiv.org/list/cs.CL/recent",
  "f-vision": "https://arxiv.org/list/cs.CV/recent",
  "f-coding": "https://arxiv.org/list/cs.SE/recent",
  "f-speech": "https://arxiv.org/list/eess.AS/recent",
};
const POP_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const popularityByField: Record<string, number[]> = {
  "f-language": [3729, 5393, 7125, 8083, 8971, 13601, 20689, 23756], // cs.CL
  "f-vision": [8591, 11601, 15340, 17203, 19692, 24523, 30584, 34978], // cs.CV
  "f-coding": [1014, 1187, 1520, 2165, 1990, 2716, 3690, 5184], // cs.SE
  "f-speech": [875, 1410, 2180, 2426, 2987, 3214, 3703, 3514], // eess.AS
};

function buildMarketValue(): FieldMetric[] {
  const out: FieldMetric[] = [];
  for (const [fieldId, points] of Object.entries(marketValuePoints)) {
    for (const [yr, value] of points) {
      out.push({
        id: `m-market_value-${fieldId}-${yr}`,
        field_id: fieldId,
        metric_key: "market_value",
        period: `${yr}-01-01`,
        value,
        unit: "USD_billion",
        source_url: GVR[fieldId] ?? null,
        status: "verified",
        vote_score: 3,
        protected: true,
        submitted_by: null,
        notes: null,
      });
    }
  }
  return out;
}

function buildPopularity(): FieldMetric[] {
  const out: FieldMetric[] = [];
  for (const [fieldId, values] of Object.entries(popularityByField)) {
    values.forEach((value, i) => {
      out.push({
        id: `m-popularity-${fieldId}-${POP_YEARS[i]}`,
        field_id: fieldId,
        metric_key: "popularity",
        period: `${POP_YEARS[i]}-01-01`,
        value,
        unit: "papers",
        source_url: ARXIV[fieldId] ?? null,
        status: "verified",
        vote_score: 3,
        protected: true,
        submitted_by: null,
        notes: null,
      });
    });
  }
  return out;
}

export const demoFieldMetrics: FieldMetric[] = [...buildMarketValue(), ...buildPopularity()];

// A couple of community metric submissions awaiting verification (demo mode), to
// demonstrate the submit/vote flow — e.g. proposing a market value for Mathematics
// (which has no curated series) and a forward 2026 figure.
export const demoPendingMetrics: FieldMetric[] = [
  {
    id: "m-pending-math-mv-2024",
    field_id: "f-math",
    metric_key: "market_value",
    period: "2024-01-01",
    value: 2.4,
    unit: "USD_billion",
    source_url: "https://www.marketsandmarkets.com/",
    status: "pending",
    vote_score: 1,
    protected: false,
    submitted_by: null,
    notes: "Rough estimate for AI-for-math tooling; needs a better source.",
  },
  {
    id: "m-pending-language-mv-2026",
    field_id: "f-language",
    metric_key: "market_value",
    period: "2026-01-01",
    value: 116.2,
    unit: "USD_billion",
    source_url: "https://www.grandviewresearch.com/industry-analysis/natural-language-processing-market-report",
    status: "pending",
    vote_score: 0,
    protected: false,
    submitted_by: null,
    notes: "2026 interpolation from GVR forecast.",
  },
];
