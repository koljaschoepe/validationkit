"use client";

import Link from "next/link";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import { ArrowRightIcon, PlayIcon } from "lucide-react";

// Landing-Redesign Phase H — the text-first hero that now owns the above-the-
// fold. The interactive galaxie demo moves one scroll-depth down (#demo).
// Copy is placeholder (German landing) — final wording is the user's (plan §11).
const HEADLINE = "Jedes Kunden-Repo auditiert, bevor Drift live geht";
const SUBHEAD =
  "ValidationKit prüft AGENTS.md, CLAUDE.md & Co. über alle deine Kunden-Repos — Konflikte, Token-Budget, tote Verweise. Eine Galaxie, ein Blick.";

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

export function HeroText() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section
          aria-labelledby="hero-headline"
          className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24"
        >
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center"
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
              className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              {HEADLINE}
            </m.h1>
            <m.p
              variants={item}
              className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {SUBHEAD}
            </m.p>
            <m.div
              variants={item}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
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
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
