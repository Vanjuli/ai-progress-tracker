import { XMLParser } from "fast-xml-parser";

export const ARTICLE_AUTO_MARKER = "auto-collected:articles";
export const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "llm",
  "llms",
  "gpt",
  "claude",
  "gemini",
  "neural",
  "machine learning",
  "deep learning",
  "diffusion",
  "transformer",
  "multimodal",
  "agentic",
  "robotics",
  "computer vision",
  "reinforcement learning",
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  trimValues: true,
  parseTagValue: false,
});

export function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function textValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object") {
    return String(value["#cdata"] ?? value["#text"] ?? value._ ?? "").trim();
  }
  return "";
}

export function normalizeWhitespace(value) {
  return textValue(value).replace(/\s+/g, " ").trim();
}

export function parseDateIso(value) {
  const raw = textValue(value);
  if (!raw) return null;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function normalizeUrl(rawUrl) {
  const raw = textValue(rawUrl);
  if (!raw) return "";
  try {
    const url = new URL(raw.replace(/^http:\/\/arxiv\.org\//, "https://arxiv.org/"));
    if (url.protocol === "http:") url.protocol = "https:";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "ref") {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

export function titleHasAiKeyword(title, keywords = AI_KEYWORDS) {
  const lower = normalizeWhitespace(title).toLowerCase();
  return keywords.some((keyword) => {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(lower);
  });
}

export function categorizeSource(source) {
  if (source === "hackernews") return "trending";
  if (source === "arxiv") return "research";
  if (String(source).startsWith("rss-")) return "official";
  return "official";
}

export function articleNotes(extra = "") {
  return [ARTICLE_AUTO_MARKER, extra].filter(Boolean).join("; ");
}

export function filterRecentTrendingStories(stories, options = {}) {
  const now = options.now ?? new Date();
  const minPoints = options.minPoints ?? 50;
  const days = options.days ?? 14;
  const keywords = options.keywords ?? AI_KEYWORDS;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;

  return stories
    .map((story) => {
      const title = normalizeWhitespace(story.title ?? story.story_title);
      const url = normalizeUrl(story.url ?? story.story_url ?? (story.objectID ? `https://news.ycombinator.com/item?id=${story.objectID}` : ""));
      const points = Number(story.points ?? 0);
      const publishedAt = parseDateIso(story.created_at);
      return {
        title,
        url,
        source: "hackernews",
        category: "trending",
        author: textValue(story.author) || null,
        score: Number.isFinite(points) ? points : null,
        published_at: publishedAt,
        summary: null,
        notes: articleNotes("source=hackernews"),
      };
    })
    .filter((article) => article.title && article.url)
    .filter((article) => titleHasAiKeyword(article.title, keywords))
    .filter((article) => (article.score ?? 0) >= minPoints)
    .filter((article) => article.published_at && Date.parse(article.published_at) >= cutoff)
    .sort((a, b) => (Date.parse(b.published_at ?? "") || 0) - (Date.parse(a.published_at ?? "") || 0));
}

function bestAtomLink(entry) {
  for (const link of toArray(entry.link)) {
    if (typeof link === "string") return link;
    if (!link["@_rel"] || link["@_rel"] === "alternate") return link["@_href"] ?? "";
  }
  return "";
}

export function parseArxivEntries(xml) {
  const doc = parser.parse(xml);
  return toArray(doc.feed?.entry)
    .map((entry) => {
      const title = normalizeWhitespace(entry.title);
      const id = textValue(entry.id);
      const link = normalizeUrl(bestAtomLink(entry) || id);
      const authors = toArray(entry.author).map((author) => normalizeWhitespace(author.name ?? author)).filter(Boolean);
      return {
        title,
        url: link,
        source: "arxiv",
        category: "research",
        author: authors.join(", ") || null,
        score: null,
        published_at: parseDateIso(entry.published ?? entry.updated),
        summary: normalizeWhitespace(entry.summary) || null,
        notes: articleNotes("source=arxiv"),
      };
    })
    .filter((article) => article.title && article.url);
}

export function parseFeedEntries(xml, feed) {
  const doc = parser.parse(xml);
  const channel = doc.rss?.channel ?? doc.rdf?.channel;
  const rssItems = toArray(channel?.item ?? doc.rss?.item ?? doc.RDF?.item);
  const atomEntries = toArray(doc.feed?.entry);
  const source = feed.source;
  const sourceName = feed.sourceName;

  const rssArticles = rssItems.map((item) => ({
    title: normalizeWhitespace(item.title),
    url: normalizeUrl(item.link?.["#text"] ?? item.link),
    source,
    category: "official",
    author: sourceName,
    score: null,
    published_at: parseDateIso(item.pubDate ?? item.published ?? item.date ?? item["dc:date"]),
    summary: normalizeWhitespace(item.description ?? item.summary ?? item["content:encoded"]) || null,
    notes: articleNotes(`source=${sourceName}`),
  }));

  const atomArticles = atomEntries.map((entry) => ({
    title: normalizeWhitespace(entry.title),
    url: normalizeUrl(bestAtomLink(entry) || entry.id),
    source,
    category: "official",
    author: sourceName,
    score: null,
    published_at: parseDateIso(entry.published ?? entry.updated),
    summary: normalizeWhitespace(entry.summary ?? entry.content) || null,
    notes: articleNotes(`source=${sourceName}`),
  }));

  return [...rssArticles, ...atomArticles].filter((article) => article.title && article.url);
}

export function dedupeArticlesByUrl(articles) {
  const byUrl = new Map();
  for (const article of articles) {
    const url = normalizeUrl(article.url);
    if (!url) continue;
    const normalized = { ...article, url };
    const existing = byUrl.get(url);
    if (!existing || (Date.parse(normalized.published_at ?? "") || 0) > (Date.parse(existing.published_at ?? "") || 0)) {
      byUrl.set(url, normalized);
    }
  }
  return [...byUrl.values()];
}

export function newestByCategory(articles, limitPerCategory = 30) {
  const out = [];
  for (const category of ["trending", "research", "official"]) {
    out.push(
      ...articles
        .filter((article) => article.category === category)
        .sort((a, b) => (Date.parse(b.published_at ?? "") || 0) - (Date.parse(a.published_at ?? "") || 0))
        .slice(0, limitPerCategory)
    );
  }
  return out;
}
