import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/trust", priority: 0.6, changeFrequency: "monthly" },
  { path: "/trust/dpa", priority: 0.4, changeFrequency: "monthly" },
  { path: "/trust/eval", priority: 0.4, changeFrequency: "weekly" },
  { path: "/legal/agb", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/dpa", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/subprocessors", priority: 0.3, changeFrequency: "monthly" },
  { path: "/status", priority: 0.5, changeFrequency: "daily" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
