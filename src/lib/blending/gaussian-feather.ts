import { smoothstep } from '@/lib/utils/math';

/**
 * Generates a 2D alpha mask with Gaussian-like feathering from edges.
 *
 * The mask is 1.0 in the interior and smoothly falls to 0.0 at the edges.
 * The featherRadius controls how many pixels the falloff spans from each edge.
 * Uses smoothstep for a perceptually smooth S-curve transition.
 *
 * @param width - Width of the mask in pixels
 * @param height - Height of the mask in pixels
 * @param featherRadius - Number of pixels over which the edge fades to transparent
 * @returns Float32Array of length width * height with values in [0, 1]
 */
export function generateFeatherMask(
  width: number,
  height: number,
  featherRadius: number
): Float32Array {
  const mask = new Float32Array(width * height);

  // With zero or negative feather radius, the mask is fully opaque
  if (featherRadius <= 0) {
    mask.fill(1.0);
    return mask;
  }

  // Clamp feather so it cannot exceed half the dimension
  const maxFeatherX = Math.floor(width / 2);
  const maxFeatherY = Math.floor(height / 2);
  const featherX = Math.min(featherRadius, maxFeatherX);
  const featherY = Math.min(featherRadius, maxFeatherY);

  for (let y = 0; y < height; y++) {
    // Distance from nearest horizontal edge, normalized to [0, 1] over feather region
    const distTop = y;
    const distBottom = height - 1 - y;
    const edgeY = Math.min(distTop, distBottom);
    const alphaY = featherY > 0 ? smoothstep(0, featherY, edgeY) : 1.0;

    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      // Distance from nearest vertical edge
      const distLeft = x;
      const distRight = width - 1 - x;
      const edgeX = Math.min(distLeft, distRight);
      const alphaX = featherX > 0 ? smoothstep(0, featherX, edgeX) : 1.0;

      // Multiply horizontal and vertical falloff for corner smoothness
      mask[rowOffset + x] = alphaX * alphaY;
    }
  }

  return mask;
}
