# Life Map: Downtown St. Louis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/map` page that shows Tom Allen's downtown St. Louis places on our own drawn 1875 map, with a swipe comparison against our own drawn map of today. It has clickable pins, a place card, zoom and a clickable timeline.

**Architecture:**
- All geometry is longitude/latitude.
  - The today layer comes from OpenStreetMap data, fetched once and committed as small GeoJSON.
  - The 1875 layer is the today layer plus a hand-made edits file. The edits are checked against the 1875 Wilson scan, which is only a tracing reference and never ships.
- A build script projects both layers with one shared Web Mercator projection (`projection.mjs`) into ready-made SVG path data.
- React renders those paths and puts pins on top using the same projection.

**Tech Stack:** Node 23 build scripts (CommonJS, `sharp` for check images), React 18 + react-router 7, Less, and `node --test` for unit tests (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-11-17-life-map-design.md`. This plan covers spec build steps 1–2. The citywide level (step 3) and the America view (step 4) get their own plans.

**Rules from `.claude/CLAUDE.md` that apply:**
- Never push.
- Stage specific paths only.
- Don't touch `data/database.js` or `data/facts.js`.
- `data/places.js` is new published data, so show the draft to the user before copying it into `data/` (Task 3).
- Update `CHANGELOG.md` in the final task.

---

## File map

| File | Responsibility |
|---|---|
| `src/components/lifemap/projection.mjs` | Frames (bounds, size) and `project`/`unproject`/`inFrame`. Shared by build scripts and React |
| `src/components/lifemap/projection.test.mjs` | Tests |
| `src/components/lifemap/timeline.mjs` | Life periods, year parsing, era matching, the fights shown on the timeline, `placeYears` |
| `src/components/lifemap/timeline.test.mjs` | Tests |
| `scripts/lifemap/geo.cjs` | Pure geometry: simplify, SVG path, polyline length, label placement |
| `scripts/lifemap/geo.test.cjs` | Tests |
| `scripts/lifemap/places.cjs` | `review/places/places.json` → `data/places.js` (draft first) |
| `scripts/lifemap/places.test.cjs` | Tests |
| `scripts/lifemap/osm.cjs` | Overpass fetch (CLI) and `normalize()` OSM JSON → GeoJSON features, plus `riverPolygon()` |
| `scripts/lifemap/osm.test.cjs` | Tests |
| `scripts/lifemap/edits.cjs` | `applyEdits(fc, edits)`: today → 1875 |
| `scripts/lifemap/edits.test.cjs` | Tests |
| `scripts/lifemap/build.cjs` | GeoJSON → `src/components/lifemap/geo/stl-downtown-{1875,today}.json` |
| `scripts/lifemap/build.test.cjs` | Tests |
| `scripts/lifemap/check-overlay.cjs` | Tracing check images: our layer over the warped scan (or OSM tiles), with a lon/lat grid |
| `scripts/lifemap/check-overlay.test.cjs` | Tests for the polynomial fit |
| `mapdata/stl-modern.geojson` | Normalized OSM features for the downtown frame (generated, committed) |
| `mapdata/stl-1875-edits.json` | Hand-made 1875 differences (committed) |
| `mapdata/reference/wilson1875-control.json` | Scan control points (committed; the scan itself is not) |
| `src/components/lifemap/geo/*.json` | Built SVG layers (generated, committed) |
| `src/components/lifemap/MapLayer.jsx` | Renders one built layer |
| `src/components/lifemap/StLouisMap.jsx` | Map frame: zoom, pan, swipe, pins |
| `src/components/lifemap/PlaceCard.jsx` | Selected place details |
| `src/components/lifemap/LifeTimeline.jsx` | Periods and fight markers |
| `src/components/lifemap/LifeMap.jsx` | The page |
| `src/styles/lifemap.less` | Page styles, imported from `src/index.less` |
| `src/components/shared.jsx` | Gains `useZoomGestures`, moved from `ArticleDetail.jsx` |
| `src/components/articles/ArticleDetail.jsx` | Imports the moved hook |
| `src/components/routes.jsx`, `src/components/Navbar.jsx` | Route and nav link |
| `package.json` | `test` and `build-map` scripts |

Gitignored work folders: raw OSM in `review/work/maps/osm/`, tiles in `review/work/maps/tiles/`, check images in `review/work/maps/check/`, and the scan in `review/work/maps/dl/`.

---

### Task 1: Test runner and projection

**Files:**
- Modify: `package.json` (scripts)
- Create: `src/components/lifemap/projection.mjs`
- Test: `src/components/lifemap/projection.test.mjs`

- [ ] **Step 1: Add the scripts to `package.json`**

In `"scripts"`, add these after `"format"`:

```json
    "test": "node --test scripts/lifemap/*.test.cjs src/components/lifemap/*.test.mjs",
    "build-map": "node scripts/lifemap/build.cjs"
```

- [ ] **Step 2: Write the failing test**

`src/components/lifemap/projection.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { FRAMES, project, unproject, inFrame } from "./projection.mjs";

const D = FRAMES.downtown;

test("downtown frame corners map to the frame edges", () => {
  assert.deepEqual(project(D, D.west, D.north).map(Math.round), [0, 0]);
  const [x, y] = project(D, D.east, D.south);
  assert.equal(Math.round(x), D.width);
  assert.equal(Math.round(y), D.height);
});

test("downtown frame keeps true proportions (about 2.9 km wide, 3.1 km tall)", () => {
  assert.equal(D.width, 1800);
  assert.ok(D.height > 1890 && D.height < 1950, `height ${D.height}`);
});

test("project accepts a frame id", () => {
  assert.deepEqual(project("downtown", -90.18761, 38.62985), project(D, -90.18761, 38.62985));
});

test("unproject inverts project", () => {
  const [x, y] = project(D, -90.18761, 38.62985);
  const [lon, lat] = unproject(D, x, y);
  assert.ok(Math.abs(lon + 90.18761) < 1e-9);
  assert.ok(Math.abs(lat - 38.62985) < 1e-9);
});

test("inFrame", () => {
  assert.equal(inFrame(D, -90.18761, 38.62985), true);
  assert.equal(inFrame(D, -90.2051, 38.60852), false);
});
```

- [ ] **Step 3: Run it and check that it fails**

Run: `node --test src/components/lifemap/projection.test.mjs`
Expected: FAIL, `Cannot find module ... projection.mjs`.

- [ ] **Step 4: Implement `src/components/lifemap/projection.mjs`**

```js
// One Web Mercator projection for the build scripts and the page, so pins and drawn layers always line up.
// Map units: frame pixels at zoom 100%. Downtown is ~1.6 m per unit.
const mx = (lon) => (lon + 180) / 360;
const my = (lat) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
const lonOf = (x) => x * 360 - 180;
const latOf = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

function makeFrame(id, west, south, east, north, width) {
  const sx = width / (mx(east) - mx(west));
  const height = Math.round((my(south) - my(north)) * sx);
  return { id, west, south, east, north, width, height, sx };
}

// downtown: Cass Ave to Chouteau Ave, 18th St to the Illinois bank
export const FRAMES = {
  downtown: makeFrame("downtown", -90.2055, 38.6155, -90.172, 38.6435, 1800),
};

const frameOf = (f) => (typeof f === "string" ? FRAMES[f] : f);

export function project(frame, lon, lat) {
  const f = frameOf(frame);
  return [(mx(lon) - mx(f.west)) * f.sx, (my(lat) - my(f.north)) * f.sx];
}

export function unproject(frame, x, y) {
  const f = frameOf(frame);
  return [lonOf(x / f.sx + mx(f.west)), latOf(y / f.sx + my(f.north))];
}

export function inFrame(frame, lon, lat) {
  const f = frameOf(frame);
  return lon >= f.west && lon <= f.east && lat >= f.south && lat <= f.north;
}
```

- [ ] **Step 5: Run the test and check that it passes**

Run: `node --test src/components/lifemap/projection.test.mjs`
Expected: 5 tests pass. If the height test fails, print `FRAMES.downtown.height` and confirm it is about 1.066 × width. Don't change the test's range unless the bounds changed.

- [ ] **Step 6: Commit**

```bash
git add package.json src/components/lifemap/projection.mjs src/components/lifemap/projection.test.mjs
git commit -m "Life map: shared projection and test script"
```

---

### Task 2: Timeline logic

**Files:**
- Create: `src/components/lifemap/timeline.mjs`
- Test: `src/components/lifemap/timeline.test.mjs`

- [ ] **Step 1: Write the failing test**

`src/components/lifemap/timeline.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIFE_ERAS, toYear, placeSpan, activeInEra, placeYears, americanFights } from "./timeline.mjs";

const era = (id) => LIFE_ERAS.find((e) => e.id === id);

test("toYear reads year, year-month and full dates", () => {
  assert.equal(toYear("1870"), 1870);
  assert.equal(toYear("1870", true), 1871);
  assert.equal(toYear("1870-03"), 1870 + 2 / 12);
  assert.equal(toYear("1870-03", true), 1870 + 3 / 12);
  assert.equal(toYear("1888-06-17"), 1888 + 5 / 12 + 16 / 365);
  assert.equal(toYear("pre-1868"), null);
  assert.equal(toYear(undefined), null);
});

test("placeSpan falls back to the one date given", () => {
  assert.deepEqual(placeSpan({ from: "1870-03", to: "1876-04" }), [1870 + 2 / 12, 1876 + 4 / 12]);
  assert.deepEqual(placeSpan({ from: null, to: "1901-02" }), [1901 + 1 / 12, 1901 + 2 / 12]);
  assert.equal(placeSpan({ from: null, to: null }), null);
});

test("activeInEra matches overlapping places only", () => {
  const wash = { from: "1870-03", to: "1876-04" };
  const kelly = { from: "1876-09", to: "1876-09" };
  assert.equal(activeInEra(wash, era("washington-417")), true);
  assert.equal(activeInEra(kelly, era("washington-417")), false);
  assert.equal(activeInEra(kelly, null), true);
});

test("placeYears", () => {
  assert.equal(placeYears({ from: "1870-03", to: "1876-04" }), "1870–1876");
  assert.equal(placeYears({ from: "1888-06-17", to: "1888-06-17" }), "1888");
  assert.equal(placeYears({ from: null, to: "1901-02" }), "1901");
  assert.equal(placeYears({}), "");
});

test("americanFights keeps fights that happened in America, 1868-1903", () => {
  const fx = [
    { id: "a", date: "1866-06-13", result: "win", location: "England" },
    { id: "b", date: "1869-08-17", result: "win", location: "Foster's Island or near St. Louis" },
    { id: "c", date: "1870-09-13", result: "canceled", location: "near St. Louis", plannedOnly: true },
    { id: "d", date: "1873-10-28", result: "broken up", location: "Omaha" },
    { id: "e", date: "1877-10-29", result: "win", location: "London district, England or England" },
    { id: "f", date: "1879-03-10", result: "win", location: "England or Glasgow" },
    { id: "g", date: undefined, result: "loss", location: "near New Orleans" },
    { id: "h", date: "1888-06-17", result: "loss", location: "Seventh street" },
    { id: "i", date: "1869-03-24", result: "?" },
  ];
  assert.deepEqual(americanFights(fx).map((f) => f.id), ["b", "h"]);
});

test("eras are in order and don't overlap", () => {
  for (let i = 1; i < LIFE_ERAS.length; i++) assert.ok(LIFE_ERAS[i].from >= LIFE_ERAS[i - 1].to, LIFE_ERAS[i].id);
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test src/components/lifemap/timeline.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/components/lifemap/timeline.mjs`**

```js
// Where Tom Allen lived or kept saloon, period by period. place = id in data/places.js.
export const T_START = 1866;
export const T_END = 1904;

export const LIFE_ERAS = [
  { id: "england-1", label: "England", short: "Eng.", from: 1866, to: 1867.4, place: "birmingham", tone: "away" },
  { id: "cleveland", label: "Cleveland", short: "Clev.", from: 1867.4, to: 1868.2, place: "cleveland", tone: "away" },
  { id: "fourth-washington", label: "Fourth & Washington", short: "4th", from: 1868.2, to: 1869.2, place: "stl-saloon-4th-washington-1868", tone: "stl" },
  { id: "fifth-street", label: "Fifth Street", short: "5th", from: 1869.2, to: 1870.2, place: "stl-saloon-fifth-1869", tone: "stl" },
  { id: "washington-417", label: "417 Washington Ave.", from: 1870.2, to: 1876.3, place: "stl-417-washington", tone: "main" },
  { id: "toronto", label: "Toronto", short: "", from: 1876.7, to: 1877.3, place: "toronto", tone: "away" },
  { id: "england-2", label: "England", from: 1877.3, to: 1882.8, place: "london", tone: "away" },
  { id: "market-619", label: "619 Market Street · the Champion's Rest", from: 1883.2, to: 1903.3, place: "stl-619-market", tone: "main" },
];

// "1870" | "1870-03" | "1870-03-04" → decimal year (start of that period, or its end with end=true)
export function toYear(d, end = false) {
  const m = String(d ?? "").match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!m[2]) return end ? y + 1 : y;
  const mo = Number(m[2]) - 1;
  if (!m[3]) return y + (mo + (end ? 1 : 0)) / 12;
  return y + mo / 12 + (Number(m[3]) - 1) / 365;
}

export function placeSpan(p) {
  const a = toYear(p.from) ?? toYear(p.to);
  const b = toYear(p.to, true) ?? toYear(p.from, true);
  return a == null || b == null ? null : [a, b];
}

export function activeInEra(p, era) {
  if (!era) return true;
  const s = placeSpan(p);
  return !!s && s[0] < era.to && s[1] > era.from;
}

export function placeYears(p) {
  const a = String(p.from ?? "").slice(0, 4);
  const b = String(p.to ?? "").slice(0, 4);
  if (!a && !b) return "";
  if (!a || !b || a === b) return a || b;
  return `${a}–${b}`;
}

const NO_FIGHT = ["?", "none", "not fought", "canceled", "broken up"];

export function americanFights(fights) {
  return fights
    .filter((f) => !f.plannedOnly && !NO_FIGHT.includes(f.result))
    .map((f) => ({ ...f, year: toYear(f.date) }))
    .filter((f) => f.year != null && f.year >= 1868 && f.year < 1904 && !/England|Glasgow|London/.test(f.location || ""));
}
```

- [ ] **Step 4: Run the test and check that it passes**

Run: `node --test src/components/lifemap/timeline.test.mjs`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/lifemap/timeline.mjs src/components/lifemap/timeline.test.mjs
git commit -m "Life map: timeline periods and era matching"
```

---

### Task 3: Places data

**Files:**
- Modify: `review/places/places.json` (untracked research file: add two coordinates and `today` fields)
- Create: `scripts/lifemap/places.cjs`
- Test: `scripts/lifemap/places.test.cjs`
- Create (after user approval): `data/places.js`

- [ ] **Step 1: Add the missing coordinates and the `today` addresses to `review/places/places.json`**

Run this one-off edit. Hennessy's and the fight steamer come from the mockup's pin positions, converted back through the old affine fit, so they're `area` precision:

```bash
python3 - <<'EOF'
import json
p='review/places/places.json'; d=json.load(open(p))
by={x['id']:x for x in d['places']}
by['stl-hennessys'].update(lat=38.63113, lon=-90.18646, precision='area')
by['stl-foot-of-elm'].update(lat=38.62236, lon=-90.18519, precision='area')
today = {
 'stl-417-washington': 'Washington Ave between N Broadway and N 4th St',
 'stl-619-market': 'Market St between S 6th and S 7th St',
 'stl-daly-fight-1888': 'N 7th St between Market and Chestnut',
 'stl-kellys-9-n-ninth': 'N 9th St just north of Market St',
 'stl-saloon-4th-washington-1868': 'N 4th St at Washington Ave',
 'stl-mozart-hall': 'N Broadway at Biddle St',
 'stl-saloon-fifth-1869': "N Broadway between O'Fallon and Biddle",
 'stl-hennessys': 'N 4th St, north of Washington Ave (approximate)',
 'stl-foot-of-elm': 'The riverfront at the south end of the Gateway Arch grounds (approximate)',
}
for k,v in today.items(): by[k]['today']=v
json.dump(d, open(p,'w'), indent=2, ensure_ascii=False); open(p,'a').write('\n')
print('ok')
EOF
```

Expected: `ok`.

- [ ] **Step 2: Write the failing test**

`scripts/lifemap/places.test.cjs`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildPlaces, renderModule } = require("./places.cjs");

const inDowntown = (lon, lat) => lon > -90.21 && lon < -90.17 && lat > 38.61 && lat < 38.65;
const src = {
  places: [
    { id: "birmingham", name: "Birmingham", kind: "residence", city: "Birmingham, England", lat: 52.48, lon: -1.89, precision: "city", from: "1839", to: "1867", facts: ["001"] },
    { id: "stl-417-washington", name: "417 Washington", kind: "saloon", city: "St. Louis, Missouri", address: "417 Washington Avenue", today: "Washington Ave", lat: 38.62985, lon: -90.18761, precision: "block", from: "1870-03", to: "1876-04", facts: ["098"], maps: ["x"] },
    { id: "stl-sportsmans-park", name: "Sportsman's Park", kind: "venue", city: "St. Louis, Missouri", lat: 38.6567, lon: -90.21993, precision: "intersection", from: "1883", to: "1883", facts: [] },
    { id: "stl-grave", name: "Grave", kind: "burial", city: "St. Louis, Missouri", lat: null, lon: null, precision: null, facts: [] },
    { id: "chicago", name: "Chicago", kind: "travel", city: "Chicago, Illinois", lat: 41.88, lon: -87.63, precision: "city", from: "1875", to: "1886", facts: [] },
  ],
};

test("keeps located places and assigns levels", () => {
  const out = buildPlaces(src, inDowntown);
  assert.deepEqual(out.map((p) => [p.id, p.level]), [
    ["birmingham", "atlantic"],
    ["stl-417-washington", "downtown"],
    ["stl-sportsmans-park", "city"],
    ["chicago", "america"],
  ]);
});

test("keeps only the published fields", () => {
  const p = buildPlaces(src, inDowntown).find((x) => x.id === "stl-417-washington");
  assert.deepEqual(Object.keys(p).sort(), ["address", "city", "facts", "fights", "from", "id", "kind", "lat", "level", "lon", "name", "notes", "precision", "to", "today"].sort());
  assert.equal(p.maps, undefined);
  assert.deepEqual(p.fights, []);
});

test("renderModule writes an ES module with a generated header", () => {
  const s = renderModule([{ id: "x" }]);
  assert.match(s, /^\/\/ Generated by scripts\/lifemap\/places\.cjs/);
  assert.match(s, /export const places = \[/);
});
```

- [ ] **Step 3: Run it and check that it fails**

Run: `node --test scripts/lifemap/places.test.cjs`
Expected: FAIL, `Cannot find module './places.cjs'`.

- [ ] **Step 4: Implement `scripts/lifemap/places.cjs`**

```js
// Builds the published places list from the research gazetteer.
//   node scripts/lifemap/places.cjs          -> review/places/places.draft.js (to show the user)
//   node scripts/lifemap/places.cjs --write  -> data/places.js (only after the user approves the draft)
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const FIELDS = ["id", "name", "kind", "city", "address", "today", "from", "to", "lat", "lon", "precision", "facts", "fights", "notes"];

function levelOf(p, inDowntown) {
  if (/England/.test(p.city || "")) return "atlantic";
  if (/^St\. Louis/.test(p.city || "")) return inDowntown(p.lon, p.lat) ? "downtown" : "city";
  return "america";
}

function buildPlaces(src, inDowntown) {
  return src.places
    .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
    .map((p) => {
      const out = {};
      for (const k of FIELDS) out[k] = p[k] ?? (k === "facts" || k === "fights" ? [] : null);
      out.level = levelOf(p, inDowntown);
      return out;
    });
}

function renderModule(places) {
  return (
    "// Generated by scripts/lifemap/places.cjs from review/places/places.json. Do not edit by hand.\n" +
    `export const places = ${JSON.stringify(places, null, 1)};\n`
  );
}

async function main() {
  const { FRAMES, inFrame } = await import(path.join(ROOT, "src/components/lifemap/projection.mjs"));
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, "review/places/places.json"), "utf8"));
  const places = buildPlaces(src, (lon, lat) => inFrame(FRAMES.downtown, lon, lat));
  const out = process.argv.includes("--write") ? "data/places.js" : "review/places/places.draft.js";
  fs.writeFileSync(path.join(ROOT, out), renderModule(places));
  const count = (l) => places.filter((p) => p.level === l).length;
  console.log(`${out}: ${places.length} places (downtown ${count("downtown")}, city ${count("city")}, america ${count("america")}, atlantic ${count("atlantic")})`);
}

if (require.main === module) main();
module.exports = { buildPlaces, renderModule, levelOf };
```

- [ ] **Step 5: Run the test and check that it passes**

Run: `node --test scripts/lifemap/places.test.cjs`
Expected: 3 tests pass.

- [ ] **Step 6: Write the draft and show it to the user**

Run: `node scripts/lifemap/places.cjs`
Expected: a line like `review/places/places.draft.js: 40 places (downtown 9, city 2, america 27, atlantic 2)`. The exact counts depend on the gazetteer, but downtown must include `stl-417-washington`, `stl-619-market`, `stl-hennessys` and `stl-foot-of-elm`.

Show the user the counts and the downtown entries (`grep -B2 -A16 '"level": "downtown"' review/places/places.draft.js | head -80` gives a quick view), and ask for approval to write `data/places.js`. **Stop here until they approve.**

- [ ] **Step 7: After approval, write `data/places.js`**

Run: `node scripts/lifemap/places.cjs --write`
Expected: `data/places.js: …` with the same counts.

- [ ] **Step 8: Commit**

```bash
git add scripts/lifemap/places.cjs scripts/lifemap/places.test.cjs data/places.js
git commit -m "Life map: published places list generated from the gazetteer"
```

(`review/places/` stays untracked; ask the user before committing it.)

---

### Task 4: Geometry helpers

**Files:**
- Create: `scripts/lifemap/geo.cjs`
- Test: `scripts/lifemap/geo.test.cjs`

- [ ] **Step 1: Write the failing test**

`scripts/lifemap/geo.test.cjs`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { simplify, toPath, polylineLength, labelAt, placeLabels } = require("./geo.cjs");

test("simplify drops points within tolerance and keeps the ends", () => {
  const pts = [[0, 0], [1, 0.1], [2, -0.1], [3, 0], [3, 5]];
  assert.deepEqual(simplify(pts, 0.5), [[0, 0], [3, 0], [3, 5]]);
  assert.deepEqual(simplify([[0, 0], [1, 1]], 0.5), [[0, 0], [1, 1]]);
});

test("toPath writes one-decimal SVG commands", () => {
  assert.equal(toPath([[0, 0], [10.04, 5.06]]), "M0 0L10 5.1");
  assert.equal(toPath([[0, 0], [1, 0], [1, 1]], true), "M0 0L1 0L1 1Z");
});

test("polylineLength", () => {
  assert.equal(polylineLength([[0, 0], [3, 4], [3, 10]]), 11);
});

test("labelAt puts the label halfway along, reading left to right", () => {
  const a = labelAt([[0, 0], [100, 0]]);
  assert.deepEqual([a.x, a.y, a.angle], [50, 0, 0]);
  const b = labelAt([[100, 0], [0, 0]]); // drawn right-to-left: text must not be upside down
  assert.equal(b.angle, 0);
  const c = labelAt([[0, 100], [0, 0]]);
  assert.equal(Math.abs(c.angle), 90);
});

test("placeLabels drops repeats of a name close together and overlapping labels", () => {
  const out = placeLabels(
    [
      { text: "MARKET ST.", x: 100, y: 100, angle: 0, len: 500, rank: 0 },
      { text: "MARKET ST.", x: 200, y: 100, angle: 0, len: 300, rank: 0 },
      { text: "WALNUT ST.", x: 110, y: 104, angle: 0, len: 400, rank: 1 },
      { text: "MARKET ST.", x: 1200, y: 100, angle: 0, len: 200, rank: 0 },
    ],
    { minSpacing: 600 },
  );
  assert.deepEqual(out.map((l) => [l.text, l.x]), [["MARKET ST.", 100], ["MARKET ST.", 1200]]);
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test scripts/lifemap/geo.test.cjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scripts/lifemap/geo.cjs`**

```js
// Pure geometry helpers for the map build. Points are [x, y] in map units.

function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

// Douglas–Peucker
function simplify(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  const left = simplify(pts.slice(0, idx + 1), tol);
  const right = simplify(pts.slice(idx), tol);
  return left.slice(0, -1).concat(right);
}

const r1 = (n) => String(Math.round(n * 10) / 10);

function toPath(pts, closed = false) {
  return pts.map((p, i) => (i ? "L" : "M") + r1(p[0]) + " " + r1(p[1])).join("") + (closed ? "Z" : "");
}

function polylineLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

// Point halfway along the line, with the angle of that segment turned so text reads left to right.
function labelAt(pts) {
  const half = polylineLength(pts) / 2;
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (s + seg >= half || i === pts.length - 1) {
      const t = seg ? (half - s) / seg : 0;
      let angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle <= -90) angle += 180;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, angle: Math.round(angle * 10) / 10 || 0 };
    }
    s += seg;
  }
  return { x: pts[0][0], y: pts[0][1], angle: 0 };
}

// Greedy: better rank first, then longer streets. Drops the same name within minSpacing, and any label whose
// rough footprint (a circle around its centre) overlaps one already placed.
function placeLabels(cands, { minSpacing = 600, charW = 7 } = {}) {
  const sorted = cands.slice().sort((a, b) => a.rank - b.rank || b.len - a.len);
  const placed = [];
  for (const c of sorted) {
    const rc = (c.text.length * charW) / 2;
    const clash = placed.some((p) => {
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (p.text === c.text) return d < minSpacing;
      return d < rc + (p.text.length * charW) / 2;
    });
    if (!clash) placed.push(c);
  }
  return placed;
}

module.exports = { simplify, toPath, polylineLength, labelAt, placeLabels };
```

- [ ] **Step 4: Run the test and check that it passes**

Run: `node --test scripts/lifemap/geo.test.cjs`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lifemap/geo.cjs scripts/lifemap/geo.test.cjs
git commit -m "Life map: geometry helpers for the map build"
```

---

### Task 5: OSM fetch and normalize

**Files:**
- Create: `scripts/lifemap/osm.cjs`
- Test: `scripts/lifemap/osm.test.cjs`
- Create (generated): `mapdata/stl-modern.geojson`

- [ ] **Step 1: Write the failing test**

`scripts/lifemap/osm.test.cjs`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalize, riverPolygon, kindOf } = require("./osm.cjs");

const g = (...pairs) => pairs.map(([lon, lat]) => ({ lon, lat }));

test("kindOf classifies ways", () => {
  assert.equal(kindOf({ highway: "motorway" }), "motorway");
  assert.equal(kindOf({ highway: "primary" }), "major");
  assert.equal(kindOf({ highway: "residential" }), "minor");
  assert.equal(kindOf({ highway: "pedestrian" }), "pedestrian");
  assert.equal(kindOf({ highway: "primary", bridge: "yes" }), "bridge");
  assert.equal(kindOf({ railway: "rail" }), "rail");
  assert.equal(kindOf({ leisure: "park" }), "park");
  assert.equal(kindOf({ highway: "footway" }), null);
  assert.equal(kindOf({ highway: "service" }), null);
});

test("normalize turns ways into features and drops duplicates and unknown kinds", () => {
  const osm = {
    elements: [
      { type: "way", id: 1, tags: { highway: "primary", name: "Market Street" }, geometry: g([-90.19, 38.62], [-90.18, 38.62]) },
      { type: "way", id: 1, tags: { highway: "primary", name: "Market Street" }, geometry: g([-90.19, 38.62], [-90.18, 38.62]) },
      { type: "way", id: 2, tags: { highway: "footway" }, geometry: g([-90.19, 38.62], [-90.18, 38.62]) },
      { type: "way", id: 3, tags: { leisure: "park", name: "Kiener Plaza" }, geometry: g([0, 0], [1, 0], [1, 1], [0, 0]) },
      { type: "way", id: 4, tags: { leisure: "park" }, geometry: g([0, 0], [1, 0], [1, 1]) },
    ],
  };
  const fc = normalize(osm);
  assert.equal(fc.type, "FeatureCollection");
  assert.deepEqual(
    fc.features.map((f) => [f.properties.osm, f.properties.kind, f.geometry.type]),
    [[1, "major", "LineString"], [3, "park", "Polygon"]],
  );
  assert.equal(fc.features[0].properties.name, "Market Street");
});

test("riverPolygon joins the west bank (north to south) and east bank (south to north)", () => {
  const banks = [
    g([-90.180, 38.64], [-90.181, 38.63]),
    g([-90.181, 38.63], [-90.182, 38.62]),
    g([-90.170, 38.62], [-90.169, 38.64]),
  ];
  const ring = riverPolygon(banks, -90.176);
  assert.deepEqual(ring[0], [-90.18, 38.64]);
  assert.deepEqual(ring[ring.length - 1], ring[0]);
  const east = ring.filter(([lon]) => lon > -90.176);
  assert.deepEqual(east.map((p) => p[1]), [38.62, 38.64]);
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test scripts/lifemap/osm.test.cjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scripts/lifemap/osm.cjs`**

```js
// Fetches today's downtown St. Louis from OpenStreetMap (Overpass) and normalizes it to GeoJSON.
//   node scripts/lifemap/osm.cjs   -> review/work/maps/osm/*.json (raw, gitignored) + mapdata/stl-modern.geojson
// Data © OpenStreetMap contributors (ODbL). The page credits it.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const RAW = path.join(ROOT, "review/work/maps/osm");
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

function kindOf(t) {
  if (t.leisure === "park") return "park";
  if (t.railway === "rail" || t.railway === "light_rail") return t.bridge ? "bridge" : "rail";
  const h = t.highway;
  if (!h) return null;
  if (t.bridge && t.bridge !== "no") return "bridge";
  if (/^(motorway|motorway_link|trunk|trunk_link)$/.test(h)) return "motorway";
  if (/^(primary|primary_link|secondary|secondary_link)$/.test(h)) return "major";
  if (/^(tertiary|tertiary_link|unclassified|residential|living_street)$/.test(h)) return "minor";
  if (h === "pedestrian") return "pedestrian";
  return null;
}

function normalize(osm) {
  const seen = new Set();
  const features = [];
  for (const el of osm.elements || []) {
    if (el.type !== "way" || !el.geometry || seen.has(el.id)) continue;
    const kind = kindOf(el.tags || {});
    if (!kind) continue;
    const coords = el.geometry.map((p) => [p.lon, p.lat]);
    const closed = coords.length > 3 && coords[0][0] === coords.at(-1)[0] && coords[0][1] === coords.at(-1)[1];
    if (kind === "park" && !closed) continue;
    seen.add(el.id);
    features.push({
      type: "Feature",
      properties: { osm: el.id, kind, name: (el.tags || {}).name || null },
      geometry: kind === "park" ? { type: "Polygon", coordinates: [coords] } : { type: "LineString", coordinates: coords },
    });
  }
  return { type: "FeatureCollection", features };
}

// banks: arrays of {lon,lat} (river bank ways). Bank ways west of splitLon are the Missouri side.
// Along this stretch the river runs roughly north-south, so sorting by latitude orders each bank.
function riverPolygon(banks, splitLon) {
  const pts = banks.flat().map((p) => [p.lon, p.lat]);
  const uniq = (arr) => arr.filter((p, i) => i === 0 || p[0] !== arr[i - 1][0] || p[1] !== arr[i - 1][1]);
  const west = uniq(pts.filter((p) => p[0] < splitLon).sort((a, b) => b[1] - a[1]));
  const east = uniq(pts.filter((p) => p[0] >= splitLon).sort((a, b) => a[1] - b[1]));
  return [...west, ...east, west[0]];
}

const BBOX = { s: 38.6155, w: -90.2055, n: 38.6435, e: -90.172 };

function quarters(b) {
  const mLat = (b.s + b.n) / 2;
  const mLon = (b.w + b.e) / 2;
  return [
    { s: b.s, w: b.w, n: mLat, e: mLon },
    { s: b.s, w: mLon, n: mLat, e: b.e },
    { s: mLat, w: b.w, n: b.n, e: mLon },
    { s: mLat, w: mLon, n: b.n, e: b.e },
  ];
}

const bb = (b) => `${b.s},${b.w},${b.n},${b.e}`;
const roadsQuery = (b) => `[out:json][timeout:90];(way["highway"](${bb(b)});way["railway"~"^(rail|light_rail)$"](${bb(b)});way["leisure"="park"](${bb(b)}););out geom;`;
const riverQuery = (b) => `[out:json][timeout:90];relation["water"="river"]["name"="Mississippi River"](${bb(b)});way(r)(${bb(b)});out geom(${bb(b)});`;

async function overpass(query, file) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  for (const url of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "historic-map-build/1.0" },
          body: "data=" + encodeURIComponent(query),
        });
        if (!r.ok) throw new Error(`${url} ${r.status}`);
        const json = await r.json();
        fs.writeFileSync(file, JSON.stringify(json));
        return json;
      } catch (e) {
        console.warn("overpass:", e.message);
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
  }
  throw new Error("Overpass failed for " + file);
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true });
  const elements = [];
  for (const [i, q] of quarters(BBOX).entries()) elements.push(...(await overpass(roadsQuery(q), path.join(RAW, `roads-${i}.json`))).elements);
  const fc = normalize({ elements });
  const river = await overpass(riverQuery(BBOX), path.join(RAW, "river.json"));
  const banks = river.elements.filter((e) => e.type === "way" && e.geometry).map((e) => e.geometry);
  const ring = riverPolygon(banks, -90.176);
  fc.features.unshift({ type: "Feature", properties: { kind: "water", name: "Mississippi River" }, geometry: { type: "Polygon", coordinates: [ring] } });
  fs.mkdirSync(path.join(ROOT, "mapdata"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "mapdata/stl-modern.geojson"), JSON.stringify(fc));
  const n = (k) => fc.features.filter((f) => f.properties.kind === k).length;
  console.log(`mapdata/stl-modern.geojson: ${fc.features.length} features (major ${n("major")}, minor ${n("minor")}, motorway ${n("motorway")}, bridge ${n("bridge")}, park ${n("park")}, rail ${n("rail")}, river ring ${ring.length} pts)`);
}

if (require.main === module) main();
module.exports = { normalize, riverPolygon, kindOf, quarters };
```

- [ ] **Step 4: Run the test and check that it passes**

Run: `node --test scripts/lifemap/osm.test.cjs`
Expected: 3 tests pass.

- [ ] **Step 5: Fetch the data**

Run: `node scripts/lifemap/osm.cjs`
Expected: `mapdata/stl-modern.geojson: N features (major …)`, with major > 50, minor > 100, bridge ≥ 2 (Eads, Poplar Street and the MLK bridges), and a river ring of more than 20 points. If Overpass keeps failing, wait a few minutes and re-run: finished quarters are cached in `review/work/maps/osm/`. The river ring is checked visually in Task 8.

- [ ] **Step 6: Commit**

```bash
git add scripts/lifemap/osm.cjs scripts/lifemap/osm.test.cjs mapdata/stl-modern.geojson
git commit -m "Life map: fetch and normalize today's downtown from OpenStreetMap"
```

---

### Task 6: 1875 edits

**Files:**
- Create: `scripts/lifemap/edits.cjs`
- Test: `scripts/lifemap/edits.test.cjs`
- Create: `mapdata/stl-1875-edits.json` (first version; Task 8 refines it)

- [ ] **Step 1: Write the failing test**

`scripts/lifemap/edits.test.cjs`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { applyEdits } = require("./edits.cjs");

const line = (osm, kind, name) => ({ type: "Feature", properties: { osm, kind, name }, geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] } });
const fc = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { kind: "water", name: "Mississippi River" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
    line(1, "major", "North Broadway"),
    line(2, "motorway", "Interstate 44"),
    line(3, "minor", "Memorial Drive"),
    line(4, "minor", "Locust Street"),
    line(5, "minor", "Lucas Avenue"),
    { type: "Feature", properties: { osm: 6, kind: "park", name: "Kiener Plaza" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
  ],
};

const edits = {
  rename: { "North Broadway": "Fifth St." },
  removeKinds: ["motorway", "park"],
  removeNames: ["Memorial Drive"],
  removeIds: [5],
  add: [
    { name: "Main St.", kind: "minor", coords: [[0, 0], [0, 1]] },
    { name: "Levee", kind: "levee", ring: [[0, 0], [1, 0], [1, 1], [0, 0]] },
  ],
  water: [[0, 0], [2, 0], [2, 2], [0, 0]],
};

test("applyEdits renames, removes, adds and replaces the river", () => {
  const out = applyEdits(fc, edits);
  const names = out.features.map((f) => `${f.properties.kind}:${f.properties.name}`);
  assert.deepEqual(names, ["water:Mississippi River", "major:Fifth St.", "minor:Locust Street", "minor:Main St.", "levee:Levee"]);
  assert.deepEqual(out.features[0].geometry.coordinates[0][1], [2, 0]);
  assert.equal(out.features[4].geometry.type, "Polygon");
});

test("applyEdits does not mutate its input", () => {
  applyEdits(fc, edits);
  assert.equal(fc.features[1].properties.name, "North Broadway");
});

test("rename tolerates missing names and leaves unknown names alone", () => {
  const out = applyEdits({ type: "FeatureCollection", features: [line(9, "minor", null), line(10, "minor", "Pine Street")] }, { rename: { "Pine Street": "Pine St." } });
  assert.deepEqual(out.features.map((f) => f.properties.name), [null, "Pine St."]);
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test scripts/lifemap/edits.test.cjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scripts/lifemap/edits.cjs`**

```js
// Turns today's features into 1875 using mapdata/stl-1875-edits.json:
//   rename      { "today name": "1875 name" }
//   removeKinds [kind]          modern-only feature kinds (motorways, today's parks)
//   removeNames [name]          modern-only streets by today's name
//   removeIds   [osm id]        single ways
//   add         [{name, kind, coords}] lines, or [{name, kind, ring}] polygons, in [lon, lat]
//   water       [[lon, lat]]    the 1875 river (replaces today's), optional
function applyEdits(fc, edits) {
  const rename = edits.rename || {};
  const kinds = new Set(edits.removeKinds || []);
  const names = new Set(edits.removeNames || []);
  const ids = new Set(edits.removeIds || []);
  const features = [];
  for (const f of fc.features) {
    const p = f.properties;
    if (kinds.has(p.kind) || names.has(p.name) || ids.has(p.osm)) continue;
    let geometry = f.geometry;
    if (p.kind === "water" && edits.water) geometry = { type: "Polygon", coordinates: [edits.water] };
    features.push({ ...f, geometry, properties: { ...p, name: p.name in rename ? rename[p.name] : p.name } });
  }
  for (const a of edits.add || []) {
    features.push({
      type: "Feature",
      properties: { kind: a.kind, name: a.name || null, added: true },
      geometry: a.ring ? { type: "Polygon", coordinates: [a.ring] } : { type: "LineString", coordinates: a.coords },
    });
  }
  return { type: "FeatureCollection", features };
}

module.exports = { applyEdits };
```

- [ ] **Step 4: Run the test and check that it passes**

Run: `node --test scripts/lifemap/edits.test.cjs`
Expected: 3 tests pass.

- [ ] **Step 5: Write the first `mapdata/stl-1875-edits.json`**

These are only the edits that are certain: Fifth Street was renamed Broadway, Twelfth Street became Tucker, and the highways, Memorial Drive and today's plazas didn't exist. List the street names actually present first, so every `rename`/`removeNames` key matches the OSM spelling:

Run: `node -e "const f=require('./mapdata/stl-modern.geojson').features;console.log([...new Set(f.map(x=>x.properties.name).filter(Boolean))].sort().join('\n'))"`

Then write the file, using the exact OSM spellings from that list. If a name below isn't in the list, drop it:

```json
{
  "about": "Differences between today's downtown (mapdata/stl-modern.geojson) and the 1875 Wm. C. Wilson & Bro. map. Every rename and addition is checked against the scan with scripts/lifemap/check-overlay.cjs. Coordinates [lon, lat].",
  "rename": {
    "North Broadway": "Fifth St.",
    "South Broadway": "Fifth St.",
    "North Tucker Boulevard": "Twelfth St.",
    "South Tucker Boulevard": "Twelfth St."
  },
  "removeKinds": ["motorway", "park", "pedestrian", "rail"],
  "removeNames": ["Memorial Drive", "Lumière Place Boulevard", "Convention Plaza", "Cole Street", "Clark Avenue", "Cardinal Way", "Stadium Plaza"],
  "removeIds": [],
  "add": [],
  "water": null
}
```

Whether Cole, Clark and Cardinal Way line up with 1875 streets (for example Elm or Myrtle) is decided in Task 8 against the scan. If one of them follows an 1875 street, Task 8 moves it from `removeNames` to `rename`.

- [ ] **Step 6: Commit**

```bash
git add scripts/lifemap/edits.cjs scripts/lifemap/edits.test.cjs mapdata/stl-1875-edits.json
git commit -m "Life map: apply 1875 edits to today's streets"
```

---

### Task 7: Build the layers

**Files:**
- Create: `scripts/lifemap/build.cjs`
- Test: `scripts/lifemap/build.test.cjs`
- Create (generated): `src/components/lifemap/geo/stl-downtown-1875.json`, `src/components/lifemap/geo/stl-downtown-today.json`

Layer JSON format, used by `MapLayer.jsx` and `check-overlay.cjs`:

```json
{ "frame": "downtown", "width": 1800, "height": 1920,
  "paths": { "water": "M…Z", "park": "", "levee": "", "rail": "", "pedestrian": "", "minor": "M…", "major": "M…", "motorway": "", "bridge": "M…" },
  "labels": [{ "text": "MARKET ST.", "x": 812.4, "y": 1203.1, "angle": -8.2, "cls": "major" }] }
```

- [ ] **Step 1: Write the failing test**

`scripts/lifemap/build.test.cjs`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildLayer, labelText } = require("./build.cjs");

const frame = { id: "t", width: 1000, height: 1000 };
const project = (f, lon, lat) => [lon * 1000, (1 - lat) * 1000]; // unit square → frame
const fc = {
  features: [
    { properties: { kind: "water" }, geometry: { type: "Polygon", coordinates: [[[0.8, 1], [1, 1], [1, 0], [0.8, 0], [0.8, 1]]] } },
    { properties: { kind: "major", name: "Market Street" }, geometry: { type: "LineString", coordinates: [[0, 0.5], [0.5, 0.5], [0.7, 0.5]] } },
    { properties: { kind: "minor", name: "Pine Street" }, geometry: { type: "LineString", coordinates: [[0, 0.6], [0.02, 0.6]] } },
  ],
};

test("buildLayer projects features into per-kind paths", () => {
  const layer = buildLayer(fc, frame, project, { era: "today" });
  assert.equal(layer.width, 1000);
  assert.match(layer.paths.water, /^M800 0L1000 0.*Z$/);
  assert.equal(layer.paths.major, "M0 500L700 500"); // middle point simplified away
  assert.equal(layer.paths.park, "");
});

test("buildLayer labels streets long enough to carry a name", () => {
  const layer = buildLayer(fc, frame, project, { era: "today" });
  assert.deepEqual(layer.labels.map((l) => [l.text, l.cls]), [["Market Street", "major"]]);
});

test("labelText: 1875 names are upper case and abbreviated, like the period map", () => {
  assert.equal(labelText("Market Street", "1875"), "MARKET ST.");
  assert.equal(labelText("Washington Avenue", "1875"), "WASHINGTON AV.");
  assert.equal(labelText("Fifth St.", "1875"), "FIFTH ST.");
  assert.equal(labelText("Market Street", "today"), "Market Street");
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test scripts/lifemap/build.test.cjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scripts/lifemap/build.cjs`**

```js
// Builds the drawn map layers: mapdata/*.geojson -> src/components/lifemap/geo/*.json
//   npm run build-map
const fs = require("fs");
const path = require("path");
const { simplify, toPath, polylineLength, labelAt, placeLabels } = require("./geo.cjs");
const { applyEdits } = require("./edits.cjs");

const ROOT = path.join(__dirname, "../..");
const KINDS = ["water", "park", "levee", "rail", "pedestrian", "minor", "major", "motorway", "bridge"];
const AREAS = new Set(["water", "park", "levee"]);
const LABELLED = { major: 0, motorway: 1, minor: 2 };
const TOL = 0.8; // map units (~1.3 m downtown)
const MIN_LABEL_LEN = 120;

function labelText(name, era) {
  if (era !== "1875") return name;
  return name
    .replace(/\bStreet\b/i, "St.")
    .replace(/\bAvenue\b/i, "Av.")
    .replace(/\bBoulevard\b/i, "Blvd.")
    .toUpperCase();
}

function buildLayer(fc, frame, project, { era }) {
  const parts = Object.fromEntries(KINDS.map((k) => [k, []]));
  const cands = [];
  for (const f of fc.features) {
    const { kind, name } = f.properties;
    if (!(kind in parts)) continue;
    const rings = f.geometry.type === "Polygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const ring of rings) {
      const pts = simplify(ring.map(([lon, lat]) => project(frame, lon, lat)), TOL);
      if (pts.length < 2) continue;
      parts[kind].push(toPath(pts, AREAS.has(kind)));
      const len = polylineLength(pts);
      if (name && kind in LABELLED && len >= MIN_LABEL_LEN) {
        cands.push({ text: labelText(name, era), ...labelAt(pts), len, rank: LABELLED[kind], cls: kind === "minor" ? "minor" : "major" });
      }
    }
  }
  const r1 = (n) => Math.round(n * 10) / 10;
  const labels = placeLabels(cands, { minSpacing: 600 }).map(({ text, x, y, angle, cls }) => ({ text, x: r1(x), y: r1(y), angle, cls }));
  return { frame: frame.id, width: frame.width, height: frame.height, paths: Object.fromEntries(KINDS.map((k) => [k, parts[k].join("")])), labels };
}

async function main() {
  const { FRAMES, project } = await import(path.join(ROOT, "src/components/lifemap/projection.mjs"));
  const modern = JSON.parse(fs.readFileSync(path.join(ROOT, "mapdata/stl-modern.geojson"), "utf8"));
  const edits = JSON.parse(fs.readFileSync(path.join(ROOT, "mapdata/stl-1875-edits.json"), "utf8"));
  const out = path.join(ROOT, "src/components/lifemap/geo");
  fs.mkdirSync(out, { recursive: true });
  const layers = {
    "stl-downtown-today": buildLayer(modern, FRAMES.downtown, project, { era: "today" }),
    "stl-downtown-1875": buildLayer(applyEdits(modern, edits), FRAMES.downtown, project, { era: "1875" }),
  };
  for (const [name, layer] of Object.entries(layers)) {
    const file = path.join(out, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(layer));
    console.log(`${path.relative(ROOT, file)}: ${(fs.statSync(file).size / 1024).toFixed(0)} KB, ${layer.labels.length} labels`);
  }
}

if (require.main === module) main();
module.exports = { buildLayer, labelText };
```

- [ ] **Step 4: Run the test and check that it passes**

Run: `node --test scripts/lifemap/build.test.cjs`
Expected: 3 tests pass.

- [ ] **Step 5: Build the real layers**

Run: `npm run build-map`
Expected: two lines, each under 400 KB with more than 20 labels. If a file is larger, raise `TOL` to 1.2 and re-run.

- [ ] **Step 6: Commit**

```bash
git add scripts/lifemap/build.cjs scripts/lifemap/build.test.cjs src/components/lifemap/geo/
git commit -m "Life map: build downtown 1875 and today layers"
```

---

### Task 8: Trace and check the 1875 layer against the scan

This task is tracing work. The result is a corrected `mapdata/stl-1875-edits.json`, approved by the user from check images. The scan stays in `review/work/maps/dl/` (gitignored) and never ships.

**Files:**
- Create: `scripts/lifemap/check-overlay.cjs`
- Test: `scripts/lifemap/check-overlay.test.cjs`
- Create: `mapdata/reference/wilson1875-control.json`
- Modify: `mapdata/stl-1875-edits.json`

- [ ] **Step 1: Get a sharper scan of downtown**

The current `review/work/maps/dl/core_raw.jpg` is a 1000 px crop: too coarse, and it doesn't cover the whole frame. Fetch the full sheet's size and a preview:

```bash
cd review/work/maps/dl
curl -s https://digital.shsmo.org/iiif/2/Maps:193/info.json -o m193_info.json && node -e "const i=require('./m193_info.json');console.log(i.width,i.height)"
curl -s "https://digital.shsmo.org/iiif/2/Maps:193/full/2000,/0/default.jpg" -o m193_2000.jpg
cd -
```

Read `m193_2000.jpg` and find downtown. On this sheet north is to the right, so downtown is the area around Eads Bridge, with the river along the bottom or top edge. Give that box generous margins (Cass Ave to Chouteau Ave, 18th St to the Illinois bank). Scale it to full-resolution pixels (`× info.width / 2000`) and fetch it at full size, as `x,y,w,h` in the IIIF region:

```bash
curl -s "https://digital.shsmo.org/iiif/2/Maps:193/X,Y,W,H/full/0/default.jpg" -o review/work/maps/dl/wilson1875-downtown.jpg
```

If the server refuses a large region (an error or a tiny image), fetch it as 2×2 tiles and join them with `sharp().composite`. Read the result back and check that the street names (WASHINGTON AV, MARKET, ELM) are legible.

- [ ] **Step 2: Write the failing test for the fit**

`scripts/lifemap/check-overlay.test.cjs`:

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fitPoly2, evalPoly2 } = require("./check-overlay.cjs");

test("fitPoly2 recovers a known quadratic mapping", () => {
  const f = (lon, lat) => [100 + 2 * lon + 3 * lat + 0.5 * lon * lat, 50 - lon + 4 * lat + 0.2 * lat * lat];
  const pts = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const lon = i * 1.3 - 2, lat = j * 0.9 + 1;
    const [x, y] = f(lon, lat);
    pts.push({ lon, lat, x, y });
  }
  const fit = fitPoly2(pts, { lon0: 0, lat0: 0 });
  const [x, y] = evalPoly2(fit, 0.7, 1.4);
  const [ex, ey] = f(0.7, 1.4);
  assert.ok(Math.abs(x - ex) < 1e-6 && Math.abs(y - ey) < 1e-6);
  assert.ok(fit.rms < 1e-6);
});

test("fitPoly2 needs at least 6 points", () => {
  assert.throws(() => fitPoly2([{ lon: 0, lat: 0, x: 0, y: 0 }], { lon0: 0, lat0: 0 }), /6 control points/);
});
```

- [ ] **Step 3: Run it and check that it fails**

Run: `node --test scripts/lifemap/check-overlay.test.cjs`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `scripts/lifemap/check-overlay.cjs`**

```js
// Tracing check images (never shipped):
//   node scripts/lifemap/check-overlay.cjs 1875   our 1875 layer over the warped Wilson scan
//   node scripts/lifemap/check-overlay.cjs today  our today layer over OSM tiles
// Writes review/work/maps/check/downtown-<era>.png at the frame's size, with a lon/lat grid every 0.002°
// (labelled, for reading off coordinates) and the downtown pins.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "../..");
const OUT = path.join(ROOT, "review/work/maps/check");
const TILES = path.join(ROOT, "review/work/maps/tiles");

// Least squares, 2nd order: x = a0 + a1 u + a2 v + a3 u² + a4 uv + a5 v², u/v = lon/lat minus an origin.
const terms = (u, v) => [1, u, v, u * u, u * v, v * v];

function solve(A, b) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const f = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}

function fitPoly2(points, { lon0, lat0 }) {
  if (points.length < 6) throw new Error("need at least 6 control points");
  const S = 1000; // scale degrees so the normal equations stay well conditioned
  const rows = points.map((p) => terms((p.lon - lon0) * S, (p.lat - lat0) * S));
  const ATA = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)));
  const fitAxis = (key) => solve(ATA, Array.from({ length: 6 }, (_, i) => rows.reduce((s, r, k) => s + r[i] * points[k][key], 0)));
  const fit = { lon0, lat0, S, ax: fitAxis("x"), ay: fitAxis("y") };
  const res = points.map((p) => {
    const [x, y] = evalPoly2(fit, p.lon, p.lat);
    return Math.hypot(x - p.x, y - p.y);
  });
  fit.residuals = res;
  fit.rms = Math.sqrt(res.reduce((s, r) => s + r * r, 0) / res.length);
  return fit;
}

function evalPoly2(fit, lon, lat) {
  const t = terms((lon - fit.lon0) * fit.S, (lat - fit.lat0) * fit.S);
  const dot = (a) => a.reduce((s, c, i) => s + c * t[i], 0);
  return [dot(fit.ax), dot(fit.ay)];
}

// Fills a width×height RGB buffer: map(x, y) -> [sx, sy] in the source, bilinear sampled.
function warp(width, height, src, map) {
  const { data, info } = src;
  const out = Buffer.alloc(width * height * 3, 255);
  const ch = info.channels;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [sx, sy] = map(x, y);
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 >= info.width - 1 || y0 >= info.height - 1) continue;
      const dx = sx - x0;
      const dy = sy - y0;
      for (let c = 0; c < 3; c++) {
        const g = (xx, yy) => data[(yy * info.width + xx) * ch + c];
        out[(y * width + x) * 3 + c] = Math.round(
          g(x0, y0) * (1 - dx) * (1 - dy) + g(x0 + 1, y0) * dx * (1 - dy) + g(x0, y0 + 1) * (1 - dx) * dy + g(x0 + 1, y0 + 1) * dx * dy,
        );
      }
    }
  }
  return out;
}

function layerSvg(layer, frame, pins, grid) {
  const p = layer.paths;
  const stroke = (d, color, w, extra = "") => (d ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>` : "");
  const fill = (d, color) => (d ? `<path d="${d}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2"/>` : "");
  const labels = layer.labels
    .map((l) => `<text transform="translate(${l.x} ${l.y}) rotate(${l.angle})" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="13" font-weight="bold" fill="#c00" stroke="#fff" stroke-width="3" paint-order="stroke">${l.text.replace(/&/g, "&amp;")}</text>`)
    .join("");
  const pinMarks = pins
    .map(([x, y, id]) => `<circle cx="${x}" cy="${y}" r="7" fill="#f0f" stroke="#000" stroke-width="2"/><text x="${x + 10}" y="${y - 8}" font-family="Arial" font-size="12" fill="#000" stroke="#fff" stroke-width="3" paint-order="stroke">${id}</text>`)
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}">` +
      grid +
      fill(p.water, "#06c") + fill(p.levee, "#a60") + fill(p.park, "#0a0") +
      stroke(p.minor, "#e00", 2) + stroke(p.major, "#e00", 3.5) + stroke(p.motorway, "#e0e", 4) + stroke(p.bridge, "#e00", 4, 'stroke-dasharray="8 4"') + stroke(p.rail, "#333", 2, 'stroke-dasharray="4 4"') +
      labels + pinMarks +
      "</svg>",
  );
}

function gridSvg(frame, project) {
  let s = "";
  const step = 0.002;
  for (let lon = Math.ceil(frame.west / step) * step; lon <= frame.east; lon += step) {
    const [x] = project(frame, lon, frame.north);
    s += `<line x1="${x}" y1="0" x2="${x}" y2="${frame.height}" stroke="#08f" stroke-width="1" stroke-opacity="0.6"/><text x="${x + 3}" y="14" font-family="Arial" font-size="12" fill="#08f">${lon.toFixed(3)}</text>`;
  }
  for (let lat = Math.ceil(frame.south / step) * step; lat <= frame.north; lat += step) {
    const [, y] = project(frame, frame.west, lat);
    s += `<line x1="0" y1="${y}" x2="${frame.width}" y2="${y}" stroke="#08f" stroke-width="1" stroke-opacity="0.6"/><text x="3" y="${y - 3}" font-family="Arial" font-size="12" fill="#08f">${lat.toFixed(3)}</text>`;
  }
  return s;
}

async function tileMosaic(frame, z) {
  const mx = (lon) => ((lon + 180) / 360) * 2 ** z;
  const my = (lat) => {
    const r = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
  };
  const tx0 = Math.floor(mx(frame.west)), tx1 = Math.floor(mx(frame.east));
  const ty0 = Math.floor(my(frame.north)), ty1 = Math.floor(my(frame.south));
  fs.mkdirSync(TILES, { recursive: true });
  const comps = [];
  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      const f = path.join(TILES, `${z}_${tx}_${ty}.png`);
      if (!fs.existsSync(f)) {
        const r = await fetch(`https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`, { headers: { "User-Agent": "historic-map-check/1.0" } });
        if (!r.ok) throw new Error(`tile ${z}/${tx}/${ty}: ${r.status}`);
        fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
        await new Promise((res) => setTimeout(res, 200));
      }
      comps.push({ input: f, left: (tx - tx0) * 256, top: (ty - ty0) * 256 });
    }
  }
  const w = (tx1 - tx0 + 1) * 256, h = (ty1 - ty0 + 1) * 256;
  const src = await sharp({ create: { width: w, height: h, channels: 3, background: "#fff" } }).composite(comps).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { src, toSrc: (lon, lat) => [(mx(lon) - tx0) * 256, (my(lat) - ty0) * 256] };
}

async function main() {
  const era = process.argv[2] === "today" ? "today" : "1875";
  const { FRAMES, project, unproject } = await import(path.join(ROOT, "src/components/lifemap/projection.mjs"));
  const { places } = await import(path.join(ROOT, "data/places.js"));
  const frame = FRAMES.downtown;
  const layer = JSON.parse(fs.readFileSync(path.join(ROOT, `src/components/lifemap/geo/stl-downtown-${era}.json`), "utf8"));
  let src, toSrc;
  if (era === "1875") {
    const ref = JSON.parse(fs.readFileSync(path.join(ROOT, "mapdata/reference/wilson1875-control.json"), "utf8"));
    const fit = fitPoly2(ref.points, { lon0: -90.19, lat0: 38.63 });
    console.log(`control points: ${ref.points.length}, rms ${fit.rms.toFixed(1)} scan px; worst: ${ref.points.map((p, i) => [p.note, fit.residuals[i].toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x.join(" ")).join(", ")}`);
    src = await sharp(path.join(ROOT, ref.image)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    toSrc = (lon, lat) => evalPoly2(fit, lon, lat);
  } else {
    ({ src, toSrc } = await tileMosaic(frame, 16));
  }
  const bg = warp(frame.width, frame.height, src, (x, y) => toSrc(...unproject(frame, x, y)));
  const pins = places.filter((p) => p.level === "downtown").map((p) => [...project(frame, p.lon, p.lat), p.id.replace(/^stl-/, "")]);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `downtown-${era}.png`);
  await sharp(bg, { raw: { width: frame.width, height: frame.height, channels: 3 } })
    .modulate({ saturation: 0.4 })
    .composite([{ input: layerSvg(layer, frame, pins, gridSvg(frame, project)) }])
    .png()
    .toFile(file);
  console.log(path.relative(ROOT, file));
}

if (require.main === module) main();
module.exports = { fitPoly2, evalPoly2, warp };
```

- [ ] **Step 5: Run the test and check that it passes**

Run: `node --test scripts/lifemap/check-overlay.test.cjs`
Expected: 2 tests pass.

- [ ] **Step 6: Check the today layer first, against OSM tiles**

Run: `node scripts/lifemap/check-overlay.cjs today`
Expected: `review/work/maps/check/downtown-today.png`. Read it (it's big, so also crop the 417 Washington area with `sharp().extract` for a close look). The red street lines must sit on the tile streets, the blue river fill must cover the river, and the magenta pins must be on their blocks. If the river polygon zigzags, the `riverPolygon` split longitude (`-90.176` in `osm.cjs`) is on the wrong side of a bank: move it to the middle of the river at that latitude, re-run `node scripts/lifemap/osm.cjs` (the raw data is cached) and `npm run build-map`.

- [ ] **Step 7: Write the control points**

Find at least 10 street corners that you can identify on both the scan (`wilson1875-downtown.jpg`) and today's map, spread over the whole frame. Use corners whose streets haven't moved: Fourth & Washington, Fourth & Market, Twelfth & Market, Seventh & Olive, Broadway(Fifth) & Chouteau, Broadway & Cass, Eighteenth & Market, and so on. Read each corner's pixel position on the scan by cropping around it at full resolution, and take its lon/lat from `downtown-today.png`'s grid (or the OSM street lines in `mapdata/stl-modern.geojson`).

Write `mapdata/reference/wilson1875-control.json`:

```json
{
  "about": "Control points for lining up the 1875 Wm. C. Wilson & Bro. map (SHSMO Maps:193) with today's coordinates. x/y are pixels in the unrotated scan crop named in 'image' (IIIF region noted below). Used only for tracing checks.",
  "image": "review/work/maps/dl/wilson1875-downtown.jpg",
  "iiif_region": "X,Y,W,H",
  "points": [
    { "note": "Fourth & Washington", "lon": -90.18713, "lat": 38.62965, "x": 0, "y": 0 }
  ]
}
```

Replace the example: each point needs real `x`/`y`, and `iiif_region` takes the region used in Step 1. Then run: `node scripts/lifemap/check-overlay.cjs 1875`
Expected: `control points: N, rms … scan px; worst: …`. An rms under about 15 scan px is good, given the map's crude lettering. If one point's residual stands out, recheck it or drop it.

- [ ] **Step 8: Correct the 1875 edits until our lines sit on the 1875 streets**

Read `review/work/maps/check/downtown-1875.png` region by region, using crops about 600×600 at full size. For each difference, edit `mapdata/stl-1875-edits.json`, then run `npm run build-map && node scripts/lifemap/check-overlay.cjs 1875` and look again:

- **A street the scan names differently:** add `rename` (for example a street labelled ELM on the scan where OSM has a different name). Check the spelling on the scan.
- **A modern street that isn't on the scan:** add its OSM name to `removeNames`, or a single way's id to `removeIds` (find ids with `node -e "require('./mapdata/stl-modern.geojson').features.filter(f=>f.properties.name==='NAME').forEach(f=>console.log(f.properties.osm, JSON.stringify(f.geometry.coordinates[0])))"`).
- **A street on the scan that's missing from ours,** especially the riverfront blocks under today's Arch grounds (Main, Second, Commercial, and the cross streets running to the levee), and streets north of Washington that were later built over: add to `add` as `{ "name": "...", "kind": "minor" | "major", "coords": [[lon, lat], …] }`, reading the coordinates off the grid.
- **The levee:** add `{ "name": "Levee", "kind": "levee", "ring": [...] }`, the paved landing between Front Street and the water.
- **The 1875 riverbank,** if it's visibly different from today's: set `water` to a ring traced from the grid, west bank north to south, then the east bank south to north, closed.

Keep going until every street on the scan inside the frame is matched, renamed, added or deliberately left out, and no modern-only street is left.

- [ ] **Step 9: Show the user the check images**

Show the user the before and after versions of `downtown-1875.png` (whole and two close crops: the 400 block of Washington and the riverfront), with a summary of the renames and additions. **Wait for their approval** before going on.

- [ ] **Step 10: Commit**

```bash
git add scripts/lifemap/check-overlay.cjs scripts/lifemap/check-overlay.test.cjs mapdata/reference/wilson1875-control.json mapdata/stl-1875-edits.json src/components/lifemap/geo/
git commit -m "Life map: trace downtown 1875 against the Wilson map"
```

---

### Task 9: Move `useZoomGestures` into `shared.jsx`

**Files:**
- Modify: `src/components/shared.jsx` (add the hook)
- Modify: `src/components/articles/ArticleDetail.jsx:57-143` (remove the hook, import it), `:160` (call site)

- [ ] **Step 1: Cut the hook**

In `ArticleDetail.jsx`, cut the comment and the `function useZoomGestures(...) { ... }` block (lines 60–143: from `// Pinch (trackpad or touch)` through the function's closing `}` after `return zoomTo;`). Keep `MIN_ZOOM` and `MAX_ZOOM` (lines 57–58) in `ArticleDetail.jsx`.

- [ ] **Step 2: Paste it into `shared.jsx` as an export taking limits**

Append the hook to the end of `src/components/shared.jsx`, changing only these things:

1. `function useZoomGestures(frameRef, zoom, setZoom, enabled) {` becomes:

```js
export function useZoomGestures(frameRef, zoom, setZoom, enabled, { min = 50, max = 400 } = {}) {
```

2. The clamp line `const next = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)));` becomes:

```js
      const next = Math.round(Math.min(max, Math.max(min, z)));
```

3. The `useCallback` dependency list `[frameRef, setZoom]` becomes `[frameRef, setZoom, min, max]`.

The comment above the function stays as it was.

- [ ] **Step 3: Use it from `ArticleDetail.jsx`**

Change the import line `import { MiniTimeline, Thumb } from "../shared";` to:

```js
import { MiniTimeline, Thumb, useZoomGestures } from "../shared";
```

Change the call (formerly line 160) to:

```js
  const zoomTo = useZoomGestures(frameRef, zoom, setZoom, tab !== "text", { min: MIN_ZOOM, max: MAX_ZOOM });
```

- [ ] **Step 4: Lint and check that the article viewer still zooms**

Run: `npx eslint src/components/shared.jsx src/components/articles/ArticleDetail.jsx`
Expected: no errors.

Run `npm run dev`, open `http://localhost:5173/articles/098/clipping`, and check that the +/- buttons and Ctrl + scroll still zoom and that the zoom stays between 50% and 400%.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared.jsx src/components/articles/ArticleDetail.jsx
git commit -m "Move useZoomGestures into shared.jsx for reuse"
```

---

### Task 10: MapLayer, StLouisMap and styles

**Files:**
- Create: `src/components/lifemap/MapLayer.jsx`
- Create: `src/components/lifemap/StLouisMap.jsx`
- Create: `src/styles/lifemap.less`
- Modify: `src/index.less` (append the import)

- [ ] **Step 1: `src/components/lifemap/MapLayer.jsx`**

```jsx
import React from "react";

// Draws one built layer (scripts/lifemap/build.cjs) inside the map's <svg>. k = screen px per map unit,
// so labels keep a steady size on screen while streets scale with the map.
const AREAS = ["water", "levee", "park"];
const ROADS = ["pedestrian", "minor", "major", "motorway", "bridge"];

export default function MapLayer({ layer, era, k }) {
  const p = layer.paths;
  return (
    <g className={`lm-layer lm-${era}`}>
      <rect className="lm-land" width={layer.width} height={layer.height} />
      {AREAS.map((c) => p[c] && <path key={c} className={`lm-${c}`} d={p[c]} />)}
      {p.rail && <path className="lm-rail" d={p.rail} />}
      {ROADS.map((c) => p[c] && <path key={`${c}-casing`} className={`lm-casing lm-${c}-casing`} d={p[c]} />)}
      {ROADS.map((c) => p[c] && <path key={c} className={`lm-road lm-${c}`} d={p[c]} />)}
      {layer.labels
        .filter((l) => l.cls === "major" || k >= 0.9)
        .map((l) => (
          <text key={`${l.text}-${l.x}-${l.y}`} className={`lm-label lm-label-${l.cls}`} transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`} fontSize={11 / k}>
            {l.text}
          </text>
        ))}
    </g>
  );
}
```

- [ ] **Step 2: `src/components/lifemap/StLouisMap.jsx`**

```jsx
import React from "react";
import { useZoomGestures } from "../shared";
import { FRAMES, project } from "./projection.mjs";
import { placeYears } from "./timeline.mjs";
import MapLayer from "./MapLayer";
import layer1875 from "./geo/stl-downtown-1875.json";
import layerToday from "./geo/stl-downtown-today.json";

const FRAME = FRAMES.downtown;
const MIN_ZOOM = 100; // 100% = the whole frame fits the width
const MAX_ZOOM = 800;
const START_ZOOM = 250;
const LABEL_K = 1.6; // above this zoom every pin shows its label

function Pin({ pin, k, selected, faded, onSelect }) {
  const cls = ["lm-pin", pin.precision === "area" ? "lm-pin-area" : "lm-pin-exact", selected && "is-selected", faded && "is-faded", k >= LABEL_K && "show-label"].filter(Boolean).join(" ");
  const years = placeYears(pin);
  return (
    <button type="button" className={cls} style={{ left: pin.x * k, top: pin.y * k }} aria-label={`${pin.name}${years ? `, ${years}` : ""}`} aria-pressed={selected} onClick={() => onSelect(pin.id)}>
      <span className="lm-pin-dot" aria-hidden="true" />
      <span className="lm-pin-label" aria-hidden="true">
        {pin.name}
        {years && <small>{years}</small>}
      </span>
    </button>
  );
}

export default function StLouisMap({ places, selectedId, onSelect, isActive }) {
  const frameRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(START_ZOOM);
  const [view, setView] = React.useState({ cw: 0, sl: 0 });
  const [compare, setCompare] = React.useState(false);
  const [split, setSplit] = React.useState(0.5);
  const zoomTo = useZoomGestures(frameRef, zoom, setZoom, true, { min: MIN_ZOOM, max: MAX_ZOOM });

  React.useLayoutEffect(() => {
    const f = frameRef.current;
    const measure = () => setView({ cw: f.clientWidth, sl: f.scrollLeft });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    return () => ro.disconnect();
  }, []);

  const k = view.cw ? (view.cw * zoom) / 100 / FRAME.width : 0;

  const pins = React.useMemo(
    () =>
      places
        .filter((p) => p.level === "downtown")
        .map((p) => {
          const [x, y] = project(FRAME, p.lon, p.lat);
          return { ...p, x, y };
        }),
    [places],
  );

  // Centre the selected place: at once on first render, smoothly afterwards.
  const centred = React.useRef(null);
  React.useLayoutEffect(() => {
    const f = frameRef.current;
    const pin = pins.find((p) => p.id === selectedId);
    if (!k || !pin || centred.current === selectedId) return;
    const first = centred.current === null;
    centred.current = selectedId;
    f.scrollTo({ left: pin.x * k - f.clientWidth / 2, top: pin.y * k - f.clientHeight / 2, behavior: first ? "auto" : "smooth" });
  }, [selectedId, k, pins]);

  // Drag to pan with a mouse; touch screens scroll natively.
  const drag = React.useRef(null);
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("button")) return;
    const f = frameRef.current;
    drag.current = { x: e.clientX, y: e.clientY, sl: f.scrollLeft, st: f.scrollTop };
    f.setPointerCapture(e.pointerId);
    f.classList.add("is-dragging");
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const f = frameRef.current;
    f.scrollLeft = d.sl - (e.clientX - d.x);
    f.scrollTop = d.st - (e.clientY - d.y);
  };
  const onPointerUp = () => {
    drag.current = null;
    frameRef.current.classList.remove("is-dragging");
  };

  // Swipe handle: position is a fraction of the visible map width.
  const moveSplit = (clientX) => {
    const r = stageRef.current.getBoundingClientRect();
    setSplit(Math.min(0.98, Math.max(0.02, (clientX - r.left) / r.width)));
  };
  const onHandleDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    moveSplit(e.clientX);
  };
  const onHandleMove = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) moveSplit(e.clientX);
  };
  const onHandleKey = (e) => {
    const step = { ArrowLeft: -0.05, ArrowRight: 0.05 }[e.key];
    if (step == null) return;
    e.preventDefault();
    setSplit((s) => Math.min(0.98, Math.max(0.02, s + step)));
  };

  const splitX = k ? (view.sl + split * view.cw) / k : 0;

  return (
    <div className="lm-map">
      <div className="lm-toolbar">
        <button type="button" role="switch" aria-checked={compare} className="lm-switch" onClick={() => setCompare((c) => !c)}>
          <span className="lm-knob" aria-hidden="true" />
          <span className="lm-switch-label">Compare with today</span>
        </button>
        {compare && <span className="lm-hint">Drag the handle: 1875 on the left, today on the right</span>}
        <span className="grow" />
        <button type="button" className="btn btn-square" aria-label="Zoom out" onClick={() => zoomTo(zoom / 1.4)} disabled={zoom <= MIN_ZOOM}>
          −
        </button>
        <button type="button" className="btn btn-square" aria-label="Zoom in" onClick={() => zoomTo(zoom * 1.4)} disabled={zoom >= MAX_ZOOM}>
          +
        </button>
      </div>
      <div className="lm-stage" ref={stageRef}>
        <div
          className="lm-frame"
          ref={frameRef}
          onScroll={(e) => setView((v) => ({ ...v, sl: e.currentTarget.scrollLeft }))}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {k > 0 && (
            <div className="lm-content" style={{ width: FRAME.width * k, height: FRAME.height * k }}>
              <svg className="lm-svg" viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width={FRAME.width * k} height={FRAME.height * k} aria-hidden="true">
                <defs>
                  <clipPath id="lm-today-clip">
                    <rect x={splitX} y="0" width={Math.max(0, FRAME.width - splitX)} height={FRAME.height} />
                  </clipPath>
                </defs>
                <MapLayer layer={layer1875} era="then" k={k} />
                {compare && (
                  <g clipPath="url(#lm-today-clip)">
                    <MapLayer layer={layerToday} era="today" k={k} />
                  </g>
                )}
              </svg>
              {pins.map((p) => (
                <Pin key={p.id} pin={p} k={k} selected={p.id === selectedId} faded={!isActive(p)} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
        {compare && (
          <>
            <div className="lm-swipe-line" style={{ left: `${split * 100}%` }} aria-hidden="true" />
            <div
              role="slider"
              tabIndex={0}
              className="lm-swipe-handle"
              style={{ left: `${split * 100}%` }}
              aria-label="Compare position: 1875 on the left, today on the right"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(split * 100)}
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onKeyDown={onHandleKey}
            >
              <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
                <path d="M8 2L3 7l5 5M18 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="lm-tag lm-tag-then" style={{ right: `${(1 - split) * 100}%` }} aria-hidden="true">
              1875
            </span>
            <span className="lm-tag lm-tag-today" style={{ left: `${split * 100}%` }} aria-hidden="true">
              Today
            </span>
          </>
        )}
      </div>
      <p className="lm-credit">
        1875 streets traced from Wm. C. Wilson &amp; Bro.&rsquo;s map of St. Louis (State Historical Society of Missouri).
        {compare && " Today: data © OpenStreetMap contributors."}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: `src/styles/lifemap.less`**

```less
// Life map (/map). Variables come from index.less.
@today-ink: #3b4a55;
@today-blue: #1f5f8b;

.lifemap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.lm-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 28px;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.lm-map {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.lm-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  border: 1px solid @ink;
  background: @panel;
  padding: 6px 8px 6px 10px;
}

.lm-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: @display;
  font-weight: 700;
  font-size: 15px;
  .lm-knob {
    position: relative;
    width: 52px;
    height: 30px;
    border-radius: 15px;
    border: 2px solid @ink;
    background: @paper;
    flex-shrink: 0;
    &::after {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: @ink;
      transition: left 0.15s;
    }
  }
  &[aria-checked="true"] .lm-knob {
    background: @red;
    &::after {
      left: 25px;
      background: @paper;
    }
  }
  &:focus-visible {
    outline: 2px solid @red;
    outline-offset: 3px;
  }
}

.lm-hint {
  font-size: 13px;
  font-style: italic;
  color: @muted;
}

.lm-stage {
  position: relative;
  border: 1px solid @ink;
  height: min(72vh, 760px);
  overflow: hidden;
  @media (max-width: 900px) {
    height: 62vh;
  }
}

.lm-frame {
  position: absolute;
  inset: 0;
  overflow: auto;
  scrollbar-width: none;
  cursor: grab;
  &::-webkit-scrollbar {
    display: none;
  }
  &.is-dragging {
    cursor: grabbing;
  }
}

.lm-content {
  position: relative;
}

.lm-svg {
  display: block;
}

// 1875: ink on cream. Roads are drawn as a dark casing under a paper-coloured fill, so blocks stand out.
.lm-then {
  .lm-land {
    fill: #e6dcc6;
  }
  .lm-water {
    fill: #cfc6ae;
    stroke: @ink-warm;
    stroke-width: 1.5;
  }
  .lm-levee {
    fill: #efe7d4;
    stroke: @ink-warm;
    stroke-width: 1;
  }
  .lm-casing {
    fill: none;
    stroke: @ink-warm;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lm-road {
    fill: none;
    stroke: @paper;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lm-minor-casing,
  .lm-pedestrian-casing {
    stroke-width: 12;
  }
  .lm-minor,
  .lm-pedestrian {
    stroke-width: 8.5;
  }
  .lm-major-casing,
  .lm-bridge-casing {
    stroke-width: 16;
  }
  .lm-major,
  .lm-bridge {
    stroke-width: 12;
  }
  .lm-label {
    font-family: @body;
    letter-spacing: 0.12em;
    fill: @ink;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .lm-label-major {
    font-weight: 700;
  }
}

// Today: a cool, plain modern style.
.lm-today {
  .lm-land {
    fill: #eef0f0;
  }
  .lm-water {
    fill: #a9cbe0;
  }
  .lm-park {
    fill: #cfe3c4;
  }
  .lm-rail {
    fill: none;
    stroke: #8d969c;
    stroke-width: 3;
    stroke-dasharray: 8 6;
  }
  .lm-casing {
    fill: none;
    stroke: #c5cbd0;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lm-road {
    fill: none;
    stroke: #fff;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lm-pedestrian-casing {
    stroke-width: 0;
  }
  .lm-pedestrian {
    stroke: #d8dcdf;
    stroke-width: 5;
  }
  .lm-minor-casing {
    stroke-width: 11;
  }
  .lm-minor {
    stroke-width: 8;
  }
  .lm-major-casing,
  .lm-bridge-casing {
    stroke-width: 15;
  }
  .lm-major,
  .lm-bridge {
    stroke-width: 11;
  }
  .lm-motorway-casing {
    stroke: #c99a6a;
    stroke-width: 19;
  }
  .lm-motorway {
    stroke: #f2cf9f;
    stroke-width: 15;
  }
  .lm-label {
    font-family: Inter, system-ui, sans-serif;
    fill: @today-ink;
    text-anchor: middle;
    dominant-baseline: central;
  }
}

.lm-pin {
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  &::before {
    // 44px touch target
    content: "";
    position: absolute;
    left: -22px;
    top: -22px;
    width: 44px;
    height: 44px;
  }
  .lm-pin-dot {
    position: absolute;
    left: -8px;
    top: -8px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: @red;
    border: 2px solid @ink;
  }
  &.lm-pin-area .lm-pin-dot {
    background: rgba(241, 236, 225, 0.85);
    border: 2px dashed @ink-warm;
  }
  .lm-pin-label {
    position: absolute;
    left: 14px;
    top: -17px;
    display: none;
    white-space: nowrap;
    padding: 3px 7px;
    background: @paper;
    border: 1px solid @rule-light;
    font-size: 13px;
    line-height: 1.25;
    text-align: left;
    small {
      display: block;
      font-size: 12px;
      color: @muted;
    }
  }
  &:hover .lm-pin-label,
  &:focus-visible .lm-pin-label,
  &.show-label .lm-pin-label,
  &.is-selected .lm-pin-label {
    display: block;
  }
  &.is-selected {
    z-index: 2;
    .lm-pin-dot {
      left: -12px;
      top: -12px;
      width: 24px;
      height: 24px;
      border-width: 3px;
      box-shadow: 0 0 0 4px rgba(158, 27, 22, 0.3);
    }
    .lm-pin-label {
      left: 18px;
      background: @ink;
      color: @paper;
      border-color: @ink;
      small {
        color: #e6dccb;
      }
    }
  }
  &.is-faded:not(.is-selected) {
    opacity: 0.35;
  }
  &:focus-visible {
    outline: none;
    .lm-pin-dot {
      outline: 2px solid @red;
      outline-offset: 3px;
    }
  }
}

.lm-swipe-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  margin-left: -1.5px;
  background: @ink;
  pointer-events: none;
}

.lm-swipe-handle {
  position: absolute;
  top: 50%;
  width: 44px;
  height: 44px;
  margin: -22px 0 0 -22px;
  border-radius: 50%;
  background: @ink;
  color: @paper;
  border: 2px solid @paper;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
  touch-action: none;
  &:focus-visible {
    outline: 2px solid @red;
    outline-offset: 2px;
  }
}

.lm-tag {
  position: absolute;
  bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  pointer-events: none;
  &.lm-tag-then {
    margin-right: 8px;
    background: @ink;
    color: @paper;
  }
  &.lm-tag-today {
    margin-left: 8px;
    background: @today-blue;
    color: #fff;
    font-family: Inter, system-ui, sans-serif;
  }
}

.lm-credit {
  margin: 0;
  font-size: 12px;
  font-style: italic;
  color: @muted;
}
```

- [ ] **Step 4: Import the styles**

Append to the end of `src/index.less`:

```less
@import "./styles/lifemap.less";
```

- [ ] **Step 5: Lint**

Run: `npx eslint src/components/lifemap/`
Expected: no errors. (The page isn't routed yet; Task 12 renders it.)

- [ ] **Step 6: Commit**

```bash
git add src/components/lifemap/MapLayer.jsx src/components/lifemap/StLouisMap.jsx src/styles/lifemap.less src/index.less
git commit -m "Life map: drawn St. Louis map with zoom, pan, swipe and pins"
```

---

### Task 11: PlaceCard and LifeTimeline

**Files:**
- Create: `src/components/lifemap/PlaceCard.jsx`
- Create: `src/components/lifemap/LifeTimeline.jsx`
- Modify: `src/styles/lifemap.less` (append)

- [ ] **Step 1: `src/components/lifemap/PlaceCard.jsx`**

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { facts } from "../../../data/facts";
import { fights } from "../../../data/fights";
import { formatDate } from "../../lib/articles";
import { placeYears } from "./timeline.mjs";

const FACT_BY_ID = new Map(facts.map((f) => [f.id, f]));
const FIGHT_BY_ID = new Map(fights.map((f) => [f.id, f]));
const SHOWN_FACTS = 6;

const KIND = {
  saloon: "Saloon",
  "saloon-other": "Another man's saloon",
  venue: "Venue",
  fight: "Fight",
  training: "Training camp",
  travel: "Travel",
  residence: "Home",
  legal: "Court",
  family: "Family",
  hotel: "Hotel",
  property: "Property",
  death: "Death",
  burial: "Burial",
};

export default function PlaceCard({ place, onMap }) {
  if (!place) {
    return (
      <article className="lm-card">
        <p className="muted">Choose a pin on the map or a period on the timeline.</p>
      </article>
    );
  }
  const placeFacts = (place.facts || [])
    .map((id) => FACT_BY_ID.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const placeFights = (place.fights || []).map((id) => FIGHT_BY_ID.get(id)).filter(Boolean);
  const articleCount = new Set(placeFacts.flatMap((f) => f.articles || [])).size;
  const years = placeYears(place);

  return (
    <article className="lm-card" aria-live="polite">
      <div className="lm-card-kicker">Selected place · {KIND[place.kind] || place.kind}</div>
      <h2>{place.name}</h2>
      <p className="lm-card-addr">
        {place.address || place.city}
        {years && (
          <>
            {" "}
            · <i>{years}</i>
          </>
        )}
      </p>
      {place.today && <p className="lm-card-today">Today: {place.today}</p>}
      {place.precision === "area" && <p className="lm-card-note">The pin is approximate.</p>}
      {!onMap && <p className="lm-card-note">Not shown on this map.</p>}
      {placeFights.length > 0 && (
        <ul className="lm-card-fights">
          {placeFights.map((f) => (
            <li key={f.id}>
              <Link to="/record">vs. {f.opponent}</Link>, {formatDate(f.date)} · {f.result}
            </li>
          ))}
        </ul>
      )}
      {placeFacts.length > 0 && (
        <ul className="lm-card-facts">
          {placeFacts.slice(0, SHOWN_FACTS).map((f) => (
            <li key={f.id}>
              {f.date && <b>{formatDate(f.date, "short")} </b>}
              {f.fact}
              {f.articles?.[0] && (
                <>
                  {" "}
                  <Link to={`/articles/${f.articles[0]}`} className="lm-src">
                    source
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {place.notes && <p className="lm-card-notes">{place.notes}</p>}
      <div className="lm-card-foot">
        {placeFacts.length} facts from {articleCount} articles
        {placeFacts.length > SHOWN_FACTS && ` · ${SHOWN_FACTS} shown`}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: `src/components/lifemap/LifeTimeline.jsx`**

```jsx
import React from "react";
import { LIFE_ERAS, T_START, T_END, americanFights } from "./timeline.mjs";

const pct = (y) => ((y - T_START) / (T_END - T_START)) * 100;
const TICKS = [1870, 1875, 1880, 1885, 1890, 1895, 1900];

export default function LifeTimeline({ eraId, onEra, fights }) {
  const marks = React.useMemo(() => americanFights(fights), [fights]);
  return (
    <section className="lm-timeline" aria-label="Timeline of where he lived">
      <div className="lm-timeline-inner">
        <div className="lm-eras">
          {LIFE_ERAS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`lm-era lm-era-${e.tone}${eraId === e.id ? " is-active" : ""}`}
              style={{ left: `${pct(e.from)}%`, width: `${pct(e.to) - pct(e.from)}%` }}
              aria-pressed={eraId === e.id}
              aria-label={`${e.label}, ${Math.floor(e.from)}–${Math.floor(e.to)}`}
              title={e.label}
              onClick={() => onEra(eraId === e.id ? null : e.id)}
            >
              {e.short ?? e.label}
            </button>
          ))}
        </div>
        <div className="lm-fights" aria-hidden="true">
          {marks.map((m) => (
            <span key={m.id} className="lm-fight" style={{ left: `${pct(m.year)}%` }} title={`${m.opponent}, ${m.date}`} />
          ))}
        </div>
        <div className="lm-axis" aria-hidden="true">
          {TICKS.map((y) => (
            <span key={y} style={{ left: `${pct(y)}%` }}>
              {y}
            </span>
          ))}
          <span className="lm-death" style={{ left: `${pct(1903.26)}%` }}>
            † 1903
          </span>
        </div>
        <div className="lm-legend">
          <span className="lm-fight lm-fight-key" aria-hidden="true" /> prize fights in America
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Append the card and timeline styles to `src/styles/lifemap.less`**

```less
.lm-card {
  background: @panel;
  border-top: 4px solid @red;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  h2 {
    font-size: 30px;
  }
}

.lm-card-kicker {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: @red;
  font-weight: 700;
}

.lm-card-addr {
  margin: 0;
  font-size: 15px;
}

.lm-card-today {
  margin: 0;
  font-size: 13px;
  font-family: Inter, system-ui, sans-serif;
  color: @today-blue;
}

.lm-card-note,
.lm-card-notes {
  margin: 0;
  font-size: 13px;
  font-style: italic;
  color: @muted;
}

.lm-card-facts,
.lm-card-fights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  line-height: 1.35;
}

.lm-src {
  font-size: 12px;
  font-style: italic;
  color: @red;
}

.lm-card-foot {
  border-top: 1px solid @rule-light;
  padding-top: 10px;
  font-size: 13px;
}

.lm-timeline {
  overflow-x: auto;
}

.lm-timeline-inner {
  position: relative;
  min-width: 900px;
  height: 100px;
}

.lm-eras {
  position: absolute;
  inset: 0 0 auto 0;
  height: 44px;
}

.lm-era {
  position: absolute;
  top: 0;
  height: 44px;
  padding: 0 5px;
  border: 0;
  border-right: 2px solid @paper;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
  font-size: 12.5px;
  cursor: pointer;
  background: #d4cab6;
  &.lm-era-stl {
    background: #c7bba2;
  }
  &.lm-era-main {
    background: @red;
    color: @paper;
    font-weight: 700;
  }
  &.is-active {
    outline: 3px solid @ink;
    outline-offset: -3px;
  }
  &:focus-visible {
    outline: 3px solid @ink;
    outline-offset: -3px;
  }
}

.lm-fights {
  position: absolute;
  left: 0;
  right: 0;
  top: 52px;
  height: 8px;
}

.lm-fight {
  position: absolute;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  background: @red;
  transform: rotate(45deg);
  &.lm-fight-key {
    position: static;
    display: inline-block;
    margin: 0 6px 0 0;
  }
}

.lm-axis {
  position: absolute;
  left: 0;
  right: 0;
  top: 64px;
  border-top: 1px solid @ink;
  span {
    position: absolute;
    top: 4px;
    transform: translateX(-50%);
    font-size: 12px;
    color: @muted;
  }
  .lm-death {
    color: @ink;
  }
}

.lm-legend {
  position: absolute;
  left: 0;
  top: 84px;
  font-size: 11px;
  color: @muted;
}
```

- [ ] **Step 4: Lint**

Run: `npx eslint src/components/lifemap/`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/lifemap/PlaceCard.jsx src/components/lifemap/LifeTimeline.jsx src/styles/lifemap.less
git commit -m "Life map: place card and timeline"
```

---

### Task 12: Page, route and nav

**Files:**
- Create: `src/components/lifemap/LifeMap.jsx`
- Modify: `src/components/routes.jsx`
- Modify: `src/components/Navbar.jsx` (`NAV`)

- [ ] **Step 1: `src/components/lifemap/LifeMap.jsx`**

```jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { places } from "../../../data/places";
import { fights } from "../../../data/fights";
import StLouisMap from "./StLouisMap";
import PlaceCard from "./PlaceCard";
import LifeTimeline from "./LifeTimeline";
import { LIFE_ERAS, activeInEra } from "./timeline.mjs";

const BY_ID = new Map(places.map((p) => [p.id, p]));
const DEFAULT_PLACE = "stl-417-washington";

export default function LifeMap() {
  const [params, setParams] = useSearchParams();
  const asked = params.get("place");
  const selectedId = BY_ID.has(asked) ? asked : DEFAULT_PLACE;
  const [eraId, setEraId] = React.useState(null);
  const era = LIFE_ERAS.find((e) => e.id === eraId) || null;

  const select = React.useCallback((id) => setParams({ place: id }, { replace: true }), [setParams]);
  const onEra = (id) => {
    setEraId(id);
    const e = LIFE_ERAS.find((x) => x.id === id);
    if (e) select(e.place);
  };
  const isActive = React.useCallback((p) => activeInEra(p, era), [era]);
  const place = BY_ID.get(selectedId);

  return (
    <div className="lifemap">
      <div className="page-head">
        <div className="kicker">The map</div>
        <h1>Tom Allen&rsquo;s St. Louis</h1>
        <div className="deck">Where he kept saloon, sang and fought, drawn over the city as it was in 1875.</div>
      </div>
      <div className="lm-body">
        <StLouisMap places={places} selectedId={selectedId} onSelect={select} isActive={isActive} />
        <aside>
          <PlaceCard place={place} onMap={place?.level === "downtown"} />
        </aside>
      </div>
      <LifeTimeline eraId={eraId} onEra={onEra} fights={fights} />
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `src/components/routes.jsx`, add the import after `import About from "./About";`:

```jsx
import LifeMap from "./lifemap/LifeMap";
```

and the route after `<Route path="/record" Component={Record} />`:

```jsx
          <Route path="/map" Component={LifeMap} />
```

- [ ] **Step 3: Add the nav link**

In `src/components/Navbar.jsx`, change `NAV` to:

```js
const NAV = [
  ["/", "Front page"],
  ["/biography", "Biography"],
  ["/articles", "Articles"],
  ["/record", "Record"],
  ["/map", "Map"],
  ["/about", "About"],
];
```

- [ ] **Step 4: Lint, test and build**

Run: `npm run lint && npm test && npm run package`
Expected: lint passes, all tests pass, and the Vite build succeeds. A warning about chunk size is acceptable; an error isn't.

- [ ] **Step 5: Commit**

```bash
git add src/components/lifemap/LifeMap.jsx src/components/routes.jsx src/components/Navbar.jsx
git commit -m "Life map: /map page with nav link"
```

---

### Task 13: Check it in the browser, then update the changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Take screenshots at desktop and phone widths**

Start the dev server (`npm run dev`, background), then:

```bash
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
S=/private/tmp/claude-501/-Users-bryanyoung-Projects-champions-rest/lifemap-shots; mkdir -p $S
"$C" --headless=new --hide-scrollbars --virtual-time-budget=8000 --window-size=1440,1400 --screenshot=$S/desktop.png "http://localhost:5173/map"
"$C" --headless=new --hide-scrollbars --virtual-time-budget=8000 --window-size=390,1600 --screenshot=$S/phone.png "http://localhost:5173/map?place=stl-619-market"
```

Read both images. Check that:
- the 1875 map shows blocks, street names and the river;
- the 417 Washington pin is selected, centred and labelled, and the card shows its facts;
- on the phone, the card is under the map and the timeline scrolls;
- `?place=stl-619-market` selects and centres 619 Market.

- [ ] **Step 2: Check the interactions by hand, or with the user**

Headless screenshots can't drag, so ask the user to try, or open Claude in Chrome if it's connected. Check that:
- the compare switch shows the today layer to the right of the handle;
- the handle drags, and arrow keys move it once it has focus;
- +/− and Ctrl + scroll zoom around the pointer, and labels stay the same size on screen;
- the map pans by mouse drag;
- clicking a pin changes the card and the URL;
- clicking "417 Washington Ave." on the timeline fades the pins outside 1870–76, and clicking it again clears that;
- clicking "Toronto" shows its card with "Not shown on this map";
- the card's "source" links open the articles.

Fix anything broken and re-run `npm run lint && npm test`.

- [ ] **Step 3: Update `CHANGELOG.md`**

Under today's date header (create `## 2026-11-17` or the current date if missing), add:

```markdown
- Map page (`/map`): Tom Allen's downtown St. Louis places on our own drawing of the 1875 city, with a swipe comparison against a drawing of today's streets (OpenStreetMap data), clickable pins, place cards and a timeline
```

In the Backlog, remove any item this finishes. Add:
- "Map: citywide zoom level (Studley 1870 tracing)";
- "Map: America view";
- "Map: period railroads on the America view".

The Status table counts articles, crops, pages and transcripts, which this doesn't change, so leave it alone.

- [ ] **Step 4: Commit (ask before pushing; a push to `main` deploys)**

```bash
git add CHANGELOG.md
git commit -m "Changelog: map page"
```

---

## Not in this plan (separate plans later)

- Spec step 3: the citywide level (`stl-city-1870` tracing, the zoom-level switch, and places with `level: "city"`).
- Spec step 4: the America view (`/map/america`, Natural Earth, arcs, the Atlantic box).
