// Builds small landscape-friendly thumbnails from each article's single-column crop.
// Usage: node scripts/build-thumbnails.cjs [sourceDir] [outDir]
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const srcDir = process.argv[2] || path.join(root, "public", "images", "articles");
const outDir = process.argv[3] || path.join(root, "public", "images", "thumbs");
const WIDTH = 600;

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter((f) => /^image-\d+\.jpg$/.test(f));
  let made = 0;
  let skipped = 0;
  for (const f of files) {
    const out = path.join(outDir, f);
    if (fs.existsSync(out)) {
      skipped++;
      continue;
    }
    try {
      const img = sharp(path.join(srcDir, f), { limitInputPixels: false });
      const meta = await img.metadata();
      const scale = WIDTH / meta.width;
      const cropH = Math.min(meta.height, Math.round(WIDTH / scale));
      await img
        .extract({ left: 0, top: 0, width: meta.width, height: cropH })
        .resize({ width: WIDTH })
        .grayscale()
        .jpeg({ quality: 70, mozjpeg: true })
        .toFile(out);
      made++;
    } catch (e) {
      console.warn(`skipped ${f}: ${e.message}`);
    }
  }
  console.log(`thumbnails: ${made} made, ${skipped} already present, in ${outDir}`);
}

main();
