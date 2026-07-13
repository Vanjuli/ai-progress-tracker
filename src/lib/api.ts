// Data-access layer. Talks to Supabase when configured; otherwise serves bundled
// demo data so the site remains fully viewable without backend credentials.

import { supabase } from "./supabaseClient";
import { isConfigured } from "./config";
import { excludeForecasts } from "./metrics";
import { Article, AsrRanking, Benchmark, DataPoint, Field, FieldMetric } from "./types";
import {
  demoArticles,
  demoAsrRankings,
  demoBenchmarks,
  demoDataPoints,
  demoFieldMetrics,
  demoFields,
} from "./demoData";

export interface Api {
  getFields(): Promise<Field[]>;
  getAllBenchmarks(): Promise<Benchmark[]>;
  getFieldMetrics(): Promise<FieldMetric[]>;
  getFieldBySlug(slug: string): Promise<Field | null>;
  getBenchmarkBySlug(slug: string): Promise<Benchmark | null>;
  getVerifiedPoints(benchmarkId: string): Promise<DataPoint[]>;
  getPoints(benchmarkId: string): Promise<DataPoint[]>;
  getArticles(limitPerCategory?: number): Promise<Article[]>;
  getAsrRankings(limit?: number): Promise<AsrRanking[]>;
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
    return excludeForecasts(demoFieldMetrics);
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

  async getAsrRankings(limit = 20): Promise<AsrRanking[]> {
    return [...demoAsrRankings]
      .sort((a, b) => a.avg_wer - b.avg_wer || a.model.localeCompare(b.model))
      .slice(0, limit);
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
    return excludeForecasts(data as FieldMetric[]);
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
    // One query per category so a prolific category (e.g. daily arXiv research)
    // cannot crowd the others out of the shared recency window.
    const categories: Array<Article["category"]> = ["trending", "research", "official"];
    const results = await Promise.all(
      categories.map((category) =>
        this.db
          .from("articles")
          .select("*")
          .eq("category", category)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(limitPerCategory)
      )
    );
    const articles: Article[] = [];
    for (const { data, error } of results) {
      if (error) throw error;
      articles.push(...((data ?? []) as Article[]).map(normalizeArticle));
    }
    return limitArticlesByCategory(articles, limitPerCategory);
  }

  async getAsrRankings(limit = 20): Promise<AsrRanking[]> {
    const { data, error } = await this.db
      .from("asr_rankings")
      .select("*")
      .order("avg_wer", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data as AsrRanking[];
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
