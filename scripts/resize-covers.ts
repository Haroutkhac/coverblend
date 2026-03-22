import sharp from "sharp";
import fs from "fs";
import path from "path";

const COVERS_DIR = path.join(__dirname, "..", "public", "covers");
const BATCH_SIZE = 20;
const JPEG_QUALITY = 70;
const TARGET_SIZE = 300;
const LOG_INTERVAL = 500;

async function getJpgFiles(): Promise<string[]> {
  const entries = fs.readdirSync(COVERS_DIR);
  return entries
    .filter((f) => f.toLowerCase().endsWith(".jpg"))
    .map((f) => path.join(COVERS_DIR, f));
}

function getTotalSize(files: string[]): number {
  let total = 0;
  for (const f of files) {
    try {
      total += fs.statSync(f).size;
    } catch {
      // skip missing files
    }
  }
  return total;
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function resizeFile(filePath: string): Promise<void> {
  const tmpPath = filePath + ".tmp";
  await sharp(filePath)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover" })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(tmpPath);
  fs.renameSync(tmpPath, filePath);
}

async function processBatch(batch: string[]): Promise<number> {
  let errors = 0;
  await Promise.all(
    batch.map(async (file) => {
      try {
        await resizeFile(file);
      } catch (err) {
        errors++;
        console.error(`  ERROR: ${path.basename(file)} - ${err}`);
      }
    })
  );
  return errors;
}

async function main() {
  console.log(`Scanning ${COVERS_DIR} for .jpg files...`);
  const files = await getJpgFiles();
  console.log(`Found ${files.length} JPG files.\n`);

  if (files.length === 0) {
    console.log("No files to process.");
    return;
  }

  const sizeBefore = getTotalSize(files);
  console.log(`Total size BEFORE: ${formatMB(sizeBefore)}\n`);

  const startTime = Date.now();
  let processed = 0;
  let totalErrors = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const errors = await processBatch(batch);
    totalErrors += errors;
    processed += batch.length;

    if (processed % LOG_INTERVAL < BATCH_SIZE || processed === files.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((processed / files.length) * 100).toFixed(1);
      console.log(
        `  Progress: ${processed}/${files.length} (${pct}%) - ${elapsed}s elapsed`
      );
    }
  }

  const sizeAfter = getTotalSize(files);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const reduction = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);

  console.log(`\n========== RESULTS ==========`);
  console.log(`Files processed: ${processed}`);
  console.log(`Errors:          ${totalErrors}`);
  console.log(`Size BEFORE:     ${formatMB(sizeBefore)}`);
  console.log(`Size AFTER:      ${formatMB(sizeAfter)}`);
  console.log(`Reduction:       ${reduction}%`);
  console.log(`Time:            ${elapsed}s`);
  console.log(`=============================`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
