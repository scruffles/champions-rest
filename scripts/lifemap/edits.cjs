// Turns today's features into 1875 using mapdata/stl-1875-edits.json:
//   rename      { "today name": "1875 name" }
//   removeKinds [kind]          modern-only feature kinds (motorways, today's parks)
//   removeNames [name]          modern-only streets by today's name
//   removeIds   [osm id]        single ways
//   keepBridges [name]          bridges that existed in 1875 (Eads Bridge). Rule for
//                               features of kind "bridge", applied after the remove checks:
//                               listed name -> stays "bridge" (renamed if in rename);
//                               other named -> becomes kind "minor" (a city street crossing
//                               something); unnamed -> dropped.
//   add         [{name, kind, coords}] lines, or [{name, kind, ring}] polygons, in [lon, lat]
//   water       [[lon, lat]]    the 1875 river (replaces today's), optional
function applyEdits(fc, edits) {
  const rename = edits.rename || {};
  const kinds = new Set(edits.removeKinds || []);
  const names = new Set(edits.removeNames || []);
  const ids = new Set(edits.removeIds || []);
  const keep = new Set(edits.keepBridges || []);
  const features = [];
  for (const f of fc.features) {
    const p = f.properties;
    if (kinds.has(p.kind) || names.has(p.name) || ids.has(p.osm)) continue;
    let kind = p.kind;
    if (kind === "bridge" && !keep.has(p.name)) {
      if (p.name == null) continue;
      kind = "minor";
    }
    let geometry = f.geometry;
    if (kind === "water" && edits.water) geometry = { type: "Polygon", coordinates: [edits.water] };
    const name = p.name != null && Object.prototype.hasOwnProperty.call(rename, p.name) ? rename[p.name] : p.name;
    features.push({ ...f, geometry, properties: { ...p, kind, name } });
  }
  for (const a of edits.add || []) {
    features.push({
      type: "Feature",
      properties: { kind: a.kind, name: a.name || null, added: true },
      geometry: a.ring ? { type: "Polygon", coordinates: [a.ring] } : { type: "LineString", coordinates: a.coords },
    });
  }
  return { type: "FeatureCollection", features };
}

module.exports = { applyEdits };
