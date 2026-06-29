import { describe, expect, it } from "vitest";
import {
  AI_KEYWORDS,
  categorizeSource,
  dedupeArticlesByUrl,
  filterRecentTrendingStories,
  normalizeUrl,
  parseFeedEntries,
  parseArxivEntries,
  newestByCategory,
  classifyTopics,
  selectArticlesForPrune,
} from "../scripts/article-helpers.mjs";

describe("article collection helpers", () => {
  it("matches AI keywords in titles and filters recent high-score Hacker News stories", () => {
    const now = new Date("2026-06-29T12:00:00Z");
    const rows = filterRecentTrendingStories(
      [
        {
          title: "New transformer model improves robot planning",
          url: "https://example.com/robot-transformer",
          points: 128,
          author: "alice",
          created_at: "2026-06-25T00:00:00Z",
        },
        {
          title: "Database maintenance tips",
          url: "https://example.com/db",
          points: 400,
          author: "bob",
          created_at: "2026-06-26T00:00:00Z",
        },
        {
          title: "LLM launch from last year",
          url: "https://example.com/old-llm",
          points: 500,
          author: "carol",
          created_at: "2026-05-01T00:00:00Z",
        },
        {
          title: "Diffusion trick",
          url: "https://example.com/low-score",
          points: 10,
          author: "dave",
          created_at: "2026-06-28T00:00:00Z",
        },
        {
          title: "New AI accelerator reaches production",
          url: "https://example.com/ai-accelerator",
          points: 256,
          author: "erin",
          created_at: "2026-06-24T00:00:00Z",
        },
      ],
      { now, minPoints: 50, days: 14, keywords: AI_KEYWORDS }
    );

    expect(rows).toEqual([
      expect.objectContaining({
        category: "trending",
        source: "hackernews",
        title: "New AI accelerator reaches production",
        url: "https://example.com/ai-accelerator",
        topics: ["Hardware/Chips"],
        score: 256,
        author: "erin",
      }),
      expect.objectContaining({
        category: "trending",
        source: "hackernews",
        title: "New transformer model improves robot planning",
        url: "https://example.com/robot-transformer",
        topics: ["Language/NLP", "Robotics", "Agents"],
        score: 128,
        author: "alice",
      }),
    ]);
  });

  it("parses RSS and Atom feeds into normalized official articles", () => {
    const rss = `<?xml version="1.0"?><rss><channel><item><title>OpenAI news</title><link>https://openai.com/news</link><pubDate>Mon, 29 Jun 2026 10:00:00 GMT</pubDate><description>Short summary</description></item></channel></rss>`;
    const atom = `<?xml version="1.0"?><feed><entry><title>DeepMind update</title><link href="https://deepmind.google/discover/blog/update"/><updated>2026-06-28T09:00:00Z</updated><summary>Atom summary</summary></entry></feed>`;

    expect(parseFeedEntries(rss, { sourceName: "OpenAI", source: "rss-openai" })).toEqual([
      expect.objectContaining({
        category: "official",
        source: "rss-openai",
        title: "OpenAI news",
        url: "https://openai.com/news",
        topics: ["General"],
        author: "OpenAI",
        summary: "Short summary",
        published_at: "2026-06-29T10:00:00.000Z",
      }),
    ]);

    expect(parseFeedEntries(atom, { sourceName: "Google DeepMind", source: "rss-deepmind" })).toEqual([
      expect.objectContaining({
        source: "rss-deepmind",
        title: "DeepMind update",
        url: "https://deepmind.google/discover/blog/update",
        topics: ["General"],
        published_at: "2026-06-28T09:00:00.000Z",
      }),
    ]);
  });

  it("parses arXiv Atom entries, categorizes sources, normalizes urls, and de-duplicates", () => {
    const atom = `<?xml version="1.0"?><feed><entry><title>  A Neural Approach\n to Tests </title><id>http://arxiv.org/abs/2606.12345v1</id><published>2026-06-27T00:00:00Z</published><author><name>Ada Lovelace</name></author><author><name>Grace Hopper</name></author><summary>Paper abstract</summary></entry></feed>`;
    const papers = parseArxivEntries(atom);

    expect(papers).toEqual([
      expect.objectContaining({
        category: "research",
        source: "arxiv",
        title: "A Neural Approach to Tests",
        url: "https://arxiv.org/abs/2606.12345v1",
        topics: ["Research/Theory"],
        author: "Ada Lovelace, Grace Hopper",
        published_at: "2026-06-27T00:00:00.000Z",
        summary: "Paper abstract",
      }),
    ]);

    expect(categorizeSource("rss-openai")).toBe("official");
    expect(normalizeUrl("http://example.com/path?utm_source=x#section")).toBe("https://example.com/path");
    expect(dedupeArticlesByUrl([
      { title: "first", url: "https://example.com/a?utm_campaign=x", published_at: "2026-01-01T00:00:00.000Z" },
      { title: "second", url: "http://example.com/a", published_at: "2026-01-02T00:00:00.000Z" },
    ])).toEqual([expect.objectContaining({ title: "second", url: "https://example.com/a" })]);
  });

  it("keeps trending category ranked by score when applying per-category caps", () => {
    const rows = newestByCategory([
      { title: "newer low score", category: "trending", score: 60, published_at: "2026-06-29T00:00:00.000Z" },
      { title: "older high score", category: "trending", score: 300, published_at: "2026-06-28T00:00:00.000Z" },
      { title: "newest official", category: "official", score: null, published_at: "2026-06-29T00:00:00.000Z" },
      { title: "older official", category: "official", score: null, published_at: "2026-06-28T00:00:00.000Z" },
    ], 2);

    expect(rows.filter((article) => article.category === "trending").map((article) => article.title)).toEqual([
      "older high score",
      "newer low score",
    ]);
    expect(rows.filter((article) => article.category === "official").map((article) => article.title)).toEqual([
      "newest official",
      "older official",
    ]);
  });

  it("classifies articles into one or more fixed topics and falls back to General", () => {
    expect(classifyTopics("GPT-4o vision and speech agents", "multimodal tool use for developers")).toEqual([
      "Language/NLP",
      "Vision",
      "Audio/Speech",
      "Agents",
      "Multimodal",
      "Tools/Dev",
    ]);
    expect(classifyTopics("AI chip startup raises Series B", "new GPU accelerator funding round")).toEqual([
      "Hardware/Chips",
      "Business/Funding",
    ]);
    expect(classifyTopics("A gardening note", "unrelated essay")).toEqual(["General"]);
  });

  it("selects prune candidates by age and per-category newest limits using published_at with created_at fallback", () => {
    const now = new Date("2026-06-29T00:00:00Z");
    const rows = [
      { id: "old-published", category: "trending", title: "old", published_at: "2026-04-01T00:00:00Z", created_at: "2026-06-28T00:00:00Z" },
      { id: "fallback-old", category: "research", title: "fallback old", published_at: null, created_at: "2026-04-15T00:00:00Z" },
      { id: "keep-newest", category: "official", title: "newest", published_at: "2026-06-28T00:00:00Z", created_at: "2026-06-28T00:00:00Z" },
      { id: "keep-second", category: "official", title: "second", published_at: null, created_at: "2026-06-27T00:00:00Z" },
      { id: "surplus-third", category: "official", title: "third", published_at: "2026-06-26T00:00:00Z", created_at: "2026-06-26T00:00:00Z" },
    ];

    const candidates = selectArticlesForPrune(rows, { now, retentionDays: 60, limitPerCategory: 2 });

    expect(candidates.map((article) => article.id)).toEqual(["old-published", "fallback-old", "surplus-third"]);
    expect(candidates.find((article) => article.id === "old-published")?.prune_reasons).toEqual(["older-than-60-days"]);
    expect(candidates.find((article) => article.id === "surplus-third")?.prune_reasons).toEqual(["category-surplus"]);
  });
});
