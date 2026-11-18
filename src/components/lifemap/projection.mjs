// One Web Mercator projection for the build scripts and the page, so pins and drawn layers always line up.
// Map units: frame pixels at zoom 100%. Downtown is ~1.6 m per unit.
const mx = (lon) => (lon + 180) / 360;
const my = (lat) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
const lonOf = (x) => x * 360 - 180;
const latOf = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

function makeFrame(id, west, south, east, north, width) {
  const sx = width / (mx(east) - mx(west));
  const height = Math.round((my(south) - my(north)) * sx);
  return { id, west, south, east, north, width, height, sx };
}

// downtown: Cass Ave to Chouteau Ave, 18th St to the Illinois bank
// america: Kansas to the Atlantic, the Gulf to Toronto
export const FRAMES = {
  downtown: makeFrame("downtown", -90.2055, 38.6155, -90.172, 38.6435, 1800),
  america: makeFrame("america", -98, 28.5, -66, 46, 1600),
};

const frameOf = (f) => (typeof f === "string" ? FRAMES[f] : f);

export function project(frame, lon, lat) {
  const f = frameOf(frame);
  return [(mx(lon) - mx(f.west)) * f.sx, (my(lat) - my(f.north)) * f.sx];
}

export function unproject(frame, x, y) {
  const f = frameOf(frame);
  return [lonOf(x / f.sx + mx(f.west)), latOf(y / f.sx + my(f.north))];
}

export function inFrame(frame, lon, lat) {
  const f = frameOf(frame);
  return lon >= f.west && lon <= f.east && lat >= f.south && lat <= f.north;
}
