import React from "react";
import { ERAS, YEAR_COUNTS, ERA_COUNTS, FIRST_YEAR, eraOfYear } from "../lib/articles";

export const LEGACY_YEAR = 9999;
const LAST_LIFE_YEAR = 1903;

export function InkFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="inkwear" x="-2%" y="-12%" width="104%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="11" result="fadeN" />
          <feColorMatrix in="fadeN" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 0.22" result="fade" />
          <feComposite in="rough" in2="fade" operator="in" result="faded" />
          <feTurbulence type="fractalNoise" baseFrequency="0.8 0.6" numOctaves="3" seed="3" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -0.6" result="holes" />
          <feComposite in="faded" in2="holes" operator="in" result="worn" />
          <feGaussianBlur in="worn" stdDeviation="0.55" />
        </filter>
      </defs>
    </svg>
  );
}

export function Thumb({ article, full = false, className = "" }) {
  const sources = (full ? [article.crop] : [article.thumb, article.crop]).filter(Boolean);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    setAttempt(0);
  }, [article.id, full]);
  const src = sources[attempt];
  if (!src) {
    return (
      <span className={`thumb thumb-empty ${className}`}>
        <span>{article.title}</span>
      </span>
    );
  }
  return (
    <span className={`thumb ${className}`}>
      <img className="ink" src={src} alt="" loading="lazy" onError={() => setAttempt(attempt + 1)} />
    </span>
  );
}

const barHeight = (n, max) => (n ? Math.max(3, Math.round((n / 100) * max)) : 1);

export function yearSlots() {
  const slots = [];
  for (let y = FIRST_YEAR; y <= LAST_LIFE_YEAR; y++) slots.push({ year: y, n: YEAR_COUNTS[y] || 0 });
  const legacy = Object.entries(YEAR_COUNTS)
    .filter(([y]) => Number(y) > LAST_LIFE_YEAR)
    .reduce((s, [, n]) => s + n, 0);
  slots.push({ year: LEGACY_YEAR, n: legacy });
  return slots;
}

export function Timeline({ year, era, onYear, onEra, height = 120 }) {
  const selEra = era ? ERAS.find((e) => e.name === era) : year ? eraOfYear(year === LEGACY_YEAR ? 3000 : year) : null;
  const slots = yearSlots();
  const inEra = (y) => selEra && (y === LEGACY_YEAR ? selEra.name === "Legacy" : y >= selEra.from && y <= selEra.to);
  return (
    <div className="timeline">
      <div className="timeline-eras">
        {ERAS.map((e) => (
          <button
            key={e.name}
            type="button"
            aria-pressed={era === e.name}
            className={e === selEra ? "on" : ""}
            style={{ flexGrow: e.grow }}
            onClick={() => onEra(era === e.name ? null : e.name)}
          >
            {e.name} · {e.shortRange}
          </button>
        ))}
      </div>
      <div className="timeline-bars" style={{ height }}>
        {slots.map((s) => (
          <button
            key={s.year}
            type="button"
            aria-label={`${s.year === LEGACY_YEAR ? "1904 and later" : s.year}: ${s.n} articles`}
            className={s.year === year ? "on" : inEra(s.year) ? "in-era" : s.year === LEGACY_YEAR ? "legacy" : ""}
            style={{ flexGrow: s.year === LEGACY_YEAR ? 3 : 1, height: barHeight(s.n, height - 10) }}
            onClick={() => onYear(s.year === year ? null : s.year)}
          />
        ))}
      </div>
      <div className="timeline-ticks" aria-hidden="true">
        {slots.map((s) => (
          <span key={s.year} style={{ flexGrow: s.year === LEGACY_YEAR ? 3 : 1 }}>
            {s.year === LEGACY_YEAR ? "1904+" : s.year % 5 === 0 ? s.year : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EraSpark({ era, height = 40 }) {
  const counts = [];
  if (era.name === "Legacy") {
    Object.entries(YEAR_COUNTS)
      .filter(([y]) => Number(y) > LAST_LIFE_YEAR)
      .forEach(([, n]) => counts.push(n));
  } else {
    for (let y = Math.max(era.from, FIRST_YEAR); y <= era.to; y++) counts.push(YEAR_COUNTS[y] || 0);
  }
  return (
    <span className="spark" aria-hidden="true" style={{ height }}>
      {counts.map((n, i) => (
        <span key={i} style={{ height: barHeight(n, height) }} />
      ))}
    </span>
  );
}

export function MiniTimeline({ year }) {
  return (
    <div className="mini-timeline" aria-hidden="true">
      {yearSlots().map((s) => (
        <span
          key={s.year}
          className={(s.year === LEGACY_YEAR ? year > LAST_LIFE_YEAR : s.year === year) ? "on" : ""}
          style={{ height: s.year === LEGACY_YEAR ? 16 : barHeight(s.n, 40) }}
        />
      ))}
    </div>
  );
}

export { ERA_COUNTS };
