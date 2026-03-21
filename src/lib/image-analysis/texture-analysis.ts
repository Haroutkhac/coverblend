function toGrayscale(imageData: ImageData): Float64Array {
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

  if (newW === srcW && newH === srcH) {
    return { data: gray, width: srcW, height: srcH };
  }

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

export function analyzeTexture(imageData: ImageData): number[] {
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
  for (let i = 0; i < energies.length; i++) {
    energies[i] /= maxEnergy;
  }

  return energies;
}
