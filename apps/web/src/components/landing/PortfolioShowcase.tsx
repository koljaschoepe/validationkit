"use client";

import { useRef } from "react";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import GalaxieRoot from "@/components/galaxie/GalaxieRoot";
import { GalaxieSkeleton } from "@/components/galaxie/GalaxieSkeleton";
import {
  generateMockGalaxieData,
  LANDING_DEMO_PROFILES,
} from "@/lib/galaxie/mock-data";
import { SEVERITY_HEX } from "@/lib/galaxie/severity-colors";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useIsMobile } from "@/lib/galaxie/device";
import type { Severity } from "@/lib/galaxie/types";

// Landing-Redesign Phase I + K — the public Pixi-Solar portfolio showcase.
// Coexistence decision (2026-06-09): a NEW section above the live-audit funnel
// (HeroSection), not a replacement — `lib/repo-galaxie/` stays. The renderer is
// the real workspace `GalaxieScene` (mode:'static-demo') over a curated
// 6-customer agency fixture (Phase K).
//
// Desktop + motion → Phase I.3 sticky scrollytelling: a 360vh outer pins the
// card and a spring-smoothed scroll progress drives the Pixi camera through a
// waypoint tour (overview → on-fire repo → folder → finding). Mobile or
// reduced-motion → a normal-height card with the built-in `enableAutoTour`
// (auto-tour itself skips under prefers-reduced-motion, and GalaxieRoot swaps
// in the SVG / list fallback there). Pixi only mounts once in view (LCP guard).

const PORTFOLIO = generateMockGalaxieData(
  "landing-portfolio-v1",
  LANDING_DEMO_PROFILES,
);

const ROLLUP = (() => {
  const bySeverity = (s: Severity) =>
    PORTFOLIO.repos.filter((r) => r.aggregateSeverity === s).length;
  return {
    customers: PORTFOLIO.customers.length,
    repos: PORTFOLIO.repos.length,
    kill: bySeverity("Kill"),
    weak: bySeverity("Weak"),
    mid: bySeverity("Mid"),
  };
})();

// Overview camera — pulled out so all six clusters fit the frame. Shared as the
// scroll tour's first waypoint (GalaxieScene derives the rest from the layout).
const OVERVIEW_ZOOM = { x: 0, y: 0, scale: 0.32 };

const STEPS = [
  {
    eyebrow: "01 · Portfolio",
    title: "Alle Mandanten auf einen Blick",
    body: "Jede Sonne ein Repo, geclustert pro Kunde. Severity sitzt in der Farbe — und nur was brennt, leuchtet.",
  },
  {
    eyebrow: "02 · Zoom",
    title: "Rein ins Repo, das brennt",
    body: "Ein Kill-Repo rückt in den Fokus. Die ruhigen Mandanten treten in den Hintergrund.",
  },
  {
    eyebrow: "03 · Kontext",
    title: "Governing-Config im Kern",
    body: "Die CLAUDE.md / AGENTS.md, die einen Ordner steuert, sitzt als warmer Nukleus im Planeten.",
  },
  {
    eyebrow: "04 · Finding",
    title: "Das Kill-Finding, erklärt",
    body: "Widersprüchliche Direktiven, tote Verweise, Token-Overshoot — jeweils mit anwendbarem Fix.",
  },
] as const;

export function PortfolioShowcase() {
  // Hooks resolve to false on SSR / first paint, so the first render is always
  // the pinned path; mobile / reduced-motion swap to the static card on mount.
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const pinned = !reduced && !mobile;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {pinned ? <PinnedShowcase /> : <StaticShowcase />}
      </MotionConfig>
    </LazyMotion>
  );
}

// ── Shared chrome ───────────────────────────────────────────────────────────

function ShowcaseHeading() {
  return (
    <div className="mx-auto mb-8 w-full max-w-3xl px-4 text-center sm:px-6">
      <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
        Dein Portfolio · live
      </p>
      <h2
        id="showcase-heading"
        className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      >
        Jedes Kunden-Repo eine Sonne. Jedes Finding ein Planet.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground">
        Eine Agency-Galaxie über alle Mandanten — Severity in der Farbe, Kontext
        im Kern. Was brennt, leuchtet. Der Rest bleibt ruhig.
      </p>
    </div>
  );
}

function Toolbar() {
  return (
    <div className="flex items-center gap-3 border-b border-[#242728] bg-[#0d0d0d] px-4 py-2.5">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-[#f4604e]/70" />
        <span className="size-2.5 rounded-full bg-[#cf8a4f]/70" />
        <span className="size-2.5 rounded-full bg-[#7eb8a4]/70" />
      </div>
      <span className="font-mono type-mono-sm text-white/40">
        validationkit · agency-portfolio
      </span>
      <HudRollup />
    </div>
  );
}

function HudRollup() {
  return (
    <div className="ml-auto hidden items-center gap-3 font-mono type-mono-sm text-white/55 sm:flex">
      <span>{ROLLUP.customers} Kunden</span>
      <span aria-hidden="true" className="text-white/20">
        ·
      </span>
      <span>{ROLLUP.repos} Repos</span>
      <span aria-hidden="true" className="text-white/20">
        ·
      </span>
      <SeverityCount label="Kill" count={ROLLUP.kill} />
      <SeverityCount label="Weak" count={ROLLUP.weak} />
      <SeverityCount label="Mid" count={ROLLUP.mid} />
    </div>
  );
}

function SeverityCount({ label, count }: { label: Severity; count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{ backgroundColor: SEVERITY_HEX[label] }}
      />
      {count} {label}
    </span>
  );
}

// ── Pinned scrollytelling (desktop + motion) ────────────────────────────────

function PinnedShowcase() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  // Mount Pixi when the pinned stage nears the viewport (keeps @pixi/react out
  // of the first-paint path).
  const inView = useInView(stickyRef, { once: true, margin: "400px 0px" });
  // Progress 0..1 as the 360vh outer scrolls through the viewport, then a
  // spring so the Pixi camera glides instead of tracking raw scroll.
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <section
      aria-labelledby="showcase-heading"
      className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6 sm:pt-24"
    >
      <ShowcaseHeading />
      {/* Outer scroll track — its height is the scroll budget for the tour. */}
      <div ref={outerRef} className="relative h-[360vh]">
        {/* Pinned stage */}
        <div ref={stickyRef} className="sticky top-[7vh] h-[86vh]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#242728] bg-[#07080a] shadow-2xl shadow-black/40">
            <Toolbar />
            <div className="relative flex-1">
              {inView ? (
                <GalaxieRoot
                  mode="static-demo"
                  readOnly
                  initialData={PORTFOLIO}
                  initialZoomLevel={OVERVIEW_ZOOM}
                  cameraProgress={progress}
                />
              ) : (
                <GalaxieSkeleton />
              )}

              {/* Narration — one caption per leg, fading in/out by progress.
                  Bottom-left so it never collides with the right-side inspector
                  revealed on the final leg. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="relative h-28 max-w-md">
                  {STEPS.map((step, i) => (
                    <StepCaption
                      key={step.eyebrow}
                      progress={progress}
                      index={i}
                      total={STEPS.length}
                      step={step}
                    />
                  ))}
                </div>
              </div>

              {/* Scroll affordance — fades out once the tour starts. */}
              <ScrollHint progress={progress} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCaption({
  progress,
  index,
  total,
  step,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  step: (typeof STEPS)[number];
}) {
  const seg = 1 / total;
  const start = index * seg;
  const end = start + seg;
  // Each caption owns its segment with quick 0.04-wide fades that finish before
  // the neighbour's begin — a short blank at the boundary reads cleaner than two
  // overlapping captions. First holds from p=0, last lingers to p=1.
  const inAt = index === 0 ? -0.1 : start + 0.02;
  const outAt = index === total - 1 ? 1.1 : end - 0.02;
  const opacity = useTransform(
    progress,
    [inAt, inAt + 0.04, outAt - 0.04, outAt],
    [0, 1, 1, 0],
  );
  const y = useTransform(opacity, [0, 1], [12, 0]);

  return (
    <m.div style={{ opacity, y }} className="absolute inset-0">
      <p className="font-mono type-mono-sm uppercase tracking-wider text-primary">
        {step.eyebrow}
      </p>
      <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white">
        {step.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/65">{step.body}</p>
    </m.div>
  );
}

function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.04], [1, 0]);
  return (
    <m.div
      style={{ opacity }}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"
    >
      <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 font-mono type-mono-sm text-white/55 backdrop-blur">
        ↓ Scroll für die Tour
      </span>
    </m.div>
  );
}

// ── Static fallback (mobile / reduced-motion) ───────────────────────────────

function StaticShowcase() {
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, margin: "300px 0px" });

  return (
    <section
      aria-labelledby="showcase-heading"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24"
    >
      <ShowcaseHeading />
      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-2xl border border-[#242728] bg-[#07080a] shadow-2xl shadow-black/40"
      >
        <Toolbar />
        <div className="relative h-[64vh] min-h-[440px] w-full">
          {inView ? (
            <GalaxieRoot
              mode="static-demo"
              readOnly
              initialData={PORTFOLIO}
              initialZoomLevel={OVERVIEW_ZOOM}
              enableAutoTour
            />
          ) : (
            <GalaxieSkeleton />
          )}
        </div>
      </div>
      <p className="mt-4 text-center font-mono type-mono-sm text-muted-foreground/70">
        Tippe einen Planeten → Finding-Details. Tour läuft automatisch.
      </p>
    </section>
  );
}
