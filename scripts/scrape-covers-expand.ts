/**
 * scrape-covers-expand.ts
 *
 * Expands the existing album catalog by searching additional artists/terms
 * on the iTunes Search API, downloading new covers, computing feature vectors,
 * and merging into the existing index.json.
 *
 * Usage: npx tsx scripts/scrape-covers-expand.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage } from 'canvas';

// ─────────────────────────────────────────────────────────────
// Math utilities (ported from src/lib/utils/math.ts)
// ─────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dotProduct(v, v));
}

function normalize(v: number[]): number[] {
  const mag = magnitude(v);
  if (mag === 0) return v.map(() => 0);
  return v.map((x) => x / mag);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ─────────────────────────────────────────────────────────────
// Color space (ported from src/lib/image-analysis/color-space.ts)
// ─────────────────────────────────────────────────────────────

interface LABColor {
  L: number;
  a: number;
  b: number;
}

const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
  rr *= 100;
  gg *= 100;
  bb *= 100;
  const x = rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375;
  const y = rr * 0.2126729 + gg * 0.7151522 + bb * 0.072175;
  const z = rr * 0.0193339 + gg * 0.119192 + bb * 0.9503041;
  return [x, y, z];
}

function xyzToLab(x: number, y: number, z: number): LABColor {
  let xx = x / REF_X;
  let yy = y / REF_Y;
  let zz = z / REF_Z;
  xx = xx > 0.008856 ? Math.cbrt(xx) : 7.787 * xx + 16 / 116;
  yy = yy > 0.008856 ? Math.cbrt(yy) : 7.787 * yy + 16 / 116;
  zz = zz > 0.008856 ? Math.cbrt(zz) : 7.787 * zz + 16 / 116;
  return { L: 116 * yy - 16, a: 500 * (xx - yy), b: 200 * (yy - zz) };
}

function rgbToLab(r: number, g: number, b: number): LABColor {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

function labToXyz(L: number, a: number, b: number): [number, number, number] {
  let yy = (L + 16) / 116;
  let xx = a / 500 + yy;
  let zz = yy - b / 200;
  const xxx = xx * xx * xx;
  const yyy = yy * yy * yy;
  const zzz = zz * zz * zz;
  xx = xxx > 0.008856 ? xxx : (xx - 16 / 116) / 7.787;
  yy = yyy > 0.008856 ? yyy : (yy - 16 / 116) / 7.787;
  zz = zzz > 0.008856 ? zzz : (zz - 16 / 116) / 7.787;
  return [xx * REF_X, yy * REF_Y, zz * REF_Z];
}

function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  x /= 100;
  y /= 100;
  z /= 100;
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
  return [
    clamp(Math.round(r * 255), 0, 255),
    clamp(Math.round(g * 255), 0, 255),
    clamp(Math.round(b * 255), 0, 255),
  ];
}

function labToHex(lab: LABColor): string {
  const [r, g, b] = xyzToRgb(...labToXyz(lab.L, lab.a, lab.b));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Color extraction (ported from src/lib/image-analysis/color-extraction.ts)
// ─────────────────────────────────────────────────────────────

interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function downsamplePixels(imageData: ImageDataLike, targetSize: number): Uint8ClampedArray {
  const { width, height, data } = imageData;
  const scale = Math.min(1, targetSize / Math.max(width, height));
  const newW = Math.max(1, Math.round(width * scale));
  const newH = Math.max(1, Math.round(height * scale));
  const out = new Uint8ClampedArray(newW * newH * 4);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcX = Math.min(Math.round(x / scale), width - 1);
      const srcY = Math.min(Math.round(y / scale), height - 1);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * newW + x) * 4;
      out[dstIdx] = data[srcIdx];
      out[dstIdx + 1] = data[srcIdx + 1];
      out[dstIdx + 2] = data[srcIdx + 2];
      out[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return out;
}

function pixelsToLab(pixels: Uint8ClampedArray): LABColor[] {
  const count = pixels.length / 4;
  const labs: LABColor[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    labs[i] = rgbToLab(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
  }
  return labs;
}

function labDistSq(a: LABColor, b: LABColor): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dL * dL + da * da + db * db;
}

function kMeansPPInit(points: LABColor[], k: number): LABColor[] {
  const n = points.length;
  const centroids: LABColor[] = [];
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push({ ...points[firstIdx] });
  const distances = new Float64Array(n).fill(Infinity);
  for (let c = 1; c < k; c++) {
    const lastCentroid = centroids[c - 1];
    let totalDist = 0;
    for (let i = 0; i < n; i++) {
      const d = labDistSq(points[i], lastCentroid);
      if (d < distances[i]) distances[i] = d;
      totalDist += distances[i];
    }
    if (totalDist === 0) {
      centroids.push({ ...points[Math.floor(Math.random() * n)] });
      continue;
    }
    let threshold = Math.random() * totalDist;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      threshold -= distances[i];
      if (threshold <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push({ ...points[chosen] });
  }
  return centroids;
}

function kMeansCluster(
  points: LABColor[],
  k: number,
  maxIterations: number
): { centroids: LABColor[]; assignments: Int32Array } {
  const n = points.length;
  const centroids = kMeansPPInit(points, k);
  const assignments = new Int32Array(n);
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let best = 0;
      for (let c = 0; c < k; c++) {
        const d = labDistSq(points[i], centroids[c]);
        if (d < minDist) {
          minDist = d;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }
    if (!changed) break;
    const sumL = new Float64Array(k);
    const sumA = new Float64Array(k);
    const sumB = new Float64Array(k);
    const counts = new Int32Array(k);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sumL[c] += points[i].L;
      sumA[c] += points[i].a;
      sumB[c] += points[i].b;
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c].L = sumL[c] / counts[c];
        centroids[c].a = sumA[c] / counts[c];
        centroids[c].b = sumB[c] / counts[c];
      }
    }
  }
  return { centroids, assignments };
}

function computeHistogram(labs: LABColor[]): number[] {
  const bins = 16;
  const histogram = new Array(bins * 3).fill(0);
  const n = labs.length;
  for (let i = 0; i < n; i++) {
    const { L, a, b } = labs[i];
    const lBin = Math.min(bins - 1, Math.max(0, Math.floor((L / 100) * bins)));
    histogram[lBin]++;
    const aBin = Math.min(bins - 1, Math.max(0, Math.floor(((a + 128) / 256) * bins)));
    histogram[bins + aBin]++;
    const bBin = Math.min(bins - 1, Math.max(0, Math.floor(((b + 128) / 256) * bins)));
    histogram[2 * bins + bBin]++;
  }
  if (n > 0) {
    for (let i = 0; i < histogram.length; i++) histogram[i] /= n;
  }
  return histogram;
}

function extractColors(imageData: ImageDataLike): { palette: LABColor[]; histogram: number[] } {
  const downsampled = downsamplePixels(imageData, 100);
  const labs = pixelsToLab(downsampled);
  const k = 5;
  const { centroids, assignments } = kMeansCluster(labs, k, 20);
  const counts = new Int32Array(k);
  for (let i = 0; i < assignments.length; i++) counts[assignments[i]]++;
  const indexed = centroids.map((centroid, i) => ({ centroid, count: counts[i] }));
  indexed.sort((a, b) => b.count - a.count);
  const palette = indexed.map((item) => item.centroid);
  const histogram = computeHistogram(labs);
  return { palette, histogram };
}

// ─────────────────────────────────────────────────────────────
// Texture analysis (ported from src/lib/image-analysis/texture-analysis.ts)
// ─────────────────────────────────────────────────────────────

function toGrayscale(imageData: ImageDataLike): Float64Array {
  const { data, width, height } = imageData;
  const gray = new Float64Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    gray[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
  }
  return gray;
}

function downsampleGray(
  gray: Float64Array,
  srcW: number,
  srcH: number,
  targetSize: number
): { data: Float64Array; width: number; height: number } {
  const scale = Math.min(1, targetSize / Math.max(srcW, srcH));
  const newW = Math.max(1, Math.round(srcW * scale));
  const newH = Math.max(1, Math.round(srcH * scale));
  if (newW === srcW && newH === srcH) return { data: gray, width: srcW, height: srcH };
  const out = new Float64Array(newW * newH);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcX = Math.min(Math.round(x / scale), srcW - 1);
      const srcY = Math.min(Math.round(y / scale), srcH - 1);
      out[y * newW + x] = gray[srcY * srcW + srcX];
    }
  }
  return { data: out, width: newW, height: newH };
}

function createGaborKernel(size: number, theta: number, lambda: number, sigma: number): Float64Array {
  const kernel = new Float64Array(size * size);
  const half = Math.floor(size / 2);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const sigma2 = 2 * sigma * sigma;
  for (let y = -half; y <= half; y++) {
    for (let x = -half; x <= half; x++) {
      const xr = x * cosT + y * sinT;
      const yr = -x * sinT + y * cosT;
      const gaussian = Math.exp(-(xr * xr + yr * yr) / sigma2);
      const sinusoidal = Math.sin((2 * Math.PI * xr) / lambda);
      kernel[(y + half) * size + (x + half)] = gaussian * sinusoidal;
    }
  }
  return kernel;
}

function convolveEnergy(
  gray: Float64Array,
  w: number,
  h: number,
  kernel: Float64Array,
  kSize: number
): number {
  const half = Math.floor(kSize / 2);
  let totalEnergy = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(Math.min(w, h) / 64));
  for (let y = half; y < h - half; y += step) {
    for (let x = half; x < w - half; x += step) {
      let sum = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const py = y + ky - half;
          const px = x + kx - half;
          sum += gray[py * w + px] * kernel[ky * kSize + kx];
        }
      }
      totalEnergy += Math.abs(sum);
      count++;
    }
  }
  return count > 0 ? totalEnergy / count : 0;
}

const ORIENTATIONS = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
const SCALES: Array<{ size: number; lambda: number; sigma: number }> = [
  { size: 7, lambda: 4, sigma: 2 },
  { size: 13, lambda: 8, sigma: 4 },
];

let cachedKernels: Float64Array[] | null = null;

function getKernels(): Float64Array[] {
  if (cachedKernels) return cachedKernels;
  cachedKernels = [];
  for (const scale of SCALES) {
    for (const theta of ORIENTATIONS) {
      cachedKernels.push(createGaborKernel(scale.size, theta, scale.lambda, scale.sigma));
    }
  }
  return cachedKernels;
}

function analyzeTexture(imageData: ImageDataLike): number[] {
  const gray = toGrayscale(imageData);
  const { data, width, height } = downsampleGray(gray, imageData.width, imageData.height, 128);
  const kernels = getKernels();
  const energies: number[] = new Array(8);
  let kernelIdx = 0;
  for (const scale of SCALES) {
    for (let o = 0; o < ORIENTATIONS.length; o++) {
      energies[kernelIdx] = convolveEnergy(data, width, height, kernels[kernelIdx], scale.size);
      kernelIdx++;
    }
  }
  const maxEnergy = Math.max(...energies, 1e-10);
  for (let i = 0; i < energies.length; i++) energies[i] /= maxEnergy;
  return energies;
}

// ─────────────────────────────────────────────────────────────
// Luminance grid (ported from src/lib/image-analysis/luminance-grid.ts)
// ─────────────────────────────────────────────────────────────

function analyzeLuminanceGrid(imageData: ImageDataLike): number[] {
  const { data, width, height } = imageData;
  const gridSize = 4;
  const grid = new Array(gridSize * gridSize).fill(0);
  const counts = new Array(gridSize * gridSize).fill(0);
  const cellW = width / gridSize;
  const cellH = height / gridSize;
  for (let y = 0; y < height; y++) {
    const row = Math.min(gridSize - 1, Math.floor(y / cellH));
    for (let x = 0; x < width; x++) {
      const col = Math.min(gridSize - 1, Math.floor(x / cellW));
      const idx = (y * width + x) * 4;
      const luminance = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
      const cellIdx = row * gridSize + col;
      grid[cellIdx] += luminance;
      counts[cellIdx]++;
    }
  }
  for (let i = 0; i < grid.length; i++) {
    grid[i] = counts[i] > 0 ? grid[i] / counts[i] / 255 : 0;
  }
  return grid;
}

// ─────────────────────────────────────────────────────────────
// Feature vector (ported from src/lib/image-analysis/feature-vector.ts)
// ─────────────────────────────────────────────────────────────

const WEIGHT_COLOR = 0.4;
const WEIGHT_TEXTURE = 0.25;
const WEIGHT_LUMINANCE = 0.2;
const WEIGHT_GLOBAL = 0.15;

function applyWeights(
  vector: number[],
  segments: { start: number; length: number; weight: number }[]
): number[] {
  const weighted = new Array(vector.length);
  for (const seg of segments) {
    const sqrtW = Math.sqrt(seg.weight);
    for (let i = seg.start; i < seg.start + seg.length; i++) {
      weighted[i] = vector[i] * sqrtW;
    }
  }
  return weighted;
}

interface AnalysisResult {
  colorPalette: LABColor[];
  colorHistogram: number[];
  textureEnergy: number[];
  luminanceGrid: number[];
  brightness: number;
  contrast: number;
  saturation: number;
  featureVector: number[];
}

function extractFeatureVector(imageData: ImageDataLike): AnalysisResult {
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

// ─────────────────────────────────────────────────────────────
// iTunes API + expansion logic
// ─────────────────────────────────────────────────────────────

const COVERS_DIR = path.resolve(__dirname, '../public/covers');

interface ITunesResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
  primaryGenreName: string;
  releaseDate: string;
}

interface AlbumEntry {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  imagePath: string;
  dominantColor: string;
  features: {
    colorPalette: LABColor[];
    colorHistogram: number[];
    textureEnergy: number[];
    luminanceGrid: number[];
    brightness: number;
    contrast: number;
    saturation: number;
    featureVector: number[];
  };
}

const ARTIST_QUERIES: string[] = [
  'Coldplay', 'The Strokes', 'Interpol', 'Yeah Yeah Yeahs', 'LCD Soundsystem',
  'Animal Collective', 'Grizzly Bear', 'Fleet Foxes', 'Bon Iver', 'The National',
  'Phoebe Bridgers', 'Mitski', 'Japanese Breakfast', 'Weyes Blood', 'King Krule',
  'Mac DeMarco', 'Rex Orange County', 'Steve Lacy', 'Daniel Caesar', 'Brent Faiyaz',
  'Summer Walker', 'Jhene Aiko', 'Miguel', 'The Internet', 'Sade',
  'Erykah Badu', "D'Angelo", 'Lauryn Hill', 'Fugees', 'Mobb Deep',
  'Notorious B.I.G.', '2Pac', 'Ice Cube', 'Snoop Dogg', 'Dr. Dre',
  '50 Cent', 'Lil Wayne', 'Future', 'Young Thug', 'Playboi Carti',
  'Baby Keem', 'Don Toliver', 'Metro Boomin', '21 Savage', 'Gunna',
  'Lil Uzi Vert', 'Juice WRLD', 'Post Malone', 'Bad Bunny', 'J Balvin',
  'Rosalia', 'Daddy Yankee', 'BTS', 'BLACKPINK', 'NewJeans',
  'Stray Kids', 'Red Hot Chili Peppers', 'Foo Fighters', 'Green Day', 'Blink-182',
  'Weezer', 'Oasis', 'Blur', 'Muse', 'Radiohead',
  'Sigur Ros', 'Explosions in the Sky', 'Mogwai', 'Godspeed You Black Emperor', 'Swans',
  'Nine Inch Nails', 'Tool', 'System of a Down', 'Deftones', 'Rage Against the Machine',
  'Metallica', 'Iron Maiden', 'Black Sabbath', 'AC/DC', 'Queen',
  'Elton John', 'Billy Joel', 'Bruce Springsteen', 'Tom Petty', 'Bob Dylan',
  'Joni Mitchell', 'Neil Young', 'The Smiths', 'Morrissey', 'The Stone Roses',
  'New Order', 'Pet Shop Boys', 'Kate Bush', 'Siouxsie', 'Bauhaus',
  'Echo and the Bunnymen', 'Cocteau Twins',
];

const GENRE_QUERIES: string[] = [
  'synthwave', 'vaporwave', 'shoegaze', 'dream pop', 'post rock',
  'trip hop', 'drum and bass', 'house music', 'techno music', 'deep house',
  'lo-fi hip hop', 'neo soul', 'gospel', 'country music', 'bluegrass',
  'folk rock', 'world music', 'afrobeats', 'dancehall', 'bossa nova',
  'city pop japanese', 'french house', 'krautrock',
];

const ALL_QUERIES = [...ARTIST_QUERIES, ...GENRE_QUERIES];

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchITunesAlbums(query: string, limit: number = 25): Promise<ITunesResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`  iTunes API error for "${query}": ${response.status}`);
    return [];
  }
  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) return [];
  return data.results.filter(
    (r: any) => r.collectionId && r.artworkUrl100 && r.collectionName
  ) as ITunesResult[];
}

function getHighResUrl(artworkUrl100: string): string {
  return artworkUrl100.replace(/100x100bb/, '600x600bb');
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 1000) return false; // Too small, probably an error
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function analyzeImage(imagePath: string): Promise<AnalysisResult | null> {
  try {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    return extractFeatureVector(imageData as unknown as ImageDataLike);
  } catch (e: any) {
    console.warn(`  Analysis failed for ${imagePath}: ${e.message}`);
    return null;
  }
}

// Concurrency limiter
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

function roundArray(arr: number[], decimals: number): number[] {
  const factor = Math.pow(10, decimals);
  return arr.map((v) => Math.round(v * factor) / factor);
}

function roundLab(lab: LABColor): LABColor {
  return {
    L: Math.round(lab.L * 100) / 100,
    a: Math.round(lab.a * 100) / 100,
    b: Math.round(lab.b * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('=== CoverBlend Album Catalog Expansion ===\n');

  // Load existing catalog
  const catalogPath = path.join(COVERS_DIR, 'index.json');
  if (!fs.existsSync(catalogPath)) {
    console.error('ERROR: Existing index.json not found at', catalogPath);
    process.exit(1);
  }

  const existingCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const existingAlbums: AlbumEntry[] = existingCatalog.albums || [];
  const existingIds = new Set<string>(existingAlbums.map((a: AlbumEntry) => a.id));
  const existingCollectionIds = new Set<number>(
    existingAlbums.map((a: AlbumEntry) => parseInt(a.id.replace('itunes-', ''), 10))
  );

  console.log(`Existing catalog: ${existingAlbums.length} albums`);
  console.log(`Search queries to run: ${ALL_QUERIES.length}\n`);

  // Step 1: Fetch albums from iTunes, skipping existing ones
  console.log('Step 1: Fetching albums from iTunes...');
  const newAlbums = new Map<number, ITunesResult>();

  for (let i = 0; i < ALL_QUERIES.length; i++) {
    const query = ALL_QUERIES[i];
    process.stdout.write(`  [${i + 1}/${ALL_QUERIES.length}] Searching "${query}"...`);
    try {
      const results = await fetchITunesAlbums(query, 25);
      let newCount = 0;
      for (const album of results) {
        // Skip if already in existing catalog or already found in this run
        if (existingCollectionIds.has(album.collectionId)) continue;
        if (newAlbums.has(album.collectionId)) continue;
        // Skip singles
        if (album.collectionName.includes('- Single')) continue;
        newAlbums.set(album.collectionId, album);
        newCount++;
      }
      console.log(` ${results.length} results, ${newCount} new (total new: ${newAlbums.size})`);
    } catch (e: any) {
      console.log(` ERROR: ${e.message}`);
    }
    // Rate limit: 500ms between API calls
    if (i < ALL_QUERIES.length - 1) {
      await sleep(500);
    }
  }

  console.log(`\nTotal new unique albums found: ${newAlbums.size}\n`);

  if (newAlbums.size === 0) {
    console.log('No new albums found. Exiting.');
    process.exit(0);
  }

  // Step 2: Download album covers
  console.log('Step 2: Downloading album covers...');
  const albumList = Array.from(newAlbums.values());
  let downloaded = 0;
  let downloadFailed = 0;

  const downloadTasks = albumList.map((album) => {
    return async (): Promise<{ album: ITunesResult; success: boolean; filePath: string }> => {
      const fileName = `cover-${album.collectionId}.jpg`;
      const filePath = path.join(COVERS_DIR, fileName);

      // Skip if already downloaded (e.g. from a previous partial run)
      if (fs.existsSync(filePath)) {
        downloaded++;
        return { album, success: true, filePath };
      }

      const url = getHighResUrl(album.artworkUrl100);
      const success = await downloadImage(url, filePath);
      if (success) {
        downloaded++;
        if (downloaded % 25 === 0) {
          console.log(`  Downloaded ${downloaded}/${albumList.length}...`);
        }
      } else {
        downloadFailed++;
      }
      return { album, success, filePath };
    };
  });

  const downloadResults = await runWithConcurrency(downloadTasks, 5);
  console.log(`  Downloads complete: ${downloaded} succeeded, ${downloadFailed} failed\n`);

  // Step 3: Analyze each downloaded image
  console.log('Step 3: Analyzing images and computing feature vectors...');
  const newCatalogAlbums: AlbumEntry[] = [];
  let analyzed = 0;
  let analysisFailed = 0;

  for (const result of downloadResults) {
    if (!result.success) continue;

    const { album, filePath } = result;
    try {
      const analysis = await analyzeImage(filePath);
      if (!analysis) {
        analysisFailed++;
        continue;
      }

      const year = new Date(album.releaseDate).getFullYear();
      const dominantColor = labToHex(analysis.colorPalette[0]);

      newCatalogAlbums.push({
        id: `itunes-${album.collectionId}`,
        title: album.collectionName,
        artist: album.artistName,
        year: isNaN(year) ? 2000 : year,
        genre: album.primaryGenreName || 'Unknown',
        imagePath: `/covers/cover-${album.collectionId}.jpg`,
        dominantColor,
        features: {
          colorPalette: analysis.colorPalette.map(roundLab),
          colorHistogram: roundArray(analysis.colorHistogram, 4),
          textureEnergy: roundArray(analysis.textureEnergy, 4),
          luminanceGrid: roundArray(analysis.luminanceGrid, 4),
          brightness: Math.round(analysis.brightness * 100) / 100,
          contrast: Math.round(analysis.contrast * 100) / 100,
          saturation: Math.round(analysis.saturation * 100) / 100,
          featureVector: roundArray(analysis.featureVector, 6),
        },
      });

      analyzed++;
      if (analyzed % 25 === 0) {
        console.log(`  Analyzed ${analyzed}/${downloaded}...`);
      }
    } catch (e: any) {
      analysisFailed++;
      console.warn(`  Failed to analyze ${album.collectionName}: ${e.message}`);
    }
  }

  console.log(`  Analysis complete: ${analyzed} succeeded, ${analysisFailed} failed\n`);

  // Step 4: Merge into existing catalog
  console.log('Step 4: Merging into existing catalog...');
  const mergedAlbums = [...existingAlbums, ...newCatalogAlbums];

  const mergedCatalog = {
    version: 2,
    generatedAt: new Date().toISOString(),
    albums: mergedAlbums,
  };

  fs.writeFileSync(catalogPath, JSON.stringify(mergedCatalog));
  console.log(`  Wrote ${catalogPath}`);
  console.log(`  Previous: ${existingAlbums.length} albums`);
  console.log(`  Added: ${newCatalogAlbums.length} new albums`);
  console.log(`  Total: ${mergedAlbums.length} albums\n`);

  // Summary
  console.log('=== DONE ===');
  console.log(`New albums added: ${newCatalogAlbums.length}`);
  console.log(`Total albums in catalog: ${mergedAlbums.length}`);
  console.log(`Target was 300+ new: ${newCatalogAlbums.length >= 300 ? 'MET' : 'NOT MET'}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
