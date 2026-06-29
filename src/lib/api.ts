// Data-access layer. Talks to Supabase when configured; otherwise serves bundled
// demo data so the site remains fully viewable without backend credentials.

import { supabase } from "./supabaseClient";
import { isConfigured } from "./config";
import { Article, Benchmark, DataPoint, Field, FieldMetric } from "./types";
import { demoArticles, demoBenchmarks, demoDataPoints, demoFieldMetrics, demoFields } from "./demoData";

export interface Api {
  getFields(): Promise<Field[]>;
  getAllBenchmarks(): Promise<Benchmark[]>;
  getFieldMetrics(): Promise<FieldMetric[]>;
  getFieldBySlug(slug: string): Promise<Field | null>;
  getBenchmarkBySlug(slug: string): Promise<Benchmark | null>;
  getVerifiedPoints(benchmarkId: string): Promise<DataPoint[]>;
  getPoints(benchmarkId: string): Promise<DataPoint[]>;
  getArticles(limitPerCategory?: number): Promise<Article[]>;
}

// ---------------------------------------------------------------------------
// Demo implementation (bundled read-only data)
// ---------------------------------------------------------------------------

class DemoApi implements Api {
  async getFields(): Promise<Field[]> {
    return [...demoFields].sort((a, b) => a.sort_order - b.sort_order);
  }

  async getAllBenchmarks(): Promise<Benchmark[]> {
    return [...demoBenchmarks];
  }

  async getFieldMetrics(): Promise<FieldMetric[]> {
    return [...demoFieldMetrics];
  }

  async getFieldBySlug(slug: string): Promise<Field | null> {
    return demoFields.find((f) => f.slug === slug) ?? null;
  }

  async getBenchmarkBySlug(slug: string): Promise<Benchmark | null> {
    return demoBenchmarks.find((b) => b.slug === slug) ?? null;
  }

  async getVerifiedPoints(benchmarkId: string): Promise<DataPoint[]> {
    return this.getPoints(benchmarkId);
  }

  async getPoints(benchmarkId: string): Promise<DataPoint[]> {
    return demoDataPoints
      .filter((p) => p.benchmark_id === benchmarkId)
      .sort((a, b) => a.achieved_on.localeCompare(b.achieved_on));
  }

  async getArticles(limitPerCategory = 5): Promise<Article[]> {
    return limitArticlesByCategory(demoArticles, limitPerCategory);
  }
}

// ---------------------------------------------------------------------------
// Supabase implementation (read-only frontend access)
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
    return this.getPoints(benchmarkId);
  }

  async getPoints(benchmarkId: string): Promise<DataPoint[]> {
    const { data, error } = await this.db
      .from("data_points")
      .select("*")
      .eq("benchmark_id", benchmarkId)
      .eq("status", "verified")
      .order("achieved_on");
    if (error) throw error;
    return data as DataPoint[];
  }

  async getArticles(limitPerCategory = 5): Promise<Article[]> {
    const { data, error } = await this.db
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limitPerCategory * 3);
    if (error) throw error;
    return limitArticlesByCategory((data ?? []).map(normalizeArticle) as Article[], limitPerCategory);
  }
}

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    topics: Array.isArray(article.topics) && article.topics.length > 0 ? article.topics : ["General"],
  };
}

function limitArticlesByCategory(articles: Article[], limitPerCategory: number): Article[] {
  const counts: Record<Article["category"], number> = { trending: 0, research: 0, official: 0 };
  return [...articles]
    .sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at))
    .filter((article) => {
      if (counts[article.category] >= limitPerCategory) return false;
      counts[article.category] += 1;
      return true;
    });
}

export const api: Api = isConfigured ? new SupabaseApi() : new DemoApi();
