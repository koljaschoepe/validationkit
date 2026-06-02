"use client";

import { useMemo, useState } from "react";
import {
  computeSolarLayout,
  SOLAR_LAYOUT_CONSTANTS,
} from "@/lib/galaxie/solar-layout";
import { generateMockGalaxieData } from "@/lib/galaxie/mock-data";
import type {
  GalaxieData,
  SolarLayoutNode,
} from "@/lib/galaxie/types";
import { Inspector } from "./Inspector";
import { type OnboardingState } from "./OnboardingBanner";
import { ActivationChecklist } from "./ActivationChecklist";
import { EmptyGalaxie } from "./EmptyGalaxie";

/**
 * Static-SVG fallback rendering of the workspace galaxy. Used when the user
 * has `prefers-reduced-motion: reduce` set — we skip the PixiJS bundle
 * entirely and ship a flat SVG instead. The Inspector flow is preserved by
 * reusing the existing component; click on a file-planet opens it in the
 * same portal-mounted panel as the PixiJS path.
 *
 * Sub-A: pure layout stage. All nodes render in neutral grey; severity colour,
 * edge badges, and orbit rings arrive in Sub-B / Sub-C.
 */

const SUN_INNER_COLOR = "#ececec";
const SUN_MID_COLOR = "#7f7f7f";
const SUN_OUTER_COLOR = "#1f1f1f";
const PLANET_FILL = "#acacac";

const { SUN_RADIUS, FOLDER_PLANET_RADIUS, FILE_PLANET_RADIUS } =
  SOLAR_LAYOUT_CONSTANTS;

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

  const layout = useMemo(() => computeSolarLayout(data), [data]);
  const viewBox = useMemo(() => computeViewBox(layout.nodes), [layout.nodes]);

  const fileById = useMemo(
    () => new Map(data.files.map((f) => [f.id, f])),
    [data.files],
  );

  const isEmptyRealWorkspace =
    initialData !== undefined && initialData.customers.length === 0;

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null;
    return data.files.find((f) => f.id === selectedFileId) ?? null;
  }, [selectedFileId, data.files]);

  if (isEmptyRealWorkspace) {
    return <EmptyGalaxie workspaceSlug={workspaceSlug ?? "default"} />;
  }

  const suns = layout.nodes.filter((n) => n.kind === "sun");
  const folderPlanets = layout.nodes.filter((n) => n.kind === "folder");
  const filePlanets = layout.nodes.filter((n) => n.kind === "file");

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
        aria-label={`Static galaxy view of ${data.repos.length} repos, ${data.files.length} files`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Layer 1 — Repo suns */}
        <g aria-hidden="true">
          {suns.map((sun) => (
            <g key={sun.id}>
              <circle
                cx={sun.x}
                cy={sun.y}
                r={SUN_RADIUS * 1.0}
                fill={SUN_OUTER_COLOR}
                fillOpacity={0.18}
              />
              <circle
                cx={sun.x}
                cy={sun.y}
                r={SUN_RADIUS * 0.75}
                fill={SUN_MID_COLOR}
                fillOpacity={0.45}
              />
              <circle
                cx={sun.x}
                cy={sun.y}
                r={SUN_RADIUS * 0.45}
                fill={SUN_INNER_COLOR}
              />
            </g>
          ))}
        </g>

        {/* Layer 2 — Folder planets */}
        <g aria-hidden="true">
          {folderPlanets.map((planet) => (
            <circle
              key={planet.id}
              cx={planet.x}
              cy={planet.y}
              r={FOLDER_PLANET_RADIUS}
              fill={PLANET_FILL}
            />
          ))}
        </g>

        {/* Layer 3 — File planets (root files only — foldered files appear via
            folder-pivot in Sub-C and are not rendered in Sub-A). */}
        {filePlanets.map((planet) => {
          const file = fileById.get(planet.id);
          if (!file) return null;
          return (
            <g key={planet.id}>
              <circle
                cx={planet.x}
                cy={planet.y}
                r={FILE_PLANET_RADIUS}
                fill={PLANET_FILL}
              />
              <rect
                x={planet.x - 22}
                y={planet.y - 22}
                width={44}
                height={44}
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={`Open finding: ${file.path}`}
                style={{ cursor: "pointer", outline: "none" }}
                onClick={() => setSelectedFileId(file.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedFileId(file.id);
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

function computeViewBox(nodes: SolarLayoutNode[]): ViewBox {
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
  // Padding so the sun coronas do not clip the viewBox edges.
  const pad = SUN_RADIUS + 20;
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}
