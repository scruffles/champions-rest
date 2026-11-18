const { test } = require("node:test");
const assert = require("node:assert/strict");
const { applyEdits } = require("./edits.cjs");

const line = (osm, kind, name) => ({ type: "Feature", properties: { osm, kind, name }, geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] } });
const fc = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { kind: "water", name: "Mississippi River" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
    line(1, "major", "North Broadway"),
    line(2, "motorway", "Interstate 44"),
    line(3, "minor", "Memorial Drive"),
    line(4, "minor", "Locust Street"),
    line(5, "minor", "Lucas Avenue"),
    { type: "Feature", properties: { osm: 6, kind: "park", name: "Kiener Plaza" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
  ],
};

const edits = {
  rename: { "North Broadway": "Fifth St." },
  removeKinds: ["motorway", "park"],
  removeNames: ["Memorial Drive"],
  removeIds: [5],
  add: [
    { name: "Main St.", kind: "minor", coords: [[0, 0], [0, 1]] },
    { name: "Levee", kind: "levee", ring: [[0, 0], [1, 0], [1, 1], [0, 0]] },
  ],
  water: [[0, 0], [2, 0], [2, 2], [0, 0]],
};

test("applyEdits renames, removes, adds and replaces the river", () => {
  const out = applyEdits(fc, edits);
  const names = out.features.map((f) => `${f.properties.kind}:${f.properties.name}`);
  assert.deepEqual(names, ["water:Mississippi River", "major:Fifth St.", "minor:Locust Street", "minor:Main St.", "levee:Levee"]);
  assert.deepEqual(out.features[0].geometry.coordinates[0][1], [2, 0]);
  assert.equal(out.features[4].geometry.type, "Polygon");
});

test("applyEdits does not mutate its input", () => {
  applyEdits(fc, edits);
  assert.equal(fc.features[1].properties.name, "North Broadway");
});

test("rename tolerates missing names and leaves unknown names alone", () => {
  const out = applyEdits({ type: "FeatureCollection", features: [line(9, "minor", null), line(10, "minor", "Pine Street")] }, { rename: { "Pine Street": "Pine St." } });
  assert.deepEqual(out.features.map((f) => f.properties.name), [null, "Pine St."]);
});

test("bridges: keep listed ones, turn named street bridges into streets, drop the rest", () => {
  const out = applyEdits(
    { type: "FeatureCollection", features: [line(20, "bridge", "Eads Bridge"), line(21, "bridge", "Pine Street"), line(22, "bridge", null), line(23, "bridge", "Ozark Expressway")] },
    { keepBridges: ["Eads Bridge"], removeNames: ["Ozark Expressway"] },
  );
  assert.deepEqual(out.features.map((f) => `${f.properties.kind}:${f.properties.name}`), ["bridge:Eads Bridge", "minor:Pine Street"]);
});
