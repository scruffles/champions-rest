// Match name spellings across review/facts/*.json (people, places, fight opponents).
// Usage:
//   node scripts/facts-names.cjs build      group spellings, write review/facts-index/names.json and print groups that need a decision
//   node scripts/facts-names.cjs show <name> list the spellings grouped with <name> and a few excerpts
// Decisions go in review/facts-index/aliases.json: { "people": { "Spelling": "Canonical name" | "-" (drop) }, "places": {...} }
// Aliases always win over the automatic grouping.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const FACTS = path.join(ROOT, "review/facts");
const OUT = path.join(ROOT, "review/facts-index");
const ALIASES = path.join(OUT, "aliases.json");

const NICK = {
  charley: "charles", charlie: "charles", chas: "charles", charles: "charles",
  jim: "james", jas: "james", jem: "james", jimmy: "james", james: "james",
  bill: "william", billy: "william", wm: "william", will: "william", william: "william",
  mike: "michael", michael: "michael", joe: "joseph", jos: "joseph", joseph: "joseph",
  bob: "robert", robert: "robert", tom: "thomas", thos: "thomas", thomas: "thomas",
  jack: "john", johnny: "john", john: "john", ned: "edward", ed: "edward", edward: "edward",
  geo: "george", george: "george", harry: "henry", henry: "henry", dan: "daniel", daniel: "daniel",
  pat: "patrick", patsy: "patrick", patrick: "patrick", fred: "frederick", frederick: "frederick",
  tim: "timothy", timothy: "timothy", dick: "richard", richard: "richard", sam: "samuel", samuel: "samuel",
};
const TITLES = /^(mr|mrs|miss|capt|captain|col|colonel|prof|professor|dr|judge|gen|general|major|sergt|sgt|officer|detective|lieut|lieutenant|rev|hon|young|old)$/;

function readFacts() {
  const out = [];
  for (const f of fs.readdirSync(FACTS).sort()) {
    if (!/^\d+\.json$/.test(f)) continue;
    out.push(JSON.parse(fs.readFileSync(path.join(FACTS, f), "utf8")));
  }
  return out;
}

// Collect every spelling with counts and a few sample excerpts.
function collect(docs) {
  const people = {}, places = {};
  const add = (o, name, id, excerpt) => {
    if (!name || typeof name !== "string") return;
    name = name.trim();
    const e = (o[name] = o[name] || { n: 0, ids: new Set(), ex: [] });
    e.n++; e.ids.add(id);
    if (excerpt && e.ex.length < 3) e.ex.push(`${id}: ${excerpt}`);
  };
  for (const d of docs) {
    for (const c of d.claims || []) {
      (c.people || []).forEach((p) => add(people, p, d.id, c.excerpt));
      (c.places || []).forEach((p) => add(places, p, d.id, c.excerpt));
    }
    for (const x of d.fights || []) {
      add(people, x.opponent, d.id, x.excerpt);
      if (x.place) add(places, x.place, d.id, x.excerpt);
    }
  }
  return { people, places };
}

const letters = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const skeleton = (w) => w.replace(/e$/, "").replace(/(.)\1+/g, "$1");
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function parsePerson(name) {
  const clean = name.replace(/\(.*?\)/g, " ").replace(/['"]/g, "");
  let toks = letters(clean).split(" ").filter(Boolean);
  toks = toks.filter((t, i) => !(i < toks.length - 1 && TITLES.test(t)));
  if (!toks.length) return null;
  const surname = toks[toks.length - 1];
  const firsts = toks.slice(0, -1);
  const first = firsts[0] || "";
  return { surname, key: skeleton(surname), first: NICK[first] || first, initial: first ? first[0] : "", full: firsts.length > 0 && first.length > 1 };
}

// Union-find over surname keys that differ by one letter (Parkinson/Perkinson, Conner/Connor).
function clusterKeys(keys) {
  const parent = {}; keys.forEach((k) => (parent[k] = k));
  const find = (k) => (parent[k] === k ? k : (parent[k] = find(parent[k])));
  const ks = [...keys].sort();
  for (let i = 0; i < ks.length; i++)
    for (let j = i + 1; j < ks.length; j++)
      if (ks[i].length >= 5 && ks[j].length >= 5 && ks[i][0] === ks[j][0] && lev(ks[i], ks[j]) <= 1) parent[find(ks[j])] = find(ks[i]);
  return find;
}

function groupPeople(people, aliases) {
  const map = {}, review = [];
  const parsed = {};
  for (const [name, e] of Object.entries(people)) {
    if (aliases[name] !== undefined) continue;
    if (/^unknown$/i.test(name) || /^tom allen$/i.test(name.replace(/\./g, ""))) { map[name] = name === "unknown" ? "unknown" : "Tom Allen"; continue; }
    if (/,| and | & /.test(name)) { review.push({ why: "several names in one field", names: [[name, e.n]] }); continue; }
    const p = parsePerson(name);
    if (!p) { review.push({ why: "unparsed", names: [[name, e.n]] }); continue; }
    parsed[name] = p;
  }
  const find = clusterKeys(new Set(Object.values(parsed).map((p) => p.key)));
  const bySurname = {};
  for (const [name, p] of Object.entries(parsed)) (bySurname[find(p.key)] = bySurname[find(p.key)] || []).push(name);

  for (const names of Object.values(bySurname)) {
    // Sub-groups by canonical first name; bare surnames and initials attach if unambiguous.
    const subs = {};
    const loose = [];
    for (const n of names) {
      const p = parsed[n];
      if (p.full) (subs[p.first] = subs[p.first] || []).push(n);
      else loose.push(n);
    }
    const count = (ns) => ns.reduce((s, n) => s + people[n].n, 0);
    const label = (ns) => ns.slice().sort((a, b) => people[b].n - people[a].n || b.length - a.length)[0];
    const subKeys = Object.keys(subs);
    for (const k of subKeys) for (const n of subs[k]) map[n] = label(subs[k]);
    const total = subKeys.reduce((s, k) => s + count(subs[k]), 0);
    const ambiguous = [];
    for (const n of loose) {
      const p = parsed[n];
      const fits = subKeys.filter((k) => !p.initial || k[0] === p.initial);
      const best = fits.sort((a, b) => count(subs[b]) - count(subs[a]))[0];
      if (subKeys.length === 0) map[n] = label(loose); // only bare surnames/initials: use the commonest spelling
      else if (fits.length === 1 || (best && count(subs[best]) >= 0.85 * total)) map[n] = label(subs[best]);
      else ambiguous.push(n);
    }
    // Different first names under one surname (Charley vs Jim Gallagher) or loose names that fit several: ask.
    const surnameSet = new Set(names.map((n) => parsed[n].surname));
    if (subKeys.length > 1 || ambiguous.length || surnameSet.size > 1) {
      const rows = names.map((n) => [n, people[n].n, map[n] || "?"]).sort((a, b) => b[1] - a[1]);
      if (subKeys.length > 1 || ambiguous.length) review.push({ why: subKeys.length > 1 ? "different first names" : "bare surname fits several", names: rows });
      else review.push({ why: "spellings joined", names: rows, auto: true });
    }
    for (const n of ambiguous) map[n] = n;
  }
  for (const [n, c] of Object.entries(aliases)) if (people[n]) map[n] = c;
  return { map, review };
}

// Places join only when the part before the first comma is the same (so "619 Market Street" and
// "Market Street" stay apart); the state or country after the comma may differ or be missing.
function placeKey(name) {
  return letters(name.split(",")[0].replace(/\(.*?\)/g, " ").replace(/\bSt\.?\s/i, "saint ")).replace(/^the /, "") + "|" + (name.split(",")[0].match(/\d+/g) || []).join(" ");
}
function groupPlaces(places, aliases) {
  const map = {}, review = [], by = {};
  for (const name of Object.keys(places)) {
    if (aliases[name] !== undefined) continue;
    if (/^unknown$/i.test(name)) { map[name] = "unknown"; continue; }
    (by[placeKey(name)] = by[placeKey(name)] || []).push(name);
  }
  for (const names of Object.values(by)) {
    const label = names.slice().sort((a, b) => places[b].n - places[a].n || b.length - a.length)[0];
    names.forEach((n) => (map[n] = label));
    if (names.length > 1) {
      const tails = new Set(names.map((n) => letters(n.split(",").slice(1).join(" "))).filter(Boolean));
      const rows = names.map((n) => [n, places[n].n, label]).sort((a, b) => b[1] - a[1]);
      review.push({ why: tails.size > 1 ? "different states or countries" : "spellings joined", names: rows, auto: tails.size <= 1 });
    }
  }
  for (const [n, c] of Object.entries(aliases)) if (places[n]) map[n] = c;
  return { map, review };
}

function build() {
  const docs = readFacts();
  const { people, places } = collect(docs);
  fs.mkdirSync(OUT, { recursive: true });
  const aliases = fs.existsSync(ALIASES) ? JSON.parse(fs.readFileSync(ALIASES, "utf8")) : { people: {}, places: {} };
  const P = groupPeople(people, aliases.people || {});
  const L = groupPlaces(places, aliases.places || {});
  fs.writeFileSync(path.join(OUT, "names.json"), JSON.stringify({ people: P.map, places: L.map }, null, 1) + "\n");
  const pr = (title, list) => {
    const open = list.filter((r) => !r.auto);
    console.log(`\n## ${title}: ${open.length} to decide, ${list.length - open.length} joined automatically`);
    for (const r of list) console.log(`${r.auto ? "  auto" : "  DECIDE"} (${r.why}): ` + r.names.map((x) => `${x[0]} ×${x[1]}${x[2] && x[2] !== x[0] ? " → " + x[2] : ""}`).join(" | "));
  };
  pr("People", P.review);
  pr("Places", L.review);
  const distinct = (m) => new Set(Object.values(m)).size;
  console.log(`\npeople: ${Object.keys(people).length} spellings → ${distinct(P.map)} names; places: ${Object.keys(places).length} → ${distinct(L.map)}`);
}

function show(q) {
  const { people, places } = collect(readFacts());
  const names = JSON.parse(fs.readFileSync(path.join(OUT, "names.json"), "utf8"));
  for (const [kind, src, map] of [["person", people, names.people], ["place", places, names.places]]) {
    const target = map[q] || q;
    for (const [n, c] of Object.entries(map)) if (c === target || n === q) {
      const e = src[n]; if (!e) continue;
      console.log(`${kind}: ${n} ×${e.n} → ${c}  [${[...e.ids].join(",")}]`);
      e.ex.forEach((x) => console.log("    " + x.slice(0, 220)));
    }
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "build") build();
else if (cmd === "show") show(rest.join(" "));
else console.log("usage: facts-names.cjs build | show <name>");

module.exports = { readFacts };
