import { Texture } from 'pixi.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  EDGE_BADGE_BANDS,
  SEVERITY_LUCIDE,
} from '@/lib/galaxie/severity-icons';
import type { Severity } from '@/lib/galaxie/types';

/**
 * Rasterizes the five severity-band Lucide icons (those in EDGE_BADGE_BANDS —
 * Mid is excluded) once into PIXI textures so each planet edge-badge sprite can
 * reuse the same texture. DPR-2 keeps icons crisp on retina; on 1× displays the
 * down-scale is acceptable.
 *
 * `ensureBadgeTexturesReady()` is idempotent and must be awaited once at scene
 * mount before sprites read from `getBadgeTexture(severity)`.
 */

// Bundle I: 12→16 source-px + DPR 2→3 so the in-canvas badge is crisp at ~10px
// instead of a ~6px blur. Dark icon (was #ffffff) — the severity discs are now
// light enough that a near-black glyph reads clearly on every band.
const ICON_SIZE = 16;
const DPR = 3;
const ICON_COLOR = '#1f1f1f';
const ICON_STROKE_WIDTH = 2.4;

const cache = new Map<Severity, Texture>();
let readyPromise: Promise<void> | null = null;

export function ensureBadgeTexturesReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  if (typeof window === 'undefined') {
    // Server-render path — return resolved promise; sprites won't mount on SSR anyway.
    readyPromise = Promise.resolve();
    return readyPromise;
  }
  readyPromise = (async () => {
    await Promise.all(
      [...EDGE_BADGE_BANDS].map(async (band) => {
        if (cache.has(band)) return;
        const Component = SEVERITY_LUCIDE[band];
        const svgMarkup = renderToStaticMarkup(
          createElement(Component, {
            size: ICON_SIZE,
            strokeWidth: ICON_STROKE_WIDTH,
            color: ICON_COLOR,
          }),
        );
        const img = await loadSvgAsImage(svgMarkup);
        const canvas = document.createElement('canvas');
        canvas.width = ICON_SIZE * DPR;
        canvas.height = ICON_SIZE * DPR;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(DPR, DPR);
        ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE);
        cache.set(band, Texture.from(canvas));
      }),
    );
  })();
  return readyPromise;
}

export function getBadgeTexture(severity: Severity): Texture | null {
  return cache.get(severity) ?? null;
}

function loadSvgAsImage(svgMarkup: string): Promise<HTMLImageElement> {
  // Use a Blob URL rather than a base64 data-URL so non-ASCII strokes in
  // Lucide icons round-trip cleanly without btoa restrictions.
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
