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

function fitPoly2(points, { lon0, lat0, S = 1000 }) {
  if (points.length < 6) throw new Error("need at least 6 control points");
  // S scales degrees so the normal equations stay well conditioned
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

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function layerSvg(layer, frame, pins, grid) {
  const p = layer.paths;
  const stroke = (d, color, w, extra = "") => (d ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>` : "");
  const fill = (d, color) => (d ? `<path d="${d}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2"/>` : "");
  const labels = layer.labels
    .map((l) => `<text transform="translate(${l.x} ${l.y}) rotate(${l.angle})" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="13" font-weight="bold" fill="#c00" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(l.text)}</text>`)
    .join("");
  const pinMarks = pins
    .map(([x, y, id]) => `<circle cx="${x}" cy="${y}" r="7" fill="#f0f" stroke="#000" stroke-width="2"/><text x="${x + 10}" y="${y - 8}" font-family="Arial" font-size="12" fill="#000" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(id)}</text>`)
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
    const worst = ref.points
      .map((p, i) => [p.note, fit.residuals[i]])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n, r]) => `${n} ${r.toFixed(1)}`)
      .join(", ");
    console.log(`control points: ${ref.points.length}, rms ${fit.rms.toFixed(1)} scan px; worst: ${worst}`);
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
