import React from "react";
import { createPortal } from "react-dom";
import { useZoomGestures } from "../shared";
import { FRAMES, project } from "./projection.mjs";
import { placeYears } from "./timeline.mjs";
import { fitStreetLabels, placeBoxes } from "./views.mjs";
import MapLayer from "./MapLayer";
import layer1875 from "./geo/stl-downtown-1875.json";
import layerToday from "./geo/stl-downtown-today.json";

const FRAME = FRAMES.downtown;
const MIN_ZOOM = 100; // 100% = the whole frame fits the width
const MAX_ZOOM = 800;
export const START_ZOOM = 250;
const LABEL_K = 1.6; // above this zoom pins show their labels, where they have room
const DOT = 18; // screen px a pin dot covers (selected or not), for label collisions
// Street-name width per character, in em: the 1875 names are spaced capitals, today's are mixed case.
const CHAR_EM = { then: 0.84, today: 0.58 };

// A pin label's box on screen (see .lm-pin-label): right of the dot, one line or two with the years.
function labelBox(pin, k, selected) {
  const years = placeYears(pin);
  const w = Math.max(pin.name.length * 7, years.length * 6.6) + 16;
  const h = years ? 40 : 24;
  return { id: pin.id, x: pin.x * k + (selected ? 18 : 14) + w / 2, y: pin.y * k - 17 + h / 2, w, h, force: selected };
}

function Pin({ pin, k, selected, faded, showLabel, onSelect }) {
  const cls = ["lm-pin", pin.precision === "area" ? "lm-pin-area" : "lm-pin-exact", selected && "is-selected", faded && "is-faded", showLabel && "show-label"].filter(Boolean).join(" ");
  const years = placeYears(pin);
  return (
    <button type="button" className={cls} style={{ left: pin.x * k, top: pin.y * k }} aria-label={`${pin.name}${years ? `, ${years}` : ""}`} aria-pressed={selected} onClick={() => onSelect(pin.id)}>
      <span className="lm-pin-dot" aria-hidden="true" />
      <span className="lm-pin-label" aria-hidden="true">
        {pin.name}
        {years && <small>{years}</small>}
      </span>
    </button>
  );
}

// toolsEl: the page's view-bar slot; the compare switch and zoom buttons render there, beside the tabs.
// settings: { zoom, compare, split } and their setters, kept by the page so they survive a switch of tabs.
export default function StLouisMap({ places, selectedId, centreRequest = 0, onSelect, isActive, toolsEl, settings }) {
  const { zoom, setZoom, compare, setCompare, split, setSplit } = settings;
  const frameRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [view, setView] = React.useState({ cw: 0, ch: 0, sl: 0 });
  const zoomTo = useZoomGestures(frameRef, zoom, setZoom, true, { min: MIN_ZOOM, max: MAX_ZOOM });

  // When the frame changes size (window resize, full screen on or off), keep the same point in the middle.
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;
  const lastSize = React.useRef(null);
  const keepCentre = React.useRef(null);
  React.useLayoutEffect(() => {
    const f = frameRef.current;
    const measure = () => {
      const last = lastSize.current;
      if (last && (last.cw !== f.clientWidth || last.ch !== f.clientHeight) && !keepCentre.current) {
        const w = (last.cw * zoomRef.current) / 100; // content size before the resize
        const h = (w * FRAME.height) / FRAME.width;
        keepCentre.current = { fx: (f.scrollLeft + last.cw / 2) / w, fy: (f.scrollTop + last.ch / 2) / h };
      }
      lastSize.current = { cw: f.clientWidth, ch: f.clientHeight };
      setView({ cw: f.clientWidth, ch: f.clientHeight, sl: f.scrollLeft });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    return () => ro.disconnect();
  }, []);

  const k = view.cw ? (view.cw * zoom) / 100 / FRAME.width : 0;

  React.useLayoutEffect(() => {
    const c = keepCentre.current;
    if (!c || !k) return;
    keepCentre.current = null;
    const f = frameRef.current;
    f.scrollLeft = c.fx * FRAME.width * k - f.clientWidth / 2;
    f.scrollTop = c.fy * FRAME.height * k - f.clientHeight / 2;
  }, [view.cw, view.ch, k]);

  const pins = React.useMemo(
    () =>
      places
        .filter((p) => p.level === "downtown")
        .map((p) => {
          const [x, y] = project(FRAME, p.lon, p.lat);
          return { ...p, x, y };
        }),
    [places],
  );

  // Pin labels that have room: the selected one always, the rest once zoomed in, in the period's places
  // first. Street names then keep clear of the dots and the labels shown.
  const labels = React.useMemo(() => {
    if (!k) return { pins: new Set(), then: [], today: [] };
    const dots = pins.map((p) => ({ id: p.id, x: p.x * k, y: p.y * k, w: DOT, h: DOT }));
    const rank = (p) => (p.id === selectedId ? 0 : isActive(p) ? 1 : 2);
    const cands = (k >= LABEL_K ? [...pins] : pins.filter((p) => p.id === selectedId)).sort((a, b) => rank(a) - rank(b));
    const boxes = cands.map((p) => labelBox(p, k, p.id === selectedId));
    const shown = placeBoxes(boxes, dots);
    const blockers = [...dots, ...boxes.filter((b) => shown.has(b.id))].map(({ x, y, w, h }) => ({ x, y, w, h }));
    return {
      pins: shown,
      then: fitStreetLabels(layer1875.labels, k, blockers, { charEm: CHAR_EM.then }),
      today: compare ? fitStreetLabels(layerToday.labels, k, blockers, { charEm: CHAR_EM.today }) : [],
    };
  }, [pins, k, selectedId, isActive, compare]);

  // Centre the selected place: at once on first render, smoothly afterwards. centreRequest lets the page
  // ask again for the same place (a timeline period clicked twice, or a return from a place off this map).
  const centred = React.useRef(null);
  const centreKey = `${selectedId}:${centreRequest}`;
  React.useLayoutEffect(() => {
    if (!k || centred.current === centreKey) return;
    const first = centred.current === null;
    centred.current = centreKey;
    const pin = pins.find((p) => p.id === selectedId);
    if (!pin) return;
    const f = frameRef.current;
    f.scrollTo({ left: pin.x * k - f.clientWidth / 2, top: pin.y * k - f.clientHeight / 2, behavior: first ? "auto" : "smooth" });
  }, [centreKey, selectedId, k, pins]);

  // Drag to pan with a mouse; touch screens scroll natively.
  const drag = React.useRef(null);
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("button")) return;
    const f = frameRef.current;
    drag.current = { x: e.clientX, y: e.clientY, sl: f.scrollLeft, st: f.scrollTop };
    f.setPointerCapture(e.pointerId);
    f.classList.add("is-dragging");
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const f = frameRef.current;
    f.scrollLeft = d.sl - (e.clientX - d.x);
    f.scrollTop = d.st - (e.clientY - d.y);
  };
  const onPointerUp = () => {
    drag.current = null;
    frameRef.current.classList.remove("is-dragging");
  };

  // Swipe handle: position is a fraction of the visible map width.
  const moveSplit = (clientX) => {
    const stage = stageRef.current; // measure the padding box, as the line and the frame do
    const left = stage.getBoundingClientRect().left + stage.clientLeft;
    setSplit(Math.min(0.98, Math.max(0.02, (clientX - left) / stage.clientWidth)));
  };
  const onHandleDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    moveSplit(e.clientX);
  };
  const onHandleMove = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) moveSplit(e.clientX);
  };
  const onHandleKey = (e) => {
    const step = { ArrowLeft: -0.05, ArrowRight: 0.05 }[e.key];
    if (step == null) return;
    e.preventDefault();
    setSplit((s) => Math.min(0.98, Math.max(0.02, s + step)));
  };

  const splitX = k ? (view.sl + split * view.cw) / k : 0;

  return (
    <div className="lm-map">
      {toolsEl &&
        createPortal(
          <>
            <button
              type="button"
              role="switch"
              aria-checked={compare}
              className="lm-switch"
              onClick={() => {
                setView((v) => ({ ...v, sl: frameRef.current.scrollLeft }));
                setCompare((c) => !c);
              }}
            >
              <span className="lm-knob" aria-hidden="true" />
              <span className="lm-switch-label">Compare with today</span>
            </button>
            <span className="grow" />
            <div className="lm-zoom" role="group" aria-label="Zoom">
              <button type="button" aria-label="Zoom out" onClick={() => zoomTo(zoom / 1.4)} disabled={zoom <= MIN_ZOOM}>
                −
              </button>
              <button type="button" aria-label="Zoom in" onClick={() => zoomTo(zoom * 1.4)} disabled={zoom >= MAX_ZOOM}>
                +
              </button>
            </div>
          </>,
          toolsEl,
        )}
      <div className="lm-stage" ref={stageRef}>
        <div
          className="lm-frame"
          ref={frameRef}
          onScroll={(e) => {
            if (!compare) return; // only the swipe clip needs the scroll position
            const sl = e.currentTarget.scrollLeft;
            setView((v) => ({ ...v, sl }));
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {k > 0 && (
            <div className="lm-content" style={{ width: FRAME.width * k, height: FRAME.height * k }}>
              <svg className="lm-svg" viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width={FRAME.width * k} height={FRAME.height * k} aria-hidden="true">
                <defs>
                  <clipPath id="lm-today-clip">
                    <rect x={splitX} y="0" width={Math.max(0, FRAME.width - splitX)} height={FRAME.height} />
                  </clipPath>
                </defs>
                <MapLayer layer={layer1875} labels={labels.then} era="then" k={k} />
                {compare && (
                  <g clipPath="url(#lm-today-clip)">
                    <MapLayer layer={layerToday} labels={labels.today} era="today" k={k} />
                  </g>
                )}
              </svg>
              {pins.map((p) => (
                <Pin key={p.id} pin={p} k={k} selected={p.id === selectedId} faded={!isActive(p)} showLabel={labels.pins.has(p.id)} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
        {compare && (
          <>
            <div className="lm-swipe-line" style={{ left: `${split * 100}%` }} aria-hidden="true" />
            <div
              role="slider"
              tabIndex={0}
              className="lm-swipe-handle"
              style={{ left: `${split * 100}%` }}
              aria-label="Compare position: 1875 on the left, today on the right"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(split * 100)}
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onKeyDown={onHandleKey}
            >
              <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
                <path d="M8 2L3 7l5 5M18 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="lm-tag lm-tag-then" style={{ right: `${(1 - split) * 100}%` }} aria-hidden="true">
              1875
            </span>
            <span className="lm-tag lm-tag-today" style={{ left: `${split * 100}%` }} aria-hidden="true">
              Today
            </span>
          </>
        )}
      </div>
      <p className="lm-credit">
        {compare && "Drag the handle: 1875 on the left, today on the right. "}
        1875 streets traced from Wm. C. Wilson &amp; Bro.&rsquo;s map of St. Louis (State Historical Society of Missouri).
        {compare && " Today: data © OpenStreetMap contributors."}
      </p>
    </div>
  );
}
