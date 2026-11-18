import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME, distanceKm, viewOfPlace, nearHome, homePlace, isFightPlace, arcPath, visibleLabels } from "./views.mjs";

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
