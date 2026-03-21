import { LABColor } from '@/types/album';
import { rgbToLab } from '@/lib/image-analysis/color-space';

function downsamplePixels(imageData: ImageData, targetSize: number): Uint8ClampedArray {
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
      if (d < distances[i]) {
        distances[i] = d;
      }
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
    for (let i = 0; i < histogram.length; i++) {
      histogram[i] /= n;
    }
  }

  return histogram;
}

export function extractColors(imageData: ImageData): { palette: LABColor[]; histogram: number[] } {
  const downsampled = downsamplePixels(imageData, 100);
  const labs = pixelsToLab(downsampled);

  const k = 5;
  const { centroids, assignments } = kMeansCluster(labs, k, 20);

  const counts = new Int32Array(k);
  for (let i = 0; i < assignments.length; i++) {
    counts[assignments[i]]++;
  }

  const indexed = centroids.map((centroid, i) => ({ centroid, count: counts[i] }));
  indexed.sort((a, b) => b.count - a.count);

  const palette = indexed.map((item) => item.centroid);
  const histogram = computeHistogram(labs);

  return { palette, histogram };
}
