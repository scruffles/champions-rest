import React from "react";

// Draws one built layer (scripts/lifemap/build.cjs) inside the map's <svg>. k = screen px per map unit,
// so labels keep a steady size on screen while streets scale with the map. labels: the names that have
// room at this zoom (views.mjs fitStreetLabels).
const AREAS = ["water", "levee", "park", "pond"];
const LANDMARKS = ["stadium", "pitch", "landmark", "arch"]; // drawn over the roads, under the names
const ROADS = ["pedestrian", "minor", "major", "motorway", "bridge"];

function MapLayer({ layer, labels, era, k }) {
  const p = layer.paths;
  return (
    <g className={`lm-layer lm-${era}`}>
      <rect className="lm-land" width={layer.width} height={layer.height} />
      {AREAS.map((c) => p[c] && <path key={c} className={`lm-${c}`} d={p[c]} />)}
      {p.path && <path className="lm-path" d={p.path} />}
      {p.rail && <path className="lm-rail" d={p.rail} />}
      {ROADS.map((c) => p[c] && <path key={`${c}-casing`} className={`lm-casing lm-${c}-casing`} d={p[c]} />)}
      {ROADS.map((c) => p[c] && <path key={c} className={`lm-road lm-${c}`} d={p[c]} />)}
      {LANDMARKS.map((c) => p[c] && <path key={c} className={`lm-${c}`} d={p[c]} />)}
      {labels.map((l) => (
        <text key={`${l.text}-${l.x}-${l.y}`} className={`lm-label lm-label-${l.cls}`} transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`} fontSize={11 / k} strokeWidth={3 / k}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

export default React.memo(MapLayer);
