const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalize, riverPolygon, bankLine, kindOf } = require("./osm.cjs");

const g = (...pairs) => pairs.map(([lon, lat]) => ({ lon, lat }));

test("kindOf classifies ways", () => {
  assert.equal(kindOf({ highway: "motorway" }), "motorway");
  assert.equal(kindOf({ highway: "primary" }), "major");
  assert.equal(kindOf({ highway: "residential" }), "minor");
  assert.equal(kindOf({ highway: "pedestrian" }), "pedestrian");
  assert.equal(kindOf({ highway: "primary", bridge: "yes" }), "bridge");
  assert.equal(kindOf({ railway: "rail" }), "rail");
  assert.equal(kindOf({ leisure: "park" }), "park");
  assert.equal(kindOf({ highway: "footway" }), null);
  assert.equal(kindOf({ highway: "service" }), null);
});

test("normalize turns ways into features and drops duplicates and unknown kinds", () => {
  const osm = {
    elements: [
      { type: "way", id: 1, tags: { highway: "primary", name: "Market Street" }, geometry: g([-90.19, 38.62], [-90.18, 38.62]) },
      { type: "way", id: 1, tags: { highway: "primary", name: "Market Street" }, geometry: g([-90.19, 38.62], [-90.18, 38.62]) },
      { type: "way", id: 2, tags: { highway: "footway" }, geometry: g([-90.19, 38.62], [-90.18, 38.62]) },
      { type: "way", id: 3, tags: { leisure: "park", name: "Kiener Plaza" }, geometry: g([0, 0], [1, 0], [1, 1], [0, 0]) },
      { type: "way", id: 4, tags: { leisure: "park" }, geometry: g([0, 0], [1, 0], [1, 1]) },
    ],
  };
  const fc = normalize(osm);
  assert.equal(fc.type, "FeatureCollection");
  assert.deepEqual(
    fc.features.map((f) => [f.properties.osm, f.properties.kind, f.geometry.type]),
    [[1, "major", "LineString"], [3, "park", "Polygon"]],
  );
  assert.equal(fc.features[0].properties.name, "Market Street");
});

test("riverPolygon joins the west bank (north to south) and east bank (south to north)", () => {
  const banks = [
    g([-90.180, 38.64], [-90.181, 38.63]),
    g([-90.181, 38.63], [-90.182, 38.62]),
    g([-90.170, 38.62], [-90.169, 38.64]),
  ];
  const ring = riverPolygon(banks, -90.176);
  assert.deepEqual(ring[0], [-90.18, 38.64]);
  assert.deepEqual(ring[ring.length - 1], ring[0]);
  const east = ring.filter(([lon]) => lon > -90.176);
  assert.deepEqual(east.map((p) => p[1]), [38.62, 38.64]);
});

test("bankLine orients and orders ways and drops points that turn back in latitude", () => {
  const ways = [
    [[-90.17, 38.64], [-90.171, 38.63]], // north part, drawn north to south
    [[-90.172, 38.62], [-90.1725, 38.6201], [-90.1721, 38.6199], [-90.171, 38.63]], // south part with a notch
  ];
  assert.deepEqual(bankLine(ways, false), [[-90.172, 38.62], [-90.1725, 38.6201], [-90.171, 38.63], [-90.17, 38.64]]);
  assert.deepEqual(bankLine(ways, true), [[-90.17, 38.64], [-90.171, 38.63], [-90.1721, 38.6199]]);
});

test("joinRings joins ways into closed rings and drops open ones", () => {
  const rings = require("./osm.cjs").joinRings([
    [[0, 0], [1, 0]],
    [[1, 1], [1, 0]], // reversed
    [[1, 1], [0, 1], [0, 0]],
    [[5, 5], [6, 6]], // never closes
  ]);
  assert.deepEqual(rings, [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
});

test("landmarkFeatures draws the listed landmarks with labels, ponds and the Arch trail", () => {
  const sq = (x) => [{ lon: x, lat: 0 }, { lon: x + 1, lat: 0 }, { lon: x + 1, lat: 1 }, { lon: x, lat: 1 }, { lon: x, lat: 0 }];
  const fc = require("./osm.cjs").landmarkFeatures({
    elements: [
      { type: "relation", id: 2511955, tags: { name: "Busch Stadium" }, members: [{ role: "outer", geometry: sq(0) }, { role: "inner", geometry: sq(0.25).map((p) => ({ lon: p.lon * 0.5, lat: p.lat * 0.5 })) }] },
      { type: "way", id: 42963069, tags: { natural: "water", water: "pond", name: "South Pond" }, geometry: sq(10) },
      { type: "way", id: 1, tags: { natural: "water", water: "river" }, geometry: sq(20) },
      { type: "way", id: 2, tags: { name: "Gateway Arch Trail", highway: "footway" }, geometry: [{ lon: 0, lat: 0 }, { lon: 1, lat: 1 }] },
      { type: "way", id: 3, tags: { building: "yes", name: "Somewhere" }, geometry: sq(30) },
    ],
  });
  assert.deepEqual(fc.map((f) => f.properties.kind), ["stadium", "pitch", "label", "pond", "path"]);
  assert.equal(fc[0].geometry.coordinates.length, 2); // the stadium keeps the field as a hole
  assert.deepEqual(fc[2].properties, { kind: "label", name: "Busch Stadium", cls: "landmark" });
  assert.deepEqual(fc[2].geometry.coordinates, [0.4, 0.4]); // middle of the outline's points
});
