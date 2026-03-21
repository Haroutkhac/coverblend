import { LABColor } from '@/types/album';
import { clamp } from '@/lib/utils/math';

// D65 illuminant reference
const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

export function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
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
  const y = rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750;
  const z = rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041;

  return [x, y, z];
}

export function xyzToLab(x: number, y: number, z: number): LABColor {
  let xx = x / REF_X;
  let yy = y / REF_Y;
  let zz = z / REF_Z;

  xx = xx > 0.008856 ? Math.cbrt(xx) : 7.787 * xx + 16 / 116;
  yy = yy > 0.008856 ? Math.cbrt(yy) : 7.787 * yy + 16 / 116;
  zz = zz > 0.008856 ? Math.cbrt(zz) : 7.787 * zz + 16 / 116;

  return {
    L: 116 * yy - 16,
    a: 500 * (xx - yy),
    b: 200 * (yy - zz),
  };
}

export function rgbToLab(r: number, g: number, b: number): LABColor {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

export function labToXyz(L: number, a: number, b: number): [number, number, number] {
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

export function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
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

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const [x, y, z] = labToXyz(L, a, b);
  return xyzToRgb(x, y, z);
}

export function labToHex(lab: LABColor): string {
  const [r, g, b] = labToRgb(lab.L, lab.a, lab.b);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function deltaE(lab1: LABColor, lab2: LABColor): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}
