"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ArrowLeftIcon, ChevronLeftIcon, Loader2Icon } from "lucide-react";
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
 * The repo-level surface of the landing console — the file tree + inspector
 * drill-down the user reaches by clicking a repo in the portfolio list. The
 * repo-URL pill morphs the demo galaxie into a real audit via
 * `buildGalaxieFromAudit` without leaving the surface. Extracted from the old
 * standalone HeroSection (galaxie-retire-console-landing): no outer section or
 * page heading — `ConsoleSurface` owns the framing; `onBack` returns to the
 * portfolio list.
 */
export function RepoConsole({
  onBack,
  repoLabel,
  initialUrl,
}: {
  onBack?: () => void;
  repoLabel?: string;
  /**
   * When set, the repo URL is audited immediately on mount — the footer CTA
   * deep-links into a live audit this way. ConsoleSurface remounts RepoConsole
   * (via `key`) for each new URL, so this only ever fires once per audit.
   */
  initialUrl?: string;
}) {
  const [actionState, action, isPending] = useActionState(
    auditAction,
    INITIAL_FORM_STATE,
  );
  const [viewState, setViewState] = useState<"demo" | "audit">("demo");
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const [activeNodeId, setActiveNodeId] = useState<string>(DEFAULT_NODE_ID);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // When transitioning into result-state, seed activeNodeId from the freshly
  // built galaxie. Idle-transition restores the demo default.
  useEffect(() => {
    if (stage === "result") {
      setActiveNodeId(pickInitialActiveNodeId(liveGalaxieData));
    } else if (stage === "idle") {
      setActiveNodeId(DEFAULT_NODE_ID);
    }
  }, [stage, liveGalaxieData]);

  const activeNode = useMemo(() => {
    return liveGalaxieData.nodes.find((n) => n.id === activeNodeId);
  }, [liveGalaxieData, activeNodeId]);

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

  const currentLoadingStage = LOADING_STAGES.reduce(
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

  // Footer-CTA deep-link: audit the supplied URL once on mount. Remount-keyed by
  // ConsoleSurface (via `key`), so this fires exactly once per incoming URL.
  useEffect(() => {
    const url = initialUrl?.trim();
    if (url) handleAuditSubmit(url);
  }, []);

  function handleResetToDemo() {
    setViewState("demo");
    setSubmittedUrl(null);
  }

  const handleNodeSelect = (nodeId: string) => setActiveNodeId(nodeId);
  const handleMobileFileSelect = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setMobileSheetOpen(true);
  };

  return (
    <div className="flex h-full w-full flex-col">
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
          onBack={onBack}
          repoLabel={repoLabel}
        />
      ) : (
        <div className="flex h-full flex-col gap-3 p-3">
          {/* Toolbar row — back-to-portfolio + repo URL pill + reset-to-demo. */}
          <div className="flex items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 font-mono type-mono-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
                Portfolio
              </button>
            ) : null}
            {repoLabel ? (
              <span className="shrink-0 truncate font-mono type-mono-sm text-white/45">
                {repoLabel}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <RepoUrlPill
                pending={isPending}
                onSubmit={handleAuditSubmit}
                error={stage === "error" ? actionState.error : undefined}
              />
            </div>
            {stage === "result" ? (
              <button
                type="button"
                onClick={handleResetToDemo}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 font-mono type-mono-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
                zurück zur Demo
              </button>
            ) : null}
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[7fr_3fr]">
            {/* Console pane — the audit findings as a scannable triage tree
                (left). Same demo/live/result data throughout; dimmed while
                the audit runs. */}
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
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
                  animate={{ opacity: stage === "loading" ? 0.4 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 h-full w-full overflow-y-auto p-3"
                  style={
                    stage === "loading" ? { willChange: "opacity" } : undefined
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

              {/* Loading-stage label centred over the dimmed tree. */}
              {stage === "loading" ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 px-6">
                  <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/80 px-3 py-1.5 font-mono type-mono-sm text-white/70 backdrop-blur">
                    <Loader2Icon
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                    <span className="truncate">{submittedUrl ?? "Auditing"}</span>
                    <span aria-hidden="true">·</span>
                    <span aria-live="polite">
                      {LOADING_STAGES[currentLoadingStage]?.label ??
                        LOADING_STAGES[0].label}
                      <AnimatedDots />
                    </span>
                  </div>
                  {isLongRun ? (
                    <p className="max-w-md rounded-md border border-white/10 bg-black/80 px-3 py-2 text-center type-body-sm text-white/60 backdrop-blur">
                      Großes Repo? Kann ein paar Minuten dauern. Sign-in für
                      Background-Audit und Magic-Link-Benachrichtigung.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Background-path: BlurOverlayCTA replaces the whole pane. */}
              {stage === "background" ? (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6 backdrop-blur">
                  <BlurOverlayCTA
                    repoUrl={submittedUrl ?? actionState.displayPath ?? ""}
                    variant="background"
                  />
                </div>
              ) : null}
            </div>

            {/* Inspector pane — right column, same component throughout. */}
            <div className="overflow-hidden rounded-lg">
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
        id="demo-findings-list"
        className="sr-only"
        aria-label="Liste aller Findings in der Demo"
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
    </div>
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
 * Mobile path — TreeView + Sheet stays the primary surface; the pill rides a
 * sticky bottom bar. While auditing, the TreeView gets replaced by a
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
  onBack,
  repoLabel,
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
  onBack?: () => void;
  repoLabel?: string;
}) {
  return (
    <div className="px-3 pb-24 pt-3">
      {(onBack || repoLabel) && (
        <div className="mb-3 flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 font-mono type-mono-sm text-white/70 hover:text-white"
            >
              <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
              Portfolio
            </button>
          ) : null}
          {repoLabel ? (
            <span className="truncate font-mono type-mono-sm text-white/45">
              {repoLabel}
            </span>
          ) : null}
        </div>
      )}

      {stage === "background" ? (
        <BlurOverlayCTA repoUrl={submittedUrl ?? ""} variant="background" />
      ) : stage === "loading" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 font-mono type-mono-sm text-white/60">
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
            <span className="truncate">{submittedUrl ?? "Auditing"}</span>
          </div>
          <p className="type-body-sm text-white/60">
            Audit läuft. Findings erscheinen hier in wenigen Sekunden.
          </p>
        </div>
      ) : stage === "result" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onResetToDemo}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 font-mono type-mono-sm text-white/70 hover:text-white"
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
          <p className="mt-3 px-1 font-mono type-mono-sm text-white/55">
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
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/95 px-4 py-3 backdrop-blur">
        <RepoUrlPill
          pending={pending}
          onSubmit={onSubmit}
          error={stage === "error" ? error : undefined}
        />
      </div>
    </div>
  );
}
