import { Container, Graphics, Rectangle } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import {
  DISMISSED_FILL_HEX,
  SEVERITY_GLOW_RADIUS,
  SEVERITY_HEX,
  SEVERITY_OUTLINE_HEX,
  hexToPixiNumber,
} from '@/lib/galaxie/severity-colors';
import { EDGE_BADGE_BANDS } from '@/lib/galaxie/severity-icons';
import type { FileNode, Severity, SolarLayoutNode } from '@/lib/galaxie/types';
import { alphaFor } from '@/lib/solution-alpha';
import { getBadgeTexture } from './edge-badge-texture';
import { buildBadge } from './FolderPlanet';

const { FILE_PLANET_RADIUS } = SOLAR_LAYOUT_CONSTANTS;

export class FilePlanet extends Container {
  file: FileNode;
  private graphics: Graphics;
  private mobileScale: number;
  private badge: Container | null = null;
  private hoverGlow: Graphics | null = null;

  constructor(file: FileNode, node: SolarLayoutNode, mobileScale = 1) {
    super();
    this.file = file;
    this.mobileScale = mobileScale;
    this.x = node.x;
    this.y = node.y;
    this.label = file.id;

    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.paint(file);
    this.updateBadge(file);

    const hitR = 22 * mobileScale;
    this.hitArea = new Rectangle(-hitR, -hitR, hitR * 2, hitR * 2);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Re-paint sprite for new severity / dismiss / solution state. */
  updateFile(file: FileNode): void {
    const visualDirty =
      this.file.severity !== file.severity ||
      this.file.dismissStatus !== file.dismissStatus ||
      this.file.solutionStatus !== file.solutionStatus ||
      this.file.solutionConfidence !== file.solutionConfidence;
    this.file = file;
    if (visualDirty) {
      this.paint(file);
      this.updateBadge(file);
    }
  }

  /** Re-render the badge after the texture cache becomes ready. */
  refreshBadgeFromTextureCache(): void {
    this.updateBadge(this.file);
  }

  setHoverGlow(active: boolean): void {
    if (active && !this.hoverGlow) {
      const r = (FILE_PLANET_RADIUS + 4) * this.mobileScale;
      this.hoverGlow = new Graphics();
      this.hoverGlow.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.14 });
      this.addChildAt(this.hoverGlow, 0);
    } else if (!active && this.hoverGlow) {
      this.removeChild(this.hoverGlow);
      this.hoverGlow.destroy();
      this.hoverGlow = null;
    }
  }

  private paint(file: FileNode): void {
    const s = this.mobileScale;
    const r = FILE_PLANET_RADIUS * s;
    const dismissed = file.dismissStatus === 'dismissed';

    // Solution-status alpha cascades on top of dismissed alpha (dismissed
    // already sits at 0.20 in alphaFor). Hover/pulse tweens read this.alpha
    // implicitly via the sprite scale; alpha itself is set here.
    this.alpha = alphaFor(
      file.solutionStatus,
      file.solutionConfidence,
      file.dismissStatus,
    );

    const fillColor = dismissed
      ? hexToPixiNumber(DISMISSED_FILL_HEX)
      : hexToPixiNumber(SEVERITY_HEX[file.severity]);

    this.graphics.clear();
    this.graphics.circle(0, 0, r).fill({ color: fillColor });

    const outlineHex = !dismissed
      ? SEVERITY_OUTLINE_HEX[file.severity]
      : undefined;
    if (outlineHex) {
      this.graphics
        .circle(0, 0, r)
        .stroke({ width: 1, color: hexToPixiNumber(outlineHex) });
    }

    const glowRadius = dismissed ? 0 : SEVERITY_GLOW_RADIUS[file.severity] * s;
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

  private updateBadge(file: FileNode): void {
    if (this.badge) {
      this.removeChild(this.badge);
      this.badge.destroy({ children: true });
      this.badge = null;
    }
    if (file.dismissStatus === 'dismissed') return;
    const severity: Severity = file.severity;
    if (!EDGE_BADGE_BANDS.has(severity)) return;
    const texture = getBadgeTexture(severity);
    if (!texture) return;
    // File planets are small (radius 4); cap badge disc radius to planet
    // radius * 0.9 so the badge doesn't visually swallow the planet.
    const parentRadius = FILE_PLANET_RADIUS * this.mobileScale;
    this.badge = buildBadge(severity, texture, parentRadius);
    this.addChild(this.badge);
  }
}
