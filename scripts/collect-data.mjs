#!/usr/bin/env node

/**
 * Automated data collector for AI Progress Tracker.
 *
 * Runtime: Node 20+ ESM. Uses global fetch and the existing @supabase/supabase-js
 * dependency when real database writes are enabled.
 *
 * Safety defaults:
 * - No SUPABASE_SERVICE_ROLE_KEY => dry-run, no writes.
 * - DRY_RUN=1/true/yes => dry-run, no writes.
 * - SUPABASE_URL is also required for real writes.
 */

import { createClient } from "@supabase/supabase-js";

const AUTO_MARKER = "auto-collected:arxiv-popularity";
const BENCHMARK_AUTO_MARKER = "auto-collected:benchmark";
const ARXIV_API_URL = "https://export.arxiv.org/api/query";
const ARXIV_REQUEST_HEADERS = {
  "User-Agent": "AIProgressTracker/1.0 (+https://aiprogresstracker.org)",
  Accept: "application/atom+xml",
};
const ARXIV_RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 40000];

// Mirrors the project-defined popularity mapping documented in supabase/seed.sql
// and the About/Compare copy: annual arXiv submissions in each field's main
// category. Math intentionally has no clean AI-specific arXiv category.
const FIELD_ARXIV_CATEGORIES = [
  { slug: "language", name: "Language & Reasoning", category: "cs.CL" },
  { slug: "vision", name: "Computer Vision", category: "cs.CV" },
  { slug: "coding", name: "Code Generation", category: "cs.SE" },
  { slug: "speech", name: "Speech Recognition", category: "eess.AS" },
];

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const DRY_RUN = isDryRun();

function isDryRun() {
  const value = process.env.DRY_RUN?.trim().toLowerCase();
  return (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    value === "1" ||
    value === "true" ||
    value === "yes" ||
    value === "y"
  );
}

function currentYearPeriod(now = new Date()) {
  const year = now.getUTCFullYear();
  const start = `${year}01010000`;
  const end = `${year}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}2359`;
  return {
    year,
    period: `${year}-01-01`,
    submittedDateRange: `${start} TO ${end}`,
  };
}

function buildArxivUrl(category, submittedDateRange) {
  const searchQuery = `cat:${category} AND submittedDate:[${submittedDateRange}]`;
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: "0",
    // arXiv currently returns HTTP 500 for max_results=0 on these range
    // queries, so request one entry while reading only opensearch:totalResults.
    max_results: "1",
  });
  return `${ARXIV_API_URL}?${params.toString()}`;
}

function parseTotalResults(xml) {
  const match = xml.match(/<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/);
  if (!match) {
    throw new Error("Could not parse opensearch:totalResults from arXiv response");
  }
  return Number.parseInt(match[1], 10);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchArxivCount(category, submittedDateRange) {
  const url = buildArxivUrl(category, submittedDateRange);
  let lastError = null;

  for (let attempt = 0; attempt <= ARXIV_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, { headers: ARXIV_REQUEST_HEADERS });

      if (response.ok) {
        const xml = await response.text();
        return { count: parseTotalResults(xml), sourceUrl: url };
      }

      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < ARXIV_RETRY_DELAYS_MS.length) {
      const delayMs = ARXIV_RETRY_DELAYS_MS[attempt];
      console.warn(
        `[arxiv] retry ${attempt + 1}/${ARXIV_RETRY_DELAYS_MS.length} for ${category} after ${delayMs}ms: ${
          lastError?.message ?? lastError
        }`
      );
      await sleep(delayMs);
    }
  }

  throw new Error(
    `arXiv API failed for ${category} after ${ARXIV_RETRY_DELAYS_MS.length + 1} attempts: ${
      lastError?.message ?? lastError
    }`
  );
}

async function collectPopularityRows() {
  const { period, submittedDateRange } = currentYearPeriod();
  const rows = [];

  for (const [index, field] of FIELD_ARXIV_CATEGORIES.entries()) {
    // Be polite to arXiv's API: wait about 3 seconds between category requests.
    if (index > 0) await sleep(3100);
    const { count, sourceUrl } = await fetchArxivCount(field.category, submittedDateRange);
    rows.push({
      field_slug: field.slug,
      field_name: field.name,
      metric_key: "popularity",
      period,
      value: count,
      unit: "papers",
      source_url: sourceUrl,
      notes: `${AUTO_MARKER}; category=${field.category}; submittedDate=[${submittedDateRange}]`,
      status: "verified",
      protected: true,
    });
  }

  return rows;
}

async function collectBenchmarkRows() {
  // Researched source options (2026-06): the seeded benchmark URLs mostly point
  // to Papers with Code SOTA pages. Requests to the former Papers with Code API
  // endpoints and SOTA pages currently redirect to Hugging Face Papers, and HF
  // Papers does not expose a clean free API that maps these benchmark leaderboards
  // to stable model/score/date/source rows. Other benchmark sites vary by task
  // and do not cover the project's exact seeded benchmark set uniformly.
  //
  // Accuracy is more important than coverage, so this intentionally returns no
  // rows instead of scraping brittle pages or fabricating benchmark values.
  console.log(
    `[benchmarks] ${BENCHMARK_AUTO_MARKER}: no reliable free public API/source currently maps cleanly to the seeded benchmarks; manual source needed.`
  );
  return [];
}

function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadFieldsBySlug(supabase) {
  const { data, error } = await supabase.from("fields").select("id, slug, name");
  if (error) throw error;
  return new Map(data.map((field) => [field.slug, field]));
}

function logPlannedRow(row, reason = "would upsert") {
  console.log(
    `[dry-run] ${reason}: field=${row.field_slug} metric=${row.metric_key} period=${row.period} value=${row.value} ${row.unit} status=${row.status} protected=${row.protected} source_url=${row.source_url} notes="${row.notes}"`
  );
}

async function writePopularityRows(rows) {
  if (DRY_RUN) {
    console.log(
      `[mode] DRY-RUN: database writes disabled (${!SUPABASE_URL ? "missing SUPABASE_URL" : ""}${
        !SUPABASE_URL && !SUPABASE_SERVICE_ROLE_KEY ? ", " : ""
      }${!SUPABASE_SERVICE_ROLE_KEY ? "missing SUPABASE_SERVICE_ROLE_KEY" : ""}${
        process.env.DRY_RUN ? `DRY_RUN=${process.env.DRY_RUN}` : ""
      })`
    );
    for (const row of rows) logPlannedRow(row);
    return;
  }

  console.log("[mode] LIVE: writing auto-collected rows to Supabase");
  const supabase = createSupabaseClient();
  const fieldsBySlug = await loadFieldsBySlug(supabase);

  for (const row of rows) {
    const field = fieldsBySlug.get(row.field_slug);
    if (!field) {
      console.warn(`[skip] field=${row.field_slug}: no matching Supabase field row`);
      continue;
    }

    const { data: existing, error: readError } = await supabase
      .from("field_metrics")
      .select("id, notes, source_url, protected, status")
      .eq("field_id", field.id)
      .eq("metric_key", row.metric_key)
      .eq("period", row.period)
      .maybeSingle();

    if (readError) throw readError;

    if (existing && !String(existing.notes ?? "").includes(AUTO_MARKER)) {
      console.log(
        `[skip] field=${row.field_slug} metric=${row.metric_key} period=${row.period}: existing row is not marked ${AUTO_MARKER}; leaving human-curated value untouched.`
      );
      continue;
    }

    const payload = {
      field_id: field.id,
      metric_key: row.metric_key,
      period: row.period,
      value: row.value,
      unit: row.unit,
      source_url: row.source_url,
      notes: row.notes,
      status: row.status,
      protected: row.protected,
      submitted_by: null,
    };

    const { error: upsertError } = await supabase
      .from("field_metrics")
      .upsert(payload, { onConflict: "field_id,metric_key,period" });

    if (upsertError) throw upsertError;
    console.log(
      `[write] ${existing ? "updated" : "inserted"}: field=${row.field_slug} metric=${row.metric_key} period=${row.period} value=${row.value} ${row.unit}`
    );
  }
}

async function main() {
  console.log("AI Progress Tracker automated data collector");
  const popularityRows = await collectPopularityRows();
  await collectBenchmarkRows();
  await writePopularityRows(popularityRows);
  console.log("Done.");
}

main().catch((error) => {
  console.error(`[error] ${error?.stack ?? error}`);
  process.exitCode = 1;
});
