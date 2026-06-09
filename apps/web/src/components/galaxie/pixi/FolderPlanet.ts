import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  type Text,
  type Texture,
} from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import { folderDisplayName } from '@/lib/galaxie/humanize';
import { applyLabelLOD, createNodeLabel, setNodeLabelText } from './NodeLabel';
import {
  SEVERITY_GLOW_RADIUS,
  SEVERITY_HEX,
  SEVERITY_OUTLINE_HEX,
  hexToPixiNumber,
} from '@/lib/galaxie/severity-colors';
import {
  BADGE_DISC_RADIUS,
  BADGE_ICON_SIZE,
  EDGE_BADGE_BANDS,
} from '@/lib/galaxie/severity-icons';
import type {
  FolderNode,
  Severity,
  SolarLayoutNode,
} from '@/lib/galaxie/types';
import { getBadgeTexture } from './edge-badge-texture';

const { FOLDER_PLANET_RADIUS } = SOLAR_LAYOUT_CONSTANTS;

export class FolderPlanet extends Container {
  folder: FolderNode;
  nodeLabel: Text;
  private graphics: Graphics;
  private mobileScale: number;
  private badge: Container | null = null;
  private hoverGlow: Graphics | null = null;

  constructor(folder: FolderNode, node: SolarLayoutNode, mobileScale = 1) {
    super();
    this.folder = folder;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = folder.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint(folder.aggregateSeverity);
    this.updateBadge(folder.aggregateSeverity);

    // Phase E — on-canvas label (LOD-gated, updated by GalaxieWorld's ticker).
    this.nodeLabel = createNodeLabel(folderDisplayName(folder));
    this.addChild(this.nodeLabel);

    const hitR = 22 * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Re-paint sprite for a new aggregate severity without destroying it. */
  updateFolder(folder: FolderNode): void {
    const severityChanged =
      this.folder.aggregateSeverity !== folder.aggregateSeverity;
    this.folder = folder;
    if (severityChanged) {
      this.paint(folder.aggregateSeverity);
      this.updateBadge(folder.aggregateSeverity);
    }
    setNodeLabelText(this.nodeLabel, folderDisplayName(folder));
  }

  /** Phase E — update the label's LOD state for the current camera zoom. */
  updateLabelLOD(cameraScale: number): void {
    applyLabelLOD(
      this.nodeLabel,
      cameraScale,
      'folder',
      FOLDER_PLANET_RADIUS * this.mobileScale,
    );
  }

  /** Re-render the badge from the texture cache. Idempotent; safe to call when
   *  textures finish loading after initial mount. */
  refreshBadgeFromTextureCache(): void {
    this.updateBadge(this.folder.aggregateSeverity);
  }

  setHoverGlow(active: boolean): void {
    if (active && !this.hoverGlow) {
      const r = (FOLDER_PLANET_RADIUS + 4) * this.mobileScale;
      this.hoverGlow = new Graphics();
      this.hoverGlow.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.14 });
      this.addChildAt(this.hoverGlow, 0);
    } else if (!active && this.hoverGlow) {
      this.removeChild(this.hoverGlow);
      this.hoverGlow.destroy();
      this.hoverGlow = null;
    }
  }

  private paint(severity: Severity): void {
    const s = this.mobileScale;
    const r = FOLDER_PLANET_RADIUS * s;
    const fillColor = hexToPixiNumber(SEVERITY_HEX[severity]);
    this.graphics.clear();
    this.graphics.circle(0, 0, r).fill({ color: fillColor });

    const outlineHex = SEVERITY_OUTLINE_HEX[severity];
    if (outlineHex) {
      this.graphics
        .circle(0, 0, r)
        .stroke({ width: 1, color: hexToPixiNumber(outlineHex) });
    }

    // Galaxie-Redesign Phase B (B.4) — a folder governed by a context-root config
    // (CLAUDE.md / AGENTS.md / gemini.md) renders a distinct warm inner core, so
    // it reads as "this folder IS context", not just a directory.
    if (this.folder.nucleus) {
      const coreR = r * 0.46;
      this.graphics.circle(0, 0, coreR).fill({ color: 0xfff6e8, alpha: 0.92 });
      this.graphics
        .circle(0, 0, coreR)
        .stroke({ width: 1, color: hexToPixiNumber(SEVERITY_HEX[severity]) });
    }

    // Phase F — baked sphere shading: upper-left highlight + faint atmosphere rim.
    this.graphics
      .circle(-r * 0.3, -r * 0.3, r * 0.42)
      .fill({ color: 0xffffff, alpha: 0.16 });
    this.graphics.circle(0, 0, r).stroke({ width: 1, color: 0xffffff, alpha: 0.1 });

    // Phase B (B.5) — a submodule (shared team context) gets a distinct teal
    // double-ring, marking it as its own node class.
    if (this.folder.isSubmodule) {
      this.graphics.circle(0, 0, r + 2.5).stroke({ width: 1.5, color: 0x5eead4, alpha: 0.85 });
      this.graphics.circle(0, 0, r + 5).stroke({ width: 1, color: 0x5eead4, alpha: 0.4 });
    }

    const glowRadius = SEVERITY_GLOW_RADIUS[severity] * s;
    this.filters =
      glowRadius > 0
        ? [
            new GlowFilter({
              distance: glowRadius,
              outerStrength: 1.4,
              innerStrength: 0,
              color: fillColor,
              quality: 0.2,
            }),
          ]
        : [];
  }

  private updateBadge(severity: Severity): void {
    if (this.badge) {
      this.removeChild(this.badge);
      this.badge.destroy({ children: true });
      this.badge = null;
    }
    if (!EDGE_BADGE_BANDS.has(severity)) return;
    const texture = getBadgeTexture(severity);
    if (!texture) return;
    this.badge = buildBadge(
      severity,
      texture,
      FOLDER_PLANET_RADIUS * this.mobileScale,
    );
    this.addChild(this.badge);
  }
}

/** Shared badge-builder — also reused by FilePlanet + RepoSun (worst-child). */
export function buildBadge(
  severity: Severity,
  texture: Texture,
  parentRadius: number,
): Container {
  const container = new Container();
  const disc = new Graphics();
  disc
    .circle(0, 0, BADGE_DISC_RADIUS)
    .fill({ color: hexToPixiNumber(SEVERITY_HEX[severity]) });
  const icon = new Sprite(texture);
  icon.anchor.set(0.5);
  icon.width = BADGE_ICON_SIZE;
  icon.height = BADGE_ICON_SIZE;
  container.addChild(disc);
  container.addChild(icon);
  // Position relative to parent center — 1 o'clock, half-overlapping the rim.
  container.x = parentRadius * 0.866;
  container.y = -parentRadius * 0.5;
  container.eventMode = 'none';
  return container;
}
