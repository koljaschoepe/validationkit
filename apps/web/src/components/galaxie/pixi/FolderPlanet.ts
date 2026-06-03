import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  type Texture,
} from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
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
