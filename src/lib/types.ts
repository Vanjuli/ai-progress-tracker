// Shared domain types (mirror the database read shape used by the frontend).

export interface Field {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
}

export interface Benchmark {
  id: string;
  field_id: string;
  slug: string;
  name: string;
  description: string | null;
  unit: string;
  higher_is_better: boolean;
  source_url: string | null;
}

export interface DataPoint {
  id: string;
  benchmark_id: string;
  model_name: string;
  organization: string | null;
  score: number;
  achieved_on: string; // ISO date (YYYY-MM-DD)
  source_url: string | null;
  notes: string | null;
  created_at: string;
}

export type MetricKey = "popularity" | "market_value";

export interface FieldMetric {
  id: string;
  field_id: string;
  metric_key: MetricKey;
  period: string; // ISO date (yearly snapshot)
  value: number;
  unit: string; // 'papers' | 'USD_billion'
  source_url?: string | null;
  notes?: string | null;
}

export interface AsrRanking {
  id: string;
  model: string;
  avg_wer: number;
  rtfx: number | null;
  license: string | null;
  datasets_count: number | null;
  source_url: string | null;
  notes: string | null;
  collected_at: string;
}

// Hand-curated "Food for thought" entries; data lives in src/lib/foodForThought.ts, not the database.
export interface FoodForThoughtEntry {
  id: string;
  title: string;
  topic: string;
  stat: string;
  summary: string;
  aiAngle: string;
  source: string;
  sourceUrl: string;
  year: number;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  category: "trending" | "research" | "official";
  topics: string[];
  author: string | null;
  score: number | null;
  published_at: string | null;
  summary: string | null;
  notes: string | null;
  created_at: string;
}
