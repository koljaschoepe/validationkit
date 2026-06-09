"use client";

import { useMemo, useState } from "react";
import {
  computeSolarLayout,
  SOLAR_LAYOUT_CONSTANTS,
} from "@/lib/galaxie/solar-layout";

import { generateMockGalaxieData } from "@/lib/galaxie/mock-data";
import { fileDisplayName, folderDisplayName } from "@/lib/galaxie/humanize";
import { SPACE_BG } from "@/lib/galaxie/space-bg";
import {
  DISMISSED_ALPHA,
  DISMISSED_FILL_HEX,
  SEVERITY_HEX,
  SEVERITY_OUTLINE_HEX,
} from "@/lib/galaxie/severity-colors";
import {
  BADGE_ICON_SIZE,
  EDGE_BADGE_BANDS,
  SEVERITY_LUCIDE,
} from "@/lib/galaxie/severity-icons";
import type {
  FileNode,
  GalaxieData,
  Severity,
  SolarLayoutNode,
} from "@/lib/galaxie/types";
import { Inspector } from "./Inspector";
import { type OnboardingState } from "./OnboardingBanner";
import { ActivationChecklist } from "./ActivationChecklist";
import { EmptyGalaxie } from "./EmptyGalaxie";

/**
 * Static-SVG fallback for `prefers-reduced-motion: reduce`. Same data + layout
 * as the PixiJS path, no pulse / glow / hover affordance — severity comes
 * across via fill colour, edge-badge and (for Exceptional) outline. Mid stays
 * anchor-neutral (no badge), Dismissed renders dark-grey at reduced alpha.
 */

// Phase F — warm photosphere (parity with the Pixi RepoSun premium look).
const SUN_CORE_COLOR = "#fff6e8";
const SUN_INNER_COLOR = "#ffd9a0";
const SUN_MID_COLOR = "#d99a5c";
const SUN_OUTER_COLOR = "#8a4f24";
const BADGE_DISC_RADIUS_SVG = 5;

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
  const folderById = useMemo(
    () => new Map(layout.folders.map((f) => [f.id, f])),
    [layout.folders],
  );
  const repoById = useMemo(
    () => new Map(data.repos.map((r) => [r.id, r])),
    [data.repos],
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
      className="relative h-full w-full overflow-hidden"
      style={SPACE_BG}
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
        {/* Sub-C — orbits + edges permanently visible at alpha 0.10. Reduced-
            motion users get a static frame of what the PixiJS reveal-on-hover
            layer shows, so the structure stays legible without animation. */}
        <g aria-hidden="true" stroke="#ffffff" strokeWidth={0.5} fill="none">
          {/* Phase D — orbit radii are count-aware per sun; derive each sun's
              rings from its children's actual orbitRadius. */}
          {suns.map((sun) => {
            const radii = new Set<number>();
            for (const c of [...folderPlanets, ...filePlanets]) {
              if (c.parentSunId === sun.id && c.orbitRadius !== undefined) {
                radii.add(c.orbitRadius);
              }
            }
            return [...radii].map((r) => (
              <circle
                key={`${sun.id}-orbit-${r}`}
                cx={sun.x}
                cy={sun.y}
                r={r}
                strokeOpacity={0.1}
              />
            ));
          })}
        </g>
        <g aria-hidden="true" stroke="#ffffff" strokeWidth={0.5}>
          {[...folderPlanets, ...filePlanets].map((child) => {
            if (!child.parentSunId) return null;
            const sun = suns.find((s) => s.id === child.parentSunId);
            if (!sun) return null;
            return (
              <line
                key={`${child.id}-edge`}
                x1={sun.x}
                y1={sun.y}
                x2={child.x}
                y2={child.y}
                strokeOpacity={0.1}
              />
            );
          })}
        </g>

        {/* Layer 1 — Repo suns + worst-child aggregate badge (Kill only) */}
        <g aria-hidden="true">
          {suns.map((sun) => {
            const repo = repoById.get(sun.id);
            return (
              <g key={sun.id}>
                {/* Phase F — warm photosphere layers + specular + rim. */}
                <circle cx={sun.x} cy={sun.y} r={SUN_RADIUS * 1.12} fill="#ffb060" fillOpacity={0.1} />
                <circle cx={sun.x} cy={sun.y} r={SUN_RADIUS} fill={SUN_OUTER_COLOR} />
                <circle cx={sun.x} cy={sun.y} r={SUN_RADIUS * 0.82} fill={SUN_MID_COLOR} />
                <circle cx={sun.x} cy={sun.y} r={SUN_RADIUS * 0.55} fill={SUN_INNER_COLOR} />
                <circle cx={sun.x} cy={sun.y} r={SUN_RADIUS * 0.32} fill={SUN_CORE_COLOR} />
                <circle
                  cx={sun.x - SUN_RADIUS * 0.26}
                  cy={sun.y - SUN_RADIUS * 0.26}
                  r={SUN_RADIUS * 0.18}
                  fill="#ffffff"
                  fillOpacity={0.5}
                />
                <circle
                  cx={sun.x}
                  cy={sun.y}
                  r={SUN_RADIUS}
                  fill="none"
                  stroke="#ffe6c2"
                  strokeOpacity={0.55}
                  strokeWidth={1}
                />
                {repo && repo.aggregateSeverity === "Kill" ? (
                  <Badge
                    severity="Kill"
                    cx={sun.x + SUN_RADIUS * 0.866}
                    cy={sun.y - SUN_RADIUS * 0.5}
                  />
                ) : null}
                {/* Phase E — static on-canvas label (no zoom, so always shown). */}
                {repo ? (
                  <text
                    x={sun.x}
                    y={sun.y + SUN_RADIUS + 12}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#ffffff"
                    fillOpacity={0.8}
                  >
                    {repo.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>

        {/* Layer 2 — Folder planets */}
        <g aria-hidden="true">
          {folderPlanets.map((planet) => {
            const folder = folderById.get(planet.id);
            if (!folder) return null;
            const severity = folder.aggregateSeverity;
            const fill = SEVERITY_HEX[severity];
            const stroke = SEVERITY_OUTLINE_HEX[severity];
            return (
              <g key={planet.id}>
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={FOLDER_PLANET_RADIUS}
                  fill={fill}
                  stroke={stroke ?? "none"}
                  strokeWidth={stroke ? 1 : 0}
                />
                {/* Phase F — sphere-shading highlight (parity with FolderPlanet). */}
                <circle
                  cx={planet.x - FOLDER_PLANET_RADIUS * 0.3}
                  cy={planet.y - FOLDER_PLANET_RADIUS * 0.3}
                  r={FOLDER_PLANET_RADIUS * 0.42}
                  fill="#ffffff"
                  fillOpacity={0.16}
                />
                {/* Phase B (B.5) — submodule teal double-ring (parity). */}
                {folder.isSubmodule ? (
                  <>
                    <circle cx={planet.x} cy={planet.y} r={FOLDER_PLANET_RADIUS + 2.5} fill="none" stroke="#5eead4" strokeOpacity={0.85} strokeWidth={1.5} />
                    <circle cx={planet.x} cy={planet.y} r={FOLDER_PLANET_RADIUS + 5} fill="none" stroke="#5eead4" strokeOpacity={0.4} strokeWidth={1} />
                  </>
                ) : null}
                {/* Phase B (B.4) — nucleus core (parity with FolderPlanet). */}
                {folder.nucleus ? (
                  <circle
                    cx={planet.x}
                    cy={planet.y}
                    r={FOLDER_PLANET_RADIUS * 0.46}
                    fill="#fff6e8"
                    fillOpacity={0.92}
                    stroke={fill}
                    strokeWidth={1}
                  />
                ) : null}
                {EDGE_BADGE_BANDS.has(severity) ? (
                  <Badge
                    severity={severity}
                    cx={planet.x + FOLDER_PLANET_RADIUS * 0.866}
                    cy={planet.y - FOLDER_PLANET_RADIUS * 0.5}
                  />
                ) : null}
                {/* Phase E — static folder label (humanized). */}
                <text
                  x={planet.x}
                  y={planet.y + FOLDER_PLANET_RADIUS + 10}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#ffffff"
                  fillOpacity={0.62}
                >
                  {folderDisplayName(folder)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Layer 3 — File planets (root files; clickable) */}
        {filePlanets.map((planet) => {
          const file = fileById.get(planet.id);
          if (!file) return null;
          return (
            <FilePlanetSvg
              key={planet.id}
              planet={planet}
              file={file}
              onSelect={setSelectedFileId}
            />
          );
        })}
      </svg>

      {selectedFile ? (
        <Inspector
          target={{ kind: 'file', file: selectedFile }}
          onClose={() => setSelectedFileId(null)}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}

function FilePlanetSvg({
  planet,
  file,
  onSelect,
}: {
  planet: SolarLayoutNode;
  file: FileNode;
  onSelect: (id: string) => void;
}) {
  const dismissed = file.dismissStatus === "dismissed";
  const severity = file.severity;
  const fill = dismissed ? DISMISSED_FILL_HEX : SEVERITY_HEX[severity];
  // Phase E — file = hollow/ringed (parity with FilePlanet): faint fill + thick ring.
  const ring = dismissed
    ? fill
    : SEVERITY_OUTLINE_HEX[severity] ?? SEVERITY_HEX[severity];
  const opacity = dismissed ? DISMISSED_ALPHA : 1;
  return (
    <g key={planet.id} opacity={opacity}>
      <circle
        cx={planet.x}
        cy={planet.y}
        r={FILE_PLANET_RADIUS}
        fill={fill}
        fillOpacity={0.25}
        stroke={ring}
        strokeWidth={2}
      />
      {/* Phase F — sphere-shading highlight (parity with FilePlanet). */}
      <circle
        cx={planet.x - FILE_PLANET_RADIUS * 0.28}
        cy={planet.y - FILE_PLANET_RADIUS * 0.28}
        r={FILE_PLANET_RADIUS * 0.32}
        fill="#ffffff"
        fillOpacity={0.16}
      />
      {!dismissed && EDGE_BADGE_BANDS.has(severity) ? (
        <Badge
          severity={severity}
          cx={planet.x + FILE_PLANET_RADIUS * 0.866}
          cy={planet.y - FILE_PLANET_RADIUS * 0.5}
        />
      ) : null}
      <rect
        x={planet.x - 22}
        y={planet.y - 22}
        width={44}
        height={44}
        fill="transparent"
        role="button"
        tabIndex={0}
        aria-label={`Open ${fileDisplayName(file)} (${file.path})`}
        style={{ cursor: "pointer", outline: "none" }}
        onClick={() => onSelect(file.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(file.id);
          }
        }}
      />
    </g>
  );
}

function Badge({
  severity,
  cx,
  cy,
}: {
  severity: Severity;
  cx: number;
  cy: number;
}) {
  const LucideIcon = SEVERITY_LUCIDE[severity];
  const discFill = SEVERITY_HEX[severity];
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle cx={0} cy={0} r={BADGE_DISC_RADIUS_SVG} fill={discFill} />
      <g transform={`translate(${-BADGE_ICON_SIZE / 2}, ${-BADGE_ICON_SIZE / 2})`}>
        <LucideIcon
          size={BADGE_ICON_SIZE}
          color="#1f1f1f"
          strokeWidth={2.4}
          aria-hidden="true"
        />
      </g>
    </g>
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
