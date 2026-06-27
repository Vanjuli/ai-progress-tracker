// Shared domain types (mirror the database schema).

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

export type DataPointStatus = "pending" | "verified" | "rejected";

export interface DataPoint {
  id: string;
  benchmark_id: string;
  model_name: string;
  organization: string | null;
  score: number;
  achieved_on: string; // ISO date (YYYY-MM-DD)
  source_url: string | null;
  notes: string | null;
  submitted_by: string | null;
  status: DataPointStatus;
  vote_score: number;
  protected: boolean;
  created_at: string;
}

export interface NewDataPoint {
  benchmark_id: string;
  model_name: string;
  organization?: string;
  score: number;
  achieved_on: string;
  source_url?: string;
  notes?: string;
}

export interface AuthUser {
  id: string;
  email: string;
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
  status?: DataPointStatus;
  vote_score?: number;
  submitted_by?: string | null;
  protected?: boolean;
  notes?: string | null;
}

export interface NewFieldMetric {
  field_id: string;
  metric_key: MetricKey;
  period: string; // ISO date (use Jan 1 of the year)
  value: number;
  source_url?: string;
  notes?: string;
}
