import { cosineSimilarity } from '@/lib/utils/math';
import type { AlbumFeatures } from '@/types/album';
import type { AnalysisResult } from '@/types/analysis';

const WEIGHTS = {
  color: 0.35,
  texture: 0.25,
  luminance: 0.20,
  brightness: 0.20,
} as const;

export interface MatchScores {
  overallScore: number;
  colorScore: number;
  textureScore: number;
  luminanceScore: number;
  brightnessScore: number;
}

export function computeMatchScore(
  photo: AnalysisResult,
  album: AlbumFeatures,
): MatchScores {
  const colorScore = cosineSimilarity(photo.colorHistogram, album.colorHistogram);
  const textureScore = cosineSimilarity(photo.textureEnergy, album.textureEnergy);
  const luminanceScore = cosineSimilarity(photo.luminanceGrid, album.luminanceGrid);
  const brightnessScore = 1 - Math.abs(photo.brightness - album.brightness) / 100;

  const overallScore =
    WEIGHTS.color * colorScore +
    WEIGHTS.texture * textureScore +
    WEIGHTS.luminance * luminanceScore +
    WEIGHTS.brightness * brightnessScore;

  return {
    overallScore,
    colorScore,
    textureScore,
    luminanceScore,
    brightnessScore,
  };
}
