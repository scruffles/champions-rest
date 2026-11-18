# Life Map: Full-Screen Mode and America View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Add a remembered full-screen mode to `/map` that fits the navbar, map, place card and timeline in a laptop window with no page scrolling.
- Add an America view (`/map/america`) drawn from Natural Earth data, with arcs from St. Louis to every city.

**Architecture:**
- **Full-screen mode:**
  - A hook (`useFullscreen`) owns the preference (localStorage), the screen-size check (`matchMedia`) and the `lm-full` class on `<html>`.
  - CSS turns the page into a fixed grid under the compact navbar.
  - `Navbar.jsx` shows the compact bar while that class is present, via `useHtmlClass`.
- **America view:**
  - The Natural Earth GeoJSON is fetched and clipped once into `mapdata/america.geojson`.
  - The existing build projects it into `src/components/lifemap/geo/america.json`.
  - `AmericaMap.jsx` draws it fitted to its box (no zoom), with arcs and percentage-positioned pins.
  - Pure helpers in `views.mjs` hold the logic: the grouping near St. Louis, which view a place belongs to, arc paths, and label thinning.

**Tech Stack:** React 18, react-router 7 (optional route segment), Less (container query units), Node 23 build scripts, and `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-life-map-design.md`, section "Addendum (2026-11-17)".

**Rules:**
- Work on branch `life-map-america` (already created).
- Stage specific paths only.
- Commit messages end with a blank line, then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never push.
- ESLint doesn't cover `.jsx` here, so `npx vite build --logLevel warn` is the compile check. The chunk-size warning is normal.

---

## File map

| File | Responsibility |
|---|---|
| `src/components/shared.jsx` | Gains `useHtmlClass(name)` |
| `src/components/Navbar.jsx` | Compact bar is also shown while `<html>` has `lm-full` |
| `src/components/lifemap/useFullscreen.js` | Preference, screen-size check, `lm-full` class, Esc |
| `src/components/lifemap/views.mjs` (+ `views.test.mjs`) | `HOME`, `distanceKm`, `viewOfPlace`, `nearHome`, `homePlace`, `isFightPlace`, `arcPath`, `visibleLabels` |
| `scripts/lifemap/natural-earth.cjs` (+ `.test.cjs`) | Fetch and clip Natural Earth → `mapdata/america.geojson` |
| `src/components/lifemap/projection.mjs` (+ test) | Gains `FRAMES.america` |
| `scripts/lifemap/build.cjs` (+ test) | New kinds (land, lake, river, state, border), per-layer tolerance, extra labels; builds `geo/america.json` |
| `src/components/lifemap/AmericaMap.jsx` | The America map |
| `src/components/lifemap/PlaceCard.jsx` | Grouped places (St. Louis marker) |
| `src/components/lifemap/LifeMap.jsx` | View bar (tabs and Full screen), views, routing |
| `src/components/routes.jsx` | `/map/:view?` |
| `src/styles/lifemap.less` | View bar, full-screen layout, America styles |

---

### Task 1: `useHtmlClass` and the navbar

**Files:** Modify `src/components/shared.jsx`, `src/components/Navbar.jsx`.

- [ ] **Step 1: Add the hook to the end of `src/components/shared.jsx`**

```jsx
// True while <html> has the class `name`; kept in sync with a MutationObserver.
export function useHtmlClass(name) {
  const [on, setOn] = React.useState(() => document.documentElement.classList.contains(name));
  React.useEffect(() => {
    const el = document.documentElement;
    const sync = () => setOn(el.classList.contains(name));
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    sync();
    return () => observer.disconnect();
  }, [name]);
  return on;
}
```

- [ ] **Step 2: Use it in `src/components/Navbar.jsx`**

Change `import { InkFilter } from "./shared";` to:

```jsx
import { InkFilter, useHtmlClass } from "./shared";
```

Change `const compact = useScrolledPast(navRowRef);` to:

```jsx
  const scrolledPast = useScrolledPast(navRowRef);
  // The map's full-screen mode hides the page behind a fixed layer, so it keeps the compact bar showing.
  const fullMap = useHtmlClass("lm-full");
  const compact = scrolledPast || fullMap;
```

- [ ] **Step 3: Compile**

Run: `npx vite build --logLevel warn`. Expected: it builds.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared.jsx src/components/Navbar.jsx
git commit -m "Navbar: show the compact bar while the map is full screen"
```

---

### Task 2: Full-screen mode

**Files:** Create `src/components/lifemap/useFullscreen.js`. Modify `src/components/lifemap/LifeMap.jsx` and `src/styles/lifemap.less`.

- [ ] **Step 1: Create `src/components/lifemap/useFullscreen.js`**

```js
import React from "react";

// Full-screen map: remembered per browser, only on screens big enough to fit everything.
const KEY = "lifemap-full";
const FITS = "(min-width: 900px) and (min-height: 600px)";

function readPref() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function writePref(on) {
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Storage blocked (private window): the choice just isn't remembered.
  }
}

export function useFullscreen() {
  const [wanted, setWanted] = React.useState(readPref);
  const [fits, setFits] = React.useState(() => window.matchMedia(FITS).matches);
  const set = React.useCallback((on) => {
    setWanted(on);
    writePref(on);
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia(FITS);
    const sync = () => setFits(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const active = wanted && fits;

  React.useEffect(() => {
    if (!active) return undefined;
    const html = document.documentElement;
    html.classList.add("lm-full");
    window.scrollTo(0, 0);
    const onKey = (e) => {
      if (e.key !== "Escape" || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      set(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.classList.remove("lm-full");
      window.removeEventListener("keydown", onKey);
    };
  }, [active, set]);

  return { active, fits, set };
}
```

- [ ] **Step 2: Add the view bar to `src/components/lifemap/LifeMap.jsx`**

Add the import after the `timeline.mjs` import:

```jsx
import { useFullscreen } from "./useFullscreen";
```

Inside `LifeMap()`, after `const place = BY_ID.get(selectedId);`, add:

```jsx
  const full = useFullscreen();
```

Replace `<div className="lifemap">` with `<div className={`lifemap${full.active ? " is-full" : ""}`}>`. Directly after the closing `</div>` of `page-head`, add:

```jsx
      <div className="lm-viewbar">
        <span className="grow" />
        {full.fits && (
          <button type="button" className="btn" aria-pressed={full.active} onClick={() => full.set(!full.active)}>
            {full.active ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </div>
```

- [ ] **Step 3: Append the full-screen styles to `src/styles/lifemap.less`**

```less
.lm-viewbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
}

// Full screen: the page is a fixed layer under the compact navbar (56px + 3px border).
html.lm-full {
  overflow: hidden;
  body {
    overflow: hidden;
  }
  .masthead {
    visibility: hidden;
  }
}

.lifemap.is-full {
  position: fixed;
  z-index: 30;
  top: 59px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 24px 8px;
  background: @paper;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 10px;
  .page-head {
    display: none;
  }
  .lm-body {
    min-height: 0;
    height: 100%;
    grid-template-columns: minmax(0, 1fr) 360px;
  }
  .lm-map {
    height: 100%;
    min-height: 0;
  }
  .lm-stage {
    flex: 1 1 0;
    height: auto;
    min-height: 0;
  }
  .lm-body > aside {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
  .lm-timeline-inner {
    min-width: 0;
  }
}
```

- [ ] **Step 4: Compile and check**

Run: `npx vite build --logLevel warn`. Expected: it builds.

Start `npx vite --port 5179` in the background and run headless Chrome at 1440×900 (a laptop). Use the CDP approach: `--remote-debugging-port=9333`, then a Node script over `WebSocket` that clicks "Full screen", waits, and takes a screenshot. Check that:
- `document.documentElement.scrollHeight <= innerHeight`, so there's no page scroll;
- the compact bar is visible (`.compact-bar.shown`);
- the map stage, card and timeline are all inside the viewport, using `getBoundingClientRect().bottom <= innerHeight` for `.lm-timeline`;
- Esc turns it off;
- a reload keeps it on, because the preference is remembered;
- at 800 px wide the button isn't rendered.

Stop the servers afterwards.

- [ ] **Step 5: Commit**

```bash
git add src/components/lifemap/useFullscreen.js src/components/lifemap/LifeMap.jsx src/styles/lifemap.less
git commit -m "Life map: remembered full-screen mode that fits a laptop window"
```

---

### Task 3: View helpers

**Files:** Create `src/components/lifemap/views.mjs` and `src/components/lifemap/views.test.mjs`.

- [ ] **Step 1: Write the failing test `src/components/lifemap/views.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME, distanceKm, viewOfPlace, nearHome, homePlace, isFightPlace, arcPath, visibleLabels } from "./views.mjs";

const P = (id, level, lat, lon, extra = {}) => ({ id, level, lat, lon, kind: "travel", fights: [], ...extra });
const places = [
  P("east-st-louis", "america", 38.6245, -90.1509),
  P("belleville", "america", 38.5201, -89.984),
  P("fight-chouteau-island", "america", 38.71, -90.17, { kind: "fight" }),
  P("union-mo", "america", 38.45, -91.0085),
  P("chicago", "america", 41.8781, -87.6298),
  P("stl-417-washington", "downtown", 38.62985, -90.18761),
  P("birmingham", "atlantic", 52.4862, -1.8904),
];

test("distanceKm", () => {
  assert.ok(Math.abs(distanceKm(HOME, { lat: 38.5201, lon: -89.984 }) - 22.2) < 1);
  assert.ok(distanceKm(HOME, { lat: 38.45, lon: -91.0085 }) > 70);
});

test("viewOfPlace", () => {
  assert.equal(viewOfPlace({ level: "downtown" }), "stl");
  assert.equal(viewOfPlace({ level: "city" }), "stl");
  assert.equal(viewOfPlace({ level: "america" }), "america");
  assert.equal(viewOfPlace({ level: "atlantic" }), "america");
  assert.equal(viewOfPlace(undefined), "stl");
});

test("nearHome groups america places within 30 km of St. Louis", () => {
  assert.deepEqual(nearHome(places), ["east-st-louis", "belleville", "fight-chouteau-island"]);
});

test("homePlace is a virtual St. Louis place listing the grouped ones", () => {
  const h = homePlace(places);
  assert.equal(h.id, "st-louis");
  assert.equal(h.level, "america");
  assert.deepEqual(h.grouped, ["east-st-louis", "belleville", "fight-chouteau-island"]);
  assert.deepEqual([h.lat, h.lon], [HOME.lat, HOME.lon]);
});

test("isFightPlace", () => {
  assert.equal(isFightPlace({ kind: "fight", fights: [] }), true);
  assert.equal(isFightPlace({ kind: "travel", fights: ["007"] }), true);
  assert.equal(isFightPlace({ kind: "travel", fights: [] }), false);
});

test("arcPath bends to the left of the direction of travel", () => {
  assert.equal(arcPath([0, 0], [100, 0]), "M0 0Q50 16 100 0");
  assert.equal(arcPath([100, 0], [0, 0]), "M100 0Q50 16 0 0");
});

test("visibleLabels keeps labels apart and always shows the chosen one", () => {
  const pins = [{ id: "a", x: 0, y: 0 }, { id: "b", x: 10, y: 0 }, { id: "c", x: 100, y: 0 }];
  assert.deepEqual([...visibleLabels(pins, 30)].sort(), ["a", "c"]);
  assert.deepEqual([...visibleLabels(pins, 30, "b")].sort(), ["b", "c"]);
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test src/components/lifemap/views.test.mjs`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/components/lifemap/views.mjs`**

```js
// Which map shows a place, the St. Louis marker on the America map, arcs and label thinning.
export const HOME = { lat: 38.627, lon: -90.199 };
export const NEAR_KM = 30;

export function distanceKm(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const viewOfPlace = (p) => (p && (p.level === "america" || p.level === "atlantic") ? "america" : "stl");

// America-level places too close to St. Louis to show apart at this scale.
export function nearHome(places, home = HOME, km = NEAR_KM) {
  return places.filter((p) => p.level === "america" && distanceKm(home, p) <= km).map((p) => p.id);
}

export function homePlace(places) {
  return {
    id: "st-louis",
    name: "St. Louis",
    kind: "residence",
    city: "St. Louis, Missouri",
    address: null,
    today: null,
    from: "1868",
    to: "1903",
    lat: HOME.lat,
    lon: HOME.lon,
    precision: "city",
    facts: [],
    fights: [],
    notes: "His home from 1868 until his death in 1903. The St. Louis map shows his saloons and the fights in the city.",
    level: "america",
    grouped: nearHome(places),
  };
}

export const isFightPlace = (p) => p.kind === "fight" || (p.fights || []).length > 0;

const r1 = (n) => String(Math.round(n * 10) / 10);

// Quadratic curve from a to b, its control point pushed sideways by 16% of the distance.
export function arcPath([x1, y1], [x2, y2], bend = 0.16) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const side = dx < 0 ? -1 : 1;
  const cx = (x1 + x2) / 2 - dy * bend * side;
  const cy = (y1 + y2) / 2 + dx * bend * side;
  return `M${r1(x1)} ${r1(y1)}Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`;
}

// Greedy: the chosen pin first, then the rest in order; skip any label within minDist of one already shown.
export function visibleLabels(pins, minDist, always) {
  const order = [...pins].sort((p, q) => (q.id === always) - (p.id === always));
  const shown = [];
  for (const p of order) if (!shown.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < minDist)) shown.push(p);
  return new Set(shown.map((p) => p.id));
}
```

- [ ] **Step 4: Run the tests and check that they pass**

Run: `node --test src/components/lifemap/views.test.mjs`. Expected: 7 pass. Also run `npm test`, which should show all passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/lifemap/views.mjs src/components/lifemap/views.test.mjs
git commit -m "Life map: view helpers for the America map"
```

---

### Task 4: Natural Earth data

**Files:** Create `scripts/lifemap/natural-earth.cjs`, `scripts/lifemap/natural-earth.test.cjs` and `mapdata/america.geojson` (generated).

- [ ] **Step 1: Write the failing test `scripts/lifemap/natural-earth.test.cjs`**

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { clampRing, clipLine, collect, BBOX } = require("./natural-earth.cjs");

const b = { w: -100, e: -64, s: 26.5, n: 48 };

test("BBOX is the America frame plus a margin", () => {
  assert.deepEqual(BBOX, b);
});

test("clampRing pulls far points onto the box edge and drops repeats", () => {
  assert.deepEqual(clampRing([[-120, 30], [-90, 30], [-90, 50], [-120, 30]], b), [[-100, 30], [-90, 30], [-90, 48], [-100, 30]]);
  assert.deepEqual(clampRing([[-120, 30], [-110, 30], [-90, 30], [-120, 30]], b), [[-100, 30], [-90, 30], [-100, 30]]);
});

test("clipLine keeps runs inside the box plus one point either side", () => {
  assert.deepEqual(clipLine([[-120, 30], [-90, 30], [-80, 30], [-50, 30]], b), [[[-120, 30], [-90, 30], [-80, 30], [-50, 30]]]);
  assert.deepEqual(clipLine([[-120, 30], [-110, 30]], b), []);
  assert.deepEqual(clipLine([[-90, 30], [-120, 30], [-80, 40]], b), [[[-90, 30], [-120, 30]], [[-120, 30], [-80, 40]]]);
});

test("collect turns polygons and lines into kinded features inside the box", () => {
  const fc = {
    features: [
      { properties: { name: "A" }, geometry: { type: "MultiPolygon", coordinates: [[[[-90, 30], [-80, 30], [-80, 40], [-90, 30]]], [[[10, 10], [11, 10], [11, 11], [10, 10]]]] } },
      { properties: { name: "Mississippi" }, geometry: { type: "LineString", coordinates: [[-90, 30], [-90, 35]] } },
    ],
  };
  const out = collect(fc, "land");
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((f) => [f.properties.kind, f.geometry.type]), [["land", "Polygon"], ["land", "LineString"]]);
  assert.equal(out[1].properties.name, "Mississippi");
});
```

- [ ] **Step 2: Run it and check that it fails**

Run: `node --test scripts/lifemap/natural-earth.test.cjs`. Expected: FAIL.

- [ ] **Step 3: Implement `scripts/lifemap/natural-earth.cjs`**

```js
// Fetches Natural Earth 1:50m (public domain) and clips it to the America frame plus a margin.
//   node scripts/lifemap/natural-earth.cjs  -> review/work/maps/ne/*.geojson (cache) + mapdata/america.geojson
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");
const CACHE = path.join(ROOT, "review/work/maps/ne");
const BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/";
const FILES = {
  land: "ne_50m_land",
  lake: "ne_50m_lakes",
  river: "ne_50m_rivers_lake_centerlines",
  state: "ne_50m_admin_1_states_provinces_lines",
  border: "ne_50m_admin_0_boundary_lines_land",
};
const BBOX = { w: -100, e: -64, s: 26.5, n: 48 };

const inside = ([x, y], b) => x >= b.w && x <= b.e && y >= b.s && y <= b.n;

function clampRing(ring, b) {
  const out = [];
  for (const [x, y] of ring) {
    const p = [Math.min(b.e, Math.max(b.w, x)), Math.min(b.n, Math.max(b.s, y))];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
}

function ringTouches(ring, b) {
  let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
  for (const [x, y] of ring) {
    w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
  }
  return w <= b.e && e >= b.w && s <= b.n && n >= b.s;
}

function clipLine(coords, b) {
  const runs = [];
  let run = null;
  coords.forEach((p, i) => {
    if (inside(p, b)) {
      if (!run) run = i > 0 ? [coords[i - 1]] : [];
      run.push(p);
    } else if (run) {
      run.push(p);
      runs.push(run);
      run = null;
    }
  });
  if (run) runs.push(run);
  return runs.filter((r) => r.length >= 2);
}

function collect(fc, kind, b = BBOX) {
  const out = [];
  const add = (geometry, name) => out.push({ type: "Feature", properties: { kind, name: name || null }, geometry });
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    const name = f.properties?.name || null;
    if (g.type === "Polygon" || g.type === "MultiPolygon") {
      const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      for (const poly of polys) {
        if (!ringTouches(poly[0], b)) continue;
        const ring = clampRing(poly[0], b);
        if (ring.length >= 4) add({ type: "Polygon", coordinates: [ring] }, name);
      }
    } else if (g.type === "LineString" || g.type === "MultiLineString") {
      const lines = g.type === "LineString" ? [g.coordinates] : g.coordinates;
      for (const line of lines) for (const run of clipLine(line, b)) add({ type: "LineString", coordinates: run }, name);
    }
  }
  return out;
}

async function load(name) {
  const file = path.join(CACHE, `${name}.geojson`);
  if (!fs.existsSync(file)) {
    const r = await fetch(BASE + name + ".geojson");
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const features = [];
  for (const [kind, name] of Object.entries(FILES)) features.push(...collect(await load(name), kind));
  const out = path.join(ROOT, "mapdata/america.geojson");
  fs.writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features }));
  const n = (k) => features.filter((f) => f.properties.kind === k).length;
  console.log(`mapdata/america.geojson: ${(fs.statSync(out).size / 1024).toFixed(0)} KB (land ${n("land")}, lake ${n("lake")}, river ${n("river")}, state ${n("state")}, border ${n("border")})`);
}

if (require.main === module) main();
module.exports = { clampRing, clipLine, collect, BBOX };
```

- [ ] **Step 4: Run the tests and check that they pass**

Run: `node --test scripts/lifemap/natural-earth.test.cjs`. Expected: 4 pass.

- [ ] **Step 5: Fetch the data**

Run: `node scripts/lifemap/natural-earth.cjs`. Expected: a line with land ≥ 1, lake ≥ 5 (the Great Lakes), river ≥ 10, state ≥ 30 and border ≥ 1. If the file is over 1.5 MB, report it; the build simplifies it anyway.

- [ ] **Step 6: Commit**

```bash
git add scripts/lifemap/natural-earth.cjs scripts/lifemap/natural-earth.test.cjs mapdata/america.geojson
git commit -m "Life map: Natural Earth outlines for the America view"
```

---

### Task 5: America frame and layer

**Files:** Modify `src/components/lifemap/projection.mjs` (+ test), `scripts/lifemap/build.cjs` (+ test). Create `src/components/lifemap/geo/america.json` (generated).

- [ ] **Step 1: Add the failing tests**

Append to `src/components/lifemap/projection.test.mjs`:

```js
test("america frame holds every city from Kansas City to Boston, New Orleans to Toronto", () => {
  const A = FRAMES.america;
  assert.equal(A.width, 1600);
  assert.ok(A.height > 1080 && A.height < 1120, `height ${A.height}`);
  for (const [lon, lat] of [[-94.5786, 39.0997], [-71.0589, 42.3601], [-90.0715, 29.9511], [-81.27, 29.86], [-79.3832, 43.6532]]) assert.equal(inFrame(A, lon, lat), true);
});
```

Append to `scripts/lifemap/build.test.cjs`:

```js
test("buildLayer draws land and lakes as areas and adds extra labels", () => {
  const fc2 = {
    features: [
      { properties: { kind: "land" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]]] } },
      { properties: { kind: "river", name: "Ohio" }, geometry: { type: "LineString", coordinates: [[0, 0.2], [0.4, 0.2]] } },
    ],
  };
  const layer = buildLayer(fc2, frame, project, { era: "today", extraLabels: [{ text: "GULF", lon: 0.5, lat: 0.1, angle: 0, cls: "water" }] });
  assert.match(layer.paths.land, /Z$/);
  assert.equal(layer.paths.river, "M0 800L400 800");
  assert.deepEqual(layer.labels, [{ text: "GULF", x: 500, y: 900, angle: 0, cls: "water" }]);
});
```

Run: `npm test`. Expected: these two tests FAIL.

- [ ] **Step 2: Add the frame**

In `projection.mjs`, change `FRAMES` to:

```js
// downtown: Cass Ave to Chouteau Ave, 18th St to the Illinois bank
// america: Kansas to the Atlantic, the Gulf to Toronto
export const FRAMES = {
  downtown: makeFrame("downtown", -90.2055, 38.6155, -90.172, 38.6435, 1800),
  america: makeFrame("america", -98, 28.5, -66, 46, 1600),
};
```

- [ ] **Step 3: Extend the build**

In `scripts/lifemap/build.cjs`:

1. Replace the `KINDS` and `AREAS` lines with:

```js
const KINDS = ["water", "park", "levee", "rail", "pedestrian", "minor", "major", "motorway", "bridge", "land", "lake", "river", "state", "border"];
const AREAS = new Set(["water", "park", "levee", "land", "lake"]);
```

2. Change the signature to `function buildLayer(fc, frame, project, { era, tol = TOL, extraLabels = [] }) {`, and use `tol` instead of `TOL` in the `simplify` call.

3. Replace the `const labels = …` line with:

```js
  const labels = placeLabels(cands, { minSpacing: 600 }).map(({ text, x, y, angle, cls }) => ({ text, x: r1(x), y: r1(y), angle, cls }));
  for (const l of extraLabels) {
    const [x, y] = project(frame, l.lon, l.lat);
    labels.push({ text: l.text, x: r1(x), y: r1(y), angle: l.angle, cls: l.cls });
  }
```

4. Above `async function main()`, add:

```js
// Hand-placed water names for the America map: [text, lon, lat, angle]
const AMERICA_LABELS = [
  ["ATLANTIC OCEAN", -72, 36.5, 0],
  ["GULF OF MEXICO", -90.5, 28.9, 0],
  ["Lake Michigan", -87.0, 43.6, -80],
  ["Lake Erie", -81.4, 42.15, -20],
  ["Lake Ontario", -77.8, 43.62, 0],
  ["Lake Huron", -82.4, 44.6, -60],
  ["Mississippi", -91.2, 33.0, -72],
  ["Ohio", -86.4, 37.95, -12],
  ["Missouri", -93.3, 39.25, 8],
].map(([text, lon, lat, angle]) => ({ text, lon, lat, angle, cls: "water" }));
```

5. In `main()`, after the `layers` object, add:

```js
  const americaFile = path.join(ROOT, "mapdata/america.geojson");
  if (fs.existsSync(americaFile)) {
    const america = JSON.parse(fs.readFileSync(americaFile, "utf8"));
    layers.america = buildLayer(america, FRAMES.america, project, { era: "today", tol: 0.6, extraLabels: AMERICA_LABELS });
  }
```

   Natural Earth names aren't wanted as street labels: the kinds `land`, `lake`, `river`, `state` and `border` aren't in `LABELLED`, so they get none automatically.

- [ ] **Step 4: Run the tests and build**

Run: `npm test`. Expected: everything passes.

Run: `npm run build-map`. Expected: three lines, the new one being `src/components/lifemap/geo/america.json: … KB, 9 labels`, under 400 KB. If it's larger, raise the America `tol` to 1.0. The downtown layers must come out byte-identical (`git diff --stat src/components/lifemap/geo/stl-*` shows nothing).

Render a check PNG in the scratchpad: land filled, water background, lakes, rivers, state lines and borders, using a throwaway sharp script like the one in Task 7 of the earlier plan. Read it, and confirm the Great Lakes, Florida, the Gulf coast and Cape Cod look right and nothing is mirrored or offset.

- [ ] **Step 5: Commit**

```bash
git add src/components/lifemap/projection.mjs src/components/lifemap/projection.test.mjs scripts/lifemap/build.cjs scripts/lifemap/build.test.cjs src/components/lifemap/geo/america.json
git commit -m "Life map: America frame and Natural Earth layer"
```

---

### Task 6: America view, tabs and routing

**Files:** Create `src/components/lifemap/AmericaMap.jsx`. Modify `src/components/lifemap/LifeMap.jsx`, `src/components/lifemap/PlaceCard.jsx`, `src/components/routes.jsx` and `src/styles/lifemap.less`.

- [ ] **Step 1: Create `src/components/lifemap/AmericaMap.jsx`**

```jsx
import React from "react";
import { FRAMES, project } from "./projection.mjs";
import { placeYears } from "./timeline.mjs";
import { arcPath, isFightPlace, visibleLabels } from "./views.mjs";
import layer from "./geo/america.json";

const FRAME = FRAMES.america;
const W = FRAME.width;
const H = FRAME.height;
const LABEL_GAP = 70; // map units between city labels

export default function AmericaMap({ places, home, selectedId, onSelect, isActive }) {
  const homeXY = React.useMemo(() => project(FRAME, home.lon, home.lat), [home]);
  const pins = React.useMemo(() => {
    const grouped = new Set(home.grouped);
    return [home, ...places.filter((p) => p.level === "america" && !grouped.has(p.id))].map((p) => {
      const [x, y] = project(FRAME, p.lon, p.lat);
      return { ...p, x, y };
    });
  }, [places, home]);
  const labelled = React.useMemo(() => visibleLabels(pins, LABEL_GAP, selectedId), [pins, selectedId]);
  const atlantic = places.filter((p) => p.level === "atlantic");

  return (
    <div className="lm-map">
      <div className="lm-stage lm-us-stage">
        <div className="lm-us-box" style={{ "--ar": W / H }}>
          <svg className="lm-us-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <rect className="lm-us-sea" width={W} height={H} />
            <path className="lm-us-land" d={layer.paths.land} />
            <path className="lm-us-lake" d={layer.paths.lake} />
            <path className="lm-us-river" d={layer.paths.river} />
            <path className="lm-us-state" d={layer.paths.state} />
            <path className="lm-us-border" d={layer.paths.border} />
            {layer.labels.map((l) => (
              <text key={l.text} className="lm-us-label" transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`}>
                {l.text}
              </text>
            ))}
            {pins.slice(1).map((p) => (
              <path key={p.id} className={`lm-arc ${isFightPlace(p) ? "lm-arc-fight" : "lm-arc-trip"}${isActive(p) ? "" : " is-faded"}`} d={arcPath(homeXY, [p.x, p.y])} />
            ))}
          </svg>
          {pins.map((p) => {
            const years = placeYears(p);
            const cls = [
              "lm-pin",
              p.id === home.id ? "lm-pin-home" : isFightPlace(p) ? "lm-pin-fight" : "lm-pin-trip",
              p.id === selectedId && "is-selected",
              !isActive(p) && "is-faded",
              labelled.has(p.id) && "show-label",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={p.id}
                type="button"
                className={cls}
                style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
                aria-label={`${p.name}${years ? `, ${years}` : ""}`}
                aria-pressed={p.id === selectedId}
                onClick={() => onSelect(p.id)}
              >
                <span className="lm-pin-dot" aria-hidden="true" />
                <span className="lm-pin-label" aria-hidden="true">
                  {p.name}
                  {years && <small>{years}</small>}
                </span>
              </button>
            );
          })}
        </div>
        {atlantic.length > 0 && (
          <div className="lm-atlantic">
            <div className="lm-atlantic-head">Across the Atlantic</div>
            {atlantic.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === selectedId} onClick={() => onSelect(p.id)}>
                {p.name}
                <small>{placeYears(p)}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="lm-credit">Coastlines, rivers and borders: Natural Earth. Lines run from St. Louis: solid to his fights, dashed to other trips.</p>
    </div>
  );
}
```

- [ ] **Step 2: Let `PlaceCard` show grouped places**

In `src/components/lifemap/PlaceCard.jsx`:

1. Change the signature to `export default function PlaceCard({ place, onMap, lookup, onSelect }) {`.

2. Directly after the `{!onMap && …}` line, add:

```jsx
      {place.grouped?.length > 0 && (
        <div className="lm-card-group">
          <p className="lm-card-note">Close by, shown on this marker:</p>
          <ul>
            {place.grouped.map((id) => {
              const g = lookup.get(id);
              return (
                g && (
                  <li key={id}>
                    <button type="button" className="btn-link" onClick={() => onSelect(id)}>
                      {g.name}
                    </button>{" "}
                    <span className="muted">{placeYears(g)}</span>
                  </li>
                )
              );
            })}
          </ul>
          <Link to="/map" className="lm-card-open">
            Open the St. Louis map →
          </Link>
        </div>
      )}
```

3. When the card has no facts (as with the virtual St. Louis place), hide the "0 facts from 0 articles" foot. Wrap the foot `div` in `{placeFacts.length > 0 && ( … )}`.

- [ ] **Step 3: Rewrite `src/components/lifemap/LifeMap.jsx`**

```jsx
import React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { places } from "../../../data/places";
import { fights } from "../../../data/fights";
import StLouisMap from "./StLouisMap";
import AmericaMap from "./AmericaMap";
import PlaceCard from "./PlaceCard";
import LifeTimeline from "./LifeTimeline";
import { LIFE_ERAS, activeInEra } from "./timeline.mjs";
import { homePlace, viewOfPlace } from "./views.mjs";
import { useFullscreen } from "./useFullscreen";

const HOME_PLACE = homePlace(places);
const BY_ID = new Map([...places, HOME_PLACE].map((p) => [p.id, p]));
const DEFAULT_PLACE = { stl: "stl-417-washington", america: HOME_PLACE.id };
const PATH = { stl: "/map", america: "/map/america" };
const TABS = [
  ["stl", "St. Louis"],
  ["america", "America"],
];
const HEAD = {
  stl: ["Tom Allen’s St. Louis", "Where he kept saloon, sang and fought, drawn over the city as it was in 1875."],
  america: ["Tom Allen’s America", "Every town the papers put him in, from his landing in 1867 to Mitchell’s camp in 1894."],
};

const onViewOf = (view, p) => !!p && (view === "stl" ? p.level === "downtown" : viewOfPlace(p) === "america");

export default function LifeMap() {
  const { view: viewParam } = useParams();
  const view = viewParam === "america" ? "america" : "stl";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const asked = params.get("place");
  const selectedId = BY_ID.has(asked) ? asked : DEFAULT_PLACE[view];
  const [eraId, setEraId] = React.useState(null);
  const [centreRequest, setCentreRequest] = React.useState(0);
  const era = LIFE_ERAS.find((e) => e.id === eraId) || null;
  const full = useFullscreen();

  const go = React.useCallback(
    (id, toView) => navigate(`${PATH[toView]}?place=${encodeURIComponent(id)}`, { replace: toView === view }),
    [navigate, view],
  );
  const select = React.useCallback((id) => go(id, view), [go, view]);
  const onEra = (id) => {
    setEraId(id);
    const e = LIFE_ERAS.find((x) => x.id === id);
    if (e) {
      go(e.place, viewOfPlace(BY_ID.get(e.place)));
      setCentreRequest((n) => n + 1);
    }
  };
  const isActive = React.useCallback((p) => activeInEra(p, era), [era]);
  const place = BY_ID.get(selectedId);
  const [title, deck] = HEAD[view];

  return (
    <div className={`lifemap${full.active ? " is-full" : ""}`}>
      <div className="page-head">
        <div className="kicker">The map</div>
        <h1>{title}</h1>
        <div className="deck">{deck}</div>
      </div>
      <div className="lm-viewbar">
        <nav className="lm-tabs" aria-label="Map view">
          {TABS.map(([v, label]) => (
            <Link key={v} to={onViewOf(v, place) ? `${PATH[v]}?place=${selectedId}` : PATH[v]} aria-current={view === v ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <span className="grow" />
        {full.fits && (
          <button type="button" className="btn" aria-pressed={full.active} onClick={() => full.set(!full.active)}>
            {full.active ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </div>
      <div className="lm-body">
        {view === "stl" ? (
          <StLouisMap places={places} selectedId={selectedId} centreRequest={centreRequest} onSelect={select} isActive={isActive} />
        ) : (
          <AmericaMap places={places} home={HOME_PLACE} selectedId={selectedId} onSelect={select} isActive={isActive} />
        )}
        <aside>
          <PlaceCard place={place} onMap={onViewOf(view, place)} lookup={BY_ID} onSelect={select} />
        </aside>
      </div>
      <LifeTimeline eraId={eraId} onEra={onEra} fights={fights} />
    </div>
  );
}
```

- [ ] **Step 4: Route**

In `src/components/routes.jsx`, change `<Route path="/map" Component={LifeMap} />` to `<Route path="/map/:view?" Component={LifeMap} />`.

- [ ] **Step 5: Append the styles to `src/styles/lifemap.less`**

```less
.lm-tabs {
  display: inline-flex;
  border: 1px solid @ink;
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 18px;
    text-decoration: none;
    font-size: 13px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    &[aria-current="page"] {
      background: @ink;
      color: @paper;
    }
  }
}

// America: fitted to the stage at the map's own proportions (container units keep pins and SVG in step).
.lm-us-stage {
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d9d1bd;
}

.lm-us-box {
  position: relative;
  width: min(100cqw, 100cqh * var(--ar));
  aspect-ratio: var(--ar);
}

.lm-us-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.lm-us-sea {
  fill: #d9d1bd;
}
.lm-us-land {
  fill: #ece4d0;
  stroke: #8a8276;
  stroke-width: 1.2;
}
.lm-us-lake {
  fill: #d9d1bd;
  stroke: #8a8276;
  stroke-width: 1;
}
.lm-us-river {
  fill: none;
  stroke: #8f9a96;
  stroke-width: 1.6;
}
.lm-us-state {
  fill: none;
  stroke: #b9b1a3;
  stroke-width: 1;
  stroke-dasharray: 4 3;
}
.lm-us-border {
  fill: none;
  stroke: #8a8276;
  stroke-width: 1.4;
}
.lm-us-label {
  font-family: @display;
  font-size: 15px;
  font-style: italic;
  letter-spacing: 0.08em;
  fill: #5c564d;
  text-anchor: middle;
  dominant-baseline: central;
}

.lm-arc {
  fill: none;
  stroke: @red;
  &.lm-arc-fight {
    stroke-width: 3;
  }
  &.lm-arc-trip {
    stroke-width: 1.6;
    stroke-dasharray: 5 5;
    opacity: 0.75;
  }
  &.is-faded {
    opacity: 0.15;
  }
}

.lm-us-box .lm-pin {
  .lm-pin-label {
    font-size: 12px;
  }
  &.lm-pin-trip .lm-pin-dot {
    background: @paper;
  }
  &.lm-pin-home .lm-pin-dot {
    left: -11px;
    top: -11px;
    width: 22px;
    height: 22px;
    border-width: 3px;
  }
  &.show-label:not(.is-selected) .lm-pin-label small {
    display: none;
  }
}

.lm-atlantic {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  background: @paper;
  border: 1px solid @ink;
  .lm-atlantic-head {
    padding: 6px 10px;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: @muted;
  }
  button {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-top: 1px solid @rule-light;
    background: none;
    cursor: pointer;
    text-align: left;
    small {
      color: @muted;
    }
    &[aria-pressed="true"] {
      background: @ink;
      color: @paper;
      small {
        color: #e6dccb;
      }
    }
  }
}

.lm-card-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }
}

.lm-card-open {
  font-size: 14px;
  color: @red;
}
```

- [ ] **Step 6: Compile, test and check in the browser**

Run: `npm test && npx vite build --logLevel warn`. Expected: everything passes and it builds.

Check in headless Chrome over CDP, as in Task 2, at 1440×900 and 390×1700. Check that:
- `/map/america` shows the map with land, lakes and arcs, and the St. Louis marker is selected with its card listing East St. Louis, Belleville and Chouteau Island;
- clicking Kansas City updates the card and the URL (`/map/america?place=kansas-city`);
- clicking "St. Louis" in the tabs goes to `/map`, and the place is kept when it belongs to that view;
- clicking the "Toronto" timeline period from `/map` navigates to `/map/america?place=toronto`, and "417 Washington Ave." navigates back to `/map`;
- the Atlantic box buttons select Birmingham and London;
- full screen works on both tabs: no page scroll, the US map fits inside the stage without overflowing, and pins line up with the land (Boston on the coast, New Orleans at the Mississippi mouth);
- on the phone, the US map fits the width and there's no sideways scroll.

Read the screenshots. Fix anything broken.

- [ ] **Step 7: Commit**

```bash
git add src/components/lifemap/AmericaMap.jsx src/components/lifemap/LifeMap.jsx src/components/lifemap/PlaceCard.jsx src/components/routes.jsx src/styles/lifemap.less
git commit -m "Life map: America view with arcs, St. Louis marker and Atlantic box"
```

---

### Task 7: Changelog

- [ ] **Step 1: Update `CHANGELOG.md`**

Under `## 2026-11-17` → `### Added`, add:

```markdown
- Map: America view (`/map/america`): every town the papers put him in, drawn from Natural Earth outlines, with arcs from St. Louis (solid to fights, dashed to other trips), a St. Louis marker that lists the nearby places, and an Across the Atlantic box for Birmingham and London
- Map: full-screen mode that fits the navbar, map, place card and timeline in a laptop window without scrolling; remembered per browser, Esc to exit, off on phones
```

In the Backlog's Map item, remove "the America view (`/map/america`, arcs to every city he fought or travelled to)", and keep "period railroads on the America view".

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "Changelog: America view and full-screen map"
```
