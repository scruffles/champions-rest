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

test("america frame holds every city from Kansas City to Boston, New Orleans to Toronto", () => {
  const A = FRAMES.america;
  assert.equal(A.width, 1600);
  assert.ok(A.height > 1080 && A.height < 1120, `height ${A.height}`);
  for (const [lon, lat] of [[-94.5786, 39.0997], [-71.0589, 42.3601], [-90.0715, 29.9511], [-81.27, 29.86], [-79.3832, 43.6532]]) assert.equal(inFrame(A, lon, lat), true);
});
