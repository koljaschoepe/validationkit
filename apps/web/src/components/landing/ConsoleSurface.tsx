"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  AnimatePresence,
} from "motion/react";
import { SolarListView } from "@/components/galaxie/SolarListView";
import { RepoConsole } from "./RepoConsole";
import { buildLandingMap } from "@/lib/galaxie/mock-data";

// The public landing console — ONE continuous interactive surface. It opens on
// the portfolio triage list (many customer repos, severity heat-bars: the
// multi-customer proof) and zooms into a single repo's file tree + inspector
// when you click a repo row. Replaces the retired galaxie as the landing's
// hero visual (galaxie-retire-console-landing). The portfolio reuses the real
// workspace SolarListView (readOnly); the repo drill reuses the demo audit
// console. Both share the same dark console aesthetic.
const LANDING_MAP = buildLandingMap();

const TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

export function ConsoleSurface() {
  const [view, setView] = useState<"portfolio" | "repo">("portfolio");
  const [activeRepoLabel, setActiveRepoLabel] = useState<string | undefined>(
    undefined,
  );
  // Set by the footer-CTA deep-link (a `vk:audit-repo` event). When present it
  // remount-keys RepoConsole so it auto-audits this URL on mount.
  const [auditUrl, setAuditUrl] = useState<string | null>(null);

  const repoLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of LANDING_MAP.repos) m.set(r.id, r.label);
    return m;
  }, []);

  // Bridge from the page-footer audit CTA — decoupled via a window event so no
  // routing/Suspense is involved and it works same-page.
  useEffect(() => {
    function onAuditRepo(e: Event) {
      const url = (e as CustomEvent<string>).detail?.trim();
      if (!url) return;
      setAuditUrl(url);
      setActiveRepoLabel(url.replace(/^https?:\/\//, ""));
      setView("repo");
    }
    window.addEventListener("vk:audit-repo", onAuditRepo);
    return () => window.removeEventListener("vk:audit-repo", onAuditRepo);
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="relative h-full w-full overflow-hidden bg-background text-left">
          <AnimatePresence mode="wait" initial={false}>
            {view === "portfolio" ? (
              <m.div
                key="portfolio"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={TRANSITION}
                className="absolute inset-0 h-full w-full"
              >
                <SolarListView
                  readOnly
                  initialData={LANDING_MAP}
                  onRepoActivate={(repoId) => {
                    setAuditUrl(null);
                    setActiveRepoLabel(repoLabelById.get(repoId));
                    setView("repo");
                  }}
                />
              </m.div>
            ) : (
              <m.div
                key="repo"
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={TRANSITION}
                className="absolute inset-0 h-full w-full"
              >
                <RepoConsole
                  key={auditUrl ?? "demo"}
                  initialUrl={auditUrl ?? undefined}
                  onBack={() => {
                    setAuditUrl(null);
                    setView("portfolio");
                  }}
                  repoLabel={activeRepoLabel}
                />
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
