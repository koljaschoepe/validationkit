import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Building2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface Frontmatter {
  slug?: string;
  customerName?: string;
  customerCompany?: string;
  primaryContact?: string;
  signedDate?: string;
  tier?: string;
  status?: string;
  dpaVersion?: string;
}

const ONBOARDING_DIR = "docs/customer-onboarding";
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function parseFrontmatter(raw: string): {
  meta: Frontmatter;
  body: string;
} {
  if (!raw.startsWith("---\n")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---\n", 4);
  if (end < 0) return { meta: {}, body: raw };
  const fmRaw = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const meta: Frontmatter = {};
  for (const line of fmRaw.split("\n")) {
    const m = /^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, k, v] = m;
    if (!k) continue;
    const key = k.trim() as keyof Frontmatter;
    const value = (v ?? "").trim().replace(/^["']|["']$/g, "");
    (meta as Record<string, string>)[key] = value;
  }
  return { meta, body };
}

async function loadDoc(
  slug: string,
): Promise<{ meta: Frontmatter; body: string } | null> {
  if (!SLUG_RE.test(slug)) return null;
  if (slug.startsWith("_")) return null;
  const repoRoot = process.cwd().replace(/\/apps\/web$/, "");
  const candidate = path.join(repoRoot, ONBOARDING_DIR, `${slug}.md`);
  try {
    const raw = await readFile(candidate, "utf8");
    return parseFrontmatter(raw);
  } catch {
    return null;
  }
}

async function listAvailableSlugs(): Promise<string[]> {
  const repoRoot = process.cwd().replace(/\/apps\/web$/, "");
  try {
    const entries = await readdir(path.join(repoRoot, ONBOARDING_DIR));
    return entries
      .filter((n) => n.endsWith(".md"))
      .map((n) => n.replace(/\.md$/, ""))
      .filter((s) => !s.startsWith("_"))
      .sort();
  } catch {
    return [];
  }
}

function expandPlaceholders(text: string, meta: Frontmatter): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    const v = (meta as Record<string, string | undefined>)[key];
    return v ?? `{{${key}}}`;
  });
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await loadDoc(slug);
  if (!doc) {
    const available = await listAvailableSlugs();
    return (
      <>
        <SiteNav />
        <main className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
          <Card className="border-dashed">
            <CardContent className="py-6 space-y-3 text-sm">
              <p className="font-medium">
                No onboarding doc at slug{" "}
                <code className="font-mono text-xs">{slug}</code>.
              </p>
              <p className="text-muted-foreground">
                Per-customer docs live at{" "}
                <code className="font-mono text-xs">
                  docs/customer-onboarding/&lt;slug&gt;.md
                </code>{" "}
                in the repo. Drop a markdown file matching the template at{" "}
                <code className="font-mono text-xs">_template.md</code> and
                push.
              </p>
              {available.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Slugs available right now:
                  </p>
                  <ul className="font-mono text-xs">
                    {available.map((s) => (
                      <li key={s}>
                        <Link
                          href={`/onboarding/${s}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          /onboarding/{s}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if (slug !== doc.meta.slug && doc.meta.slug) {
    // Frontmatter slug ≠ URL slug — file got renamed without updating
    // metadata. Render anyway but surface the inconsistency.
  }
  if (!doc.meta.customerName) {
    notFound();
  }

  const body = expandPlaceholders(doc.body, doc.meta);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Onboarding · {doc.meta.customerName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {doc.meta.tier ? (
              <Badge variant="secondary" className="font-mono">
                tier: {doc.meta.tier}
              </Badge>
            ) : null}
            {doc.meta.status ? (
              <Badge variant="outline" className="font-mono">
                status: {doc.meta.status}
              </Badge>
            ) : null}
            {doc.meta.dpaVersion ? (
              <Badge variant="outline" className="font-mono">
                DPA: {doc.meta.dpaVersion}
              </Badge>
            ) : null}
            {doc.meta.signedDate ? (
              <Badge variant="outline" className="font-mono">
                signed: {doc.meta.signedDate}
              </Badge>
            ) : null}
          </div>
          {doc.meta.customerCompany ? (
            <p className="text-sm text-muted-foreground">
              {doc.meta.customerCompany}
              {doc.meta.primaryContact ? (
                <>
                  {" · "}
                  <a
                    href={`mailto:${doc.meta.primaryContact}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {doc.meta.primaryContact}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </header>

        <Card>
          <CardContent className="py-5">
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90 text-[0.85rem] leading-relaxed">
              {body}
            </article>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Concession:</strong> This
              doc is generated from the markdown in the repo, not a CMS. Edits
              ship via PR.
            </p>
            <p>
              <strong className="text-foreground">Critique:</strong> That
              means you (the customer) can audit the source on GitHub. The
              flip-side: the founder updates this on a human cadence, not in
              real-time.{" "}
              <Link
                href="/trust"
                className="text-primary underline-offset-4 hover:underline"
              >
                /trust
              </Link>{" "}
              and{" "}
              <Link
                href="/status"
                className="text-primary underline-offset-4 hover:underline"
              >
                /status
              </Link>{" "}
              are the live surfaces.
            </p>
          </CardContent>
        </Card>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.20 ·{" "}
          <Link href="/trust" className="hover:text-foreground">
            Trust
          </Link>{" "}
          ·{" "}
          <Link href="/trust/dpa" className="hover:text-foreground">
            DPA
          </Link>{" "}
          ·{" "}
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
        </footer>
      </main>
    </>
  );
}
