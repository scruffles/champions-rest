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
