import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface OnboardingStatus {
  hasScans: boolean;
  hasRepos: boolean;
  hasDrift: boolean;
}

interface Step {
  title: string;
  description: string;
  done: boolean;
  cta?: { label: string; href: string };
}

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const steps: Step[] = [
    {
      title: "Run your first audit",
      description:
        "Paste any public GitHub repo on the home page. The deterministic 5/6 rules fire in under 60 seconds.",
      done: status.hasScans,
      cta: status.hasScans ? undefined : { label: "Run an audit", href: "/" },
    },
    {
      title: "Add a customer-repo",
      description:
        "Repos you watch get polled for changes every 4h. Free tier covers 1 — the agency tiers cover 30+.",
      done: status.hasRepos,
      cta: status.hasRepos
        ? undefined
        : { label: "Add a repo", href: "/customers" },
    },
    {
      title: "Connect a canonical for drift detection",
      description:
        "Mark one repo as canonical; the others get drift-compared automatically on every re-audit. Visible in the graph view.",
      done: status.hasDrift,
    },
  ];

  const complete = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base">Get started</CardTitle>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Concession:</strong> the free
          tier is enough to feel the workflow. <strong className="text-foreground">Critique:</strong>{" "}
          you only see the load-bearing wedge once you connect a second repo.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {complete} / {steps.length} done
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.title}
            className={cn(
              "flex items-start gap-3 rounded-md border p-3",
              step.done ? "bg-secondary/30" : "bg-card",
            )}
          >
            {step.done ? (
              <Check className="mt-0.5 size-4 text-primary shrink-0" />
            ) : (
              <Circle className="mt-0.5 size-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 space-y-1">
              <div
                className={cn(
                  "text-sm font-medium",
                  step.done && "text-muted-foreground line-through",
                )}
              >
                {step.title}
              </div>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {step.cta && !step.done ? (
              <Button asChild size="sm" variant="outline" className="h-7">
                <Link href={step.cta.href as never}>{step.cta.label}</Link>
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
