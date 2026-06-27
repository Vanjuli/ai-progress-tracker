// Data-access layer. Talks to Supabase when configured; otherwise serves bundled
// demo data with votes/submissions persisted to localStorage so the full flow
// (submit -> vote -> verify) works locally without a backend.

import { supabase } from "./supabaseClient";
import { isConfigured, VERIFY_THRESHOLD } from "./config";
import {
  Benchmark,
  DataPoint,
  Field,
  FieldMetric,
  NewDataPoint,
  NewFieldMetric,
} from "./types";
import {
  demoBenchmarks,
  demoDataPoints,
  demoFieldMetrics,
  demoPendingMetrics,
  demoFields,
} from "./demoData";
import { statusForVotes } from "./verification";

export interface Api {
  getFields(): Promise<Field[]>;
  getAllBenchmarks(): Promise<Benchmark[]>;
  getFieldMetrics(): Promise<FieldMetric[]>; // verified only
  getPendingMetrics(): Promise<FieldMetric[]>;
  submitMetric(input: NewFieldMetric, userId: string): Promise<FieldMetric>;
  getMyMetricVotes(): Promise<Record<string, number>>;
  castMetricVote(fieldMetricId: string, value: 1 | -1, userId: string): Promise<void>;
  getFieldBySlug(slug: string): Promise<Field | null>;
  getBenchmarkBySlug(slug: string): Promise<Benchmark | null>;
  getVerifiedPoints(benchmarkId: string): Promise<DataPoint[]>;
  getPoints(benchmarkId: string): Promise<DataPoint[]>;
  getPendingPoints(): Promise<DataPoint[]>;
  submitPoint(input: NewDataPoint, userId: string): Promise<DataPoint>;
  getMyVotes(): Promise<Record<string, number>>;
  castVote(dataPointId: string, value: 1 | -1, userId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Demo implementation (localStorage-backed)
// ---------------------------------------------------------------------------

const VOTES_KEY = "apt.demo.votes";
const SUBS_KEY = "apt.demo.submissions";
const METRIC_VOTES_KEY = "apt.demo.metricVotes";
const METRIC_SUBS_KEY = "apt.demo.metricSubs";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

class DemoApi implements Api {
  private myVotes(): Record<string, number> {
    return readJson<Record<string, number>>(VOTES_KEY, {});
  }

  private submissions(): DataPoint[] {
    return readJson<DataPoint[]>(SUBS_KEY, []);
  }

  /** Apply the local user's vote on top of the stored base tally, then re-derive status. */
  private effective(p: DataPoint): DataPoint {
    const mine = this.myVotes()[p.id] ?? 0;
    const voteScore = p.vote_score + mine;
    const status = statusForVotes({
      voteScore,
      threshold: VERIFY_THRESHOLD,
      protectedRow: p.protected,
      currentStatus: p.status,
    });
    return { ...p, vote_score: voteScore, status };
  }

  private allPoints(): DataPoint[] {
    return [...demoDataPoints, ...this.submissions()].map((p) => this.effective(p));
  }

  async getFields(): Promise<Field[]> {
    return [...demoFields].sort((a, b) => a.sort_order - b.sort_order);
  }
  async getAllBenchmarks(): Promise<Benchmark[]> {
    return [...demoBenchmarks];
  }
  async getFieldMetrics(): Promise<FieldMetric[]> {
    return this.allMetrics().filter((m) => m.status === "verified");
  }
  async getFieldBySlug(slug: string): Promise<Field | null> {
    return demoFields.find((f) => f.slug === slug) ?? null;
  }
  async getBenchmarkBySlug(slug: string): Promise<Benchmark | null> {
    return demoBenchmarks.find((b) => b.slug === slug) ?? null;
  }
  async getVerifiedPoints(benchmarkId: string): Promise<DataPoint[]> {
    return this.allPoints()
      .filter((p) => p.benchmark_id === benchmarkId && p.status === "verified")
      .sort((a, b) => a.achieved_on.localeCompare(b.achieved_on));
  }
  async getPoints(benchmarkId: string): Promise<DataPoint[]> {
    return this.allPoints()
      .filter((p) => p.benchmark_id === benchmarkId && p.status !== "rejected")
      .sort((a, b) => a.achieved_on.localeCompare(b.achieved_on));
  }
  async getPendingPoints(): Promise<DataPoint[]> {
    return this.allPoints()
      .filter((p) => p.status === "pending")
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async submitPoint(input: NewDataPoint): Promise<DataPoint> {
    const subs = this.submissions();
    const point: DataPoint = {
      id: `d-sub-${Date.now()}`,
      benchmark_id: input.benchmark_id,
      model_name: input.model_name,
      organization: input.organization ?? null,
      score: input.score,
      achieved_on: input.achieved_on,
      source_url: input.source_url ?? null,
      notes: input.notes ?? null,
      submitted_by: "demo-user",
      status: "pending",
      vote_score: 0,
      protected: false,
      created_at: new Date().toISOString(),
    };
    writeJson(SUBS_KEY, [...subs, point]);
    return point;
  }
  async getMyVotes(): Promise<Record<string, number>> {
    return this.myVotes();
  }
  async castVote(dataPointId: string, value: 1 | -1): Promise<void> {
    const votes = this.myVotes();
    if (votes[dataPointId] === value) delete votes[dataPointId];
    else votes[dataPointId] = value;
    writeJson(VOTES_KEY, votes);
  }

  // --- metrics ---
  private myMetricVotes(): Record<string, number> {
    return readJson<Record<string, number>>(METRIC_VOTES_KEY, {});
  }
  private metricSubs(): FieldMetric[] {
    return readJson<FieldMetric[]>(METRIC_SUBS_KEY, []);
  }
  private effectiveMetric(m: FieldMetric): FieldMetric {
    const mine = this.myMetricVotes()[m.id] ?? 0;
    const voteScore = (m.vote_score ?? 0) + mine;
    const status = statusForVotes({
      voteScore,
      threshold: VERIFY_THRESHOLD,
      protectedRow: m.protected ?? false,
      currentStatus: m.status ?? "pending",
    });
    return { ...m, vote_score: voteScore, status };
  }
  private allMetrics(): FieldMetric[] {
    return [...demoFieldMetrics, ...demoPendingMetrics, ...this.metricSubs()].map((m) =>
      this.effectiveMetric(m)
    );
  }
  async getPendingMetrics(): Promise<FieldMetric[]> {
    return this.allMetrics()
      .filter((m) => m.status === "pending")
      .sort((a, b) => b.period.localeCompare(a.period));
  }
  async submitMetric(input: NewFieldMetric): Promise<FieldMetric> {
    const subs = this.metricSubs();
    const m: FieldMetric = {
      id: `m-sub-${Date.now()}`,
      field_id: input.field_id,
      metric_key: input.metric_key,
      period: input.period,
      value: input.value,
      unit: input.metric_key === "market_value" ? "USD_billion" : "papers",
      source_url: input.source_url ?? null,
      status: "pending",
      vote_score: 0,
      protected: false,
      submitted_by: "demo-user",
      notes: input.notes ?? null,
    };
    writeJson(METRIC_SUBS_KEY, [...subs, m]);
    return m;
  }
  async getMyMetricVotes(): Promise<Record<string, number>> {
    return this.myMetricVotes();
  }
  async castMetricVote(fieldMetricId: string, value: 1 | -1): Promise<void> {
    const votes = this.myMetricVotes();
    if (votes[fieldMetricId] === value) delete votes[fieldMetricId];
    else votes[fieldMetricId] = value;
    writeJson(METRIC_VOTES_KEY, votes);
  }
}

// ---------------------------------------------------------------------------
// Supabase implementation
// ---------------------------------------------------------------------------

class SupabaseApi implements Api {
  private get db() {
    if (!supabase) throw new Error("Supabase client is not configured");
    return supabase;
  }

  async getFields(): Promise<Field[]> {
    const { data, error } = await this.db.from("fields").select("*").order("sort_order");
    if (error) throw error;
    return data as Field[];
  }
  async getAllBenchmarks(): Promise<Benchmark[]> {
    const { data, error } = await this.db.from("benchmarks").select("*").order("name");
    if (error) throw error;
    return data as Benchmark[];
  }
  async getFieldMetrics(): Promise<FieldMetric[]> {
    const { data, error } = await this.db
      .from("field_metrics")
      .select("*")
      .eq("status", "verified")
      .order("period");
    if (error) throw error;
    return data as FieldMetric[];
  }
  async getPendingMetrics(): Promise<FieldMetric[]> {
    const { data, error } = await this.db
      .from("field_metrics")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as FieldMetric[];
  }
  async submitMetric(input: NewFieldMetric, userId: string): Promise<FieldMetric> {
    const unit = input.metric_key === "market_value" ? "USD_billion" : "papers";
    const { data, error } = await this.db
      .from("field_metrics")
      .insert({
        field_id: input.field_id,
        metric_key: input.metric_key,
        period: input.period,
        value: input.value,
        unit,
        source_url: input.source_url ?? null,
        notes: input.notes ?? null,
        submitted_by: userId,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return data as FieldMetric;
  }
  async getMyMetricVotes(): Promise<Record<string, number>> {
    const { data, error } = await this.db.from("metric_votes").select("field_metric_id, value");
    if (error) throw error;
    const map: Record<string, number> = {};
    for (const v of data as { field_metric_id: string; value: number }[]) {
      map[v.field_metric_id] = v.value;
    }
    return map;
  }
  async castMetricVote(fieldMetricId: string, value: 1 | -1, userId: string): Promise<void> {
    const { data: existing, error: readErr } = await this.db
      .from("metric_votes")
      .select("value")
      .eq("field_metric_id", fieldMetricId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw readErr;
    if (existing && (existing as { value: number }).value === value) {
      const { error } = await this.db
        .from("metric_votes")
        .delete()
        .eq("field_metric_id", fieldMetricId)
        .eq("user_id", userId);
      if (error) throw error;
      return;
    }
    const { error } = await this.db
      .from("metric_votes")
      .upsert(
        { field_metric_id: fieldMetricId, user_id: userId, value },
        { onConflict: "field_metric_id,user_id" }
      );
    if (error) throw error;
  }
  async getFieldBySlug(slug: string): Promise<Field | null> {
    const { data, error } = await this.db.from("fields").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data as Field) ?? null;
  }
  async getBenchmarkBySlug(slug: string): Promise<Benchmark | null> {
    const { data, error } = await this.db
      .from("benchmarks")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Benchmark) ?? null;
  }
  async getVerifiedPoints(benchmarkId: string): Promise<DataPoint[]> {
    const { data, error } = await this.db
      .from("data_points")
      .select("*")
      .eq("benchmark_id", benchmarkId)
      .eq("status", "verified")
      .order("achieved_on");
    if (error) throw error;
    return data as DataPoint[];
  }
  async getPoints(benchmarkId: string): Promise<DataPoint[]> {
    const { data, error } = await this.db
      .from("data_points")
      .select("*")
      .eq("benchmark_id", benchmarkId)
      .neq("status", "rejected")
      .order("achieved_on");
    if (error) throw error;
    return data as DataPoint[];
  }
  async getPendingPoints(): Promise<DataPoint[]> {
    const { data, error } = await this.db
      .from("data_points")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as DataPoint[];
  }
  async submitPoint(input: NewDataPoint, userId: string): Promise<DataPoint> {
    const { data, error } = await this.db
      .from("data_points")
      .insert({ ...input, submitted_by: userId, status: "pending" })
      .select()
      .single();
    if (error) throw error;
    return data as DataPoint;
  }
  async getMyVotes(): Promise<Record<string, number>> {
    const { data, error } = await this.db.from("votes").select("data_point_id, value");
    if (error) throw error;
    const map: Record<string, number> = {};
    for (const v of data as { data_point_id: string; value: number }[]) {
      map[v.data_point_id] = v.value;
    }
    return map;
  }
  async castVote(dataPointId: string, value: 1 | -1, userId: string): Promise<void> {
    const { data: existing, error: readErr } = await this.db
      .from("votes")
      .select("value")
      .eq("data_point_id", dataPointId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw readErr;

    if (existing && (existing as { value: number }).value === value) {
      // Toggling the same vote off.
      const { error } = await this.db
        .from("votes")
        .delete()
        .eq("data_point_id", dataPointId)
        .eq("user_id", userId);
      if (error) throw error;
      return;
    }
    const { error } = await this.db
      .from("votes")
      .upsert(
        { data_point_id: dataPointId, user_id: userId, value },
        { onConflict: "data_point_id,user_id" }
      );
    if (error) throw error;
  }
}

export const api: Api = isConfigured ? new SupabaseApi() : new DemoApi();
