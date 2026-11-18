import React from "react";
import { useZoomGestures } from "../shared";
import { FRAMES, project } from "./projection.mjs";
import { placeYears } from "./timeline.mjs";
import MapLayer from "./MapLayer";
import layer1875 from "./geo/stl-downtown-1875.json";
import layerToday from "./geo/stl-downtown-today.json";

const FRAME = FRAMES.downtown;
const MIN_ZOOM = 100; // 100% = the whole frame fits the width
const MAX_ZOOM = 800;
const START_ZOOM = 250;
const LABEL_K = 1.6; // above this zoom every pin shows its label

function Pin({ pin, k, selected, faded, onSelect }) {
  const cls = ["lm-pin", pin.precision === "area" ? "lm-pin-area" : "lm-pin-exact", selected && "is-selected", faded && "is-faded", k >= LABEL_K && "show-label"].filter(Boolean).join(" ");
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

export default function StLouisMap({ places, selectedId, centreRequest = 0, onSelect, isActive }) {
  const frameRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(START_ZOOM);
  const [view, setView] = React.useState({ cw: 0, sl: 0 });
  const [compare, setCompare] = React.useState(false);
  const [split, setSplit] = React.useState(0.5);
  const zoomTo = useZoomGestures(frameRef, zoom, setZoom, true, { min: MIN_ZOOM, max: MAX_ZOOM });

  React.useLayoutEffect(() => {
    const f = frameRef.current;
    const measure = () => setView({ cw: f.clientWidth, sl: f.scrollLeft });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    return () => ro.disconnect();
  }, []);

  const k = view.cw ? (view.cw * zoom) / 100 / FRAME.width : 0;

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
      <div className="lm-toolbar">
        <button type="button" role="switch" aria-checked={compare} className="lm-switch" onClick={() => {
            setView((v) => ({ ...v, sl: frameRef.current.scrollLeft }));
            setCompare((c) => !c);
          }}>
          <span className="lm-knob" aria-hidden="true" />
          <span className="lm-switch-label">Compare with today</span>
        </button>
        {compare && <span className="lm-hint">Drag the handle: 1875 on the left, today on the right</span>}
        <span className="grow" />
        <button type="button" className="btn btn-square" aria-label="Zoom out" onClick={() => zoomTo(zoom / 1.4)} disabled={zoom <= MIN_ZOOM}>
          −
        </button>
        <button type="button" className="btn btn-square" aria-label="Zoom in" onClick={() => zoomTo(zoom * 1.4)} disabled={zoom >= MAX_ZOOM}>
          +
        </button>
      </div>
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
                <MapLayer layer={layer1875} era="then" k={k} />
                {compare && (
                  <g clipPath="url(#lm-today-clip)">
                    <MapLayer layer={layerToday} era="today" k={k} />
                  </g>
                )}
              </svg>
              {pins.map((p) => (
                <Pin key={p.id} pin={p} k={k} selected={p.id === selectedId} faded={!isActive(p)} onSelect={onSelect} />
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
        1875 streets traced from Wm. C. Wilson &amp; Bro.&rsquo;s map of St. Louis (State Historical Society of Missouri).
        {compare && " Today: data © OpenStreetMap contributors."}
      </p>
    </div>
  );
}
