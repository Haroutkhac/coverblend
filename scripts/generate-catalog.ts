/**
 * CoverBlend Album Catalog Generator
 *
 * Generates:
 *   - public/covers/index.json  (150 album entries with realistic feature vectors)
 *   - public/covers/cover-NNN.svg  (abstract SVG album covers)
 *
 * Run with: npx tsx scripts/generate-catalog.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Seeded PRNG (xoshiro128** for reproducibility)
// ---------------------------------------------------------------------------

class SeededRandom {
  private s: Uint32Array;

  constructor(seed: number) {
    this.s = new Uint32Array(4);
    this.s[0] = seed >>> 0;
    this.s[1] = (seed * 1664525 + 1013904223) >>> 0;
    this.s[2] = (this.s[1] * 1664525 + 1013904223) >>> 0;
    this.s[3] = (this.s[2] * 1664525 + 1013904223) >>> 0;
    // Warm up
    for (let i = 0; i < 20; i++) this.next();
  }

  next(): number {
    const s = this.s;
    const result = (((s[1] * 5) << 7) | ((s[1] * 5) >>> 25)) * 9;
    const t = s[1] << 9;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = ((s[3] << 11) | (s[3] >>> 21));
    return (result >>> 0) / 4294967296;
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  gaussian(mean: number, std: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }
}

const rng = new SeededRandom(42);

// ---------------------------------------------------------------------------
// Color-space conversions (mirrors src/lib/image-analysis/color-space.ts)
// ---------------------------------------------------------------------------

const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
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
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
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

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const [x, y, z] = labToXyz(L, a, b);
  return xyzToRgb(x, y, z);
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

function labToHex(L: number, a: number, b: number): string {
  const [r, g, bb] = labToRgb(L, a, b);
  return rgbToHex(r, g, bb);
}

// ---------------------------------------------------------------------------
// Metadata pools
// ---------------------------------------------------------------------------

interface LABColor { L: number; a: number; b: number; }

// Pre-build the genre list with exact counts to match the target distribution
const GENRE_LIST: string[] = [];
function buildGenreList(count: number) {
  const dist: [string, number][] = [
    ['Rock', 0.25],
    ['Electronic', 0.20],
    ['Hip-Hop', 0.15],
    ['Pop', 0.15],
    ['Jazz', 0.10],
    ['Classical', 0.05],
    ['R&B', 0.05],
    ['Ambient', 0.025],
    ['Folk', 0.025],
  ];
  let remaining = count;
  for (const [genre, prob] of dist) {
    const n = Math.round(prob * count);
    for (let i = 0; i < n; i++) GENRE_LIST.push(genre);
    remaining -= n;
  }
  // Fill any remainder with Rock
  for (let i = 0; i < remaining; i++) GENRE_LIST.push('Rock');
}

let genreIdx = 0;
function pickGenre(): string {
  return GENRE_LIST[genreIdx++];
}

const ARTIST_FIRST = [
  'Luna', 'Nova', 'Echo', 'Drift', 'Pulse', 'Ghost', 'Neon', 'Solar', 'Haze',
  'Storm', 'Velvet', 'Iron', 'Crystal', 'Shadow', 'Ember', 'Frost', 'Cobalt',
  'Marble', 'Silver', 'Obsidian', 'Jade', 'Coral', 'Azure', 'Violet', 'Onyx',
  'Ivory', 'Sage', 'Atlas', 'River', 'Phoenix', 'Eden', 'Lyric', 'Blaze',
  'Moss', 'Flint', 'Dusk', 'Ray', 'Sable', 'Thorn', 'Briar',
];

const ARTIST_LAST = [
  'Circuit', 'Waves', 'Fields', 'Theory', 'Engine', 'Archive', 'Orbit',
  'Signal', 'Prism', 'Canvas', 'Machine', 'Collective', 'Project', 'System',
  'Sound', 'Assembly', 'Protocol', 'Network', 'Pattern', 'Current', 'Voltage',
  'Rhythm', 'Frequency', 'Harmonic', 'Spectrum', 'Lattice', 'Meridian',
  'Cascade', 'Tangent', 'Vector', 'Zenith', 'Cipher', 'Epoch', 'Fractal',
];

const BAND_NAMES = [
  'The Glass Animals', 'Midnight Reverie', 'Broken Symmetry', 'Parallel Lines',
  'The Observable Universe', 'Distant Signals', 'Temporal Drift', 'The Soft Machine',
  'Liquid Architecture', 'The Color Spectrum', 'Negative Space', 'Phase Transition',
  'The Silent Orchestra', 'Electric Meridian', 'Harmonic Series', 'The Last Analog',
  'Binary Sunset', 'The Quiet Storm', 'Deep Current', 'Phosphene',
  'The Waveform', 'Static Bloom', 'The Parallax View', 'Afterimage',
  'The Liminal Space', 'Blue Vertex', 'Dark Fiber', 'The Pattern Library',
  'Ambient Pressure', 'The Void Protocol', 'Northern Exposure', 'Slow Pulse',
  'The Event Horizon', 'Low Frequency', 'The Blank Canvas',
];

const SOLO_ARTISTS = [
  'Aria Chen', 'Kai Morrison', 'Zara Webb', 'Leo Tanaka', 'Mira Johansson',
  'Devon Park', 'Suki Aronov', 'Jules Garcia', 'Thea Blackwood', 'Omar Voss',
  'Lena Schultz', 'Remy Dubois', 'Isa Nakamura', 'Felix Strand', 'Nina Petrova',
  'Cass Rivera', 'Eli Morrow', 'Yuki Sato', 'Rosa Almeda', 'Sam Okafor',
  'Dani Frost', 'Milo Vega', 'Iris Moon', 'Jude Hale', 'Neve Walsh',
];

function pickArtist(): string {
  const r = rng.next();
  if (r < 0.35) return rng.pick(BAND_NAMES);
  if (r < 0.65) return rng.pick(SOLO_ARTISTS);
  return rng.pick(ARTIST_FIRST) + ' ' + rng.pick(ARTIST_LAST);
}

const TITLE_PATTERNS = [
  // Single word
  () => rng.pick(['Resonance', 'Dissolve', 'Meridian', 'Afterglow', 'Velocity',
    'Threshold', 'Bloom', 'Refraction', 'Descent', 'Convergence', 'Parallax',
    'Nocturne', 'Synthesis', 'Periphery', 'Chromatic', 'Undertow', 'Phosphor',
    'Iridescent', 'Subliminal', 'Wavelength', 'Amplitude', 'Reverb', 'Entropy',
    'Catalyst', 'Eclipse', 'Horizon', 'Mirage', 'Solstice', 'Zenith', 'Equilibrium']),
  // Two words
  () => rng.pick(['Silent', 'Dark', 'Electric', 'Broken', 'Last', 'Deep', 'Slow',
    'Glass', 'Neon', 'Phantom', 'Golden', 'Hollow', 'Inner', 'Liquid', 'Frozen',
    'Distant', 'Sacred', 'Hidden', 'Pale', 'Burning']) +
    ' ' +
    rng.pick(['Light', 'Waves', 'City', 'Dreams', 'Hours', 'Mirror', 'Water',
      'Signal', 'Garden', 'Frequency', 'Highway', 'Season', 'Machine', 'Canyon',
      'Atlas', 'Compass', 'Theory', 'Language', 'Memory', 'Landscape']),
  // "The X of Y"
  () => 'The ' + rng.pick(['Art', 'Science', 'Sound', 'Edge', 'Weight', 'Shape',
    'Color', 'Architecture', 'Mathematics', 'Geography', 'Geometry', 'Physics']) +
    ' of ' + rng.pick(['Light', 'Silence', 'Everything', 'Nothing', 'Distance',
      'Time', 'Space', 'Movement', 'Stillness', 'Color', 'Sound']),
  // Roman numeral
  () => rng.pick(['Volume', 'Phase', 'Chapter', 'Part', 'Section', 'Movement']) +
    ' ' + rng.pick(['I', 'II', 'III', 'IV', 'V']),
  // Number-based
  () => rng.pick(['3 AM', '4:33', '808s & Heartbreaks', '2049', 'Zero Hour',
    'Day One', 'Year Zero', 'Track 7', 'Side B', 'Tape Three']),
];

function pickTitle(): string {
  return rng.pick(TITLE_PATTERNS)();
}

// ---------------------------------------------------------------------------
// Palette generation — multiple color-scheme strategies
// ---------------------------------------------------------------------------

type PaletteStrategy = 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'dark' | 'bright' | 'warm' | 'cool';

function hueToAB(hue: number, chroma: number): { a: number; b: number } {
  const rad = (hue * Math.PI) / 180;
  return { a: chroma * Math.cos(rad), b: chroma * Math.sin(rad) };
}

function generatePalette(strategy: PaletteStrategy): LABColor[] {
  const palette: LABColor[] = [];

  switch (strategy) {
    case 'monochromatic': {
      const baseL = rng.float(20, 80);
      const baseHue = rng.float(0, 360);
      const baseChroma = rng.float(15, 65);
      for (let i = 0; i < 5; i++) {
        const L = clamp(baseL + rng.gaussian(0, 20), 5, 95);
        const c = clamp(baseChroma + rng.gaussian(0, 10), 5, 80);
        const { a, b } = hueToAB(baseHue + rng.gaussian(0, 10), c);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'analogous': {
      const baseHue = rng.float(0, 360);
      const baseL = rng.float(30, 70);
      for (let i = 0; i < 5; i++) {
        const hue = baseHue + rng.float(-40, 40);
        const chroma = rng.float(20, 65);
        const L = clamp(baseL + rng.gaussian(0, 18), 10, 90);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'complementary': {
      const hue1 = rng.float(0, 360);
      const hue2 = hue1 + 180 + rng.float(-20, 20);
      for (let i = 0; i < 5; i++) {
        const hue = i < 3 ? hue1 + rng.gaussian(0, 15) : hue2 + rng.gaussian(0, 15);
        const chroma = rng.float(25, 70);
        const L = rng.float(15, 90);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'triadic': {
      const baseHue = rng.float(0, 360);
      const hues = [baseHue, baseHue + 120, baseHue + 240];
      for (let i = 0; i < 5; i++) {
        const hue = hues[i % 3] + rng.gaussian(0, 12);
        const chroma = rng.float(25, 55);
        const L = rng.float(25, 75);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'dark': {
      const baseHue = rng.float(0, 360);
      for (let i = 0; i < 5; i++) {
        // Mostly dark but one lighter accent for contrast
        const L = i < 4 ? rng.float(5, 35) : rng.float(45, 70);
        const hue = baseHue + rng.float(-60, 60);
        const chroma = rng.float(5, 45);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'bright': {
      const baseHue = rng.float(0, 360);
      for (let i = 0; i < 5; i++) {
        // Mix of high-L and mid-L to ensure decent contrast
        const L = i < 3 ? rng.float(65, 95) : rng.float(35, 60);
        const hue = baseHue + rng.float(-50, 50);
        const chroma = rng.float(30, 75);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'warm': {
      for (let i = 0; i < 5; i++) {
        const L = rng.float(20, 80);
        const hue = rng.float(-30, 80); // reds, oranges, yellows
        const chroma = rng.float(20, 65);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
    case 'cool': {
      for (let i = 0; i < 5; i++) {
        const L = rng.float(20, 80);
        const hue = rng.float(180, 300); // blues, cyans, purples
        const chroma = rng.float(20, 60);
        const { a, b } = hueToAB(hue, chroma);
        palette.push({ L: round2(L), a: round2(a), b: round2(b) });
      }
      break;
    }
  }

  return palette;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Histogram generation — 48 values (16 bins per L, a, b channel)
// ---------------------------------------------------------------------------

function generateHistogramFromPalette(palette: LABColor[]): number[] {
  // Build histogram that's consistent with the palette
  const bins = 16;
  const histogram = new Float64Array(bins * 3); // L, a, b channels

  // For each palette color, add gaussian blobs to appropriate bins
  for (const color of palette) {
    const lBin = clamp(Math.floor((color.L / 100) * bins), 0, bins - 1);
    const aBin = clamp(Math.floor(((color.a + 128) / 256) * bins), 0, bins - 1);
    const bBin = clamp(Math.floor(((color.b + 128) / 256) * bins), 0, bins - 1);

    const weight = rng.float(0.5, 2.0);
    const spread = rng.float(1.0, 3.0);

    for (let i = 0; i < bins; i++) {
      const dL = Math.abs(i - lBin);
      const dA = Math.abs(i - aBin);
      const dB = Math.abs(i - bBin);

      histogram[i] += weight * Math.exp(-(dL * dL) / (2 * spread * spread));
      histogram[bins + i] += weight * Math.exp(-(dA * dA) / (2 * spread * spread));
      histogram[2 * bins + i] += weight * Math.exp(-(dB * dB) / (2 * spread * spread));
    }
  }

  // Add some noise
  for (let i = 0; i < histogram.length; i++) {
    histogram[i] += rng.float(0, 0.1);
  }

  // Normalize each channel to sum to 1
  for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (let i = 0; i < bins; i++) sum += histogram[c * bins + i];
    if (sum > 0) {
      for (let i = 0; i < bins; i++) histogram[c * bins + i] /= sum;
    }
  }

  return Array.from(histogram).map((v) => round4(v));
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Texture energy — 8 values
// ---------------------------------------------------------------------------

function generateTextureEnergy(): number[] {
  // Different texture profiles
  const profiles = [
    // Smooth (low texture)
    () => Array.from({ length: 8 }, () => rng.float(0.02, 0.15)),
    // Textured (high frequency content)
    () => Array.from({ length: 8 }, () => rng.float(0.3, 0.85)),
    // Mixed (some directions high, some low)
    () => {
      const base = rng.float(0.05, 0.3);
      const spike1 = rng.int(0, 7);
      const spike2 = (spike1 + rng.int(2, 5)) % 8;
      return Array.from({ length: 8 }, (_, i) => {
        if (i === spike1 || i === spike2) return rng.float(0.5, 0.9);
        return base + rng.float(0, 0.15);
      });
    },
    // Gradual falloff
    () => {
      const peak = rng.int(0, 7);
      return Array.from({ length: 8 }, (_, i) => {
        const dist = Math.min(Math.abs(i - peak), 8 - Math.abs(i - peak));
        return clamp(rng.float(0.6, 0.9) * Math.exp(-0.5 * dist) + rng.float(0, 0.05), 0, 1);
      });
    },
  ];

  const profile = rng.pick(profiles);
  return profile().map((v) => round4(clamp(v, 0, 1)));
}

// ---------------------------------------------------------------------------
// Luminance grid — 16 values (4x4) with spatial coherence
// ---------------------------------------------------------------------------

function generateLuminanceGrid(palette: LABColor[]): number[] {
  const grid = new Array(16);
  const avgL = palette.reduce((s, c) => s + c.L, 0) / palette.length;

  // Strategy: pick a pattern and overlay noise
  const patterns = [
    // Gradient left to right
    () => {
      const left = rng.float(20, 80);
      const right = rng.float(20, 80);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          grid[row * 4 + col] = left + (right - left) * (col / 3) + rng.gaussian(0, 5);
        }
      }
    },
    // Gradient top to bottom
    () => {
      const top = rng.float(20, 80);
      const bottom = rng.float(20, 80);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          grid[row * 4 + col] = top + (bottom - top) * (row / 3) + rng.gaussian(0, 5);
        }
      }
    },
    // Center bright
    () => {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const dx = col - 1.5;
          const dy = row - 1.5;
          const dist = Math.sqrt(dx * dx + dy * dy);
          grid[row * 4 + col] = avgL + (30 - dist * 15) + rng.gaussian(0, 5);
        }
      }
    },
    // Uniform with noise
    () => {
      for (let i = 0; i < 16; i++) {
        grid[i] = avgL + rng.gaussian(0, 10);
      }
    },
    // Diagonal
    () => {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          grid[row * 4 + col] = rng.float(15, 40) + (row + col) * rng.float(5, 10) + rng.gaussian(0, 3);
        }
      }
    },
    // Corner bright
    () => {
      const corner = rng.int(0, 3);
      const cx = (corner % 2) * 3;
      const cy = Math.floor(corner / 2) * 3;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
          grid[row * 4 + col] = avgL + 20 - dist * 8 + rng.gaussian(0, 4);
        }
      }
    },
  ];

  rng.pick(patterns)();

  // Normalize to 0-1 range
  let min = Infinity, max = -Infinity;
  for (const v of grid) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  return grid.map((v: number) => round4(clamp((v - min) / range, 0, 1)));
}

// ---------------------------------------------------------------------------
// Feature vector computation (mirrors feature-vector.ts)
// ---------------------------------------------------------------------------

const WEIGHT_COLOR = 0.4;
const WEIGHT_TEXTURE = 0.25;
const WEIGHT_LUMINANCE = 0.2;
const WEIGHT_GLOBAL = 0.15;

function computeFeatureVector(
  palette: LABColor[],
  histogram: number[],
  textureEnergy: number[],
  luminanceGrid: number[],
  brightness: number,
  contrast: number,
  saturation: number
): number[] {
  // Flatten palette: L/100, (a+128)/256, (b+128)/256
  const paletteFlat: number[] = [];
  for (const color of palette) {
    paletteFlat.push(color.L / 100, (color.a + 128) / 256, (color.b + 128) / 256);
  }

  const raw = [
    ...histogram,       // 48 values
    ...textureEnergy,   // 8 values
    ...luminanceGrid,   // 16 values
    brightness / 100,   // 1 value
    contrast / 50,      // 1 value
    saturation / 100,   // 1 value
    ...paletteFlat,     // 15 values
  ];
  // total: 48 + 8 + 16 + 3 + 15 = 90

  const segments = [
    { start: 0, length: 48, weight: WEIGHT_COLOR },
    { start: 48, length: 8, weight: WEIGHT_TEXTURE },
    { start: 56, length: 16, weight: WEIGHT_LUMINANCE },
    { start: 72, length: 3, weight: WEIGHT_GLOBAL },
    { start: 75, length: 15, weight: WEIGHT_COLOR },
  ];

  const weighted = new Array(raw.length);
  for (const seg of segments) {
    const sqrtW = Math.sqrt(seg.weight);
    for (let i = seg.start; i < seg.start + seg.length; i++) {
      weighted[i] = raw[i] * sqrtW;
    }
  }

  // L2 normalize
  let mag = 0;
  for (const v of weighted) mag += v * v;
  mag = Math.sqrt(mag);
  if (mag === 0) return weighted.map(() => 0);
  return weighted.map((v: number) => round4(v / mag));
}

// ---------------------------------------------------------------------------
// SVG generation
// ---------------------------------------------------------------------------

type SVGStyle = 'gradient-circles' | 'grid-blocks' | 'stripes' | 'radial-burst' |
  'triangles' | 'concentric' | 'wave-layers' | 'diagonal-split' | 'scattered-dots' |
  'mosaic' | 'minimal-bar' | 'diamond-pattern' | 'flowing-curves' | 'noise-field' |
  'cross-hatch';

const SVG_STYLES: SVGStyle[] = [
  'gradient-circles', 'grid-blocks', 'stripes', 'radial-burst', 'triangles',
  'concentric', 'wave-layers', 'diagonal-split', 'scattered-dots', 'mosaic',
  'minimal-bar', 'diamond-pattern', 'flowing-curves', 'noise-field', 'cross-hatch',
];

function paletteToHexColors(palette: LABColor[]): string[] {
  return palette.map((c) => labToHex(c.L, c.a, c.b));
}

function generateSVG(palette: LABColor[], style: SVGStyle, idx: number): string {
  const colors = paletteToHexColors(palette);
  const c = colors;
  const w = 400, h = 400;

  let inner = '';

  switch (style) {
    case 'gradient-circles': {
      inner = `
  <defs>
    <linearGradient id="bg${idx}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c[0]}"/>
      <stop offset="100%" stop-color="${c[1]}"/>
    </linearGradient>
    <radialGradient id="rg${idx}">
      <stop offset="0%" stop-color="${c[2]}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${c[2]}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg${idx})"/>
  <circle cx="${rng.int(80, 320)}" cy="${rng.int(80, 320)}" r="${rng.int(60, 150)}" fill="url(#rg${idx})"/>
  <circle cx="${rng.int(50, 350)}" cy="${rng.int(50, 350)}" r="${rng.int(30, 100)}" fill="${c[3]}" opacity="0.5"/>
  <circle cx="${rng.int(100, 300)}" cy="${rng.int(100, 300)}" r="${rng.int(20, 80)}" fill="${c[4]}" opacity="0.6"/>
  <circle cx="${rng.int(150, 250)}" cy="${rng.int(150, 250)}" r="${rng.int(10, 50)}" fill="${c[0]}" opacity="0.4"/>`;
      break;
    }

    case 'grid-blocks': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const blockSize = rng.pick([50, 80, 100]);
      const cols = Math.ceil(w / blockSize);
      const rows = Math.ceil(h / blockSize);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (rng.next() < 0.6) {
            const fill = rng.pick(c);
            const opacity = round2(rng.float(0.3, 0.9));
            inner += `\n  <rect x="${col * blockSize}" y="${row * blockSize}" width="${blockSize}" height="${blockSize}" fill="${fill}" opacity="${opacity}"/>`;
          }
        }
      }
      break;
    }

    case 'stripes': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const stripeCount = rng.int(5, 15);
      const stripeW = w / stripeCount;
      const angle = rng.pick([0, 45, 90, -45]);
      inner += `\n  <g transform="rotate(${angle} ${w / 2} ${h / 2})">`;
      for (let i = 0; i < stripeCount + 4; i++) {
        const fill = c[i % c.length];
        const opacity = round2(rng.float(0.4, 1.0));
        inner += `\n    <rect x="${i * stripeW - stripeW * 2}" y="-50" width="${stripeW}" height="${h + 100}" fill="${fill}" opacity="${opacity}"/>`;
      }
      inner += '\n  </g>';
      break;
    }

    case 'radial-burst': {
      inner = `
  <defs>
    <radialGradient id="rb${idx}">
      <stop offset="0%" stop-color="${c[0]}"/>
      <stop offset="100%" stop-color="${c[1]}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#rb${idx})"/>`;
      const numRays = rng.int(8, 24);
      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * 360;
        const len = rng.float(100, 200);
        const rad = (angle * Math.PI) / 180;
        const x2 = 200 + Math.cos(rad) * len;
        const y2 = 200 + Math.sin(rad) * len;
        inner += `\n  <line x1="200" y1="200" x2="${round2(x2)}" y2="${round2(y2)}" stroke="${rng.pick(c)}" stroke-width="${rng.int(2, 8)}" opacity="${round2(rng.float(0.3, 0.8))}"/>`;
      }
      inner += `\n  <circle cx="200" cy="200" r="${rng.int(15, 50)}" fill="${c[2]}"/>`;
      break;
    }

    case 'triangles': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      for (let i = 0; i < rng.int(6, 15); i++) {
        const x1 = rng.int(0, w), y1 = rng.int(0, h);
        const size = rng.int(40, 200);
        const x2 = x1 + rng.int(-size, size), y2 = y1 + rng.int(-size, size);
        const x3 = x1 + rng.int(-size, size), y3 = y1 + rng.int(-size, size);
        inner += `\n  <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${rng.pick(c)}" opacity="${round2(rng.float(0.2, 0.8))}"/>`;
      }
      break;
    }

    case 'concentric': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const numRings = rng.int(4, 10);
      const maxR = 220;
      for (let i = numRings; i >= 0; i--) {
        const r = (i / numRings) * maxR;
        inner += `\n  <circle cx="200" cy="200" r="${round2(r)}" fill="${c[i % c.length]}" opacity="${round2(rng.float(0.5, 1.0))}"/>`;
      }
      break;
    }

    case 'wave-layers': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      for (let layer = 0; layer < 4; layer++) {
        const yBase = 80 + layer * 80;
        const amp = rng.float(15, 50);
        const freq = rng.float(0.005, 0.02);
        const phase = rng.float(0, Math.PI * 2);
        let d = `M 0 ${h}`;
        for (let x = 0; x <= w; x += 10) {
          const y = yBase + Math.sin(x * freq + phase) * amp;
          d += ` L ${x} ${round2(y)}`;
        }
        d += ` L ${w} ${h} Z`;
        inner += `\n  <path d="${d}" fill="${c[layer + 1]}" opacity="${round2(rng.float(0.5, 0.9))}"/>`;
      }
      break;
    }

    case 'diagonal-split': {
      const splitType = rng.next() > 0.5;
      if (splitType) {
        inner = `
  <polygon points="0,0 ${w},0 0,${h}" fill="${c[0]}"/>
  <polygon points="${w},0 ${w},${h} 0,${h}" fill="${c[1]}"/>`;
      } else {
        inner = `
  <polygon points="0,0 ${w},0 ${w},${h}" fill="${c[0]}"/>
  <polygon points="0,0 ${w},${h} 0,${h}" fill="${c[1]}"/>`;
      }
      inner += `\n  <circle cx="${rng.int(100, 300)}" cy="${rng.int(100, 300)}" r="${rng.int(30, 100)}" fill="${c[2]}" opacity="0.7"/>`;
      inner += `\n  <rect x="${rng.int(50, 250)}" y="${rng.int(50, 250)}" width="${rng.int(40, 120)}" height="${rng.int(40, 120)}" fill="${c[3]}" opacity="0.5" transform="rotate(${rng.int(0, 45)} 200 200)"/>`;
      inner += `\n  <circle cx="${rng.int(80, 320)}" cy="${rng.int(80, 320)}" r="${rng.int(10, 40)}" fill="${c[4]}" opacity="0.8"/>`;
      break;
    }

    case 'scattered-dots': {
      inner = `
  <defs>
    <linearGradient id="sd${idx}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c[0]}"/>
      <stop offset="100%" stop-color="${c[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sd${idx})"/>`;
      for (let i = 0; i < rng.int(20, 60); i++) {
        const cx = rng.int(0, w);
        const cy = rng.int(0, h);
        const r = rng.float(3, 25);
        inner += `\n  <circle cx="${cx}" cy="${cy}" r="${round2(r)}" fill="${rng.pick(c)}" opacity="${round2(rng.float(0.2, 0.9))}"/>`;
      }
      break;
    }

    case 'mosaic': {
      inner = '';
      const tileSize = rng.pick([40, 50, 80]);
      const cols = Math.ceil(w / tileSize);
      const rows = Math.ceil(h / tileSize);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const fill = c[(row + col + rng.int(0, 2)) % c.length];
          inner += `\n  <rect x="${col * tileSize}" y="${row * tileSize}" width="${tileSize}" height="${tileSize}" fill="${fill}" stroke="${c[0]}" stroke-width="1"/>`;
        }
      }
      break;
    }

    case 'minimal-bar': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const barH = rng.int(60, 150);
      const barY = rng.int(100, 250);
      inner += `\n  <rect x="0" y="${barY}" width="${w}" height="${barH}" fill="${c[1]}"/>`;
      inner += `\n  <line x1="${rng.int(40, 160)}" y1="${barY}" x2="${rng.int(240, 360)}" y2="${barY}" stroke="${c[2]}" stroke-width="${rng.int(2, 6)}"/>`;
      inner += `\n  <circle cx="${rng.int(150, 250)}" cy="${rng.int(50, barY - 20)}" r="${rng.int(15, 50)}" fill="${c[3]}" opacity="0.6"/>`;
      inner += `\n  <rect x="${rng.int(50, 150)}" y="${barY + barH + 10}" width="${rng.int(100, 200)}" height="${rng.int(3, 12)}" fill="${c[4]}" opacity="0.7"/>`;
      break;
    }

    case 'diamond-pattern': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const size = rng.int(30, 80);
      for (let row = -1; row < h / size + 1; row++) {
        for (let col = -1; col < w / size + 1; col++) {
          const cx = col * size + (row % 2) * (size / 2);
          const cy = row * size;
          if (rng.next() < 0.7) {
            const half = size / 2;
            inner += `\n  <polygon points="${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}" fill="${rng.pick(c)}" opacity="${round2(rng.float(0.4, 0.9))}"/>`;
          }
        }
      }
      break;
    }

    case 'flowing-curves': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      for (let i = 0; i < 5; i++) {
        const x1 = rng.int(-50, 100);
        const y1 = rng.int(0, h);
        const cx1 = rng.int(50, 200);
        const cy1 = rng.int(0, h);
        const cx2 = rng.int(200, 350);
        const cy2 = rng.int(0, h);
        const x2 = rng.int(300, 450);
        const y2 = rng.int(0, h);
        inner += `\n  <path d="M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}" fill="none" stroke="${c[i % c.length]}" stroke-width="${rng.int(3, 20)}" opacity="${round2(rng.float(0.3, 0.8))}" stroke-linecap="round"/>`;
      }
      break;
    }

    case 'noise-field': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const cellSize = 20;
      for (let y = 0; y < h; y += cellSize) {
        for (let x = 0; x < w; x += cellSize) {
          if (rng.next() < 0.4) {
            inner += `\n  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${rng.pick(c)}" opacity="${round2(rng.float(0.1, 0.6))}"/>`;
          }
        }
      }
      break;
    }

    case 'cross-hatch': {
      inner = `<rect width="${w}" height="${h}" fill="${c[0]}"/>`;
      const spacing = rng.int(15, 40);
      const strokeW = rng.int(1, 4);
      // Horizontal lines
      for (let y = 0; y < h; y += spacing) {
        inner += `\n  <line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${c[1]}" stroke-width="${strokeW}" opacity="${round2(rng.float(0.2, 0.6))}"/>`;
      }
      // Vertical lines
      for (let x = 0; x < w; x += spacing) {
        inner += `\n  <line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${c[2]}" stroke-width="${strokeW}" opacity="${round2(rng.float(0.2, 0.6))}"/>`;
      }
      // Accent shapes
      inner += `\n  <circle cx="${rng.int(100, 300)}" cy="${rng.int(100, 300)}" r="${rng.int(30, 80)}" fill="${c[3]}" opacity="0.5"/>`;
      inner += `\n  <rect x="${rng.int(50, 200)}" y="${rng.int(50, 200)}" width="${rng.int(60, 150)}" height="${rng.int(60, 150)}" fill="${c[4]}" opacity="0.4"/>`;
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}
</svg>`;
}

// ---------------------------------------------------------------------------
// Album entry builder
// ---------------------------------------------------------------------------

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

function buildAlbum(index: number): { entry: AlbumEntry; svg: string } {
  const id = `cover-${String(index + 1).padStart(3, '0')}`;
  const title = pickTitle();
  const artist = pickArtist();
  const year = rng.int(1965, 2024);
  const genre = pickGenre();

  // Pick palette strategy
  const strategies: PaletteStrategy[] = [
    'monochromatic', 'analogous', 'complementary', 'triadic',
    'dark', 'bright', 'warm', 'cool',
  ];
  const strategy = rng.pick(strategies);
  const palette = generatePalette(strategy);

  const histogram = generateHistogramFromPalette(palette);
  const textureEnergy = generateTextureEnergy();
  const luminanceGrid = generateLuminanceGrid(palette);

  // Compute brightness, contrast, saturation from palette (matching feature-vector.ts logic)
  const lValues = palette.map((c) => c.L);
  let brightness = round2(lValues.reduce((s, v) => s + v, 0) / lValues.length);
  const meanL = brightness;
  const variance = lValues.reduce((s, v) => s + (v - meanL) ** 2, 0) / lValues.length;
  let contrast = round2(Math.sqrt(variance));
  let saturation = round2(
    palette.reduce((s, c) => s + Math.sqrt(c.a * c.a + c.b * c.b), 0) / palette.length
  );

  // Ensure values fall within specified ranges (20-90, 10-60, 15-80)
  brightness = clamp(brightness, 20, 90);
  contrast = clamp(contrast, 10, 60);
  saturation = clamp(saturation, 15, 80);

  const featureVector = computeFeatureVector(
    palette, histogram, textureEnergy, luminanceGrid, brightness, contrast, saturation
  );

  const dominantColor = labToHex(palette[0].L, palette[0].a, palette[0].b);

  const svgStyle = SVG_STYLES[index % SVG_STYLES.length];
  const svg = generateSVG(palette, svgStyle, index);

  return {
    entry: {
      id,
      title,
      artist,
      year,
      genre,
      imagePath: `/covers/${id}.svg`,
      dominantColor,
      features: {
        colorPalette: palette,
        colorHistogram: histogram,
        textureEnergy,
        luminanceGrid,
        brightness,
        contrast,
        saturation,
        featureVector,
      },
    },
    svg,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const ALBUM_COUNT = 150;
  const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'covers');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Build and shuffle genre list for exact distribution
  buildGenreList(ALBUM_COUNT);
  const shuffledGenres = rng.shuffle(GENRE_LIST.splice(0));
  GENRE_LIST.push(...shuffledGenres);
  genreIdx = 0;

  console.log(`Generating ${ALBUM_COUNT} album covers...`);

  const albums: AlbumEntry[] = [];

  for (let i = 0; i < ALBUM_COUNT; i++) {
    const { entry, svg } = buildAlbum(i);
    albums.push(entry);

    // Write SVG file
    const svgPath = path.join(OUTPUT_DIR, `${entry.id}.svg`);
    fs.writeFileSync(svgPath, svg, 'utf-8');

    if ((i + 1) % 25 === 0) {
      console.log(`  Generated ${i + 1}/${ALBUM_COUNT}`);
    }
  }

  // Write catalog JSON
  const catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    albums,
  };

  const jsonPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log(`\nDone! Wrote:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${ALBUM_COUNT} SVG files in ${OUTPUT_DIR}/`);

  // Print some stats
  const genres: Record<string, number> = {};
  const years = albums.map((a) => a.year);
  for (const a of albums) genres[a.genre] = (genres[a.genre] || 0) + 1;
  console.log(`\nGenre distribution:`);
  for (const [g, n] of Object.entries(genres).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${g}: ${n} (${((n / ALBUM_COUNT) * 100).toFixed(1)}%)`);
  }
  console.log(`Year range: ${Math.min(...years)} - ${Math.max(...years)}`);
  console.log(`Feature vector length: ${albums[0].features.featureVector.length}`);
}

main();
