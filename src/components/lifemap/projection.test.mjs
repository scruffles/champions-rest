import { test } from "node:test";
import assert from "node:assert/strict";
import { FRAMES, project, unproject, inFrame } from "./projection.mjs";

const D = FRAMES.downtown;

test("downtown frame corners map to the frame edges", () => {
  assert.deepEqual(project(D, D.west, D.north).map(Math.round), [0, 0]);
  const [x, y] = project(D, D.east, D.south);
  assert.equal(Math.round(x), D.width);
  assert.equal(Math.round(y), D.height);
});

test("downtown frame keeps true proportions (about 2.9 km wide, 3.1 km tall)", () => {
  assert.equal(D.width, 1800);
  assert.ok(D.height > 1890 && D.height < 1950, `height ${D.height}`);
});

test("project accepts a frame id", () => {
  assert.deepEqual(project("downtown", -90.18761, 38.62985), project(D, -90.18761, 38.62985));
});

test("unproject inverts project", () => {
  const [x, y] = project(D, -90.18761, 38.62985);
  const [lon, lat] = unproject(D, x, y);
  assert.ok(Math.abs(lon + 90.18761) < 1e-9);
  assert.ok(Math.abs(lat - 38.62985) < 1e-9);
});

test("inFrame", () => {
  assert.equal(inFrame(D, -90.18761, 38.62985), true);
  assert.equal(inFrame(D, -90.2051, 38.60852), false);
});
