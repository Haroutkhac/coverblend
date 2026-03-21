import { AnalysisResult } from '@/types/analysis';
import { extractColors } from '@/lib/image-analysis/color-extraction';
import { analyzeTexture } from '@/lib/image-analysis/texture-analysis';
import { analyzeLuminanceGrid } from '@/lib/image-analysis/luminance-grid';
import { mean, standardDeviation, normalize } from '@/lib/utils/math';

const WEIGHT_COLOR = 0.4;
const WEIGHT_TEXTURE = 0.25;
const WEIGHT_LUMINANCE = 0.2;
const WEIGHT_GLOBAL = 0.15;

function applyWeights(vector: number[], segments: { start: number; length: number; weight: number }[]): number[] {
  const weighted = new Array(vector.length);
  for (const seg of segments) {
    const sqrtW = Math.sqrt(seg.weight);
    for (let i = seg.start; i < seg.start + seg.length; i++) {
      weighted[i] = vector[i] * sqrtW;
    }
  }
  return weighted;
}

export function extractFeatureVector(imageData: ImageData): AnalysisResult {
  const { palette, histogram } = extractColors(imageData);
  const textureEnergy = analyzeTexture(imageData);
  const luminanceGrid = analyzeLuminanceGrid(imageData);

  const lValues = palette.map((c) => c.L);
  const brightness = mean(lValues);
  const contrast = standardDeviation(lValues);
  const saturation = mean(palette.map((c) => Math.sqrt(c.a * c.a + c.b * c.b)));

  const paletteFlat: number[] = [];
  for (const color of palette) {
    paletteFlat.push(color.L / 100, (color.a + 128) / 256, (color.b + 128) / 256);
  }

  const raw = [
    ...histogram,
    ...textureEnergy,
    ...luminanceGrid,
    brightness / 100,
    contrast / 50,
    saturation / 100,
    ...paletteFlat,
  ];

  const segments = [
    { start: 0, length: 48, weight: WEIGHT_COLOR },
    { start: 48, length: 8, weight: WEIGHT_TEXTURE },
    { start: 56, length: 16, weight: WEIGHT_LUMINANCE },
    { start: 72, length: 3, weight: WEIGHT_GLOBAL },
    { start: 75, length: 15, weight: WEIGHT_COLOR },
  ];

  const weighted = applyWeights(raw, segments);
  const featureVector = normalize(weighted);

  return {
    colorPalette: palette,
    colorHistogram: histogram,
    textureEnergy,
    luminanceGrid,
    brightness,
    contrast,
    saturation,
    featureVector,
  };
}
