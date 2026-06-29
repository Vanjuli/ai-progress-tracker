#!/usr/bin/env node

/**
 * Automated article collector for AI Progress Tracker.
 *
 * Safety defaults mirror scripts/collect-data.mjs:
 * - Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY => dry-run, no writes.
 * - DRY_RUN=1/true/yes/y => dry-run, no writes.
 */

import { createClient } from "@supabase/supabase-js";
import {
  ARTICLE_AUTO_MARKER,
  dedupeArticlesByUrl,
  filterRecentTrendingStories,
  newestByCategory,
  parseArxivEntries,
  parseFeedEntries,
} from "./article-helpers.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const DRY_RUN = isDryRun();
const HN_MIN_POINTS = Number(process.env.HN_MIN_POINTS ?? 50);
const CATEGORY_LIMIT = Number(process.env.ARTICLE_CATEGORY_LIMIT ?? 30);
const ARXIV_API_URL = "https://export.arxiv.org/api/query";
const ARXIV_CATEGORIES = ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.RO", "stat.ML"];
const ARXIV_REQUEST_HEADERS = {
  "User-Agent": "AIProgressTracker/1.0 (+https://aiprogresstracker.org; article collector)",
  Accept: "application/atom+xml",
};
const ARXIV_RETRY_DELAYS_MS = [2000, 5000, 10000];

const OFFICIAL_FEEDS = [
  { sourceName: "OpenAI", source: "rss-openai", url: "https://openai.com/news/rss.xml" },
  { sourceName: "Google DeepMind", source: "rss-deepmind", url: "https://deepmind.google/blog/rss.xml" },
  { sourceName: "Hugging Face", source: "rss-huggingface", url: "https://huggingface.co/blog/feed.xml" },
  { sourceName: "Google Research", source: "rss-google-research", url: "https://research.google/blog/rss/" },
  { sourceName: "Meta AI", source: "rss-meta-ai", url: "https://ai.meta.com/blog/rss/" },
  { sourceName: "Anthropic", source: "rss-anthropic", url: "https://www.anthropic.com/news/rss.xml" },
];

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

function dryRunReason() {
  return [
    !SUPABASE_URL ? "missing SUPABASE_URL" : "",
    !SUPABASE_SERVICE_ROLE_KEY ? "missing SUPABASE_SERVICE_ROLE_KEY" : "",
    process.env.DRY_RUN ? `DRY_RUN=${process.env.DRY_RUN}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function twoWeeksAgoUnix(now = new Date()) {
  return Math.floor((now.getTime() - 14 * 24 * 60 * 60 * 1000) / 1000);
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.json();
}

async function collectTrendingArticles() {
  const params = new URLSearchParams({
    query: "AI OR LLM OR GPT OR neural OR machine learning OR diffusion OR transformer",
    tags: "story",
    numericFilters: `created_at_i>${twoWeeksAgoUnix()},points>=${HN_MIN_POINTS}`,
    hitsPerPage: "100",
  });
  const url = `https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`;
  console.log(`[hackernews] fetching ${url}`);
  const data = await fetchJson(url);
  const rows = filterRecentTrendingStories(data.hits ?? [], { minPoints: HN_MIN_POINTS, days: 14 });
  console.log(`[hackernews] kept ${rows.length} AI stories with >=${HN_MIN_POINTS} points from ${data.hits?.length ?? 0} hits`);
  return rows;
}

function buildArxivUrl() {
  const query = `(${ARXIV_CATEGORIES.map((category) => `cat:${category}`).join(" OR ")})`;
  const params = new URLSearchParams({
    search_query: query,
    start: "0",
    max_results: "60",
    sortBy: "submittedDate",
    sortOrder: "descending",
  });
  return `${ARXIV_API_URL}?${params.toString()}`;
}

async function fetchArxivXml() {
  const url = buildArxivUrl();
  let lastError = null;
  for (let attempt = 0; attempt <= ARXIV_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, { headers: ARXIV_REQUEST_HEADERS });
      if (response.ok) return response.text();
      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < ARXIV_RETRY_DELAYS_MS.length) {
      const delay = ARXIV_RETRY_DELAYS_MS[attempt];
      console.warn(`[arxiv] retry ${attempt + 1}/${ARXIV_RETRY_DELAYS_MS.length} after ${delay}ms: ${lastError?.message ?? lastError}`);
      await sleep(delay);
    }
  }
  throw new Error(`arXiv API failed after ${ARXIV_RETRY_DELAYS_MS.length + 1} attempts: ${lastError?.message ?? lastError}`);
}

async function collectResearchArticles() {
  console.log(`[arxiv] fetching newest papers for ${ARXIV_CATEGORIES.join(", ")}`);
  const xml = await fetchArxivXml();
  const rows = parseArxivEntries(xml).slice(0, CATEGORY_LIMIT);
  console.log(`[arxiv] kept ${rows.length} newest papers`);
  return rows;
}

async function collectOfficialArticles() {
  const rows = [];
  for (const feed of OFFICIAL_FEEDS) {
    try {
      console.log(`[rss] fetching ${feed.sourceName}: ${feed.url}`);
      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "AIProgressTracker/1.0 (+https://aiprogresstracker.org; article collector)",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const xml = await response.text();
      const parsed = parseFeedEntries(xml, feed).slice(0, 10);
      console.log(`[rss] ${feed.sourceName}: kept ${parsed.length} entries`);
      rows.push(...parsed);
    } catch (error) {
      console.warn(`[rss] skip ${feed.sourceName}: ${error?.message ?? error}`);
    }
  }
  return rows;
}

function payloadForArticle(article) {
  return {
    title: article.title,
    url: article.url,
    source: article.source,
    category: article.category,
    author: article.author ?? null,
    score: article.score ?? null,
    published_at: article.published_at ?? null,
    summary: article.summary ?? null,
    notes: String(article.notes ?? ARTICLE_AUTO_MARKER).includes(ARTICLE_AUTO_MARKER)
      ? article.notes
      : `${ARTICLE_AUTO_MARKER}; ${article.notes}`,
  };
}

function logPlannedArticle(article, reason = "would upsert") {
  console.log(`[dry-run] ${reason}: category=${article.category} source=${article.source} published_at=${article.published_at ?? ""} score=${article.score ?? ""} title="${article.title}" url=${article.url}`);
}

async function writeArticles(articles) {
  if (DRY_RUN) {
    console.log(`[mode] DRY-RUN: database writes disabled (${dryRunReason()})`);
    for (const article of articles) logPlannedArticle(article);
    return;
  }

  console.log(`[mode] LIVE: upserting ${articles.length} articles to Supabase`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase
    .from("articles")
    .upsert(articles.map(payloadForArticle), { onConflict: "url" });
  if (error) throw error;
  console.log(`[write] upserted ${articles.length} articles`);
}

function logCategorySamples(articles) {
  for (const category of ["trending", "research", "official"]) {
    const sample = articles.find((article) => article.category === category);
    if (sample) {
      console.log(`[sample:${category}] ${sample.title} — ${sample.url}`);
    } else {
      console.log(`[sample:${category}] none collected`);
    }
  }
}

async function main() {
  console.log("AI Progress Tracker article collector");
  const [trending, research, official] = await Promise.all([
    collectTrendingArticles(),
    collectResearchArticles(),
    collectOfficialArticles(),
  ]);
  const articles = newestByCategory(dedupeArticlesByUrl([...trending, ...research, ...official]), CATEGORY_LIMIT);
  console.log(`[collect] total normalized articles after de-dupe/cap: ${articles.length}`);
  logCategorySamples(articles);
  await writeArticles(articles.map(payloadForArticle));
  console.log("Done.");
}

main().catch((error) => {
  console.error(`[error] ${error?.stack ?? error}`);
  process.exitCode = 1;
});
