"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import GalaxieRoot from "@/components/galaxie/GalaxieRoot";
import { GalaxieSkeleton } from "@/components/galaxie/GalaxieSkeleton";
import {
  generateMockGalaxieData,
  LANDING_DEMO_PROFILES,
} from "@/lib/galaxie/mock-data";
import { SEVERITY_HEX } from "@/lib/galaxie/severity-colors";
import type { Severity } from "@/lib/galaxie/types";

// Landing-Redesign Phase I + K — the public Pixi-Solar portfolio showcase.
// Coexistence decision (2026-06-09): this is a NEW section above the live-audit
// funnel (HeroSection), not a replacement — `lib/repo-galaxie/` stays. The
// renderer is the real workspace `GalaxieScene` in `mode:'static-demo'` driven
// by a curated 6-customer agency fixture (Phase K). `enableAutoTour` gives the
// built-in cinematic camera (zoom → finding → overview → next); reduced-motion
// + mobile fallbacks are handled inside GalaxieRoot (SVG / list). Pixi only
// mounts once the card scrolls into view (LCP guard).

// Deterministic portfolio — generated once at module-eval (pure, seeded).
const PORTFOLIO = generateMockGalaxieData(
  "landing-portfolio-v1",
  LANDING_DEMO_PROFILES,
);

// HUD rollup — agency scale at a glance (asymmetric: only Kill is loud).
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

// Overview camera — pulled out so all six clusters fit the 64vh frame. Tuned
// against the LANDING_DEMO_PROFILES spread; see Camera.zoomLevels[0] (0.45) for
// the 3-customer workspace default.
const OVERVIEW_ZOOM = { x: 0, y: 0, scale: 0.32 };

export function PortfolioShowcase() {
  const frameRef = useRef<HTMLDivElement>(null);
  // Mount Pixi only when the card is ~one viewport away — keeps the heavy
  // @pixi/react chunk out of the initial paint path.
  const inView = useInView(frameRef, { once: true, margin: "300px 0px" });

  return (
    <section
      aria-labelledby="showcase-heading"
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="mb-8 text-center">
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
          Eine Agency-Galaxie über alle Mandanten — Severity in der Farbe,
          Kontext im Kern. Was brennt, leuchtet. Der Rest bleibt ruhig.
        </p>
      </div>

      {/* App-chrome frame — surface ladder: canvas #07080a, border hairline. */}
      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-2xl border border-[#242728] bg-[#07080a] shadow-2xl shadow-black/40"
      >
        {/* Faux product toolbar */}
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

        {/* Canvas — fixed-height stage; GalaxieRoot fills it. */}
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
        Klick einen Planeten → Finding-Details. Tour läuft automatisch, stoppt
        bei der ersten Interaktion.
      </p>
    </section>
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
