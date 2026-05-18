import { SUB_PROCESSORS, type SubProcessor } from "@/lib/sub-processors";

export const runtime = "nodejs";
export const dynamic = "force-static";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://validationkit.vercel.app";

/**
 * RSS feed of sub-processor changes. Customers can subscribe to track
 * additions/replacements per DPA §5 (30-day prior notice). One item per
 * sub-processor; pubDate = introducedAt.
 */
export function GET(): Response {
  const items = [...SUB_PROCESSORS]
    .sort(
      (a, b) =>
        new Date(b.introducedAt).getTime() - new Date(a.introducedAt).getTime(),
    )
    .map((p) => itemXml(p))
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ValidationKit · Sub-Processor Changes</title>
    <link>${SITE_URL}/trust/sub-processors.xml</link>
    <atom:link href="${SITE_URL}/trust/sub-processors.xml" rel="self" type="application/rss+xml" />
    <description>30-day prior-notice feed for sub-processor additions and replacements per DPA §5.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

function itemXml(p: SubProcessor): string {
  const pubDate = new Date(`${p.introducedAt}T00:00:00Z`).toUTCString();
  const description = [
    `Purpose: ${escapeXml(p.purpose)}`,
    `Regions: ${p.regions.map(escapeXml).join(", ")}`,
    `Phase: ${p.phase}`,
    `Status: ${p.status}`,
    p.dpaUrl ? `DPA: ${escapeXml(p.dpaUrl)}` : "",
    p.notes ? `Notes: ${escapeXml(p.notes)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `    <item>
      <title>${escapeXml(p.name)} — ${escapeXml(p.purpose)}</title>
      <guid isPermaLink="false">${SITE_URL}/trust/sub-processors#${p.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
