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
