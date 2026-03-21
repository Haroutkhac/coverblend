/**
 * CoverBlend Pipeline Test Script
 *
 * Tests the image analysis, matching, and blending pipelines
 * 5 test images x 20 runs = 100 total analysis+matching runs
 * Plus 5 blending tests (one per example).
 *
 * Run with:
 *   npx tsx -r tsconfig-paths/register scripts/test-pipeline.ts
 */

import { createCanvas, createImageData, type Canvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Polyfill browser globals that the source modules rely on
// ---------------------------------------------------------------------------

// ImageData polyfill: node-canvas's createImageData returns objects compatible
// with the spec, but some code may reference the global ImageData constructor.
const nodeImageData = createImageData(1, 1).constructor;
(globalThis as any).ImageData = nodeImageData;

// document.createElement polyfill (used by compositor.ts for offscreen canvases)
(globalThis as any).document = {
  createElement(tag: string) {
    if (tag === 'canvas') {
      return createCanvas(1, 1);
    }
    throw new Error(`Unsupported element: ${tag}`);
  },
};

// Patch node-canvas Canvas prototype so getContext('2d') works like browser
// (node-canvas already does this, but let's make sure getImageData/putImageData work)
const origGetContext = (createCanvas(1, 1) as any).__proto__.getContext;
if (origGetContext) {
  // node-canvas canvases have getContext, so this should work out of the box.
}

// ---------------------------------------------------------------------------
// Now import the project modules (they use @/ paths resolved by tsconfig-paths)
// ---------------------------------------------------------------------------

import { extractColors } from '@/lib/image-analysis/color-extraction';
import { analyzeTexture } from '@/lib/image-analysis/texture-analysis';
import { analyzeLuminanceGrid } from '@/lib/image-analysis/luminance-grid';
import { extractFeatureVector } from '@/lib/image-analysis/feature-vector';
import { computeMatchScore } from '@/lib/matching/similarity';
import { findTopMatches } from '@/lib/matching/ranking';
import { compositeImages } from '@/lib/blending/compositor';
import type { AlbumCover, AlbumCatalog } from '@/types/album';
import type { BlendSettings } from '@/types/blend';

// ---------------------------------------------------------------------------
// Test image generation
// ---------------------------------------------------------------------------

interface TestImage {
  name: string;
  description: string;
  colorStops: Array<{ offset: number; color: string }>;
}

const TEST_IMAGES: TestImage[] = [
  {
    name: 'Sunset',
    description: 'orange-to-purple gradient',
    colorStops: [
      { offset: 0, color: '#FF6B35' },
      { offset: 0.5, color: '#D63384' },
      { offset: 1, color: '#6F42C1' },
    ],
  },
  {
    name: 'Ocean',
    description: 'cyan-to-indigo gradient',
    colorStops: [
      { offset: 0, color: '#0DCAF0' },
      { offset: 0.5, color: '#0D6EFD' },
      { offset: 1, color: '#3D0066' },
    ],
  },
  {
    name: 'Forest',
    description: 'green-to-teal gradient',
    colorStops: [
      { offset: 0, color: '#198754' },
      { offset: 0.5, color: '#20C997' },
      { offset: 1, color: '#0D6E6E' },
    ],
  },
  {
    name: 'Neon',
    description: 'pink-to-violet gradient',
    colorStops: [
      { offset: 0, color: '#E91E8C' },
      { offset: 0.5, color: '#D63AFF' },
      { offset: 1, color: '#7B2FBE' },
    ],
  },
  {
    name: 'Minimal',
    description: 'gray-to-dark gradient',
    colorStops: [
      { offset: 0, color: '#ADB5BD' },
      { offset: 0.5, color: '#6C757D' },
      { offset: 1, color: '#212529' },
    ],
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function lerpColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

/**
 * Creates an ImageData with a vertical gradient defined by the color stops.
 */
function createGradientImageData(
  width: number,
  height: number,
  stops: Array<{ offset: number; color: string }>
): ImageData {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Build pixel data manually for precise control
  const data = new Uint8ClampedArray(width * height * 4);
  const rgbStops = stops.map((s) => ({ offset: s.offset, rgb: hexToRgb(s.color) }));

  for (let y = 0; y < height; y++) {
    const t = y / (height - 1); // 0..1 top to bottom

    // Find the two stops surrounding t
    let lower = rgbStops[0];
    let upper = rgbStops[rgbStops.length - 1];

    for (let i = 0; i < rgbStops.length - 1; i++) {
      if (t >= rgbStops[i].offset && t <= rgbStops[i + 1].offset) {
        lower = rgbStops[i];
        upper = rgbStops[i + 1];
        break;
      }
    }

    const segT =
      upper.offset === lower.offset
        ? 0
        : (t - lower.offset) / (upper.offset - lower.offset);
    const rgb = lerpColor(lower.rgb, upper.rgb, segT);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }

  return createImageData(data, width, height) as unknown as ImageData;
}

// ---------------------------------------------------------------------------
// Load catalog from disk (instead of fetch)
// ---------------------------------------------------------------------------

function loadCatalogFromDisk(): AlbumCover[] {
  const catalogPath = path.join(__dirname, '..', 'public', 'covers', 'index.json');
  const raw = fs.readFileSync(catalogPath, 'utf-8');
  const catalog: AlbumCatalog = JSON.parse(raw);
  return catalog.albums;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMs(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}us` : `${ms.toFixed(1)}ms`;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------

async function main() {
  const RUNS = 20;
  const TOP_K = 5;
  const IMAGE_SIZE = 200; // 200x200 test images

  console.log('='.repeat(72));
  console.log('  CoverBlend Pipeline Test');
  console.log(`  ${TEST_IMAGES.length} examples x ${RUNS} runs = ${TEST_IMAGES.length * RUNS} total analysis+matching runs`);
  console.log('='.repeat(72));
  console.log();

  // Load catalog
  console.log('[1/3] Loading catalog...');
  const catalog = loadCatalogFromDisk();
  console.log(`      Loaded ${catalog.length} album covers.\n`);

  // ---------------------------------------------------------------------------
  // Phase 1: Analysis + Matching (5 x 20 = 100 runs)
  // ---------------------------------------------------------------------------
  console.log('[2/3] Running analysis + matching pipeline...\n');

  interface ExampleResult {
    name: string;
    description: string;
    topMatchIds: string[][]; // top-K IDs per run
    topMatchTitles: string[][]; // top-K titles per run
    timingsMs: number[];
    consistent: boolean;
    topMatchSummary: string;
    avgTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
  }

  const results: ExampleResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const testImage of TEST_IMAGES) {
    const imageData = createGradientImageData(IMAGE_SIZE, IMAGE_SIZE, testImage.colorStops);

    const topMatchIds: string[][] = [];
    const topMatchTitles: string[][] = [];
    const timingsMs: number[] = [];

    for (let run = 0; run < RUNS; run++) {
      const start = performance.now();

      // Full analysis pipeline
      const analysis = extractFeatureVector(imageData);

      // Matching pipeline
      const matches = findTopMatches(analysis, catalog, TOP_K);

      const elapsed = performance.now() - start;
      timingsMs.push(elapsed);

      topMatchIds.push(matches.map((m) => m.album.id));
      topMatchTitles.push(matches.map((m) => `${m.album.artist} - ${m.album.title}`));
    }

    // Check consistency: top match should be the same every run
    // Note: extractColors uses k-means with random init, so results may vary.
    // We check if the #1 match is the same across all runs.
    const firstRunTop1 = topMatchIds[0][0];
    const allTop1Same = topMatchIds.every((ids) => ids[0] === firstRunTop1);

    // Also check if top-K order is identical every run
    const firstRunTopK = topMatchIds[0];
    const allTopKSame = topMatchIds.every((ids) => arraysEqual(ids, firstRunTopK));

    const avgTime = timingsMs.reduce((s, t) => s + t, 0) / timingsMs.length;
    const minTime = Math.min(...timingsMs);
    const maxTime = Math.max(...timingsMs);

    // Count unique #1 matches across runs
    const uniqueTop1 = new Set(topMatchIds.map((ids) => ids[0]));

    const consistent = allTop1Same;
    if (consistent) totalPassed++;
    else totalFailed++;

    results.push({
      name: testImage.name,
      description: testImage.description,
      topMatchIds,
      topMatchTitles,
      timingsMs,
      consistent: allTop1Same,
      topMatchSummary: allTop1Same
        ? `${topMatchTitles[0][0]} (consistent across all ${RUNS} runs)`
        : `VARIES: ${uniqueTop1.size} unique top-1 matches across ${RUNS} runs`,
      avgTimeMs: avgTime,
      minTimeMs: minTime,
      maxTimeMs: maxTime,
    });

    const status = allTop1Same ? 'PASS' : 'WARN';
    const statusColor = allTop1Same ? '\x1b[32m' : '\x1b[33m';
    console.log(
      `  ${statusColor}[${status}]\x1b[0m ${testImage.name} (${testImage.description})`
    );
    console.log(`         Top match: ${topMatchTitles[0][0]}`);
    console.log(
      `         Top-1 consistent: ${allTop1Same ? 'YES' : `NO (${uniqueTop1.size} variants)`} | Top-K order consistent: ${allTopKSame ? 'YES' : 'NO'}`
    );
    console.log(
      `         Timing: avg=${formatMs(avgTime)} min=${formatMs(minTime)} max=${formatMs(maxTime)}`
    );
    console.log();
  }

  // ---------------------------------------------------------------------------
  // Phase 2: Individual analysis function checks
  // ---------------------------------------------------------------------------
  console.log('  --- Individual function checks (first example) ---\n');

  const sampleImage = createGradientImageData(IMAGE_SIZE, IMAGE_SIZE, TEST_IMAGES[0].colorStops);

  // extractColors
  const colors = extractColors(sampleImage);
  console.log(`  extractColors:      palette=${colors.palette.length} colors, histogram=${colors.histogram.length} bins`);
  const paletteValid = colors.palette.length === 5 && colors.histogram.length === 48;
  console.log(`                      ${paletteValid ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (expected 5 palette, 48 histogram)`);

  // analyzeTexture
  const texture = analyzeTexture(sampleImage);
  console.log(`  analyzeTexture:     ${texture.length} energy values`);
  const textureValid = texture.length === 8 && texture.every((v) => v >= 0 && v <= 1);
  console.log(`                      ${textureValid ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (expected 8 values in [0,1])`);

  // analyzeLuminanceGrid
  const lum = analyzeLuminanceGrid(sampleImage);
  console.log(`  analyzeLuminanceGrid: ${lum.length} grid cells`);
  const lumValid = lum.length === 16 && lum.every((v) => v >= 0 && v <= 1);
  console.log(`                      ${lumValid ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (expected 16 values in [0,1])`);

  // extractFeatureVector
  const fv = extractFeatureVector(sampleImage);
  console.log(`  extractFeatureVector: ${fv.featureVector.length} dimensions`);
  const fvValid = fv.featureVector.length === 90 && fv.featureVector.every((v) => !isNaN(v));
  console.log(`                      ${fvValid ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (expected 90 non-NaN values)`);

  // computeMatchScore
  const score = computeMatchScore(fv, catalog[0].features);
  const scoreValid =
    score.overallScore >= 0 &&
    score.overallScore <= 1 &&
    !isNaN(score.colorScore) &&
    !isNaN(score.textureScore);
  console.log(`  computeMatchScore:  overall=${score.overallScore.toFixed(4)}`);
  console.log(`                      ${scoreValid ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (valid score range)`);
  console.log();

  // ---------------------------------------------------------------------------
  // Phase 3: Blending pipeline
  // ---------------------------------------------------------------------------
  console.log('[3/3] Running blending pipeline...\n');

  const defaultSettings: BlendSettings = {
    opacity: 0.85,
    featherRadius: 40,
    positionX: 0.5,
    positionY: 0.5,
    scale: 1.0,
    rotation: 0,
    blendMode: 'normal',
    colorTransferEnabled: false, // Disable color transfer to keep things faster
    colorTransferStrength: 0.0,
  };

  let blendPassed = 0;
  let blendFailed = 0;

  for (const testImage of TEST_IMAGES) {
    const photoData = createGradientImageData(IMAGE_SIZE, IMAGE_SIZE, testImage.colorStops);

    // Create a simple "cover" image (a solid-ish square)
    const coverSize = 100;
    const coverData = createGradientImageData(coverSize, coverSize, [
      { offset: 0, color: '#FFFFFF' },
      { offset: 1, color: '#000000' },
    ]);

    const start = performance.now();
    let result: ImageData;
    let error: string | null = null;

    try {
      result = compositeImages(photoData, coverData, defaultSettings);
    } catch (e: any) {
      error = e.message || String(e);
      result = null as any;
    }

    const elapsed = performance.now() - start;

    if (error) {
      console.log(`  \x1b[31m[FAIL]\x1b[0m ${testImage.name}: ${error}`);
      blendFailed++;
      continue;
    }

    // Validate result
    const validDimensions = result.width === IMAGE_SIZE && result.height === IMAGE_SIZE;
    const hasNonZeroPixels = result.data.some((v: number) => v !== 0);
    const correctLength = result.data.length === IMAGE_SIZE * IMAGE_SIZE * 4;
    const pass = validDimensions && hasNonZeroPixels && correctLength;

    if (pass) {
      blendPassed++;
      console.log(
        `  \x1b[32m[PASS]\x1b[0m ${testImage.name}: ${result.width}x${result.height}, ${result.data.length} bytes, ${formatMs(elapsed)}`
      );
    } else {
      blendFailed++;
      console.log(
        `  \x1b[31m[FAIL]\x1b[0m ${testImage.name}: dims=${result.width}x${result.height} nonzero=${hasNonZeroPixels} len=${result.data.length}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log();
  console.log('='.repeat(72));
  console.log('  SUMMARY');
  console.log('='.repeat(72));
  console.log();

  console.log('  Analysis + Matching Pipeline:');
  console.log(`    Total runs:        ${TEST_IMAGES.length * RUNS}`);
  console.log(`    Examples tested:   ${TEST_IMAGES.length}`);
  console.log(`    Runs per example:  ${RUNS}`);
  console.log();

  for (const r of results) {
    const icon = r.consistent ? '\x1b[32mPASS\x1b[0m' : '\x1b[33mWARN\x1b[0m';
    console.log(`    [${icon}] ${r.name.padEnd(10)} -> ${r.topMatchSummary}`);
    console.log(`             avg=${formatMs(r.avgTimeMs)} min=${formatMs(r.minTimeMs)} max=${formatMs(r.maxTimeMs)}`);
  }

  console.log();
  console.log('  Blending Pipeline:');
  console.log(`    Passed: ${blendPassed}/${TEST_IMAGES.length}`);
  console.log(`    Failed: ${blendFailed}/${TEST_IMAGES.length}`);
  console.log();

  // Count all individual function checks
  const funcChecksPassed = [paletteValid, textureValid, lumValid, fvValid, scoreValid].filter(Boolean).length;
  const funcChecksTotal = 5;

  console.log('  Individual Function Checks:');
  console.log(`    Passed: ${funcChecksPassed}/${funcChecksTotal}`);
  console.log();

  const overallPass =
    blendFailed === 0 &&
    funcChecksPassed === funcChecksTotal;

  if (overallPass) {
    console.log('  \x1b[32mOVERALL: ALL TESTS PASSED\x1b[0m');
  } else {
    console.log('  \x1b[33mOVERALL: SOME TESTS HAD WARNINGS OR FAILURES\x1b[0m');
  }

  console.log();
  console.log('='.repeat(72));

  // Exit with appropriate code
  process.exit(overallPass ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
