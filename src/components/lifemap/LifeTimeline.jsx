import React from "react";
import { LIFE_ERAS, T_START, T_END, americanFights } from "./timeline.mjs";

const pct = (y) => ((y - T_START) / (T_END - T_START)) * 100;
const TICKS = [1870, 1875, 1880, 1885, 1890, 1895, 1900];

export default function LifeTimeline({ eraId, onEra, fights }) {
  const marks = React.useMemo(() => americanFights(fights), [fights]);
  return (
    <section className="lm-timeline" aria-label="Timeline of where he lived">
      <div className="lm-timeline-inner">
        <div className="lm-eras">
          {LIFE_ERAS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`lm-era lm-era-${e.tone}${eraId === e.id ? " is-active" : ""}`}
              style={{ left: `${pct(e.from)}%`, width: `${pct(e.to) - pct(e.from)}%` }}
              aria-pressed={eraId === e.id}
              aria-label={`${e.label}, ${Math.floor(e.from)}–${Math.floor(e.to)}`}
              title={e.label}
              onClick={() => onEra(eraId === e.id ? null : e.id)}
            >
              {e.short ?? e.label}
            </button>
          ))}
        </div>
        <div className="lm-fights" aria-hidden="true">
          {marks.map((m) => (
            <span key={m.id} className="lm-fight" style={{ left: `${pct(m.year)}%` }} title={`${m.opponent}, ${m.date}`} />
          ))}
        </div>
        <div className="lm-axis" aria-hidden="true">
          {TICKS.map((y) => (
            <span key={y} style={{ left: `${pct(y)}%` }}>
              {y}
            </span>
          ))}
          <span className="lm-death" style={{ left: `${pct(1903.26)}%` }}>
            † 1903
          </span>
        </div>
        <div className="lm-legend">
          <span className="lm-fight lm-fight-key" aria-hidden="true" /> prize fights in America
        </div>
      </div>
    </section>
  );
}
