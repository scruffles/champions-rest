import React from "react";

// Draws one built layer (scripts/lifemap/build.cjs) inside the map's <svg>. k = screen px per map unit,
// so labels keep a steady size on screen while streets scale with the map.
const AREAS = ["water", "levee", "park"];
const ROADS = ["pedestrian", "minor", "major", "motorway", "bridge"];

export default function MapLayer({ layer, era, k }) {
  const p = layer.paths;
  return (
    <g className={`lm-layer lm-${era}`}>
      <rect className="lm-land" width={layer.width} height={layer.height} />
      {AREAS.map((c) => p[c] && <path key={c} className={`lm-${c}`} d={p[c]} />)}
      {p.rail && <path className="lm-rail" d={p.rail} />}
      {ROADS.map((c) => p[c] && <path key={`${c}-casing`} className={`lm-casing lm-${c}-casing`} d={p[c]} />)}
      {ROADS.map((c) => p[c] && <path key={c} className={`lm-road lm-${c}`} d={p[c]} />)}
      {layer.labels
        .filter((l) => l.cls === "major" || k >= 0.9)
        .map((l) => (
          <text key={`${l.text}-${l.x}-${l.y}`} className={`lm-label lm-label-${l.cls}`} transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`} fontSize={11 / k}>
            {l.text}
          </text>
        ))}
    </g>
  );
}
