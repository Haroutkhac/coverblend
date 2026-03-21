import { LABColor } from './album';

export interface AnalysisResult {
  colorPalette: LABColor[];
  colorHistogram: number[];
  textureEnergy: number[];
  luminanceGrid: number[];
  brightness: number;
  contrast: number;
  saturation: number;
  featureVector: number[];
}

export interface MatchResult {
  album: import('./album').AlbumCover;
  overallScore: number;
  colorScore: number;
  textureScore: number;
  luminanceScore: number;
  brightnessScore: number;
}

export interface AnalysisProgress {
  step: string;
  percent: number;
}
