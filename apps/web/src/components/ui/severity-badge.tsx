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
 * Calm encoding (visual-overhaul, Jun 2026): every band is a uniform 1px-solid
 * hairline pill — only Kill is filled so it stays the single loud signal. No more
 * border-weight ladder, dashed borders or italics ("too much in your face").
 * Severity is disambiguated by the always-present icon + text label, so the
 * three-color (red/orange/green) scheme stays color-blind safe — hue is never the
 * sole carrier. The 5 bands {Kill, Weak, Mid, Strong, Exceptional} remain the only
 * allowed severity language; numeric scores are an anti-pattern.
 */
const SEVERITY_ICON: Record<SeverityBand, LucideIcon> = {
  Kill: OctagonAlertIcon,
  Weak: AlertTriangleIcon,
  Mid: DotIcon,
  Strong: CheckIcon,
  Exceptional: SparklesIcon,
};

const severityBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 type-mono-sm tracking-wide uppercase font-mono",
  {
    variants: {
      severity: {
        Kill: "border-[var(--color-sev-kill)] bg-[var(--color-sev-kill)] text-[var(--color-sev-on-kill)] font-semibold",
        Weak: "border-[var(--color-sev-weak)] text-[var(--color-sev-weak)]",
        Mid: "border-[var(--color-sev-mid)] text-[var(--color-sev-mid)]",
        Strong: "border-[var(--color-sev-strong)] text-[var(--color-sev-strong)]",
        Exceptional:
          "border-[var(--color-sev-exceptional)] text-[var(--color-sev-exceptional)]",
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
