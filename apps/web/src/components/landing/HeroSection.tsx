"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  AnimatePresence,
} from "motion/react";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import {
  DEFAULT_GALAXIE_SETTINGS,
  type GalaxieSettings,
} from "./RepoGalaxie";
import { RepoInspector } from "./RepoInspector";
import { SignUpTeaseDialog } from "./SignUpTeaseDialog";
import { RepoTreeView } from "./RepoTreeView";
import { InspectorMobileSheet } from "./InspectorMobileSheet";
import { RepoUrlPill } from "./RepoUrlPill";
import { BlurOverlayCTA } from "./BlurOverlayCTA";
import { auditAction, type AuditFormState } from "@/lib/audit-action";
import { buildGalaxieFromAudit } from "@/lib/repo-galaxie/build-from-audit";
import { useIsMobile } from "@/lib/use-media-query";
import {
  DEMO_GALAXIE,
  DEMO_FINDINGS as REPO_DEMO_FINDINGS,
  DEFAULT_NODE_ID,
  nodeById,
} from "@/lib/repo-galaxie/demo-data";
import type { GraphNode, RepoGalaxieData } from "@/lib/repo-galaxie/types";

const INITIAL_FORM_STATE: AuditFormState = { ok: false };

const LOADING_STAGES = [
  { label: "Cloning Repo", afterMs: 0 },
  { label: "Parsing Context-Files", afterMs: 4000 },
  { label: "Running Audit-Rules", afterMs: 9000 },
  { label: "Building Report", afterMs: 18000 },
] as const;
const LONG_RUN_HINT_MS = 30_000;

const DEMO_ROOT_ID = DEMO_GALAXIE.nodes.find((n) => n.parentId === null)!.id;

function demoPathFromRoot(nodeId: string): GraphNode[] {
  const path: GraphNode[] = [];
  let cursor = nodeById(nodeId);
  while (cursor) {
    path.unshift(cursor);
    if (!cursor.parentId) break;
    cursor = nodeById(cursor.parentId);
  }
  return path;
}

function buildPathFromNodes(
  nodes: GraphNode[],
  nodeId: string,
): GraphNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: GraphNode[] = [];
  let cursor = byId.get(nodeId);
  while (cursor) {
    path.unshift(cursor);
    if (!cursor.parentId) break;
    cursor = byId.get(cursor.parentId);
  }
  return path;
}

function pickRootId(data: RepoGalaxieData): string {
  return data.nodes.find((n) => n.parentId === null)?.id ?? DEMO_ROOT_ID;
}

function pickInitialActiveNodeId(data: RepoGalaxieData): string {
  // Prefer the first file with a finding; fall back to the first file at all,
  // then root. Keeps the inspector meaningful immediately after the audit.
  const firstFileWithFinding = data.nodes.find(
    (n) => n.kind === "file" && n.severity != null,
  );
  if (firstFileWithFinding) return firstFileWithFinding.id;
  const firstFile = data.nodes.find((n) => n.kind === "file");
  if (firstFile) return firstFile.id;
  return pickRootId(data);
}

/**
 * Public landing hero — fullscreen demo (galaxie + inspector) under the
 * SiteNav. The repo-URL pill lives in the galaxie's top toolbar; submitting
 * it morphs the demo-galaxie into the real audit galaxie via the
 * `buildGalaxieFromAudit` helper without leaving the hero. The inspector
 * remains the same component in both states.
 */
export function HeroSection() {
  const [actionState, action, isPending] = useActionState(
    auditAction,
    INITIAL_FORM_STATE,
  );
  const [viewState, setViewState] = useState<"demo" | "audit">("demo");
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const [activeNodeId, setActiveNodeId] = useState<string>(DEFAULT_NODE_ID);
  const [focusId, setFocusId] = useState<string>(DEMO_ROOT_ID);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [galaxieSettings, setGalaxieSettings] = useState<GalaxieSettings>(
    DEFAULT_GALAXIE_SETTINGS,
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  // Derive the user-facing stage from the (viewState, actionState, isPending)
  // triple. `viewState === 'demo'` always wins so the reset button can clear
  // the audit view even while the cached actionState is still ok.
  const stage: "idle" | "loading" | "result" | "background" | "error" =
    viewState === "demo"
      ? "idle"
      : isPending
        ? "loading"
        : actionState.ok && actionState.background
          ? "background"
          : actionState.ok && actionState.scan && actionState.report
            ? "result"
            : actionState.error
              ? "error"
              : "loading";

  // Build the live galaxie once per result and memoise so re-renders don't
  // re-walk the parser output.
  const liveGalaxieData = useMemo<RepoGalaxieData>(() => {
    if (stage !== "result" || !actionState.scan || !actionState.report) {
      return DEMO_GALAXIE;
    }
    return buildGalaxieFromAudit(actionState.scan, actionState.report);
  }, [stage, actionState.scan, actionState.report]);

  // When transitioning into result-state, seed activeNodeId + focusId from
  // the freshly-built galaxie. Idle-transition restores the demo defaults.
  useEffect(() => {
    if (stage === "result") {
      setActiveNodeId(pickInitialActiveNodeId(liveGalaxieData));
      setFocusId(pickRootId(liveGalaxieData));
    } else if (stage === "idle") {
      setActiveNodeId(DEFAULT_NODE_ID);
      setFocusId(DEMO_ROOT_ID);
    }
  }, [stage, liveGalaxieData]);

  const activeNode = useMemo(() => {
    return liveGalaxieData.nodes.find((n) => n.id === activeNodeId);
  }, [liveGalaxieData, activeNodeId]);

  const breadcrumbPath = useMemo(
    () =>
      stage === "result"
        ? buildPathFromNodes(liveGalaxieData.nodes, focusId)
        : demoPathFromRoot(focusId),
    [stage, liveGalaxieData, focusId],
  );

  const reducedMotionForLib =
    galaxieSettings.reducedMotionMode === "auto"
      ? "user"
      : galaxieSettings.reducedMotionMode === "on"
        ? "always"
        : "never";

  // Loading elapsed-timer drives the stage-label cycle + long-run hint.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stage !== "loading") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 500);
    return () => clearInterval(id);
  }, [stage]);

  const currentLoadingStage =
    LOADING_STAGES.reduce(
      (acc, s, i) => (elapsed >= s.afterMs ? i : acc),
      0,
    );
  const isLongRun = elapsed > LONG_RUN_HINT_MS;

  function handleAuditSubmit(rawPath: string) {
    setSubmittedUrl(rawPath);
    setViewState("audit");
    const fd = new FormData();
    fd.set("path", rawPath);
    action(fd);
  }

  function handleResetToDemo() {
    setViewState("demo");
    setSubmittedUrl(null);
  }

  const handleNodeSelect = (nodeId: string) => setActiveNodeId(nodeId);
  const handleMobileFileSelect = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setMobileSheetOpen(true);
  };
  const handleFocusChange = (nodeId: string) => setFocusId(nodeId);
  const handleBreadcrumbSelect = (nodeId: string) => {
    setFocusId(nodeId);
    setActiveNodeId(nodeId);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={reducedMotionForLib}>
          <section
            id="demo"
            aria-labelledby="demo-heading"
            className="relative w-full scroll-mt-16"
          >
            {/* Landing-Redesign Phase H — the galaxie is demoted below the text
                hero (which now owns the page h1); this is the live-demo section. */}
            <div className="mx-auto w-full max-w-7xl px-4 pb-4 pt-14 text-center sm:px-6 sm:pt-20">
              <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
                Live-Demo · keine Anmeldung
              </p>
              <h2
                id="demo-heading"
                className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Audit dein Repo in Sekunden
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Wirf eine GitHub-URL rein oder erkunde die Demo. Jedes Finding
                nach Severity sortiert, mit anwendbarem Fix.
              </p>
            </div>

            {/* Skip-link — first focusable element on the page. */}
            <a
              href="#galaxie-findings-list"
              className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:font-mono focus:type-mono-sm focus:text-foreground focus:outline-2 focus:outline-ring focus:outline-offset-2"
            >
              Direkt zur Findings-Liste
            </a>

            {isMobile ? (
              <MobileLayout
                activeNode={activeNode}
                galaxieData={liveGalaxieData}
                onFileSelect={handleMobileFileSelect}
                mobileSheetOpen={mobileSheetOpen}
                onSheetOpenChange={setMobileSheetOpen}
                onFixClick={() => setDialogOpen(true)}
                stage={stage}
                pending={isPending}
                error={actionState.error}
                submittedUrl={submittedUrl}
                onSubmit={handleAuditSubmit}
                onResetToDemo={handleResetToDemo}
              />
            ) : (
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-4 pt-2 sm:px-6">
                {/* Nova-3a Phase 2: prominent hero-row with label + URL pill.
                    Centred so the primary audit-input reads as the focal CTA. */}
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                  <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    Audit Dein Repo →
                  </p>
                  <div className="w-full sm:max-w-xl">
                    <RepoUrlPill
                      pending={isPending}
                      size="hero"
                      onSubmit={handleAuditSubmit}
                      error={stage === "error" ? actionState.error : undefined}
                    />
                  </div>
                  {stage === "result" ? (
                    <button
                      type="button"
                      onClick={handleResetToDemo}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/80 px-2.5 font-mono type-mono-sm text-muted-foreground backdrop-blur hover:bg-muted/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                    >
                      <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
                      zurück zur Demo
                    </button>
                  ) : null}
                </div>

                <div
                  className="grid flex-1 gap-4 sm:gap-6 lg:grid-cols-[7fr_3fr]"
                  style={{ minHeight: "min(72vh, calc(100svh - 3.5rem - 6rem))" }}
                >
                {/* Console-Pane — the audit findings as a scannable triage
                    tree (left). Same demo/live/result data throughout; dimmed
                    while the audit runs. Replaces the old galaxie so the page
                    keeps exactly one galaxy (the Portfolio-Map above). */}
                <div className="relative overflow-hidden rounded-xl border border-border bg-card/40">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.div
                      key={
                        stage === "result"
                          ? "live-tree"
                          : stage === "loading"
                            ? "loading-tree"
                            : "demo-tree"
                      }
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: stage === "loading" ? 0.4 : 1,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 h-full w-full overflow-y-auto p-3"
                      style={
                        stage === "loading"
                          ? { willChange: "opacity" }
                          : undefined
                      }
                    >
                      <RepoTreeView
                        data={liveGalaxieData}
                        activeNodeId={activeNodeId}
                        onFileSelect={
                          stage === "loading" ? undefined : handleNodeSelect
                        }
                      />
                    </m.div>
                  </AnimatePresence>

                  {/* Loading-stage label centred over the dimmed galaxie. */}
                  {stage === "loading" ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 px-6">
                      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-1.5 font-mono type-mono-sm text-muted-foreground backdrop-blur">
                        <Loader2Icon
                          className="size-3.5 animate-spin"
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {submittedUrl ?? "Auditing"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span aria-live="polite">
                          {LOADING_STAGES[currentLoadingStage]?.label ??
                            LOADING_STAGES[0].label}
                          <AnimatedDots />
                        </span>
                      </div>
                      {isLongRun ? (
                        <p className="max-w-md rounded-md border border-border bg-card/90 px-3 py-2 text-center type-body-sm text-muted-foreground backdrop-blur">
                          Großes Repo? Kann ein paar Minuten dauern. Sign-in
                          für Background-Audit und Magic-Link-Benachrichtigung.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Background-path: BlurOverlayCTA replaces the whole pane. */}
                  {stage === "background" ? (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 p-6 backdrop-blur">
                      <BlurOverlayCTA
                        repoUrl={
                          submittedUrl ?? actionState.displayPath ?? ""
                        }
                        variant="background"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Inspector-Pane — right column, same component throughout. */}
                <div className="overflow-hidden">
                  <RepoInspector
                    node={activeNode}
                    onFixClick={() => setDialogOpen(true)}
                  />
                </div>
                </div>
              </div>
            )}

            {/* Screen-reader-only flat list of clickable demo findings. */}
            <ol
              id="galaxie-findings-list"
              className="sr-only"
              aria-label="Liste aller Findings in der Demo-Galaxie"
            >
              {REPO_DEMO_FINDINGS.map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => setActiveNodeId(f.nodeId)}>
                    {f.title}, Schweregrad {f.severity}, Knoten {f.nodeId}
                  </button>
                </li>
              ))}
            </ol>

            <SignUpTeaseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </section>
      </MotionConfig>
    </LazyMotion>
  );
}

function AnimatedDots() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v % 3) + 1), 400);
    return () => clearInterval(id);
  }, []);
  return <span aria-hidden="true">{".".repeat(n)}</span>;
}

/**
 * Mobile path — TreeView + Sheet stays the primary surface; the pill rides
 * a sticky bottom bar. While auditing, the TreeView gets replaced by a
 * skeleton/result card so the user still gets visible feedback.
 */
function MobileLayout({
  activeNode,
  galaxieData,
  onFileSelect,
  mobileSheetOpen,
  onSheetOpenChange,
  onFixClick,
  stage,
  pending,
  error,
  submittedUrl,
  onSubmit,
  onResetToDemo,
}: {
  activeNode: GraphNode | undefined;
  galaxieData: RepoGalaxieData;
  onFileSelect: (nodeId: string) => void;
  mobileSheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  onFixClick: () => void;
  stage: "idle" | "loading" | "result" | "background" | "error";
  pending: boolean;
  error: string | undefined;
  submittedUrl: string | null;
  onSubmit: (path: string) => void;
  onResetToDemo: () => void;
}) {
  return (
    <div className="px-4 pb-24 pt-4">
      {stage === "background" ? (
        <BlurOverlayCTA repoUrl={submittedUrl ?? ""} variant="background" />
      ) : stage === "loading" ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 font-mono type-mono-sm text-muted-foreground">
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
            <span className="truncate">{submittedUrl ?? "Auditing"}</span>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Audit läuft. Findings erscheinen hier in wenigen Sekunden.
          </p>
        </div>
      ) : stage === "result" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onResetToDemo}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 font-mono type-mono-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
            zurück zur Demo
          </button>
          <RepoTreeView
            data={galaxieData}
            activeNodeId={activeNode?.id ?? null}
            onFileSelect={onFileSelect}
          />
        </div>
      ) : (
        <>
          <RepoTreeView
            data={galaxieData}
            activeNodeId={activeNode?.id ?? null}
            onFileSelect={onFileSelect}
          />
          <p className="mt-3 px-1 font-mono type-mono-sm text-foreground/55">
            Tippe ein Finding, um es zu inspizieren.
          </p>
        </>
      )}

      <InspectorMobileSheet
        open={mobileSheetOpen}
        onOpenChange={onSheetOpenChange}
        node={activeNode}
        onFixClick={onFixClick}
      />

      {/* Sticky bottom bar — pill survives across all stages. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <RepoUrlPill
          pending={pending}
          onSubmit={onSubmit}
          error={stage === "error" ? error : undefined}
        />
      </div>
    </div>
  );
}
