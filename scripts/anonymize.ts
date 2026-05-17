/**
 * Anonymize a customer-snapshot subtree for the golden-set anonymized-customer
 * bucket. Strips emails, GitHub handles, internal URLs, and swaps the
 * customer's name for a slug.
 *
 * Usage:
 *   pnpm tsx scripts/anonymize.ts \
 *     --in .local/pending-anonymize/acme-NN-raw \
 *     --out .local/pending-anonymize/acme-NN-clean \
 *     --slug acme-NN \
 *     [--customer-name "Real Customer Inc"] \
 *     [--customer-domain "realcustomer.com"]
 *
 * This is a *first pass*, not a guarantee. The 24h re-review window and the
 * final grep sweep (see eval/golden-set/anonymized-customer/README.md §6) are
 * still mandatory. This script reduces the surface for human eyes; it does
 * not replace them.
 */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

interface Args {
  inPath: string;
  outPath: string;
  slug: string;
  customerName?: string;
  customerDomain?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--in") out.inPath = argv[++i];
    else if (a === "--out") out.outPath = argv[++i];
    else if (a === "--slug") out.slug = argv[++i];
    else if (a === "--customer-name") out.customerName = argv[++i];
    else if (a === "--customer-domain") out.customerDomain = argv[++i];
  }
  if (!out.inPath || !out.outPath || !out.slug) {
    process.stderr.write(
      "Required: --in <path> --out <path> --slug <acme-NN>\n",
    );
    process.exit(2);
  }
  return out as Args;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const GITHUB_HANDLE_RE = /\bgithub\.com\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)?\b/g;
const URL_INTERNAL_RE = /\bhttps?:\/\/(?:[a-z0-9-]+\.)+(?:com|io|ai|dev|app|tech|net)\b\S*/g;

function anonymizeBody(body: string, args: Args): string {
  let out = body;
  out = out.replace(EMAIL_RE, `redacted@${args.slug}.example`);
  out = out.replace(GITHUB_HANDLE_RE, `github.com/${args.slug}`);
  out = out.replace(URL_INTERNAL_RE, `https://${args.slug}.example`);
  if (args.customerName) {
    const safe = args.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "gi");
    out = out.replace(re, args.slug);
  }
  if (args.customerDomain) {
    const safe = args.customerDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "gi");
    out = out.replace(re, `${args.slug}.example`);
  }
  return out;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const st = await stat(full);
    if (st.isDirectory()) {
      out.push(...(await walk(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = await walk(args.inPath);

  for (const file of files) {
    const rel = path.relative(args.inPath, file);
    const destPath = path.join(args.outPath, rel);
    await mkdir(path.dirname(destPath), { recursive: true });
    const raw = await readFile(file, "utf8");
    const cleaned = anonymizeBody(raw, args);
    await writeFile(destPath, cleaned, "utf8");
  }

  process.stdout.write(
    `Anonymized ${files.length} files → ${args.outPath}\n` +
      `\nNext steps (see eval/golden-set/anonymized-customer/README.md):\n` +
      `  1. 24h re-review window — sit on this output.\n` +
      `  2. grep -RIn -E "[a-z]+\\.[a-z]+@[a-z]+\\.[a-z]+" ${args.outPath}\n` +
      `  3. Customer sign-off in writing.\n` +
      `  4. Then mv to eval/golden-set/anonymized-customer/${args.slug}.\n`,
  );
}

await main();
