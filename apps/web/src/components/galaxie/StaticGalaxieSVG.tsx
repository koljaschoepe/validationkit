"use client";

import { useMemo, useState } from "react";
import { computeLayout } from "@/lib/galaxie/layout";
import { generateMockGalaxieData } from "@/lib/galaxie/mock-data";
import type {
  GalaxieData,
  LayoutNode,
  Severity,
} from "@/lib/galaxie/types";
import { Inspector } from "./Inspector";
import { type OnboardingState } from "./OnboardingBanner";
import { ActivationChecklist } from "./ActivationChecklist";
import { EmptyGalaxie } from "./EmptyGalaxie";

/**
 * Static-SVG fallback rendering of the workspace galaxy. Used when the user
 * has `prefers-reduced-motion: reduce` set — we skip the PixiJS bundle
 * (~200KB JS) entirely and ship a flat SVG instead. The Inspector flow is
 * preserved by reusing the existing component; click on a file-asteroid
 * opens it in the same portal-mounted panel as the PixiJS path.
 *
 * Tradeoffs vs the PixiJS path:
 * - No pan / zoom / pinch — the SVG fills its container at one viewBox.
 * - No hover affordance + pulse animations (matches reduced-motion intent).
 * - No tooltips on file hover; clicking is the only interaction.
 * - Multi-workspace switching, MiniMap, Cmd+K, and Auto-Tour are not wired —
 *   reduced-motion users do not need a tour, and the chrome adds little when
 *   panning is gone.
 */

const SEVERITY_COLOR_VAR: Record<Severity, string> = {
  Kill: "var(--color-sev-kill)",
  Weak: "var(--color-sev-weak)",
  Mid: "var(--color-sev-mid)",
  Strong: "var(--color-sev-strong)",
  Exceptional: "var(--color-sev-exceptional)",
};

export function StaticGalaxieSVG({
  initialData,
  readOnly = false,
  onboarding,
  workspaceSlug,
}: {
  initialData?: GalaxieData;
  readOnly?: boolean;
  onboarding?: OnboardingState;
  workspaceSlug?: string;
}) {
  const data = useMemo(
    () => initialData ?? generateMockGalaxieData(),
    [initialData],
  );

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const layout = useMemo(() => computeLayout(data), [data]);
  const nodeById = useMemo(
    () => new Map<string, LayoutNode>(layout.nodes.map((n) => [n.id, n])),
    [layout],
  );

  const viewBox = useMemo(() => computeViewBox(layout.nodes), [layout.nodes]);

  const isEmptyRealWorkspace =
    initialData !== undefined && initialData.customers.length === 0;

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null;
    return data.files.find((f) => f.id === selectedFileId) ?? null;
  }, [selectedFileId, data.files]);

  if (isEmptyRealWorkspace) {
    return <EmptyGalaxie workspaceSlug={workspaceSlug ?? "default"} />;
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {onboarding ? (
        <ActivationChecklist
          state={{
            workspaceId: onboarding.workspaceId,
            customerCount: onboarding.customerCount,
            repoCount: onboarding.repoCount,
            scanCount: onboarding.scanCount,
            applyCount: onboarding.applyCount ?? 0,
            memberCount: onboarding.memberCount ?? 0,
            gitHubAppConfigured: onboarding.gitHubAppConfigured,
          }}
          workspaceSlug={workspaceSlug ?? "default"}
        />
      ) : null}

      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        role="img"
        aria-label={`Static galaxy view of ${data.customers.length} customers, ${data.files.length} files`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Layer 1 — Customer stars */}
        <g aria-hidden="true">
          {data.customers.map((c) => {
            const ln = nodeById.get(c.id);
            if (!ln) return null;
            const color = SEVERITY_COLOR_VAR[c.aggregateSeverity];
            return (
              <g key={c.id}>
                <circle
                  cx={ln.x}
                  cy={ln.y}
                  r={32}
                  fill={color}
                  fillOpacity={0.12}
                />
                <circle
                  cx={ln.x}
                  cy={ln.y}
                  r={20}
                  fill={color}
                  fillOpacity={0.32}
                />
                <circle cx={ln.x} cy={ln.y} r={11} fill={color} />
              </g>
            );
          })}
        </g>

        {/* Layer 2 — Repo moons */}
        <g aria-hidden="true">
          {data.repos.map((r) => {
            const ln = nodeById.get(r.id);
            if (!ln) return null;
            const color = SEVERITY_COLOR_VAR[r.aggregateSeverity];
            return (
              <g key={r.id}>
                <circle
                  cx={ln.x}
                  cy={ln.y}
                  r={9}
                  fill={color}
                  fillOpacity={0.22}
                />
                <circle cx={ln.x} cy={ln.y} r={5.5} fill={color} />
              </g>
            );
          })}
        </g>

        {/* Layer 3 — File asteroids (clickable) */}
        {data.files.map((f) => {
          const ln = nodeById.get(f.id);
          if (!ln) return null;
          const dimmed = f.dismissStatus === "dismissed";
          const color = dimmed ? "var(--muted-foreground)" : SEVERITY_COLOR_VAR[f.severity];
          return (
            <g key={f.id}>
              <circle cx={ln.x} cy={ln.y} r={2.4} fill={color} />
              <rect
                x={ln.x - 22}
                y={ln.y - 22}
                width={44}
                height={44}
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={`Open finding: ${f.path}`}
                style={{ cursor: "pointer", outline: "none" }}
                onClick={() => setSelectedFileId(f.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedFileId(f.id);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>

      {selectedFile ? (
        <Inspector
          file={selectedFile}
          onClose={() => setSelectedFileId(null)}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function computeViewBox(nodes: LayoutNode[]): ViewBox {
  if (nodes.length === 0) {
    return { x: -400, y: -400, w: 800, h: 800 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  // Padding so the customer-star halos do not clip the viewBox edges.
  const pad = 80;
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}
