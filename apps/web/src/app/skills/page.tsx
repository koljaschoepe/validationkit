import Link from "next/link";
import { Sparkles, ExternalLink, FileCode } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SKILLS } from "@/lib/skills-registry";

export const metadata = {
  title: "Skills — ValidationKit",
  description:
    "Anthropic Skills shipped by ValidationKit. Drop into ~/.claude/skills/ to give Claude Code the ability to run deterministic agent-file audits on demand.",
};

const STATUS_LABEL: Record<string, string> = {
  shipped: "Shipped",
  submitted: "PR open",
  draft: "Draft",
};

export default function SkillsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Anthropic Skills
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Drop these folders into <code className="font-mono text-xs">~/.claude/skills/</code>{" "}
            to give Claude Code the ability to run ValidationKit&apos;s
            deterministic audits on demand. Each Skill is a SKILL.md file +
            trigger conditions; Claude auto-discovers them on session start.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Skills shipped
          </h2>
          {SKILLS.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No Skills published yet.
              </CardContent>
            </Card>
          ) : null}
          <div className="space-y-3">
            {SKILLS.map((skill) => (
              <Card key={skill.id}>
                <CardHeader className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base font-mono">
                      {skill.id}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="default">
                        {STATUS_LABEL[skill.status] ?? skill.status}
                      </Badge>
                      {skill.tags.slice(0, 3).map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="font-mono text-[0.6rem]"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-medium">{skill.title}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{skill.summary}</p>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">
                      Trigger
                    </div>
                    <p className="text-xs italic">&quot;{skill.trigger}&quot;</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">
                      Install (user-level)
                    </div>
                    <pre className="overflow-auto rounded-md border bg-muted/50 p-3 text-[0.7rem] font-mono">
{`mkdir -p ~/.claude/skills
# install instructions per Skill`}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild variant="outline" size="sm">
                      <a href={skill.sourceUrl} rel="noreferrer">
                        <FileCode className="size-3.5" />
                        SKILL.md
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/pricing">See hosted plans</Link>
                    </Button>
                  </div>
                  <p className="text-[0.65rem] text-muted-foreground font-mono">
                    Published {skill.publishedAt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Audit</Link>
          {" · "}
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          {" · "}
          <Link href="/status" className="hover:text-foreground">Status</Link>
          {" · "}
          <Link href="/trust" className="hover:text-foreground">Trust</Link>
        </footer>
      </main>
    </>
  );
}
