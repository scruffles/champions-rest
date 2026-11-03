const fs = require("fs");
const path = require("path");
const MiniSearch = require("minisearch");

const dataDir = path.join(__dirname, "..", "data");

// Load full-text articles (new_articles.json has un-truncated OCR text)
const fullTextMap = {};
const newArticles = JSON.parse(
  fs.readFileSync(path.join(dataDir, "new_articles.json"), "utf-8"),
);
for (const a of newArticles) {
  fullTextMap[a.id] = a.text || "";
}

// Load database.js as ESM — use a dynamic import workaround for CJS
const dbPath = path.join(dataDir, "database.js");
const dbRaw = fs.readFileSync(dbPath, "utf-8");
const dbJson = dbRaw
  .replace(/^export const db = /, "")
  .replace(/;\s*$/, "")
  .replace(/(\n\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  .replace(/,(\s*[}\]])/g, "$1");

let db;
try {
  db = JSON.parse(dbJson);
} catch (e) {
  console.error("Failed to parse database.js as JSON:", e.message);
  process.exit(1);
}

console.log(`Loaded ${db.length} articles from database.js`);
console.log(`Loaded ${newArticles.length} full-text articles from new_articles.json`);

const docs = db.map((a) => ({
  id: a.id,
  title: a.title || "",
  summary: a.summary || "",
  publication: a.publication || "",
  text: fullTextMap[a.id] || a.text || "",
}));

const miniSearch = new MiniSearch({
  fields: ["title", "summary", "publication", "text"],
  storeFields: ["id"],
  searchOptions: {
    boost: { title: 3, summary: 2, publication: 1, text: 1 },
    fuzzy: 0.2,
    prefix: true,
  },
});

miniSearch.addAll(docs);

const indexJson = JSON.stringify(miniSearch.toJSON());
const outPath = path.join(__dirname, "..", "public", "search-index.json");
fs.writeFileSync(outPath, indexJson);

const sizeMB = (Buffer.byteLength(indexJson) / 1024 / 1024).toFixed(1);
console.log(`Search index written to public/search-index.json (${sizeMB} MB)`);
console.log(`Indexed ${docs.length} documents`);
