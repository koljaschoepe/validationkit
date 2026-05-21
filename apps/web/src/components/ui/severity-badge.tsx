import { cva, type VariantProps } from "class-variance-authority";
import {
  OctagonAlertIcon,
  AlertTriangleIcon,
  DotIcon,
  CheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeverityBand } from "@vk/core";

/**
 * Canonical severity-band badge — PRD §2 Constraint #5.
 *
 * Monochrome encoding (post Homepage-Relaunch, May 2026): severity is
 * carried by icon + border weight/style + font weight, not hue. The 5
 * bands {Kill, Weak, Mid, Strong, Exceptional} stay the only allowed
 * severity language; numeric scores are an anti-pattern.
 */
const SEVERITY_ICON: Record<SeverityBand, LucideIcon> = {
  Kill: OctagonAlertIcon,
  Weak: AlertTriangleIcon,
  Mid: DotIcon,
  Strong: CheckIcon,
  Exceptional: SparklesIcon,
};

const severityBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 type-mono-sm tracking-wide uppercase font-mono bg-transparent",
  {
    variants: {
      severity: {
        Kill: "border-[3px] border-solid border-[var(--color-sev-kill)] text-[var(--color-sev-kill)] font-bold",
        Weak: "border-2 border-solid border-[var(--color-sev-weak)] text-[var(--color-sev-weak)] font-semibold",
        Mid: "border border-solid border-[var(--color-sev-mid)] text-[var(--color-sev-mid)] font-medium",
        Strong: "border border-dashed border-[var(--color-sev-strong)] text-[var(--color-sev-strong)] font-normal",
        Exceptional:
          "border border-dashed border-[var(--color-sev-exceptional)] text-[var(--color-sev-exceptional)] font-normal italic",
      },
    },
    defaultVariants: {
      severity: "Mid",
    },
  },
);

export interface SeverityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof severityBadgeVariants>, "severity"> {
  severity: SeverityBand;
}

export function SeverityBadge({
  severity,
  className,
  ...props
}: SeverityBadgeProps) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <span
      className={cn(severityBadgeVariants({ severity }), className)}
      data-sev={severity}
      role="img"
      aria-label={`Severity: ${severity.toLowerCase()}`}
      {...props}
    >
      <Icon className="size-3" aria-hidden="true" />
      <span>{severity}</span>
    </span>
  );
}
