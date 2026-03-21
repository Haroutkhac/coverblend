import { rgbToLab, labToRgb } from '@/lib/image-analysis/color-space';
import { clamp, lerp } from '@/lib/utils/math';

interface ChannelStats {
  mean: number;
  std: number;
}

/**
 * Computes the mean and standard deviation for L, a, b channels
 * from an ImageData's pixel buffer.
 */
function computeLabStats(imageData: ImageData): [ChannelStats, ChannelStats, ChannelStats] {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  let sumL = 0, sumA = 0, sumB = 0;
  let sumL2 = 0, sumA2 = 0, sumB2 = 0;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const lab = rgbToLab(data[offset], data[offset + 1], data[offset + 2]);

    sumL += lab.L;
    sumA += lab.a;
    sumB += lab.b;

    sumL2 += lab.L * lab.L;
    sumA2 += lab.a * lab.a;
    sumB2 += lab.b * lab.b;
  }

  const meanL = sumL / pixelCount;
  const meanA = sumA / pixelCount;
  const meanB = sumB / pixelCount;

  // Population standard deviation
  const stdL = Math.sqrt(Math.max(0, sumL2 / pixelCount - meanL * meanL));
  const stdA = Math.sqrt(Math.max(0, sumA2 / pixelCount - meanA * meanA));
  const stdB = Math.sqrt(Math.max(0, sumB2 / pixelCount - meanB * meanB));

  return [
    { mean: meanL, std: stdL },
    { mean: meanA, std: stdA },
    { mean: meanB, std: stdB },
  ];
}

/**
 * Transfers a single LAB channel value using Reinhard's method.
 * result = (value - srcMean) * (tgtStd / srcStd) + tgtMean
 */
function transferChannel(value: number, src: ChannelStats, tgt: ChannelStats): number {
  // Avoid division by zero: if source has no variance, just shift by target mean
  const scale = src.std > 1e-6 ? tgt.std / src.std : 1.0;
  return (value - src.mean) * scale + tgt.mean;
}

/**
 * Applies Reinhard color transfer from a target image onto a source image.
 *
 * The source image (album cover) is recolored to match the color distribution
 * of the target image (photo crop region) in LAB color space.
 *
 * @param source - The image to recolor (album cover)
 * @param target - The image whose color distribution to match (photo crop)
 * @param strength - Interpolation factor (0 = no change, 1 = full transfer)
 * @returns A new ImageData with the color-transferred result
 */
export function applyColorTransfer(
  source: ImageData,
  target: ImageData,
  strength: number
): ImageData {
  const clampedStrength = clamp(strength, 0, 1);

  // If strength is zero, return a copy of the source
  if (clampedStrength === 0) {
    return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  }

  const [srcL, srcA, srcB] = computeLabStats(source);
  const [tgtL, tgtA, tgtB] = computeLabStats(target);

  const { data, width, height } = source;
  const pixelCount = width * height;
  const result = new Uint8ClampedArray(data.length);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];

    // Convert to LAB
    const lab = rgbToLab(r, g, b);

    // Apply Reinhard transfer
    const transferredL = clamp(transferChannel(lab.L, srcL, tgtL), 0, 100);
    const transferredA = clamp(transferChannel(lab.a, srcA, tgtA), -128, 127);
    const transferredB = clamp(transferChannel(lab.b, srcB, tgtB), -128, 127);

    // Convert transferred LAB back to RGB
    const [tr, tg, tb] = labToRgb(transferredL, transferredA, transferredB);

    // Lerp between original and transferred based on strength
    result[offset] = Math.round(lerp(r, tr, clampedStrength));
    result[offset + 1] = Math.round(lerp(g, tg, clampedStrength));
    result[offset + 2] = Math.round(lerp(b, tb, clampedStrength));
    result[offset + 3] = a;
  }

  return new ImageData(result, width, height);
}
