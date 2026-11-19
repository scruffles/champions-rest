import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME, distanceKm, viewOfPlace, nearHome, homePlace, isFightPlace, arcPath, visibleLabels, fitView, boxesOverlap, placeBoxes, fitStreetLabels } from "./views.mjs";

const P = (id, level, lat, lon, extra = {}) => ({ id, level, lat, lon, kind: "travel", fights: [], ...extra });
const places = [
  P("east-st-louis", "america", 38.6245, -90.1509),
  P("belleville", "america", 38.5201, -89.984),
  P("fight-chouteau-island", "america", 38.71, -90.17, { kind: "fight" }),
  P("union-mo", "america", 38.45, -91.0085),
  P("chicago", "america", 41.8781, -87.6298),
  P("stl-417-washington", "downtown", 38.62985, -90.18761),
  P("birmingham", "atlantic", 52.4862, -1.8904),
];

test("distanceKm", () => {
  assert.ok(Math.abs(distanceKm(HOME, { lat: 38.5201, lon: -89.984 }) - 22.2) < 1);
  assert.ok(distanceKm(HOME, { lat: 38.45, lon: -91.0085 }) > 70);
});

test("viewOfPlace", () => {
  assert.equal(viewOfPlace({ level: "downtown" }), "stl");
  assert.equal(viewOfPlace({ level: "city" }), "stl");
  assert.equal(viewOfPlace({ level: "america" }), "america");
  assert.equal(viewOfPlace({ level: "atlantic" }), "america");
  assert.equal(viewOfPlace(undefined), "stl");
});

test("nearHome groups america places within 30 km of St. Louis", () => {
  assert.deepEqual(nearHome(places), ["east-st-louis", "belleville", "fight-chouteau-island"]);
});

test("homePlace is a virtual St. Louis place listing the grouped ones", () => {
  const h = homePlace(places);
  assert.equal(h.id, "st-louis");
  assert.equal(h.level, "america");
  assert.deepEqual(h.grouped, ["east-st-louis", "belleville", "fight-chouteau-island"]);
  assert.deepEqual([h.lat, h.lon], [HOME.lat, HOME.lon]);
});

test("isFightPlace", () => {
  assert.equal(isFightPlace({ kind: "fight", fights: [] }), true);
  assert.equal(isFightPlace({ kind: "travel", fights: ["007"] }), true);
  assert.equal(isFightPlace({ kind: "travel", fights: [] }), false);
});

test("arcPath bends to the left of the direction of travel", () => {
  assert.equal(arcPath([0, 0], [100, 0]), "M0 0Q50 16 100 0");
  assert.equal(arcPath([100, 0], [0, 0]), "M100 0Q50 16 0 0");
});

test("visibleLabels keeps labels apart and always shows the chosen one", () => {
  const pins = [{ id: "a", x: 0, y: 0 }, { id: "b", x: 10, y: 0 }, { id: "c", x: 100, y: 0 }];
  assert.deepEqual([...visibleLabels(pins, 30)].sort(), ["a", "c"]);
  assert.deepEqual([...visibleLabels(pins, 30, "b")].sort(), ["b", "c"]);
});

test("fitView widens or heightens the core frame to fill the box, centred", () => {
  assert.deepEqual(fitView(1600, 1000, 2000, 1000), { x: -200, y: 0, w: 2000, h: 1000 });
  assert.deepEqual(fitView(1600, 1000, 800, 800), { x: 0, y: -300, w: 1600, h: 1600 });
  assert.deepEqual(fitView(1600, 1000, 0, 0), { x: 0, y: 0, w: 1600, h: 1000 });
});

test("boxesOverlap handles rotated boxes", () => {
  const a = { x: 0, y: 0, w: 100, h: 10 };
  assert.equal(boxesOverlap(a, { x: 40, y: 0, w: 30, h: 10 }), true);
  assert.equal(boxesOverlap(a, { x: 0, y: 20, w: 100, h: 10 }), false);
  // A long label tilted 45° near the end of another: the bounding boxes meet but the labels don't.
  assert.equal(boxesOverlap({ x: 0, y: 0, w: 100, h: 10, angle: 45 }, { x: 40, y: -40, w: 20, h: 10 }), false);
  assert.equal(boxesOverlap({ x: 0, y: 0, w: 100, h: 10, angle: 45 }, { x: 30, y: 30, w: 20, h: 10 }), true);
});

test("placeBoxes keeps boxes in order, skipping overlaps and obstacles but not forced ones", () => {
  const boxes = [
    { id: "a", x: 0, y: 0, w: 50, h: 10 },
    { id: "b", x: 20, y: 0, w: 50, h: 10 },
    { id: "c", x: 0, y: 30, w: 50, h: 10 },
    { id: "d", x: 0, y: 60, w: 50, h: 10 },
    { id: "e", x: 10, y: 0, w: 10, h: 10, force: true },
  ];
  const obstacles = [
    { id: "c", x: 0, y: 30, w: 8, h: 8 }, // c's own dot: ignored
    { id: "x", x: 0, y: 60, w: 8, h: 8 }, // another pin's dot covers d
  ];
  assert.deepEqual([...placeBoxes(boxes, obstacles)], ["a", "c", "e"]);
});

test("fitStreetLabels puts major names first and drops minor names when zoomed out", () => {
  const labels = [
    { text: "Minor St.", x: 0, y: 0, angle: 0, cls: "minor" },
    { text: "Major St.", x: 1, y: 0, angle: 0, cls: "major" },
    { text: "Far St.", x: 0, y: 500, angle: 0, cls: "minor" },
  ];
  assert.deepEqual(fitStreetLabels(labels, 0.5).map((l) => l.text), ["Major St."]);
  assert.deepEqual(fitStreetLabels(labels, 1).map((l) => l.text), ["Major St.", "Far St."]);
  assert.deepEqual(fitStreetLabels(labels, 1, [{ x: 0, y: 500, w: 200, h: 200 }]).map((l) => l.text), ["Major St."]);
});
