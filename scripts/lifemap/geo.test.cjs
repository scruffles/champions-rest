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
