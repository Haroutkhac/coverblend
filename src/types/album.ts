export interface LABColor {
  L: number;
  a: number;
  b: number;
}

export interface AlbumFeatures {
  colorPalette: LABColor[];
  colorHistogram: number[];
  textureEnergy: number[];
  luminanceGrid: number[];
  brightness: number;
  contrast: number;
  saturation: number;
  featureVector: number[];
}

export interface AlbumCover {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  imagePath: string;
  dominantColor: string;
  features: AlbumFeatures;
}

export interface AlbumCatalog {
  version: number;
  generatedAt: string;
  albums: AlbumCover[];
}
