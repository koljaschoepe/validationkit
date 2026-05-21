"use client";

import { useEffect, useState } from "react";
import { AlertCircleIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";

const PLACEHOLDERS = [
  "github.com/vercel/next.js",
  "github.com/anthropics/anthropic-sdk-python",
  "github.com/shadcn-ui/ui",
];

/**
 * Compact landing-hero form pill — single input + submit arrow, sized to drop
 * into the galaxie's top toolbar next to the breadcrumb. Owns no submit state
 * (parent HeroSection drives `pending`/`error`) so it stays a pure controlled
 * component.
 */
export function RepoUrlPill({
  pending,
  onSubmit,
  error,
  size = "compact",
}: {
  pending: boolean;
  onSubmit: (path: string) => void;
  error?: string;
  /**
   * Visual size. "compact" (default) fits inline toolbars; "hero" is the
   * Nova-3a Phase-2 prominent variant for the landing-page audit-CTA.
   */
  size?: "compact" | "hero";
}) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0 || pending) return;
    onSubmit(trimmed);
  }

  const isHero = size === "hero";

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={
          isHero
            ? "flex h-11 w-full items-center gap-1 rounded-md border border-border bg-card/80 px-2 shadow-sm backdrop-blur focus-within:border-foreground/40"
            : "flex h-9 w-full items-center gap-1 rounded-md border border-border bg-card/80 px-1.5 backdrop-blur focus-within:border-foreground/30"
        }
      >
        <input
          type="text"
          name="path"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          aria-label="GitHub repository URL"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
          className={
            isHero
              ? "h-full min-w-0 flex-1 bg-transparent px-2 font-mono type-body-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
              : "h-full min-w-0 flex-1 bg-transparent px-2 font-mono type-mono-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
          }
        />
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          aria-label={pending ? "Audit läuft" : "Audit starten"}
          className={
            isHero
              ? "inline-flex h-8 items-center justify-center rounded-md bg-foreground px-3 text-background transition-colors hover:bg-foreground/90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              : "inline-flex h-7 items-center justify-center rounded-md px-2 text-foreground transition-colors hover:bg-muted/40 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          }
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          )}
        </button>
      </form>

      {error ? (
        <div
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 type-mono-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{error}</span>
        </div>
      ) : null}
    </div>
  );
}
