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
