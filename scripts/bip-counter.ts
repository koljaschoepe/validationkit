/**
 * BiP-Counter: walks docs/bip-posts/, counts published posts per ISO-week,
 * and rewrites the STATUS.md Build-in-Public-Cadence table.
 *
 * Idempotent: re-running on the same data produces the same output.
 *
 * Usage: pnpm bip:count
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "docs/bip-posts");
const STATUS_PATH = path.join(ROOT, "STATUS.md");

interface Post {
  date: Date;
  published: boolean;
  platform: string;
  audience: string;
  filename: string;
}

function isoWeek(d: Date): { year: number; week: number } {
  // ISO 8601 week number.
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3);
  const diff = target.getTime() - firstThursday.getTime();
  const week = 1 + Math.round(diff / (7 * 86400000));
  return { year: target.getUTCFullYear(), week };
}

async function loadPosts(): Promise<Post[]> {
  let entries: string[];
  try {
    entries = await readdir(POSTS_DIR);
  } catch {
    return [];
  }
  const posts: Post[] = [];
  for (const name of entries) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    const raw = await readFile(path.join(POSTS_DIR, name), "utf8");
    const { data } = matter(raw);
    const dateStr = (data.date as string | undefined) ?? name.slice(0, 10);
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) continue;
    posts.push({
      date: parsed,
      published: Boolean(data.published),
      platform: String(data.platform ?? "unknown"),
      audience: String(data.audience ?? "both"),
      filename: name,
    });
  }
  return posts;
}

interface WeekStats {
  iso: string;
  count: number;
  byDay: Record<string, number>;
  total: number;
}

function summarize(posts: Post[]): WeekStats[] {
  const buckets = new Map<string, { count: number; byDay: Map<string, number> }>();
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  for (const p of posts) {
    if (!p.published) continue;
    const { year, week } = isoWeek(p.date);
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    const day = dayNames[(p.date.getUTCDay() + 6) % 7]!;
    if (!buckets.has(key)) buckets.set(key, { count: 0, byDay: new Map() });
    const b = buckets.get(key)!;
    b.count += 1;
    b.byDay.set(day, (b.byDay.get(day) ?? 0) + 1);
  }

  const out: WeekStats[] = [];
  for (const [key, b] of [...buckets.entries()].sort()) {
    const byDayRec: Record<string, number> = {};
    for (const d of dayNames) byDayRec[d] = b.byDay.get(d) ?? 0;
    out.push({ iso: key, count: b.count, byDay: byDayRec, total: b.count });
  }
  return out;
}

function buildTable(stats: WeekStats[]): string {
  if (stats.length === 0) {
    return "| Week | Mo | Di | Mi | Do | Fr | Total |\n|---|---|---|---|---|---|---|\n| (no published posts yet) | — | — | — | — | — | 0 |";
  }
  const lines: string[] = [];
  lines.push("| Week | Mo | Di | Mi | Do | Fr | Total |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const s of stats) {
    const cell = (n: number) => (n === 0 ? "—" : String(n));
    lines.push(
      `| ${s.iso} | ${cell(s.byDay.Mo ?? 0)} | ${cell(s.byDay.Di ?? 0)} | ${cell(s.byDay.Mi ?? 0)} | ${cell(s.byDay.Do ?? 0)} | ${cell(s.byDay.Fr ?? 0)} | ${s.total} |`,
    );
  }
  return lines.join("\n");
}

async function updateStatus(table: string): Promise<void> {
  const status = await readFile(STATUS_PATH, "utf8");

  const startMarker = "## Build-in-Public-Cadence\n";
  const endMarker = "\n---";
  const startIdx = status.indexOf(startMarker);
  if (startIdx < 0) {
    process.stderr.write(
      "Could not find '## Build-in-Public-Cadence' section in STATUS.md.\n",
    );
    process.exit(1);
  }
  const afterStart = startIdx + startMarker.length;
  const endIdx = status.indexOf(endMarker, afterStart);
  if (endIdx < 0) {
    process.stderr.write("Could not find section terminator in STATUS.md.\n");
    process.exit(1);
  }

  const before = status.slice(0, afterStart);
  const after = status.slice(endIdx);
  const replacement = `\n${table}\n`;
  const next = before + replacement + after;
  if (next === status) {
    process.stdout.write("STATUS.md cadence table is already up-to-date.\n");
    return;
  }
  await writeFile(STATUS_PATH, next, "utf8");
  process.stdout.write(`STATUS.md cadence table updated.\n`);
}

async function main() {
  const posts = await loadPosts();
  const stats = summarize(posts);
  const table = buildTable(stats);
  await updateStatus(table);

  const total = posts.filter((p) => p.published).length;
  process.stdout.write(
    `Counted ${total} published post(s) across ${stats.length} ISO week(s).\n`,
  );
}

await main();
