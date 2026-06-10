"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import { ArrowRightIcon, PlayIcon } from "lucide-react";

// Landing-Redesign Phase H — the text-first hero that owns the above-the-fold.
// A single headline, the two CTAs, and one framed product shot. The interactive
// galaxie demo lives one scroll-depth down (#demo).
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
          className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-8 pt-16 text-center sm:px-6 sm:pt-24"
        >
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex w-full flex-col items-center"
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
              className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl"
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

            {/* Framed product shot — a real capture of the audit galaxie plus
                inspector. Sits just below the fold so it reads as proof, not
                decoration. */}
            <m.div
              variants={frame}
              className="mt-14 w-full max-w-5xl sm:mt-16"
            >
              <div className="overflow-hidden rounded-xl border border-border bg-card/40 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-2.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full bg-foreground/15"
                  />
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full bg-foreground/15"
                  />
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full bg-foreground/15"
                  />
                  <span className="ml-3 font-mono type-mono-sm text-muted-foreground/70">
                    app.validationkit.dev
                  </span>
                </div>
                <Image
                  src="/landing/konsole.png"
                  alt="Triage-Konsole mit Findings nach Severity über mehrere Kunden-Repos"
                  width={2240}
                  height={1440}
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="h-auto w-full"
                />
              </div>
            </m.div>
          </m.div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
