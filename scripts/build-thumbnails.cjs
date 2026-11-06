// Builds small landscape-friendly thumbnails from each article's crop (the file named in
// localCopyEdited in data/database.js), not from the full page.
// Output is thumbs/image-<id>.jpg, which is the path the site uses.
// Usage: node scripts/build-thumbnails.cjs [sourceDir] [outDir]
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const srcDir = process.argv[2] || path.join(root, "public", "images", "articles");
const outDir = process.argv[3] || path.join(root, "public", "images", "thumbs");
const WIDTH = 600;

// Map article id -> crop file name in srcDir, from the database.
async function cropsById() {
  const { db } = await import(pathToFileURL(path.join(root, "data", "database.js")).href);
  const map = new Map();
  for (const a of db) {
    const edited = a.localCopyEdited || "";
    if (!edited.startsWith("images/articles/")) continue;
    const name = path.basename(edited);
    if (!fs.existsSync(path.join(srcDir, name))) continue;
    map.set(a.id, name);
  }
  return map;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const crops = await cropsById();
  const { db } = await import(pathToFileURL(path.join(root, "data", "database.js")).href);
  let made = 0;
  const missing = [];
  for (const a of db) {
    const f = crops.get(a.id);
    if (!f) {
      missing.push(a.id);
      continue;
    }
    const out = path.join(outDir, `image-${a.id}.jpg`);
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
      console.warn(`skipped ${a.id} (${f}): ${e.message}`);
    }
  }
  if (missing.length) console.warn(`no crop file for ${missing.length} articles, thumbnails not rebuilt: ${missing.join(", ")}`);
  console.log(`thumbnails: ${made} made from crops, in ${outDir}`);
}

main();
