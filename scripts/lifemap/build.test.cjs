const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildLayer, labelText } = require("./build.cjs");

const frame = { id: "t", width: 1000, height: 1000 };
const project = (f, lon, lat) => [lon * 1000, (1 - lat) * 1000]; // unit square → frame
const fc = {
  features: [
    { properties: { kind: "water" }, geometry: { type: "Polygon", coordinates: [[[0.8, 1], [1, 1], [1, 0], [0.8, 0], [0.8, 1]]] } },
    { properties: { kind: "major", name: "Market Street" }, geometry: { type: "LineString", coordinates: [[0, 0.5], [0.5, 0.5], [0.7, 0.5]] } },
    { properties: { kind: "minor", name: "Pine Street" }, geometry: { type: "LineString", coordinates: [[0, 0.6], [0.02, 0.6]] } },
  ],
};

test("buildLayer projects features into per-kind paths", () => {
  const layer = buildLayer(fc, frame, project, { era: "today" });
  assert.equal(layer.width, 1000);
  assert.match(layer.paths.water, /^M800 0L1000 0.*Z$/);
  assert.equal(layer.paths.major, "M0 500L700 500"); // middle point simplified away
  assert.equal(layer.paths.park, "");
});

test("buildLayer labels streets long enough to carry a name", () => {
  const layer = buildLayer(fc, frame, project, { era: "today" });
  assert.deepEqual(layer.labels.map((l) => [l.text, l.cls]), [["Market Street", "major"]]);
});

test("labelText: 1875 names are upper case and abbreviated, like the period map", () => {
  assert.equal(labelText("Market Street", "1875"), "MARKET ST.");
  assert.equal(labelText("Washington Avenue", "1875"), "WASHINGTON AV.");
  assert.equal(labelText("Fifth St.", "1875"), "FIFTH ST.");
  assert.equal(labelText("Market Street", "today"), "Market Street");
});

test("buildLayer draws land and lakes as areas and adds extra labels", () => {
  const fc2 = {
    features: [
      { properties: { kind: "land" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]]] } },
      { properties: { kind: "river", name: "Ohio" }, geometry: { type: "LineString", coordinates: [[0, 0.2], [0.4, 0.2]] } },
    ],
  };
  const layer = buildLayer(fc2, frame, project, { era: "today", extraLabels: [{ text: "GULF", lon: 0.5, lat: 0.1, angle: 0, cls: "water" }] });
  assert.match(layer.paths.land, /Z$/);
  assert.equal(layer.paths.river, "M0 800L400 800");
  assert.deepEqual(layer.labels, [{ text: "GULF", x: 500, y: 900, angle: 0, cls: "water" }]);
});
