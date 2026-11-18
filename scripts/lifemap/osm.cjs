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
  return ringFrom(pts.filter((p) => p[0] < splitLon), pts.filter((p) => p[0] >= splitLon));
}

// West and east bank points (already separated) -> closed ring, west bank north to south, then east bank south to north.
function ringFrom(westPts, eastPts) {
  const uniq = (arr) => arr.filter((p, i) => i === 0 || p[0] !== arr[i - 1][0] || p[1] !== arr[i - 1][1]);
  const west = uniq([...westPts].sort((a, b) => b[1] - a[1]));
  const east = uniq([...eastPts].sort((a, b) => a[1] - b[1]));
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
const riverQuery = (b) => `[out:json][timeout:90];relation["natural"="water"]["water"="river"](${bb(b)});way(r)(${bb(b)});out geom(${bb(b)});`;

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
  // Bank ways run diagonally here, so one longitude can't split them; classify each whole way by its mean longitude.
  // (Points outside the bbox come back as null.)
  const banks = river.elements.filter((e) => e.type === "way" && e.geometry).map((e) => e.geometry.filter(Boolean).map((p) => [p.lon, p.lat]));
  const meanLon = (w) => w.reduce((a, p) => a + p[0], 0) / w.length;
  const ring = ringFrom(banks.filter((w) => meanLon(w) < -90.1805).flat(), banks.filter((w) => meanLon(w) >= -90.1805).flat());
  fc.features.unshift({ type: "Feature", properties: { kind: "water", name: "Mississippi River" }, geometry: { type: "Polygon", coordinates: [ring] } });
  fs.mkdirSync(path.join(ROOT, "mapdata"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "mapdata/stl-modern.geojson"), JSON.stringify(fc));
  const n = (k) => fc.features.filter((f) => f.properties.kind === k).length;
  console.log(`mapdata/stl-modern.geojson: ${fc.features.length} features (major ${n("major")}, minor ${n("minor")}, motorway ${n("motorway")}, bridge ${n("bridge")}, park ${n("park")}, rail ${n("rail")}, river ring ${ring.length} pts)`);
}

if (require.main === module) main();
module.exports = { normalize, riverPolygon, ringFrom, kindOf, quarters };
