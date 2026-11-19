// Builds the drawn map layers: mapdata/*.geojson -> src/components/lifemap/geo/*.json
//   npm run build-map
const fs = require("fs");
const path = require("path");
const { simplify, toPath, polylineLength, labelAt, placeLabels } = require("./geo.cjs");
const { applyEdits } = require("./edits.cjs");

const ROOT = path.join(__dirname, "../..");
const KINDS = ["water", "park", "levee", "pond", "path", "rail", "pedestrian", "minor", "major", "motorway", "bridge", "pitch", "stadium", "landmark", "arch", "land", "lake", "river", "state", "border"];
const AREAS = new Set(["water", "park", "levee", "pond", "pitch", "stadium", "landmark", "arch", "land", "lake"]);
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

function buildLayer(fc, frame, project, { era, tol = TOL, extraLabels = [] }) {
  const parts = Object.fromEntries(KINDS.map((k) => [k, []]));
  const cands = [];
  const points = []; // "label" features: names placed by hand (landmarks)
  for (const f of fc.features) {
    const { kind, name } = f.properties;
    if (kind === "label") {
      const [lon, lat] = f.geometry.coordinates;
      points.push({ text: name, lon, lat, angle: f.properties.angle || 0, cls: f.properties.cls || "major" });
      continue;
    }
    if (!(kind in parts)) continue;
    const rings = f.geometry.type === "Polygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const ring of rings) {
      const pts = simplify(ring.map(([lon, lat]) => project(frame, lon, lat)), tol);
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
  for (const l of [...points, ...extraLabels]) {
    const [x, y] = project(frame, l.lon, l.lat);
    labels.push({ text: l.text, x: r1(x), y: r1(y), angle: l.angle, cls: l.cls });
  }
  return { frame: frame.id, width: frame.width, height: frame.height, paths: Object.fromEntries(KINDS.map((k) => [k, parts[k].join("")])), labels };
}

// Hand-placed water names for the America map: [text, lon, lat, angle]
const AMERICA_LABELS = [
  ["ATLANTIC OCEAN", -72, 36.5, 0],
  ["GULF OF MEXICO", -90.5, 28.9, 0],
  ["Lake Michigan", -87.0, 43.6, -80],
  ["Lake Erie", -81.4, 42.15, -20],
  ["Lake Ontario", -77.6, 43.3, -10],
  ["Lake Huron", -82.4, 44.6, -60],
  ["Mississippi", -91.2, 33.0, -72],
  ["Ohio", -86.4, 37.95, -12],
  ["Missouri", -93.3, 39.25, 8],
].map(([text, lon, lat, angle]) => ({ text, lon, lat, angle, cls: "water" }));

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
  const americaFile = path.join(ROOT, "mapdata/america.geojson");
  if (fs.existsSync(americaFile)) {
    const america = JSON.parse(fs.readFileSync(americaFile, "utf8"));
    layers.america = buildLayer(america, FRAMES.america, project, { era: "today", tol: 0.6, extraLabels: AMERICA_LABELS });
  }
  for (const [name, layer] of Object.entries(layers)) {
    const file = path.join(out, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(layer));
    console.log(`${path.relative(ROOT, file)}: ${(fs.statSync(file).size / 1024).toFixed(0)} KB, ${layer.labels.length} labels`);
  }
}

if (require.main === module) main();
module.exports = { buildLayer, labelText };
