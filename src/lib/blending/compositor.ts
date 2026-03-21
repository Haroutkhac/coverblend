import type { BlendSettings } from '@/types/blend';
import { clamp } from '@/lib/utils/math';
import { applyBlendMode } from '@/lib/blending/blend-modes';
import { generateFeatherMask } from '@/lib/blending/gaussian-feather';
import { applyColorTransfer } from '@/lib/blending/color-transfer';

/**
 * Scales an ImageData to the given dimensions using an offscreen canvas.
 */
function scaleImageData(
  source: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;

  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(source, 0, 0);

  const scaled = document.createElement('canvas');
  scaled.width = targetWidth;
  scaled.height = targetHeight;

  const sctx = scaled.getContext('2d')!;
  sctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return sctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Extracts an ImageData region from a larger ImageData buffer.
 */
function extractRegion(
  source: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;

  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(source, 0, 0);

  return ctx.getImageData(x, y, width, height);
}

/**
 * Composites a cover image onto a photo using the specified blend settings.
 *
 * Pipeline:
 *  1. Scale cover to fit based on settings.scale
 *  2. Optionally apply Reinhard color transfer
 *  3. Generate Gaussian feather mask
 *  4. For each pixel in overlap region: apply blend mode, multiply by feather alpha and global opacity
 *  5. Combine: final = photo * (1 - alpha) + blended * alpha
 *
 * @param photo - The background photo ImageData
 * @param cover - The album cover ImageData to overlay
 * @param settings - Blend configuration (position, scale, opacity, blend mode, etc.)
 * @returns A new ImageData with the composited result
 */
export function compositeImages(
  photo: ImageData,
  cover: ImageData,
  settings: BlendSettings
): ImageData {
  const photoWidth = photo.width;
  const photoHeight = photo.height;

  // Step 1: Scale the cover
  const scaledWidth = Math.max(1, Math.round(cover.width * settings.scale));
  const scaledHeight = Math.max(1, Math.round(cover.height * settings.scale));
  const scaledCover = scaleImageData(cover, scaledWidth, scaledHeight);

  // Compute placement position (positionX/Y are 0-1 anchors on the photo)
  const placeX = Math.round(settings.positionX * photoWidth - scaledWidth / 2);
  const placeY = Math.round(settings.positionY * photoHeight - scaledHeight / 2);

  // Compute the overlap rectangle (intersection of cover rect and photo bounds)
  const overlapLeft = Math.max(0, placeX);
  const overlapTop = Math.max(0, placeY);
  const overlapRight = Math.min(photoWidth, placeX + scaledWidth);
  const overlapBottom = Math.min(photoHeight, placeY + scaledHeight);

  // If no overlap, return a copy of the photo
  if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
    return new ImageData(new Uint8ClampedArray(photo.data), photoWidth, photoHeight);
  }

  const overlapWidth = overlapRight - overlapLeft;
  const overlapHeight = overlapBottom - overlapTop;

  // Step 2: Optionally apply color transfer
  let processedCover = scaledCover;
  if (settings.colorTransferEnabled && settings.colorTransferStrength > 0) {
    // Extract the photo region under the cover for color reference
    const targetRegion = extractRegion(photo, overlapLeft, overlapTop, overlapWidth, overlapHeight);
    processedCover = applyColorTransfer(scaledCover, targetRegion, settings.colorTransferStrength);
  }

  // Step 3: Generate feather mask for the scaled cover dimensions
  const featherMask = generateFeatherMask(scaledWidth, scaledHeight, settings.featherRadius);

  // Step 4 & 5: Composite pixel by pixel
  const result = new Uint8ClampedArray(photo.data);
  const coverData = processedCover.data;
  const opacity = clamp(settings.opacity, 0, 1);

  for (let row = overlapTop; row < overlapBottom; row++) {
    for (let col = overlapLeft; col < overlapRight; col++) {
      // Coordinates within the cover image
      const coverX = col - placeX;
      const coverY = row - placeY;

      // Feather alpha from the mask
      const featherAlpha = featherMask[coverY * scaledWidth + coverX];

      // Combined alpha: feather * global opacity
      const alpha = featherAlpha * opacity;

      if (alpha <= 0) continue;

      const photoIdx = (row * photoWidth + col) * 4;
      const coverIdx = (coverY * scaledWidth + coverX) * 4;

      // Apply blend mode per channel (R, G, B)
      for (let ch = 0; ch < 3; ch++) {
        const base = result[photoIdx + ch];
        const blend = coverData[coverIdx + ch];
        const blended = applyBlendMode(settings.blendMode, base, blend);

        // Combine: final = photo * (1 - alpha) + blended * alpha
        result[photoIdx + ch] = clamp(
          Math.round(base * (1 - alpha) + blended * alpha),
          0,
          255
        );
      }

      // Alpha channel: keep photo alpha
    }
  }

  return new ImageData(result, photoWidth, photoHeight);
}

/**
 * Convenience wrapper that operates on HTMLCanvasElements.
 *
 * Extracts ImageData from both canvases, runs the compositing pipeline,
 * and returns a new canvas with the result.
 *
 * @param photo - The background photo canvas
 * @param cover - The album cover canvas to overlay
 * @param settings - Blend configuration
 * @returns A new HTMLCanvasElement with the composited result
 */
export function compositeToCanvas(
  photo: HTMLCanvasElement,
  cover: HTMLCanvasElement,
  settings: BlendSettings
): HTMLCanvasElement {
  const photoCtx = photo.getContext('2d')!;
  const coverCtx = cover.getContext('2d')!;

  const photoData = photoCtx.getImageData(0, 0, photo.width, photo.height);
  const coverData = coverCtx.getImageData(0, 0, cover.width, cover.height);

  const resultData = compositeImages(photoData, coverData, settings);

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = resultData.width;
  resultCanvas.height = resultData.height;

  const resultCtx = resultCanvas.getContext('2d')!;
  resultCtx.putImageData(resultData, 0, 0);

  return resultCanvas;
}
