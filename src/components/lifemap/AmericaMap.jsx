import React from "react";
import { FRAMES, project } from "./projection.mjs";
import { placeYears } from "./timeline.mjs";
import { arcPath, isFightPlace, visibleLabels } from "./views.mjs";
import layer from "./geo/america.json";

const FRAME = FRAMES.america;
const W = FRAME.width;
const H = FRAME.height;
const LABEL_GAP = 70; // map units between city labels

export default function AmericaMap({ places, home, selectedId, onSelect, isActive }) {
  // A place folded into the St. Louis marker highlights that marker.
  const markerId = home.grouped.includes(selectedId) ? home.id : selectedId;
  const homeXY = React.useMemo(() => project(FRAME, home.lon, home.lat), [home]);
  const pins = React.useMemo(() => {
    const grouped = new Set(home.grouped);
    return [home, ...places.filter((p) => p.level === "america" && !grouped.has(p.id))].map((p) => {
      const [x, y] = project(FRAME, p.lon, p.lat);
      return { ...p, x, y };
    });
  }, [places, home]);
  const labelled = React.useMemo(() => visibleLabels(pins, LABEL_GAP, markerId), [pins, markerId]);
  const atlantic = places.filter((p) => p.level === "atlantic");

  return (
    <div className="lm-map">
      <div className="lm-stage lm-us-stage">
        <div className="lm-us-box" style={{ "--ar": W / H }}>
          <svg className="lm-us-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <rect className="lm-us-sea" width={W} height={H} />
            <path className="lm-us-land" d={layer.paths.land} />
            <path className="lm-us-lake" d={layer.paths.lake} />
            <path className="lm-us-river" d={layer.paths.river} />
            <path className="lm-us-state" d={layer.paths.state} />
            <path className="lm-us-border" d={layer.paths.border} />
            {layer.labels.map((l) => (
              <text key={l.text} className="lm-us-label" transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`}>
                {l.text}
              </text>
            ))}
            {pins.slice(1).map((p) => (
              <path key={p.id} className={`lm-arc ${isFightPlace(p) ? "lm-arc-fight" : "lm-arc-trip"}${isActive(p) ? "" : " is-faded"}`} d={arcPath(homeXY, [p.x, p.y])} />
            ))}
          </svg>
          {pins.map((p) => {
            const years = placeYears(p);
            const cls = [
              "lm-pin",
              p.id === home.id ? "lm-pin-home" : isFightPlace(p) ? "lm-pin-fight" : "lm-pin-trip",
              p.id === markerId && "is-selected",
              !isActive(p) && "is-faded",
              labelled.has(p.id) && "show-label",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={p.id}
                type="button"
                className={cls}
                style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
                aria-label={`${p.name}${years ? `, ${years}` : ""}`}
                aria-pressed={p.id === markerId}
                onClick={() => onSelect(p.id)}
              >
                <span className="lm-pin-dot" aria-hidden="true" />
                <span className="lm-pin-label" aria-hidden="true">
                  {p.name.replace(/\s*\(.*$/, "")}
                  {years && <small>{years}</small>}
                </span>
              </button>
            );
          })}
        </div>
        {atlantic.length > 0 && (
          <div className="lm-atlantic">
            <div className="lm-atlantic-head">Across the Atlantic</div>
            {atlantic.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.id === selectedId} onClick={() => onSelect(p.id)}>
                {p.name}
                <small>{placeYears(p)}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="lm-credit">Coastlines, rivers and borders: Natural Earth. Lines run from St. Louis: solid to his fights, dashed to other trips.</p>
    </div>
  );
}
