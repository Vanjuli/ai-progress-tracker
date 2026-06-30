import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://aiprogresstracker.org";
export const SITE_NAME = "AI Progress Tracker";
export const DEFAULT_SHARE_IMAGE = "/og-image.png";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: BreadcrumbItem[];
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

function truncateDescription(description: string): string {
  return description.length > 180 ? `${description.slice(0, 177).trimEnd()}…` : description;
}

function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function Seo({
  title,
  description,
  path = "/",
  type = "website",
  image = DEFAULT_SHARE_IMAGE,
  jsonLd,
  breadcrumbs,
}: SeoProps) {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const metaDescription = truncateDescription(description);
  const structuredData = [
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    ...(breadcrumbs && breadcrumbs.length > 0 ? [buildBreadcrumbJsonLd(breadcrumbs)] : []),
  ];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {structuredData.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
