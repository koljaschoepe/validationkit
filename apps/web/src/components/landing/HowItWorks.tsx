import { ClipboardCopyIcon, OctagonAlertIcon, GitPullRequestIcon } from "lucide-react";
import { Section } from "./Section";

const STEPS = [
  {
    n: 1,
    Icon: ClipboardCopyIcon,
    title: "Paste Repo URL",
    body: "Public-GitHub-URL einfügen. Kein OAuth, kein Setup, kein Download.",
  },
  {
    n: 2,
    Icon: OctagonAlertIcon,
    title: "Severity-Hotspots",
    body: "Audit-Findings in fünf Bändern — Kill, Weak, Mid, Strong, Exceptional. Keine Vibe-Scores.",
  },
  {
    n: 3,
    Icon: GitPullRequestIcon,
    title: "Apply via PR",
    body: "Zero-Code-Fix als GitHub-PR. Du reviewst, mergst, fertig.",
  },
];

export function HowItWorks() {
  return (
    <Section size="lg" className="border-t border-border">
      <div className="space-y-12">
        <div className="space-y-2 text-center">
          <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
            So funktioniert's
          </p>
          <h2 className="type-h1 font-semibold tracking-tight">
            Drei Schritte vom Audit zum Fix.
          </h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, Icon, title, body }) => (
            <li
              key={n}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-background font-mono type-body-sm">
                  {n}
                </span>
                <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="type-h2 font-semibold tracking-tight">{title}</h3>
              <p className="type-body text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
