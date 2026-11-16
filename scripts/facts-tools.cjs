#!/usr/bin/env node
// Tools for indexing facts, quotes and fights from the articles.
//
//   node scripts/facts-tools.cjs prep <ids...> | --all     write compact agent inputs to review/work/facts/in/<id>.json
//   node scripts/facts-tools.cjs batches [--max=40000] [--pending] [ids...]
//                                                          group ids into batches by text size (one line per batch)
//   node scripts/facts-tools.cjs verify <ids...> | --all   check review/facts/<id>.json: schema, and that every excerpt
//                                                          and quote is really in the article text
//   node scripts/facts-tools.cjs compare <ids...>          compare new claims with the old review claims and data/facts.js
//   node scripts/facts-tools.cjs status                    how many articles are extracted / verified
//
// Agent instructions: .claude/skills/index-facts/EXTRACT.md
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "..");
const IN_DIR = path.join(ROOT, "review", "work", "facts", "in");
const OUT_DIR = path.join(ROOT, "review", "facts");
const REC_DIR = path.join(ROOT, "review", "records");

const KINDS = ["birth", "family", "death", "health", "residence", "travel", "career", "fight", "challenge", "exhibition", "saloon", "business", "legal", "other"];
const PRECISION = ["day", "month", "year", "approx", "unknown"];
const RESULTS = ["win", "loss", "draw", "no contest", "forfeit", "unknown"];
const REPORTED = ["report", "recollection", "record"];
const CONF = ["high", "medium", "low"];

async function loadArticles() {
  const { db } = await import(pathToFileURL(path.join(ROOT, "data", "database.js")).href);
  const na = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "new_articles.json"), "utf8"));
  const byNa = {};
  for (const a of na) byNa[a.id] = a;
  const out = {};
  for (const a of db) out[a.id] = { ...a, text: (byNa[a.id] && byNa[a.id].text) || a.text || "" };
  return out;
}

// Normalise for matching: lower case, unify quotes and dashes, join hyphenated line breaks, keep letters and digits only.
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[‘’‚‛'`]/g, "'")
    .replace(/[“”„"]/g, '"')
    .replace(/-\s*\n\s*/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function words(s) { return norm(s).split(" ").filter(Boolean); }

// Excerpt check: exact (after normalising) or, for OCR noise, most of its 4-word runs present in order-free form.
function matchExcerpt(excerpt, textNorm, textShingles) {
  const e = norm(excerpt);
  if (!e) return "missing";
  if (textNorm.includes(e)) return "exact";
  const w = e.split(" ");
  if (w.length < 4) return "fail";
  let hit = 0, tot = 0;
  for (let i = 0; i + 4 <= w.length; i++) { tot++; if (textShingles.has(w.slice(i, i + 4).join(" "))) hit++; }
  return hit / tot >= 0.6 ? "fuzzy" : "fail";
}
function shingles(textNorm) {
  const w = textNorm.split(" ");
  const s = new Set();
  for (let i = 0; i + 4 <= w.length; i++) s.add(w.slice(i, i + 4).join(" "));
  return s;
}

function parseIds(args, all) {
  if (args.includes("--all")) return Object.keys(all);
  return args.filter((a) => !a.startsWith("--"));
}

async function cmdPrep(args) {
  const all = await loadArticles();
  const ids = parseIds(args, all);
  fs.mkdirSync(IN_DIR, { recursive: true });
  for (const id of ids) {
    const a = all[id];
    if (!a) { console.log(`${id}: no such article`); continue; }
    let hints = [];
    const rp = path.join(REC_DIR, `${id}.json`);
    if (fs.existsSync(rp)) {
      const r = JSON.parse(fs.readFileSync(rp, "utf8"));
      hints = (r.facts || []).map((f) => [f.date, f.kind, f.fact].filter(Boolean).join(" | "));
    }
    const input = {
      id,
      publication: a.publication || "",
      published: a.sourceDate || "",
      title: a.title || "",
      text: a.text,
      hints,
    };
    fs.writeFileSync(path.join(IN_DIR, `${id}.json`), JSON.stringify(input, null, 1) + "\n");
  }
  console.log(`prepped ${ids.length} into ${path.relative(ROOT, IN_DIR)}`);
}

async function cmdBatches(args) {
  const all = await loadArticles();
  const maxArg = args.find((a) => a.startsWith("--max="));
  const max = maxArg ? Number(maxArg.split("=")[1]) : 40000;
  let ids = args.filter((a) => !a.startsWith("--"));
  if (!ids.length) ids = Object.keys(all);
  if (args.includes("--pending")) ids = ids.filter((id) => !fs.existsSync(path.join(OUT_DIR, `${id}.json`)));
  const batches = [];
  let cur = [], size = 0;
  for (const id of ids) {
    const n = (all[id] && all[id].text.length) || 0;
    const per = Number((args.find((a) => a.startsWith("--per=")) || "--per=12").split("=")[1]);
    if (cur.length && (size + n > max || cur.length >= per)) { batches.push(cur); cur = []; size = 0; }
    cur.push(id); size += n;
  }
  if (cur.length) batches.push(cur);
  for (const b of batches) console.log(b.join(" "));
  console.error(`${ids.length} ids in ${batches.length} batches (max ${max} chars, 12 ids)`);
}

function checkOne(id, a) {
  const p = path.join(OUT_DIR, `${id}.json`);
  const errs = [];
  const stats = { claims: 0, quotes: 0, fights: 0, exact: 0, fuzzy: 0 };
  if (!fs.existsSync(p)) return { errs: ["no output file"], stats };
  let o;
  try { o = JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return { errs: ["invalid JSON: " + e.message], stats }; }
  if (o.id !== id) errs.push(`id is ${o.id}`);
  const tn = norm(a.text);
  const sh = shingles(tn);
  const date = (d, where) => {
    if (d && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(d)) errs.push(`${where}: bad date "${d}"`);
  };
  const ex = (e, where) => {
    const m = matchExcerpt(e, tn, sh);
    if (m === "exact") stats.exact++;
    else if (m === "fuzzy") stats.fuzzy++;
    else errs.push(`${where}: excerpt ${m === "missing" ? "missing" : "not found in text"}: "${String(e || "").slice(0, 70)}"`);
  };
  for (const key of ["claims", "quotes", "fights"]) if (!Array.isArray(o[key])) errs.push(`${key} is not a list`);
  (o.claims || []).forEach((c, i) => {
    const w = `claim ${i + 1}`;
    stats.claims++;
    if (!KINDS.includes(c.kind)) errs.push(`${w}: kind "${c.kind}"`);
    if (!c.statement || c.statement.length < 8) errs.push(`${w}: statement missing`);
    date(c.date, w);
    if (c.date_precision && !PRECISION.includes(c.date_precision)) errs.push(`${w}: date_precision "${c.date_precision}"`);
    if (!CONF.includes(c.confidence)) errs.push(`${w}: confidence "${c.confidence}"`);
    if (typeof c.retrospective !== "boolean") errs.push(`${w}: retrospective must be true/false`);
    ex(c.excerpt, w);
  });
  (o.quotes || []).forEach((q, i) => {
    const w = `quote ${i + 1}`;
    stats.quotes++;
    if (!q.speaker) errs.push(`${w}: speaker missing`);
    ex(q.text, w);
  });
  (o.fights || []).forEach((f, i) => {
    const w = `fight ${i + 1}`;
    stats.fights++;
    if (!f.opponent) errs.push(`${w}: opponent missing`);
    if (!RESULTS.includes(f.result)) errs.push(`${w}: result "${f.result}"`);
    if (!REPORTED.includes(f.reported_as)) errs.push(`${w}: reported_as "${f.reported_as}"`);
    date(f.date, w);
    ex(f.excerpt, w);
  });
  const fightClaims = (o.claims || []).filter((c) => c.kind === "fight").length;
  if ((o.fights || []).length > fightClaims) errs.push(`${(o.fights || []).length} fights but only ${fightClaims} fight claims: every fight needs its own fight claim`);
  return { errs, stats };
}

async function cmdVerify(args) {
  const all = await loadArticles();
  let ids = parseIds(args, all);
  if (args.includes("--all")) ids = ids.filter((id) => fs.existsSync(path.join(OUT_DIR, `${id}.json`)));
  let ok = 0;
  const tot = { claims: 0, quotes: 0, fights: 0, exact: 0, fuzzy: 0, errors: 0 };
  for (const id of ids) {
    if (!all[id]) { console.log(`${id}: no such article`); continue; }
    const { errs, stats } = checkOne(id, all[id]);
    for (const k of Object.keys(stats)) tot[k] += stats[k];
    tot.errors += errs.length;
    if (!errs.length) { ok++; if (ids.length <= 15) console.log(`${id}: ok (${stats.claims} claims, ${stats.quotes} quotes, ${stats.fights} fights)`); }
    else { console.log(`${id}: ${errs.length} problem(s)`); for (const e of errs.slice(0, 12)) console.log(`   - ${e}`); }
  }
  console.log(`${ok}/${ids.length} ok | ${JSON.stringify(tot)}`);
  process.exitCode = ok === ids.length ? 0 : 1;
}

// Overlap of content words between two statements (0..1, relative to the shorter).
const STOP = new Set("the a an and of to in on at for with by from was were is are he his him that this as it had has be been tom allen allen's".split(" "));
function contentWords(s) { return new Set(words(s).filter((w) => w.length > 2 && !STOP.has(w))); }
function overlap(a, b) {
  const A = contentWords(a), B = contentWords(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

async function cmdCompare(args) {
  const all = await loadArticles();
  const ids = parseIds(args, all);
  const { facts } = await import(pathToFileURL(path.join(ROOT, "data", "facts.js")).href);
  const { fights } = await import(pathToFileURL(path.join(ROOT, "data", "fights.js")).href);
  let oldN = 0, oldHit = 0, newN = 0, newOld = 0, fN = 0, fHit = 0, fgN = 0, fgHit = 0;
  const missed = [];
  for (const id of ids) {
    const p = path.join(OUT_DIR, `${id}.json`);
    if (!fs.existsSync(p)) continue;
    const o = JSON.parse(fs.readFileSync(p, "utf8"));
    const neu = (o.claims || []).map((c) => c.statement + " " + (c.excerpt || ""));
    const rp = path.join(REC_DIR, `${id}.json`);
    const old = fs.existsSync(rp) ? (JSON.parse(fs.readFileSync(rp, "utf8")).facts || []).map((f) => f.fact) : [];
    oldN += old.length;
    newN += neu.length;
    for (const f of old) {
      if (neu.some((n) => overlap(f, n) >= 0.5)) oldHit++;
      else missed.push(`${id} (old claim not found): ${f.slice(0, 110)}`);
    }
    for (const n of neu) if (old.some((f) => overlap(f, n) >= 0.5)) newOld++;
    for (const f of facts.filter((x) => (x.articles || []).includes(id))) {
      fN++;
      if (neu.some((n) => overlap(f.fact, n) >= 0.4)) fHit++;
      else missed.push(`${id} (facts.js ${f.id} not found): ${f.fact.slice(0, 110)}`);
    }
    for (const g of fights.filter((x) => (x.articles || []).includes(id))) {
      fgN++;
      if ((o.fights || []).some((f) => overlap(g.opponent, f.opponent) >= 0.5)) fgHit++;
      else missed.push(`${id} (fights.js ${g.date} ${g.opponent} not in fights)`);
    }
  }
  console.log(`old review claims found again: ${oldHit}/${oldN}`);
  console.log(`new claims that match an old claim: ${newOld}/${newN} (the rest are new or reworded)`);
  console.log(`facts.js facts citing these articles found: ${fHit}/${fN}`);
  console.log(`fights.js fights citing these articles found: ${fgHit}/${fgN}`);
  if (args.includes("--missed")) for (const m of missed) console.log("  " + m);
}

async function cmdStatus() {
  const all = await loadArticles();
  const ids = Object.keys(all);
  let done = 0, ok = 0;
  for (const id of ids) {
    if (!fs.existsSync(path.join(OUT_DIR, `${id}.json`))) continue;
    done++;
    if (!checkOne(id, all[id]).errs.length) ok++;
  }
  console.log(`${ids.length} articles | ${done} extracted | ${ok} verified clean | ${ids.length - done} pending`);
}

const [cmd, ...args] = process.argv.slice(2);
const cmds = { prep: cmdPrep, batches: cmdBatches, verify: cmdVerify, compare: cmdCompare, status: cmdStatus };
if (!cmds[cmd]) { console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 13).join("\n")); process.exit(1); }
cmds[cmd](args).catch((e) => { console.error(e); process.exit(1); });
