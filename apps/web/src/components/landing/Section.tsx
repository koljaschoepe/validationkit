import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for the public landing's section width + padding.
 * Replaces the v1/v2 mix of max-w-3xl vs max-w-6xl that produced "uneven"
 * margins. Hero is the only exception — it renders edge-to-edge and uses
 * its own internal cap.
 *
 * size="md" (default) → py-16             — sub-blocks
 * size="lg"           → py-20 sm:py-24 lg:py-28 — top-level CTA/closer sections
 */
export function Section({
  children,
  className,
  as: As = "section",
  id,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "footer";
  id?: string;
  size?: "md" | "lg";
}) {
  return (
    <As
      id={id}
      className={cn(
        "mx-auto w-full max-w-7xl px-6 sm:px-8",
        size === "lg" ? "py-20 sm:py-24 lg:py-28" : "py-16",
        className,
      )}
    >
      {children}
    </As>
  );
}
