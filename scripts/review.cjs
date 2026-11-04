// Article review pipeline: checklist, per-article inputs, and record validation.
//   npm run review -- init                 create review/checklist.json (keeps existing statuses)
//   npm run review -- status               progress summary
//   npm run review -- next [n]             ids of the next n pending articles (key articles first)
//   npm run review -- prep <id...>|--next n   build review/work/<id>/ inputs
//   npm run review -- validate [id...]     check records and mark complete ones "reviewed"
//   npm run review -- set <status> <id...> set status by hand (pending, assigned, reviewed, approved, merged, skipped)
//   npm run review -- issues               write review/ISSUES.md (articles to revisit)
//   npm run review -- assigned [n]         ids prepped but not yet reviewed (resume these first)
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const reviewDir = path.join(root, "review");
const recordsDir = path.join(reviewDir, "records");
const workDir = path.join(reviewDir, "work");
const checklistPath = path.join(reviewDir, "checklist.json");
const imagesDir = path.join(root, "public", "images");

const STATUSES = ["pending", "assigned", "reviewed", "approved", "merged", "skipped"];
const TAGS = ["Fights", "Challenges", "Exhibitions", "Saloon", "Legal", "Personal life", "Profiles", "Legacy"];
const KINDS = ["birth", "fight", "challenge", "exhibition", "saloon", "legal", "family", "travel", "health", "death", "quote", "other"];
const PRIORITY = { key: 0, support: 1, mention: 2 };

async function loadData() {
  const { pathToFileURL } = require("url");
  const { db } = await import(pathToFileURL(path.join(root, "data", "database.js")).href);
  const { facts } = await import(pathToFileURL(path.join(root, "data", "facts.js")).href);
  const full = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, "data", "new_articles.json"), "utf8")).map((a) => [a.id, a.text || ""]));
  return { db, facts, full };
}

const importance = (a) => (a.focus === "secondary" ? "support" : a.focus === "passing" ? "mention" : "key");
const readChecklist = () => (fs.existsSync(checklistPath) ? JSON.parse(fs.readFileSync(checklistPath, "utf8")) : { articles: {} });
const writeChecklist = (c) => fs.writeFileSync(checklistPath, JSON.stringify(c, null, 2) + "\n");
const today = () => new Date().toISOString().slice(0, 10);

async function init() {
  const { db } = await loadData();
  const c = readChecklist();
  const ordered = [...db].sort((x, y) => PRIORITY[importance(x)] - PRIORITY[importance(y)] || String(x.sourceDate).localeCompare(String(y.sourceDate)));
  const next = { updated: today(), articles: {} };
  ordered.forEach((a) => {
    next.articles[a.id] = c.articles[a.id] || { status: "pending", importance: importance(a), date: a.sourceDate };
  });
  const dropped = Object.keys(c.articles).filter((id) => !next.articles[id]);
  writeChecklist(next);
  console.log(`checklist: ${Object.keys(next.articles).length} articles${dropped.length ? `, dropped ${dropped.length} no longer in the database` : ""}`);
}

function status() {
  const c = readChecklist();
  const rows = Object.values(c.articles);
  const by = (k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {});
  console.log(`total ${rows.length}`, by("status"));
  for (const imp of ["key", "support", "mention"]) {
    const sub = rows.filter((r) => r.importance === imp);
    const done = sub.filter((r) => ["reviewed", "approved", "merged", "skipped"].includes(r.status)).length;
    console.log(`  ${imp.padEnd(8)} ${done}/${sub.length} reviewed or later`);
  }
}

const pendingIds = (n) =>
  Object.entries(readChecklist().articles)
    .filter(([, r]) => r.status === "pending")
    .slice(0, n)
    .map(([id]) => id);

const localImage = (p) => {
  if (!p || p === "missing" || p.includes("?")) return null;
  const f = path.join(imagesDir, p.replace(/^\/?(public\/)?images\//, ""));
  return fs.existsSync(f) ? f : null;
};

async function slice(file, outDir) {
  const img = sharp(file, { limitInputPixels: false });
  const { width, height } = await img.metadata();
  const scale = Math.min(1, 900 / width);
  const pieceH = Math.round(1300 / scale);
  const overlap = Math.round(80 / scale);
  const pieces = [];
  for (let top = 0, i = 1; top < height; top += pieceH - overlap, i++) {
    const h = Math.min(pieceH, height - top);
    const out = path.join(outDir, `crop-${i}.jpg`);
    await sharp(file, { limitInputPixels: false }).extract({ left: 0, top, width, height: h }).resize({ width: Math.round(width * scale) }).jpeg({ quality: 82 }).toFile(out);
    pieces.push(path.basename(out));
    if (top + h >= height) break;
  }
  return pieces;
}

async function prep(ids) {
  const { db, facts, full } = await loadData();
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, "facts-index.txt"), facts.map((f) => `${f.id || "(no id)"}: ${f.fact}`).join("\n") + "\n");
  const c = readChecklist();
  for (const id of ids) {
    const a = db.find((x) => x.id === id);
    if (!a) {
      console.warn(`skip ${id}: not in database`);
      continue;
    }
    const dir = path.join(workDir, id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const crop = localImage(a.localCopyEdited);
    const page = localImage(a.localCopyFull);
    const pieces = crop ? await slice(crop, dir) : [];
    if (page) await sharp(page, { limitInputPixels: false }).resize({ width: 1400, height: 1800, fit: "inside" }).jpeg({ quality: 80 }).toFile(path.join(dir, "page.jpg"));
    const { text, ...meta } = a;
    const article = { ...meta, text: full[id] || text || "", crop_pieces: pieces, page_image: page ? "page.jpg" : null, crop_is_page: a.localCopyEdited === a.localCopyFull };
    fs.writeFileSync(path.join(dir, "article.json"), JSON.stringify(article, null, 2));
    if (c.articles[id] && c.articles[id].status === "pending") c.articles[id].status = "assigned";
    console.log(`prepped ${id}: ${pieces.length} crop pieces${page ? " + page" : ", no page"}`);
  }
  c.updated = today();
  writeChecklist(c);
}

function check(rec) {
  const errs = [];
  const need = (cond, msg) => cond || errs.push(msg);
  need(["ok", "cut_off", "wrong_article", "mixed", "no_crop"].includes(rec.crop?.status), "crop.status");
  need(["good", "rough", "unusable", "missing"].includes(rec.ocr?.status), "ocr.status");
  need(["yes", "no", "unsure"].includes(rec.about_tom), "about_tom");
  need(typeof rec.title?.ok === "boolean" && (rec.title.ok || rec.title.suggested), "title");
  need(typeof rec.summary?.ok === "boolean" && (rec.summary.ok || rec.summary.suggested), "summary");
  need(!rec.summary?.suggested || rec.summary.suggested.length <= 300, `summary too long (${rec.summary?.suggested?.length} chars, max 300)`);
  need(rec.metadata?.publication_ok !== false || rec.metadata.publication, "metadata.publication (the paper's name at the time)");
  need(["primary", "secondary", "passing"].includes(rec.focus?.suggested), "focus.suggested");
  need(Array.isArray(rec.tags) && rec.tags.length > 0 && rec.tags.every((t) => TAGS.includes(t)), "tags");
  need(Array.isArray(rec.facts), "facts");
  (rec.facts || []).forEach((f, i) => {
    need(f.fact, `facts[${i}].fact`);
    need(KINDS.includes(f.kind), `facts[${i}].kind`);
    need(["high", "medium", "low"].includes(f.confidence), `facts[${i}].confidence`);
  });
  need(typeof rec.needs_human === "boolean", "needs_human");
  return errs;
}

function validate(ids) {
  const c = readChecklist();
  const files = fs.existsSync(recordsDir) ? fs.readdirSync(recordsDir).filter((f) => f.endsWith(".json")) : [];
  const targets = ids.length ? ids : files.map((f) => f.replace(/\.json$/, ""));
  let ok = 0;
  for (const id of targets) {
    const f = path.join(recordsDir, `${id}.json`);
    if (!fs.existsSync(f)) {
      console.log(`${id}: no record`);
      continue;
    }
    let rec;
    try {
      rec = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch (e) {
      console.log(`${id}: invalid JSON (${e.message})`);
      continue;
    }
    const errs = check(rec);
    if (rec.id !== id) errs.push("id mismatch");
    if (errs.length) {
      console.log(`${id}: missing or invalid ${errs.join(", ")}`);
      continue;
    }
    ok++;
    if (c.articles[id] && ["pending", "assigned"].includes(c.articles[id].status)) c.articles[id].status = "reviewed";
  }
  c.updated = today();
  writeChecklist(c);
  console.log(`${ok}/${targets.length} records valid`);
}

// review/ISSUES.md: articles to revisit on newspapers.com (new screenshots, re-crops, hand transcription).
async function issues() {
  const { db } = await loadData();
  const recs = fs.readdirSync(recordsDir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(recordsDir, f), "utf8")));
  const c = readChecklist();
  const byId = Object.fromEntries(db.map((a) => [a.id, a]));
  const line = (r, why) => {
    const a = byId[r.id] || {};
    return `- [ ] **${r.id}** ${a.sourceDate || "?"} ${r.metadata?.publication || a.publication || ""} — ${why}`;
  };
  const sections = [
    ["Get a new screenshot (crop missing, cut off or wrong)", (r) => ["cut_off", "wrong_article", "no_crop"].includes(r.crop?.status), (r) => `${r.crop.status.replace("_", " ")}: ${r.crop.notes || ""}`],
    ["Mixed clipping (trim to the Allen item)", (r) => r.crop?.status === "mixed", (r) => r.crop.notes || ""],
    ["OCR unusable or missing (re-OCR or transcribe by hand)", (r) => ["unusable", "missing"].includes(r.ocr?.status), (r) => `${r.ocr.status}: ${r.ocr.notes || ""}`],
    ["Maybe not about Tom Allen", (r) => r.about_tom !== "yes" && r.about_tom, (r) => `${r.about_tom}: ${r.notes || ""}`],
    ["Paper name unconfirmed", (r) => /unconfirmed|no masthead|not visible|unclear/i.test(r.metadata?.notes || ""), (r) => r.metadata.notes],
    ["Other reviewer flags", (r) => r.needs_human, (r) => r.notes || ""],
  ];
  const skipped = Object.entries(c.articles).filter(([, x]) => x.status === "skipped").map(([id]) => `- [ ] **${id}** ${byId[id]?.sourceDate || "?"} ${byId[id]?.publication || ""} — skipped (no usable source)`);
  const used = new Set();
  let out = `# Review issues\n\nGenerated by \`npm run review -- issues\` from \`review/records/\`. Do not edit by hand; fix the source and re-review, or add notes to \`review/FINDINGS.md\`.\n`;
  for (const [title, pred, why] of sections) {
    const rows = recs.filter((r) => pred(r) && (title !== "Other reviewer flags" || !used.has(r.id))).sort((x, y) => String(byId[x.id]?.sourceDate).localeCompare(String(byId[y.id]?.sourceDate)));
    rows.forEach((r) => used.add(r.id));
    out += `\n## ${title} (${rows.length})\n\n${rows.map((r) => line(r, String(why(r)).replace(/\s+/g, " ").slice(0, 220))).join("\n") || "_none_"}\n`;
  }
  out += `\n## Skipped (${skipped.length})\n\n${skipped.join("\n") || "_none_"}\n`;
  fs.writeFileSync(path.join(reviewDir, "ISSUES.md"), out);
  console.log(`wrote review/ISSUES.md (${used.size} articles flagged, ${skipped.length} skipped)`);
}

const idsWithStatus = (s, n) =>
  Object.entries(readChecklist().articles)
    .filter(([, r]) => r.status === s)
    .slice(0, n)
    .map(([id]) => id);

function set(statusName, ids) {
  if (!STATUSES.includes(statusName)) throw new Error(`status must be one of ${STATUSES.join(", ")}`);
  const c = readChecklist();
  ids.forEach((id) => c.articles[id] && (c.articles[id].status = statusName));
  c.updated = today();
  writeChecklist(c);
  console.log(`set ${ids.length} to ${statusName}`);
}

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  fs.mkdirSync(recordsDir, { recursive: true });
  if (cmd === "init") await init();
  else if (cmd === "status") status();
  else if (cmd === "next") console.log(pendingIds(Number(args[0]) || 10).join(" "));
  else if (cmd === "prep") await prep(args[0] === "--next" ? pendingIds(Number(args[1]) || 10) : args);
  else if (cmd === "validate") validate(args);
  else if (cmd === "set") set(args[0], args.slice(1));
  else if (cmd === "issues") await issues();
  else if (cmd === "assigned") console.log(idsWithStatus("assigned", Number(args[0]) || 1e9).join(" "));
  else console.log("usage: npm run review -- init | status | next [n] | prep <ids>|--next n | validate [ids] | set <status> <ids>");
})();
