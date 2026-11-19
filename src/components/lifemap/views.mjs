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

// The part of the map to show in a box of boxW×boxH: the whole core frame (w×h), widened or heightened,
// centred, to fill the box exactly, so there are no empty bands (the outlines extend past the frame).
export function fitView(w, h, boxW, boxH) {
  if (!boxW || !boxH) return { x: 0, y: 0, w, h };
  const ar = boxW / boxH;
  if (ar >= w / h) return { x: (w - h * ar) / 2, y: 0, w: h * ar, h };
  return { x: 0, y: (h - w / ar) / 2, w, h: w / ar };
}

// Label boxes: { x, y, w, h, angle } with (x, y) the centre and angle in degrees. Separating-axis test.
export function boxesOverlap(a, b) {
  const axes = (r) => {
    const t = ((r.angle || 0) * Math.PI) / 180;
    return [
      [Math.cos(t), Math.sin(t)],
      [-Math.sin(t), Math.cos(t)],
    ];
  };
  const span = (r, [ax, ay]) => {
    const [[ux, uy], [vx, vy]] = axes(r);
    const c = r.x * ax + r.y * ay;
    const e = Math.abs((r.w / 2) * (ux * ax + uy * ay)) + Math.abs((r.h / 2) * (vx * ax + vy * ay));
    return [c - e, c + e];
  };
  for (const axis of [...axes(a), ...axes(b)]) {
    const [a0, a1] = span(a, axis);
    const [b0, b1] = span(b, axis);
    if (a1 <= b0 || b1 <= a0) return false;
  }
  return true;
}

// Keeps each box, in order, that overlaps no box kept before it and no obstacle (an obstacle with the
// box's own id doesn't count: a pin's own dot). force: true keeps a box regardless. Returns the kept ids.
export function placeBoxes(boxes, obstacles = []) {
  const kept = [];
  for (const b of boxes) {
    if (!b.force && (kept.some((k) => boxesOverlap(b, k)) || obstacles.some((o) => o.id !== b.id && boxesOverlap(b, o)))) continue;
    kept.push(b);
  }
  return new Set(kept.map((b) => b.id));
}

// Street and water names at zoom k (screen px per map unit), in screen px. Minor names wait for k >= 0.9;
// major names go first; a name that would cover a blocker (pin dots and labels) or another name is left out.
export function fitStreetLabels(labels, k, blockers = [], { charEm = 0.6, fontPx = 11 } = {}) {
  const cands = labels.filter((l) => l.cls === "major" || k >= 0.9).sort((a, b) => (a.cls !== "major") - (b.cls !== "major"));
  const boxes = cands.map((l, i) => ({ id: `l${i}`, l, x: l.x * k, y: l.y * k, w: l.text.length * fontPx * charEm + 6, h: fontPx + 4, angle: l.angle }));
  const shown = placeBoxes(boxes, blockers);
  return boxes.filter((b) => shown.has(b.id)).map((b) => b.l);
}
