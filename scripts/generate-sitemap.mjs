import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SITE_URL = "https://aiprogresstracker.org";
export const STATIC_ROUTES = ["/", "/compare", "/food-for-thought", "/about"];

function clean(value) {
  return typeof value === "string" ? value.replace(/^\uFEFF/, "").trim() : "";
}

function normalizeBaseUrl(url) {
  return clean(url).replace(/\/+$/, "");
}

async function readEnvFile(filePath) {
  try {
    const text = await readFile(filePath, "utf8");
    return Object.fromEntries(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=");
          const key = line.slice(0, index).trim();
          const value = line.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, "");
          return [key, value];
        })
    );
  } catch {
    return {};
  }
}

export async function loadSitemapEnv(env = process.env, cwd = process.cwd()) {
  const files = [".env", ".env.local"];
  const fromFiles = Object.assign(
    {},
    ...(await Promise.all(files.map((file) => readEnvFile(path.join(cwd, file)))))
  );
  return { ...fromFiles, ...env };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeRoute(route) {
  if (!route || route === "/") return "/";
  return `/${String(route).replace(/^\/+|\/+$/g, "")}`;
}

export function absoluteUrl(route) {
  const normalized = normalizeRoute(route);
  return normalized === "/" ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
}

export function uniqueRoutes(routes) {
  return Array.from(new Set(routes.map(normalizeRoute)));
}

export function buildSitemapXml(routes, now = new Date()) {
  const lastmod = now.toISOString().slice(0, 10);
  const urls = uniqueRoutes(routes)
    .map(
      (route) => `  <url>\n    <loc>${escapeXml(absoluteUrl(route))}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${route === "/" ? "daily" : "weekly"}</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function fetchRows(table, supabaseUrl, anonKey) {
  const endpoint = `${supabaseUrl}/rest/v1/${table}?select=slug&order=slug.asc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: ["Bearer", anonKey].join(" "),
      Accept: "application/json",
      "User-Agent": "ai-progress-tracker-sitemap/1.0",
    },
  });
  if (!response.ok) throw new Error(`${table} query failed: HTTP ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

export async function fetchDynamicRoutes(env = process.env) {
  const supabaseUrl = normalizeBaseUrl(env.VITE_SUPABASE_URL);
  const anonKey = clean(env.VITE_SUPABASE_ANON_KEY);
  if (!supabaseUrl || !anonKey) {
    console.warn("Sitemap dynamic routes skipped: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.");
    return [];
  }

  try {
    const [fields, benchmarks] = await Promise.all([
      fetchRows("fields", supabaseUrl, anonKey),
      fetchRows("benchmarks", supabaseUrl, anonKey),
    ]);
    return [
      ...fields.filter((row) => row?.slug).map((row) => `/field/${row.slug}`),
      ...benchmarks.filter((row) => row?.slug).map((row) => `/benchmark/${row.slug}`),
    ];
  } catch (error) {
    console.warn(`Sitemap dynamic routes skipped: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

export async function generateSitemap({ env = process.env, outDir = "public" } = {}) {
  const sitemapEnv = env === process.env ? await loadSitemapEnv(env) : env;
  const routes = uniqueRoutes([...STATIC_ROUTES, ...(await fetchDynamicRoutes(sitemapEnv))]);
  await mkdir(outDir, { recursive: true });
  const sitemapPath = path.join(outDir, "sitemap.xml");
  await writeFile(sitemapPath, buildSitemapXml(routes), "utf8");
  console.log(`Generated ${sitemapPath} with ${routes.length} routes.`);
  for (const route of routes) console.log(`- ${absoluteUrl(route)}`);
  return { sitemapPath, routes };
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  generateSitemap().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
