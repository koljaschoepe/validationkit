"use client";

import { useRef } from "react";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useInView,
} from "motion/react";
import GalaxieRoot from "@/components/galaxie/GalaxieRoot";
import { GalaxieSkeleton } from "@/components/galaxie/GalaxieSkeleton";
import { buildLandingMap } from "@/lib/galaxie/mock-data";
import { SEVERITY_HEX } from "@/lib/galaxie/severity-colors";
import { useIsMobile } from "@/lib/galaxie/device";
import type { Severity } from "@/lib/galaxie/types";

// Frontend-Redesign v2 — the public "Portfolio-Map". The earlier 30-repo
// scroll-hijacking galaxy read as an unreadable point-cloud that "got lost".
// This is the calm replacement: a single static card over a SMALL fixture
// (6 customers, one repo each, two on fire) at a zoom where the suns are big
// and their labels are legible. No 360vh pin, no flying camera — you read it.
const PORTFOLIO = buildLandingMap();

// Tighter inter-cluster spacing than the workspace default (750) so all six
// clusters fit the frame at a label-legible zoom (sun labels appear ≥ 0.6).
const MAP_CLUSTER_RADIUS = 400;
const DESKTOP_ZOOM = { x: 0, y: 0, scale: 0.66 };
const MOBILE_ZOOM = { x: 0, y: 0, scale: 0.4 };

const ROLLUP = (() => {
  const bySeverity = (s: Severity) =>
    PORTFOLIO.repos.filter((r) => r.aggregateSeverity === s).length;
  return {
    customers: PORTFOLIO.customers.length,
    repos: PORTFOLIO.repos.length,
    kill: bySeverity("Kill"),
    mid: bySeverity("Mid"),
    strong: bySeverity("Strong"),
  };
})();

export function PortfolioShowcase() {
  const mobile = useIsMobile();
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, margin: "300px 0px" });

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section
          aria-labelledby="showcase-heading"
          className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto mb-10 w-full max-w-3xl text-center">
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Portfolio-Map
            </p>
            <h2
              id="showcase-heading"
              className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Alle Mandanten auf einer Karte
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground">
              Jede Sonne ein Repo, die Farbe ist die Severity. Was brennt,
              leuchtet rot. Der Rest bleibt ruhig.
            </p>
          </div>

          <m.div
            ref={frameRef}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-[#242728] bg-[#07080a] shadow-2xl shadow-black/40"
          >
            <Toolbar />
            <div className="relative h-[64vh] min-h-[560px] w-full">
              {inView ? (
                <GalaxieRoot
                  mode="static-demo"
                  readOnly
                  initialData={PORTFOLIO}
                  clusterRadius={MAP_CLUSTER_RADIUS}
                  initialZoomLevel={mobile ? MOBILE_ZOOM : DESKTOP_ZOOM}
                />
              ) : (
                <GalaxieSkeleton />
              )}
            </div>
          </m.div>

          <p className="mt-4 text-center font-mono type-mono-sm text-muted-foreground/70">
            Tippe einen Planeten für die Finding-Details.
          </p>
        </section>
      </MotionConfig>
    </LazyMotion>
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
        <SeverityCount label="Mid" count={ROLLUP.mid} />
        <SeverityCount label="Strong" count={ROLLUP.strong} />
      </div>
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
