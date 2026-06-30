import { describe, expect, it, vi } from "vitest";
import { buildSitemapXml, fetchDynamicRoutes, generateSitemap, STATIC_ROUTES } from "../scripts/generate-sitemap.mjs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const fixedDate = new Date("2026-06-30T00:00:00.000Z");

describe("generate-sitemap", () => {
  it("builds sitemap XML with static and dynamic routes", () => {
    const xml = buildSitemapXml(["/", "/compare", "/field/language", "/benchmark/mmlu"], fixedDate);

    expect(xml).toContain("<loc>https://aiprogresstracker.org/</loc>");
    expect(xml).toContain("<loc>https://aiprogresstracker.org/compare</loc>");
    expect(xml).toContain("<loc>https://aiprogresstracker.org/field/language</loc>");
    expect(xml).toContain("<loc>https://aiprogresstracker.org/benchmark/mmlu</loc>");
    expect(xml).toContain("<lastmod>2026-06-30</lastmod>");
  });

  it("returns only static routes when Supabase env is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(fetchDynamicRoutes({})).resolves.toEqual([]);

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("writes a sitemap file without Supabase credentials", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const outDir = await mkdtemp(path.join(tmpdir(), "apt-sitemap-"));

    try {
      const { routes, sitemapPath } = await generateSitemap({ env: {}, outDir });
      const xml = await readFile(sitemapPath, "utf8");

      expect(routes).toEqual(STATIC_ROUTES);
      expect(xml).toContain("https://aiprogresstracker.org/about");
    } finally {
      await rm(outDir, { recursive: true, force: true });
      warn.mockRestore();
      log.mockRestore();
    }
  });
});
