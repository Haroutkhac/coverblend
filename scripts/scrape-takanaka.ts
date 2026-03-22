import { createCanvas, loadImage, createImageData } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const COVERS_DIR = '/Users/harout/coverblend/public/covers';
const INDEX_PATH = path.join(COVERS_DIR, 'index.json');

// Load existing catalog
const catalog = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
const existingIds = new Set(catalog.albums.map((a: any) => a.id));
console.log(`Existing catalog: ${catalog.albums.length} albums`);

// --- Feature pipeline (same as scrape-covers.ts) ---
function rgbToLab(r: number, g: number, b: number) {
  let rr = r / 255, gg = g / 255, bb = b / 255;
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
  rr *= 100; gg *= 100; bb *= 100;
  const x = rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375;
  const y = rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750;
  const z = rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041;
  let xx = x / 95.047, yy = y / 100.0, zz = z / 108.883;
  xx = xx > 0.008856 ? Math.cbrt(xx) : 7.787 * xx + 16 / 116;
  yy = yy > 0.008856 ? Math.cbrt(yy) : 7.787 * yy + 16 / 116;
  zz = zz > 0.008856 ? Math.cbrt(zz) : 7.787 * zz + 16 / 116;
  return { L: 116 * yy - 16, a: 500 * (xx - yy), b: 200 * (yy - zz) };
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  let yy = (L + 16) / 116, xx = a / 500 + yy, zz = yy - b / 200;
  const x3 = xx*xx*xx, y3 = yy*yy*yy, z3 = zz*zz*zz;
  xx = x3 > 0.008856 ? x3 : (xx - 16/116) / 7.787;
  yy = y3 > 0.008856 ? y3 : (yy - 16/116) / 7.787;
  zz = z3 > 0.008856 ? z3 : (zz - 16/116) / 7.787;
  let x = xx * 95.047, y = yy * 100.0, z = zz * 108.883;
  x /= 100; y /= 100; z /= 100;
  let r = x*3.2404542 + y*-1.5371385 + z*-0.4985314;
  let g = x*-0.9692660 + y*1.8760108 + z*0.0415560;
  let bl = x*0.0556434 + y*-0.2040259 + z*1.0572252;
  r = r > 0.0031308 ? 1.055*Math.pow(r,1/2.4)-0.055 : 12.92*r;
  g = g > 0.0031308 ? 1.055*Math.pow(g,1/2.4)-0.055 : 12.92*g;
  bl = bl > 0.0031308 ? 1.055*Math.pow(bl,1/2.4)-0.055 : 12.92*bl;
  return [Math.max(0,Math.min(255,Math.round(r*255))), Math.max(0,Math.min(255,Math.round(g*255))), Math.max(0,Math.min(255,Math.round(bl*255)))];
}

function analyzeImage(imgData: any) {
  const { data, width, height } = imgData;
  const pixels: {L:number,a:number,b:number}[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt(width * height / 10000)));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      pixels.push(rgbToLab(data[i], data[i+1], data[i+2]));
    }
  }
  // K-means
  const k = 5;
  let centroids = pixels.slice(0, k).map(p => ({...p}));
  for (let iter = 0; iter < 15; iter++) {
    const clusters: typeof pixels[] = Array.from({length: k}, () => []);
    for (const p of pixels) {
      let minD = Infinity, minI = 0;
      for (let c = 0; c < k; c++) {
        const d = (p.L-centroids[c].L)**2 + (p.a-centroids[c].a)**2 + (p.b-centroids[c].b)**2;
        if (d < minD) { minD = d; minI = c; }
      }
      clusters[minI].push(p);
    }
    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) continue;
      centroids[c] = {
        L: clusters[c].reduce((s,p) => s+p.L, 0) / clusters[c].length,
        a: clusters[c].reduce((s,p) => s+p.a, 0) / clusters[c].length,
        b: clusters[c].reduce((s,p) => s+p.b, 0) / clusters[c].length,
      };
    }
  }
  const palette = centroids.map(c => ({L: Math.round(c.L*100)/100, a: Math.round(c.a*100)/100, b: Math.round(c.b*100)/100}));

  // Histogram
  const hist = new Array(48).fill(0);
  for (const p of pixels) {
    const lBin = Math.min(15, Math.floor(p.L / 6.25));
    const aBin = Math.min(15, Math.floor((p.a + 128) / 16));
    const bBin = Math.min(15, Math.floor((p.b + 128) / 16));
    hist[lBin]++; hist[16+aBin]++; hist[32+bBin]++;
  }
  const total = pixels.length;
  for (let i = 0; i < 48; i++) hist[i] = Math.round(hist[i] / total * 10000) / 10000;

  // Texture
  const gray = new Float32Array(128*128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const sx = Math.floor(x * width / 128), sy = Math.floor(y * height / 128);
      const i = (sy * width + sx) * 4;
      gray[y*128+x] = (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114) / 255;
    }
  }
  const texture = new Array(8).fill(0);
  const orientations = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4];
  const scales = [3, 6];
  let idx = 0;
  for (const s of scales) {
    for (const o of orientations) {
      let energy = 0, count = 0;
      for (let y = s; y < 128-s; y += 2) {
        for (let x = s; x < 128-s; x += 2) {
          let val = 0;
          for (let ky = -s; ky <= s; ky++) {
            for (let kx = -s; kx <= s; kx++) {
              const g = Math.exp(-(kx*kx+ky*ky)/(2*s*s));
              const w = g * Math.cos(2*Math.PI*(kx*Math.cos(o)+ky*Math.sin(o))/(2*s));
              val += gray[(y+ky)*128+(x+kx)] * w;
            }
          }
          energy += Math.abs(val); count++;
        }
      }
      texture[idx++] = count > 0 ? energy / count : 0;
    }
  }
  const maxT = Math.max(...texture, 0.001);
  for (let i = 0; i < 8; i++) texture[i] = Math.round(texture[i] / maxT * 10000) / 10000;

  // Luminance grid
  const grid = new Array(16).fill(0);
  const cellW = Math.floor(width/4), cellH = Math.floor(height/4);
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      let sum = 0, cnt = 0;
      for (let y = gy*cellH; y < (gy+1)*cellH; y += 2) {
        for (let x = gx*cellW; x < (gx+1)*cellW; x += 2) {
          const i = (y*width+x)*4;
          sum += (data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114)/255;
          cnt++;
        }
      }
      grid[gy*4+gx] = Math.round(sum/cnt*10000)/10000;
    }
  }

  // Global stats
  let brightness = 0, saturation = 0;
  const lValues: number[] = [];
  for (const p of pixels) { brightness += p.L; lValues.push(p.L); saturation += Math.sqrt(p.a*p.a+p.b*p.b); }
  brightness = Math.round(brightness / total * 100) / 100;
  saturation = Math.round(saturation / total * 100) / 100;
  const meanL = brightness;
  const contrast = Math.round(Math.sqrt(lValues.reduce((s,v) => s+(v-meanL)**2, 0)/total) * 100) / 100;

  // Feature vector
  const WC = 0.4, WT = 0.25, WL = 0.2, WG = 0.15;
  const vec: number[] = [];
  for (const v of hist) vec.push(v * Math.sqrt(WC));
  for (const v of texture) vec.push(v * Math.sqrt(WT));
  for (const v of grid) vec.push(v * Math.sqrt(WL));
  vec.push((brightness/100)*Math.sqrt(WG), (contrast/50)*Math.sqrt(WG), (saturation/100)*Math.sqrt(WG));
  for (const c of palette) { vec.push((c.L/100)*Math.sqrt(WC/3), ((c.a+128)/256)*Math.sqrt(WC/3), ((c.b+128)/256)*Math.sqrt(WC/3)); }
  const mag = Math.sqrt(vec.reduce((s,v) => s+v*v, 0));
  const fv = mag > 0 ? vec.map(v => Math.round(v/mag*10000)/10000) : vec;

  return { colorPalette: palette, colorHistogram: hist, textureEnergy: texture, luminanceGrid: grid, brightness, contrast, saturation, featureVector: fv };
}

async function main() {
  const queries = [
    'takanaka masayoshi', '高中正義', 'takanaka', 'masayoshi takanaka guitar',
    'takanaka seychelles', 'takanaka rainbow', 'takanaka jolly jive',
    'takanaka ocean breeze', 'takanaka brasilian skies', 'takanaka saudade'
  ];

  const newAlbums: any[] = [];
  const seenIds = new Set<number>();

  for (const q of queries) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=200&country=JP`;
      const res = await fetch(url);
      if (!res.ok) { console.log(`  Skip ${q}: ${res.status}`); continue; }
      const data = await res.json();
      console.log(`${q}: ${data.resultCount} results`);
      
      for (const r of data.results) {
        const id = `itunes-${r.collectionId}`;
        if (existingIds.has(id) || seenIds.has(r.collectionId)) continue;
        if (r.collectionName.includes('- Single')) continue;
        seenIds.add(r.collectionId);
        
        const artUrl = r.artworkUrl100.replace('100x100bb', '300x300bb');
        const filePath = path.join(COVERS_DIR, `cover-${r.collectionId}.jpg`);
        
        // Download
        if (!fs.existsSync(filePath)) {
          try {
            const imgRes = await fetch(artUrl);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              fs.writeFileSync(filePath, buf);
            } else continue;
          } catch { continue; }
        }

        // Analyze
        try {
          const img = await loadImage(filePath);
          const canvas = createCanvas(img.width, img.height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const features = analyzeImage(imgData);
          const [dr,dg,db] = labToRgb(features.colorPalette[0].L, features.colorPalette[0].a, features.colorPalette[0].b);
          const hex = `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`;

          newAlbums.push({
            id,
            title: r.collectionName,
            artist: r.artistName,
            year: new Date(r.releaseDate).getFullYear(),
            genre: r.primaryGenreName || 'J-Pop',
            imagePath: `/covers/cover-${r.collectionId}.jpg`,
            dominantColor: hex,
            features
          });
        } catch {}
      }
      await new Promise(r => setTimeout(r, 400));
    } catch (e) { console.log(`Error ${q}: ${e}`); }
  }

  console.log(`\nNew Takanaka albums: ${newAlbums.length}`);
  catalog.albums.push(...newAlbums);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(catalog, null, 0));
  console.log(`Total catalog: ${catalog.albums.length}`);
  
  for (const a of newAlbums) {
    console.log(`  ${a.artist} - ${a.title} (${a.year})`);
  }
}

main();
