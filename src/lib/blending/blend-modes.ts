import type { BlendMode } from '@/types/blend';
import { clamp } from '@/lib/utils/math';

/**
 * Normal blend: linearly interpolates between base and blend by opacity.
 */
export function blendNormal(base: number, blend: number, opacity: number): number {
  return clamp(Math.round(base + (blend - base) * opacity), 0, 255);
}

/**
 * Multiply blend: darkens by multiplying base and blend channels.
 */
export function blendMultiply(base: number, blend: number): number {
  return (base * blend) / 255;
}

/**
 * Screen blend: lightens by inverting, multiplying, and inverting back.
 */
export function blendScreen(base: number, blend: number): number {
  return 255 - ((255 - base) * (255 - blend)) / 255;
}

/**
 * Overlay blend: combines multiply and screen depending on the base value.
 * Dark bases get multiply, light bases get screen.
 */
export function blendOverlay(base: number, blend: number): number {
  if (base < 128) {
    return (2 * base * blend) / 255;
  }
  return 255 - (2 * (255 - base) * (255 - blend)) / 255;
}

/**
 * Soft Light blend using the Pegtop formula.
 * Produces a softer contrast adjustment than overlay.
 */
export function blendSoftLight(base: number, blend: number): number {
  const b = base / 255;
  const s = blend / 255;
  // Pegtop formula: (1 - 2s) * b^2 + 2s * b
  const result = (1 - 2 * s) * b * b + 2 * s * b;
  return clamp(Math.round(result * 255), 0, 255);
}

/**
 * Dispatches to the correct blend function based on the mode.
 * Returns a blended channel value (0-255).
 */
export function applyBlendMode(mode: BlendMode, base: number, blend: number): number {
  switch (mode) {
    case 'normal':
      return blend;
    case 'multiply':
      return blendMultiply(base, blend);
    case 'screen':
      return blendScreen(base, blend);
    case 'overlay':
      return blendOverlay(base, blend);
    case 'soft-light':
      return blendSoftLight(base, blend);
    default:
      return blend;
  }
}
