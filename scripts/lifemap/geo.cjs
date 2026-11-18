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
