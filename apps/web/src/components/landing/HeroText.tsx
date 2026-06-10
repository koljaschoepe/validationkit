"use client";

import Link from "next/link";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import { ArrowRightIcon, PlayIcon } from "lucide-react";
import { ConsoleSurface } from "./ConsoleSurface";

// Hero owns exactly ONE viewport (100dvh minus the 56px sticky nav): on desktop
// the headline + CTAs sit left and the LIVE console fills the right column; on
// mobile the console stacks on top, headline + CTAs below — both fit without a
// scroll. Visual-overhaul, Jun 2026.
const HEADLINE = "Jedes Kunden-Repo auditiert, bevor Drift live geht";
const SUBHEAD =
  "ValidationKit prüft AGENTS.md, CLAUDE.md und Co. über alle deine Kunden-Repos. Konflikte, Token-Budget und tote Verweise, nach Severity sortiert. Was brennt, fixt du zuerst.";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};
const frame = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function HeroText() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section
          aria-labelledby="hero-headline"
          className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl flex-col items-center justify-center gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:gap-12 lg:py-8"
        >
          {/* Text column — order-2 on mobile (below the demo), left on desktop. */}
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className="order-2 flex w-full flex-col items-center text-center lg:order-1 lg:w-[46%] lg:shrink-0 lg:items-start lg:text-left"
          >
            <m.p
              variants={item}
              className="mb-4 font-mono type-mono-sm uppercase tracking-wider text-muted-foreground"
            >
              Multi-Customer Agent-File Audits
            </m.p>
            <m.h1
              id="hero-headline"
              variants={item}
              className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]"
            >
              {HEADLINE}
            </m.h1>
            <m.p
              variants={item}
              className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {SUBHEAD}
            </m.p>
            <m.div
              variants={item}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
            >
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                Kostenlos starten
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card/40 px-5 text-sm font-medium text-foreground transition hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <PlayIcon className="size-4" aria-hidden="true" />
                Live-Demo ansehen
              </a>
            </m.div>
            <m.p
              variants={item}
              className="mt-4 font-mono type-mono-sm text-muted-foreground/70"
            >
              Keine Kreditkarte nötig · Erstes Audit in unter einer Minute
            </m.p>
          </m.div>

          {/* Framed LIVE console — the one continuous interactive surface: the
              portfolio triage list (many customer repos) that zooms into a repo's
              file tree + inspector on click. order-1 on mobile (on top), right on
              desktop; the frame fills the column so the hero stays one viewport. */}
          <m.div
            id="demo"
            variants={frame}
            initial="hidden"
            animate="show"
            className="order-1 flex h-[42dvh] w-full min-w-0 scroll-mt-20 lg:order-2 lg:h-[min(72dvh,720px)] lg:flex-1"
          >
            <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card/40 shadow-xl shadow-black/40">
              <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-2.5">
                <span aria-hidden className="size-2.5 rounded-full bg-foreground/15" />
                <span aria-hidden className="size-2.5 rounded-full bg-foreground/15" />
                <span aria-hidden className="size-2.5 rounded-full bg-foreground/15" />
                <span className="ml-3 font-mono type-mono-sm text-muted-foreground/70">
                  app.validationkit.dev
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <ConsoleSurface />
              </div>
            </div>
          </m.div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
