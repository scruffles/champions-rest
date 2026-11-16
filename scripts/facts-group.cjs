// Pull review/facts/*.json together into review/facts-index/.
// Run `node scripts/facts-names.cjs build` first (names.json).
// Usage:
//   node scripts/facts-group.cjs index     claims.json: every claim with an id (<article>.c<n>), canonical names and the article date
//   node scripts/facts-group.cjs bouts     bouts.json: fight entries grouped into bouts (seeds in bout-seeds.json), with the fight claims attached
//   node scripts/facts-group.cjs buckets   write review/facts-index/group/in/<bucket>.json for the non-fight claims (Haiku groups them)
//   node scripts/facts-group.cjs check [buckets]  check Haiku's outputs in review/facts-index/group/out/
//   node scripts/facts-group.cjs existing  list facts from dated buckets per kind (for the undated buckets)
//   node scripts/facts-group.cjs merge     combine the outputs into facts.json (joins on 'join' keys and seed ids)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const FACTS = path.join(ROOT, "review/facts");
const IDX = path.join(ROOT, "review/facts-index");
const GIN = path.join(ROOT, "review/facts-index/group/in");
const GOUT = path.join(ROOT, "review/facts-index/group/out");
const rd = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const wr = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 1) + "\n");

function articleMeta() {
  const meta = {};
  for (const f of fs.readdirSync(path.join(ROOT, "review/work/facts/in"))) {
    if (!f.endsWith(".json")) continue;
    const a = rd(path.join(ROOT, "review/work/facts/in", f));
    meta[a.id] = { publication: a.publication, published: a.published, title: a.title };
  }
  return meta;
}
function docs() {
  return fs.readdirSync(FACTS).filter((f) => /^\d+\.json$/.test(f)).sort().map((f) => rd(path.join(FACTS, f)));
}
const names = () => rd(path.join(IDX, "names.json"));

// ---------- index ----------
function index() {
  const N = names(), meta = articleMeta();
  const claims = [], quotes = [];
  for (const d of docs()) {
    const m = meta[d.id] || {};
    d.claims.forEach((c, i) => claims.push({
      cid: `${d.id}.c${i + 1}`, article: d.id, published: m.published || "", kind: c.kind, statement: c.statement, excerpt: c.excerpt,
      date: c.date || "", date_precision: c.date_precision, people: (c.people || []).map((p) => N.people[p] || p),
      places: (c.places || []).map((p) => N.places[p] || p), retrospective: !!c.retrospective, confidence: c.confidence,
    }));
    (d.quotes || []).forEach((q, i) => quotes.push({ qid: `${d.id}.q${i + 1}`, article: d.id, published: m.published || "", ...q }));
  }
  wr(path.join(IDX, "claims.json"), claims);
  wr(path.join(IDX, "quotes.json"), quotes);
  console.log(`claims ${claims.length}, quotes ${quotes.length}`);
}

// ---------- bouts ----------
const toNum = (d) => {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(d || "");
  return m ? +m[1] + ((+m[2] || 6.5) - 1) / 12 + ((+m[3] || 15) - 1) / 365 : null;
};
const tally = (arr) => {
  const t = {}; arr.filter((x) => x !== "" && x != null).forEach((x) => (t[x] = (t[x] || 0) + 1));
  return Object.entries(t).sort((a, b) => b[1] - a[1]);
};
function bouts() {
  const N = names(), meta = articleMeta();
  const seeds = rd(path.join(IDX, "bout-seeds.json")).seeds;
  const claims = rd(path.join(IDX, "claims.json"));
  const out = {}; const unassigned = [];
  for (const s of seeds) out[s.id] = { id: s.id, opponent: s.opponents[0], seed_date: s.date, entries: [] };
  for (const d of docs()) {
    d.fights.forEach((x, i) => {
      const opp = N.people[x.opponent] || x.opponent;
      const e = { fid: `${d.id}.f${i + 1}`, article: d.id, published: (meta[d.id] || {}).published || "", ...x, opponent_canonical: opp };
      let cands = seeds.filter((s) => s.opponents.includes(opp));
      // A bare surname ("Davis", "Gallagher") may match the seeds of several men with that surname.
      if (!cands.length && !/\s/.test(opp)) cands = seeds.filter((s) => s.opponents.some((o) => o.split(" ").pop() === opp));
      if (!cands.length) {
        const y = (x.date || "").slice(0, 4) || "undated";
        const id = `${opp.toLowerCase().replace(/[^a-z]+/g, "-")}-${y}`;
        (out[id] = out[id] || { id, opponent: opp, seed_date: "", entries: [], auto: true }).entries.push(e);
        return;
      }
      // Undated: a report written at the time is near the paper's date; a recollection may name the place.
      let dn = toNum(x.date);
      if (dn == null && x.reported_as === "report" && e.published) dn = toNum(e.published.slice(0, 7));
      if (dn == null && cands.length > 1) {
        const hay = `${x.place} ${x.excerpt} ${x.notes}`.toLowerCase();
        const hit = cands.filter((s) => (s.hints || []).some((h) => hay.includes(h.toLowerCase())));
        if (hit.length === 1) { out[hit[0].id].entries.push(e); return; }
      }
      const score = (s) => (dn == null ? 0 : Math.abs(dn - toNum(s.date))) + (s.results.includes(x.result) || x.result === "unknown" ? 0 : 2);
      const ranked = cands.map((s) => [s, score(s)]).sort((a, b) => a[1] - b[1]);
      // Undated with an unknown result and several bouts with this man: can't tell which.
      if (cands.length > 1 && dn == null && (x.result === "unknown" || ranked[1][1] === ranked[0][1])) { e.candidates = cands.map((s) => s.id); unassigned.push(e); return; }
      out[ranked[0][0].id].entries.push(e);
    });
  }
  // Attach fight claims: same article, a fight claim naming the opponent (or the only fight in that article).
  const fightClaims = claims.filter((c) => c.kind === "fight");
  const byArticle = {};
  for (const b of Object.values(out)) for (const e of b.entries) (byArticle[e.article] = byArticle[e.article] || []).push([b, e]);
  const claimBout = {};
  for (const c of fightClaims) {
    const list = byArticle[c.article] || [];
    const hit = list.filter(([b]) => c.people.includes(b.opponent));
    const pick = hit.length === 1 ? hit[0] : hit.length > 1 ? hit.find(([, e]) => e.excerpt === c.excerpt) || hit.find(([, e]) => e.date && e.date === c.date) : list.length === 1 ? list[0] : null;
    if (pick) claimBout[c.cid] = pick[0].id;
  }
  const res = Object.values(out).filter((b) => b.entries.length).map((b) => {
    const E = b.entries;
    return {
      id: b.id, opponent: b.opponent, auto: !!b.auto,
      date: tally(E.map((e) => e.date)).slice(0, 4), result: tally(E.map((e) => e.result)), place: tally(E.map((e) => e.place)).slice(0, 5),
      rounds: tally(E.map((e) => e.rounds)).slice(0, 5), duration: tally(E.map((e) => e.duration)).slice(0, 5), stakes: tally(E.map((e) => e.stakes)).slice(0, 5),
      rules: tally(E.map((e) => e.rules)).slice(0, 3), articles: [...new Set(E.map((e) => e.article))].sort(),
      claims: Object.entries(claimBout).filter(([, id]) => id === b.id).map(([cid]) => cid), entries: E,
    };
  }).sort((a, b) => (toNum(a.date[0] && a.date[0][0]) || 9999) - (toNum(b.date[0] && b.date[0][0]) || 9999));
  wr(path.join(IDX, "bouts.json"), { bouts: res, unassigned, unattached_fight_claims: fightClaims.filter((c) => !claimBout[c.cid]).map((c) => c.cid) });
  for (const b of res) {
    const r = b.result.map(([k, n]) => `${k}×${n}`).join(" ");
    console.log(`${b.auto ? " " : "*"} ${b.id.padEnd(22)} ${String(b.entries.length).padStart(3)} entries ${String(b.articles.length).padStart(3)} arts | ${(b.date[0] || ["?"])[0].padEnd(10)} | ${r}`);
  }
  console.log(`unassigned entries: ${unassigned.length}; fight claims not attached to a bout: ${fightClaims.length - Object.keys(claimBout).length}/${fightClaims.length}`);
}

// ---------- buckets ----------
const MAXB = 60;
function buckets() {
  const claims = rd(path.join(IDX, "claims.json")).filter((c) => c.kind !== "fight");
  fs.mkdirSync(GIN, { recursive: true });
  for (const f of fs.readdirSync(GIN)) fs.unlinkSync(path.join(GIN, f));
  const groups = {};
  // Kinds that are small or closely related share a bucket.
  const KIND = { birth: "life", family: "life", death: "life", health: "life", residence: "places", travel: "places", business: "saloon", saloon: "saloon" };
  for (const c of claims) {
    const k = KIND[c.kind] || c.kind;
    const y = c.date ? +c.date.slice(0, 4) : null;
    (groups[k] = groups[k] || []).push({ ...c, y });
  }
  const list = [];
  for (const [k, cs] of Object.entries(groups)) {
    const dated = cs.filter((c) => c.y).sort((a, b) => a.date.localeCompare(b.date));
    const undated = cs.filter((c) => !c.y);
    // Split dated claims into runs of whole years of at most MAXB claims.
    let cur = [];
    const flush = () => { if (cur.length) list.push({ name: `${k}-${cur[0].y}${cur[cur.length - 1].y !== cur[0].y ? "-" + cur[cur.length - 1].y : ""}`, kind: k, claims: cur }); cur = []; };
    for (let i = 0; i < dated.length;) {
      const y = dated[i].y; const yr = dated.filter((c) => c.y === y);
      if (cur.length && cur.length + yr.length > MAXB) flush();
      if (yr.length > MAXB) { for (let j = 0; j < yr.length; j += MAXB) { cur = yr.slice(j, j + MAXB); const n = cur.length; flush(); if (n) list[list.length - 1].name += `-p${j / MAXB + 1}`; } }
      else cur.push(...yr);
      i += yr.length;
    }
    flush();
    for (let j = 0; j < undated.length; j += MAXB) list.push({ name: `${k}-undated${undated.length > MAXB ? "-p" + (j / MAXB + 1) : ""}`, kind: k, undated: true, claims: undated.slice(j, j + MAXB) });
  }
  for (const b of list) {
    wr(path.join(GIN, b.name + ".json"), {
      bucket: b.name, kind: b.kind, undated: !!b.undated,
      claims: b.claims.map((c) => ({ cid: c.cid, date: c.date, published: c.published, retro: c.retrospective || undefined, conf: c.confidence === "high" ? undefined : c.confidence, statement: c.statement })),
    });
  }
  console.log(list.map((b) => `${b.name}:${b.claims.length}`).join(" "));
  console.log(`${list.length} buckets, ${claims.length} claims`);
}

// ---------- check / existing / merge ----------
function checkBucket(b) {
  const problems = [];
  const p = path.join(GOUT, b + ".json");
  if (!fs.existsSync(p)) return { problems: [`${b}: no output`], facts: [] };
  let o; try { o = rd(p); } catch (e) { return { problems: [`${b}: bad JSON ${e.message}`], facts: [] }; }
  const inp = rd(path.join(GIN, b + ".json"));
  const input = new Set(inp.claims.map((c) => c.cid));
  const keys = inp.undated ? new Set(Object.values(existingFacts()).flat().map((f) => f.key)) : new Set();
  const got = new Set();
  (o.facts || []).forEach((f, i) => {
    for (const cid of f.claims || []) {
      if (!input.has(cid)) problems.push(`${b}: fact ${i + 1} has a claim not in this bucket: ${cid}`);
      if (got.has(cid)) problems.push(`${b}: ${cid} is in more than one fact`);
      got.add(cid);
    }
    if (!(f.claims || []).length) problems.push(`${b}: fact ${i + 1} has no claims`);
    if (!f.fact) problems.push(`${b}: fact ${i + 1} has no text`);
    if (f.join && !keys.has(f.join)) problems.push(`${b}: fact ${i + 1} joins unknown key ${f.join}`);
  });
  for (const cid of input) if (!got.has(cid)) problems.push(`${b}: ${cid} is in no fact`);
  return { problems, facts: o.facts || [] };
}
function check(list) {
  const all = list.length ? list : fs.readdirSync(GIN).map((f) => f.replace(/\.json$/, "")).sort();
  let bad = 0;
  for (const b of all) {
    const { problems, facts } = checkBucket(b);
    if (problems.length) { bad++; console.log(problems.slice(0, 15).join("\n") + (problems.length > 15 ? `\n... ${problems.length - 15} more` : "")); }
    else console.log(`${b}: ok (${facts.length} facts)`);
  }
  if (bad) process.exitCode = 1;
}
// Facts from dated buckets, per kind, each with a key "<bucket>#<n>".
function existingFacts() {
  const by = {};
  for (const f of fs.readdirSync(GIN)) {
    const inp = rd(path.join(GIN, f)); if (inp.undated) continue;
    const p = path.join(GOUT, f); if (!fs.existsSync(p)) continue;
    let o; try { o = rd(p); } catch { continue; }
    (o.facts || []).forEach((x, i) => (by[inp.kind] = by[inp.kind] || []).push({ key: `${inp.bucket}#${i + 1}`, date: x.date || "", fact: x.fact }));
  }
  return by;
}
function existing() {
  const dir = path.join(path.dirname(GIN), "existing");
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, list] of Object.entries(existingFacts())) { list.sort((a, b) => a.date.localeCompare(b.date)); wr(path.join(dir, k + ".json"), list); console.log(k, list.length); }
}
function merge() {
  const claims = rd(path.join(IDX, "claims.json"));
  const byCid = Object.fromEntries(claims.map((c) => [c.cid, c]));
  const buckets = fs.readdirSync(GIN).map((f) => f.replace(/\.json$/, "")).sort();
  const order = buckets.filter((b) => !rd(path.join(GIN, b + ".json")).undated).concat(buckets.filter((b) => rd(path.join(GIN, b + ".json")).undated));
  const problems = []; const byKey = {}; const bySeed = {}; const out = [];
  for (const b of order) {
    const r = checkBucket(b); problems.push(...r.problems);
    const kind = rd(path.join(GIN, b + ".json")).kind;
    r.facts.forEach((f, i) => {
      const key = `${b}#${i + 1}`;
      // Join only on an explicit "join"; a seed is a label (a broad seed can sit on several facts).
      let t = f.join && byKey[f.join];
      if (t) {
        t.claims.push(...(f.claims || [])); t.keys.push(key);
        if (f.seed && !t.seed) { t.seed = f.seed; (bySeed[f.seed] = bySeed[f.seed] || []).push(t); }
        else if (f.seed && t.seed !== f.seed) t.also = [...new Set([...(t.also || []), f.seed])];
        if (f.conflict) t.conflict = [t.conflict, f.conflict].filter(Boolean).join("; ");
      } else {
        t = { id: "", kind, fact: f.fact, date: f.date || "", seed: f.seed || "", conflict: f.conflict || "", claims: [...(f.claims || [])], keys: [key] };
        out.push(t);
        if (f.seed) (bySeed[f.seed] = bySeed[f.seed] || []).push(t);
      }
      byKey[key] = t;
    });
  }
  if (problems.length) { console.log(problems.slice(0, 40).join("\n")); console.log(`${problems.length} problems`); process.exitCode = 1; }
  // Facts made by hand for claims added after the grouping (manual-facts.json: [{kind, fact, date, seed, conflict, claims}]).
  const mp = path.join(IDX, "manual-facts.json");
  if (fs.existsSync(mp)) rd(mp).forEach((f, i) => {
    const key = `manual#${i + 1}`;
    for (const c of f.claims) if (!byCid[c]) problems.push(`manual: unknown claim ${c}`);
    const t = { id: "", kind: f.kind, fact: f.fact, date: f.date || "", seed: f.seed || "", conflict: f.conflict || "", claims: [...f.claims], keys: [key] };
    out.push(t); byKey[key] = t; if (t.seed) (bySeed[t.seed] = bySeed[t.seed] || []).push(t);
  });
  // Cross-bucket joins decided later (fact-joins.json: [["keyA", "keyB", "fact text for the joined fact"], ...]).
  const jp = path.join(IDX, "fact-joins.json");
  if (fs.existsSync(jp)) for (const [ka, kb, text] of rd(jp)) {
    const a = byKey[ka], b = byKey[kb];
    if (!a || !b) { console.log(`join: unknown key ${!a ? ka : kb}`); continue; }
    if (a === b) continue;
    a.claims.push(...b.claims); a.keys.push(...b.keys);
    if (text) a.fact = text;
    a.conflict = [a.conflict, b.conflict].filter(Boolean).join("; ");
    const also = [...(a.also || []), ...(b.also || []), ...(a.seed && b.seed && a.seed !== b.seed ? [b.seed] : [])];
    if (also.length) a.also = [...new Set(also)];
    a.seed = a.seed || b.seed; if (!a.date || (b.date && b.date.length > a.date.length)) a.date = b.date;
    for (const k of b.keys) byKey[k] = a;
    for (const list of Object.values(bySeed)) { const i = list.indexOf(b); if (i >= 0) list.splice(i, 1, ...(list.includes(a) ? [] : [a])); }
    out.splice(out.indexOf(b), 1);
  }
  // Seeds placed by hand (fact-seeds.json: {"021": "<fact key>"}) override the agents' choice.
  const sp = path.join(IDX, "fact-seeds.json");
  if (fs.existsSync(sp)) for (const [seed, key] of Object.entries(rd(sp))) {
    const t = byKey[key]; if (!t) { console.log(`seed ${seed}: unknown key ${key}`); continue; }
    for (const f of out) if (f.seed === seed && f !== t) { f.related_seed = seed; f.seed = ""; }
    if (bySeed[seed]) bySeed[seed] = [];
    if (t.seed && t.seed !== seed) t.also = [...new Set([...(t.also || []), t.seed])];
    t.seed = seed; t.seed_fixed = true;
  }
  // Disputed facts (fact-disputes.json: [{key, fact, parts: [{fact, date, claims}]}]): each version becomes its own
  // fact, and every version names the others. A part's claims move out of the fact unless the part has "copy": true.
  const dp = path.join(IDX, "fact-disputes.json");
  if (fs.existsSync(dp)) rd(dp).forEach((d, i) => {
    const t = byKey[d.key]; if (!t) { console.log(`dispute: unknown key ${d.key}`); return; }
    const group = `dispute-${i + 1}`;
    if (d.fact) t.fact = d.fact;
    if (d.date !== undefined) t.date = d.date;
    t.conflict = d.conflict || ""; t.dispute = group;
    d.parts.forEach((p, j) => {
      for (const c of p.claims) if (!byCid[c]) problems.push(`dispute ${d.key}: unknown claim ${c}`);
      if (!p.copy) t.claims = t.claims.filter((c) => !p.claims.includes(c));
      const v = { id: "", kind: t.kind, fact: p.fact, date: p.date || "", seed: "", conflict: p.conflict || "", claims: [...p.claims], keys: [`${d.key}/v${j + 2}`], dispute: group };
      out.push(v); byKey[v.keys[0]] = v;
    });
  });
  out.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  for (const f of out) f.articles = [...new Set(f.claims.map((c) => byCid[c] && byCid[c].article))].filter(Boolean).sort();
  // The fact with the most claims keeps the seed id (the Biography's <Ref id>); the others note it as related.
  for (const list of Object.values(bySeed)) {
    list.sort((a, b) => b.claims.length - a.claims.length);
    list.sort((a, b) => (b.seed_fixed ? 1 : 0) - (a.seed_fixed ? 1 : 0));
    list.slice(1).forEach((f) => { if (f.seed_fixed) return; f.related_seed = f.seed; f.seed = ""; });
  }
  wr(path.join(IDX, "facts.json"), out);
  if (problems.length && !process.exitCode) { console.log(problems.join("\n")); process.exitCode = 1; }
  console.log(`facts ${out.length}; seeds placed ${Object.keys(bySeed).length}; with conflict ${out.filter((f) => f.conflict).length}; single-source ${out.filter((f) => f.articles.length === 1).length}`);
}

// ---------- dupes ----------
// Facts from different buckets that may be the same episode: same month (or both undated-year match) and shared words.
const STOP = new Set("tom allen allens the a an and of to in on at for with was were his he him by from that as is be had has which who it its this their they or not but said would after before".split(" "));
const words = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
function dupes() {
  const facts = rd(path.join(IDX, "facts.json"));
  const W = facts.map((f) => words(f.fact));
  const pairs = [];
  for (let i = 0; i < facts.length; i++) for (let j = i + 1; j < facts.length; j++) {
    const a = facts[i], b = facts[j];
    if (a.keys[0].split("#")[0] === b.keys[0].split("#")[0]) continue;
    const undated = !a.date || !b.date;
    const near = undated || a.date.slice(0, 7) === b.date.slice(0, 7) || (a.date.length === 4 || b.date.length === 4) && a.date.slice(0, 4) === b.date.slice(0, 4);
    if (!near) continue;
    const inter = [...W[i]].filter((w) => W[j].has(w)).length;
    const jac = inter / (W[i].size + W[j].size - inter);
    // With no date to line them up, ask for more shared wording.
    if (undated ? jac >= 0.4 && inter >= 4 : jac >= 0.25 && inter >= 3) pairs.push({ a: a.keys[0], b: b.keys[0], score: +jac.toFixed(2), fa: `[${a.date}] ${a.fact}`, fb: `[${b.date}] ${b.fact}` });
  }
  pairs.sort((x, y) => y.score - x.score);
  wr(path.join(IDX, "dupe-candidates.json"), pairs);
  console.log(`${pairs.length} candidate pairs`);
}

// ---------- build ----------
// Draft site data in review/facts-index/draft/ (data/ is only changed once the user approves).
const WEIGHT = { report: 3, record: 1, recollection: 1 };
const NUMW = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" ");
const normVal = (field, v) => {
  v = v.trim();
  if (field === "rounds") { const w = v.toLowerCase().replace(/\s*rounds?$/, ""); if (NUMW.includes(w)) return String(NUMW.indexOf(w)); return w; }
  return v;
};
function wtally(entries, field) {
  const t = {};
  for (const e of entries) { const v = normVal(field, e[field] || ""); if (!v || v === "unknown") continue; t[v] = (t[v] || 0) + (WEIGHT[e.reported_as] || 1); }
  let r = Object.entries(t).sort((a, b) => b[1] - a[1]);
  // "within fifty miles of ..." is the articles of agreement, not where they fought.
  if (field === "place" && r.some(([v]) => !/^within\b/i.test(v))) r = r.filter(([v]) => !/^within\b/i.test(v));
  return r;
}
const pick = (t, n = 2) => t.slice(0, n).filter(([, w], i) => i === 0 || w >= t[0][1] / 2).map(([v]) => v).join(" or ");
function build() {
  const dir = path.join(IDX, "draft"); fs.mkdirSync(dir, { recursive: true });
  const seeds = Object.fromEntries(rd(path.join(IDX, "bout-seeds.json")).seeds.map((s) => [s.id, s]));
  const B = rd(path.join(IDX, "bouts.json")).bouts;
  const RES = { win: "win", loss: "loss", draw: "draw", "no contest": "broken up", forfeit: "canceled" };
  const fights = B.map((b) => {
    const E = b.entries, s = seeds[b.id] || {};
    // Date: the year most sources give, then the commonest month within it, then the commonest day within that.
    const narrow = (list, len) => {
      const t = wtally(list.filter((e) => (e.date || "").length >= len).map((e) => ({ ...e, date: e.date.slice(0, len) })), "date");
      return t.length ? t[0][0] : null;
    };
    let date = "";
    const yr = narrow(E, 4);
    if (yr) {
      date = yr; const inY = E.filter((e) => (e.date || "").startsWith(yr));
      const mo = narrow(inY, 7);
      if (mo) { date = mo; const day = narrow(inY.filter((e) => e.date.startsWith(mo)), 10); if (day) date = day; }
    }
    const res = wtally(E, "result").map(([v, w]) => [RES[v] || v, w]);
    // The result most sources give (weighted by how it was reported); every other result given is kept under "disputed".
    // A seed's "result" fixes the main result when the count picks a wrong one (entries placed under the wrong bout).
    if (s.result) { const r = RES[s.result] || s.result; res.sort((a, b) => (b[0] === r) - (a[0] === r)); }
    const result = res.length ? res[0][0] : "?";
    const disputed = res.slice(1).map(([v]) => ({ result: v, articles: [...new Set(E.filter((e) => (RES[e.result] || e.result) === v).map((e) => e.article))].sort() }));
    const details = [];
    const dl = [...new Set(E.map((e) => e.date).filter(Boolean))].sort();
    if (dl.length > 1) details.push("dates given: " + dl.join(", "));
    // The extraction notes are working notes for the agents, not for readers, so they stay in bouts.json.
    const f = {
      id: s.ref || b.id, date, opponent: b.opponent, result,
      articles: b.articles, location: pick(wtally(E, "place")), rounds: pick(wtally(E, "rounds")), time: pick(wtally(E, "duration")),
      stakes: pick(wtally(E, "stakes")), rules: pick(wtally(E, "rules"), 1), disputed, details,
    };
    if (/canceled|broken up/.test(result) && !/win|loss|draw/.test(result)) f.plannedOnly = result === "canceled";
    if (b.auto && b.articles.length < 2) f.questionable = true;
    if (b.opponent === "unknown" || /,| and /.test(b.opponent)) f.questionable = true;
    for (const k of Object.keys(f)) if (f[k] === "" || (Array.isArray(f[k]) && !f[k].length && k !== "articles")) delete f[k];
    return f;
  });
  const facts = rd(path.join(IDX, "facts.json"));
  let n = 51;
  const used = new Set(facts.flatMap((f) => [f.seed, ...(f.also || [])]).filter(Boolean));
  const out = facts.map((f) => {
    const o = { id: f.seed || "", kind: f.kind, date: f.date, fact: f.fact, articles: f.articles };
    if (f.conflict) o.conflict = f.conflict;
    if (f.related_seed) o.related = f.related_seed;
    return o;
  });
  // A fact that absorbed other cited facts is also written under their ids, so every <Ref id> still resolves.
  facts.forEach((f, i) => { for (const a of f.also || []) if (!out.some((o) => o.id === a)) out.push({ ...out[i], id: a, same_as: out[i].id || f.seed }); });
  for (const o of out) if (!o.id) { while (used.has(String(n).padStart(3, "0"))) n++; o.id = String(n++).padStart(3, "0"); }
  // Each version of a disputed fact lists the ids of the other versions.
  facts.forEach((f, i) => {
    if (!f.dispute) return;
    out[i].disputed = facts.map((g, j) => (g.dispute === f.dispute && j !== i ? out[j].id : null)).filter(Boolean);
  });
  for (const o of out) if (o.same_as) { const src = out.find((x) => x.id === o.same_as); if (src && src.disputed) o.disputed = src.disputed; }
  const quotes = rd(path.join(IDX, "quotes.json")).map((q) => ({ id: q.qid, speaker: q.speaker, text: q.text, topic: q.topic, article: q.article, published: q.published }));
  const js = (name, arr) => `// Generated by scripts/facts-group.cjs build from review/facts-index/. Do not edit by hand.\nexport const ${name} = ${JSON.stringify(arr, null, 1)};\n`;
  fs.writeFileSync(path.join(dir, "fights.js"), js("fights", fights));
  fs.writeFileSync(path.join(dir, "facts.js"), js("facts", out));
  fs.writeFileSync(path.join(dir, "quotes.js"), js("quotes", quotes));
  console.log(`draft: fights ${fights.length}, facts ${out.length}, quotes ${quotes.length} → ${path.relative(ROOT, dir)}`);
}

const cmd = process.argv[2];
({ index, bouts, buckets, merge, existing, dupes, build, check: () => check(process.argv.slice(3)) }[cmd] || (() => console.log("usage: facts-group.cjs index|bouts|buckets|merge")))();
