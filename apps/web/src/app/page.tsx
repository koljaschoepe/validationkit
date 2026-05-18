import Link from "next/link";
import {
  FileSearchIcon,
  GitCompareIcon,
  ShieldCheckIcon,
  CodeXmlIcon,
  AlertTriangleIcon,
  SparklesIcon,
} from "lucide-react";
import { AuditForm } from "@/components/AuditForm";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FINDING_CATEGORIES = [
  {
    icon: AlertTriangleIcon,
    name: "unused-agent",
    desc: "Agents defined but never called from any command or workflow.",
    deterministic: true,
  },
  {
    icon: GitCompareIcon,
    name: "duplicate-guidance",
    desc: "Trigram similarity ≥ 85% across two agent files. Pick one canonical home.",
    deterministic: true,
  },
  {
    icon: FileSearchIcon,
    name: "context-bloat",
    desc: "Single file over 8 000 tokens (tiktoken cl100k_base).",
    deterministic: true,
  },
  {
    icon: CodeXmlIcon,
    name: "stale-reference",
    desc: "Markdown links pointing to files that don't exist.",
    deterministic: true,
  },
  {
    icon: ShieldCheckIcon,
    name: "token-budget",
    desc: "Always-loaded context sum over 25 k tokens.",
    deterministic: true,
  },
  {
    icon: SparklesIcon,
    name: "conflicting-rules",
    desc: "Two related files disagree (low / mid / high confidence).",
    deterministic: false,
  },
];

export default function Home() {
  const cwd = process.cwd();
  const repoRoot = cwd.replace(/\/apps\/web$/, "");

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Agent-file audit.
          </h1>
          <p className="text-muted-foreground text-lg">
            Paste a public GitHub repo. Get a deterministic audit of all 12 agent-file
            formats. No vibe-scores.
          </p>
        </header>

        <section className="mt-8">
          <AuditForm defaultPath={repoRoot} />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            What we check
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FINDING_CATEGORIES.map((cat) => (
              <Card key={cat.name} className="bg-card/50">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <cat.icon className="size-4 text-primary mt-1 shrink-0" />
                  <div className="flex-1">
                    <CardTitle className="font-mono text-sm">
                      {cat.name}
                    </CardTitle>
                  </div>
                  <Badge variant={cat.deterministic ? "secondary" : "outline"}>
                    {cat.deterministic ? "Deterministic" : "LLM (opt-in)"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{cat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <p className="text-sm">
                <strong className="text-foreground">Concession:</strong>{" "}
                anonymous-audit is free. No signup, no GitHub-token.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">Critique:</strong> persisted
                history, multi-repo dashboard, drift detection, fix-suggestions
                — those need a free account.{" "}
                <Link
                  href="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
          ValidationKit v0.0.11 ·{" "}
          <Link href="/" className="hover:text-foreground">
            Audit
          </Link>{" "}
          ·{" "}
          <Link href="/drift" className="hover:text-foreground">
            Drift
          </Link>{" "}
          ·{" "}
          <Link href="/trust" className="hover:text-foreground">
            Trust
          </Link>
        </footer>
      </main>
    </>
  );
}
