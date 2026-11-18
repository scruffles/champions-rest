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
