import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
import { BY_ID, IMPORTANCE_LABEL, LEGACY_ERA, chronologicalNeighbors, formatDate, related } from "../../lib/articles";
import { MiniTimeline, Thumb } from "../shared";

const TABS = [
  ["clipping", "Clipping"],
  ["text", "Transcript"],
  ["page", "Full page"],
];
const LEGACY_TAB = { scan: "clipping" };

const dedent = (str) => {
  const lines = str.split("\n");
  const indent = lines.filter((l) => l.trim()).reduce((m, l) => Math.min(m, l.match(/^[ \t]*/)[0].length), Infinity);
  return lines.map((l) => l.slice(indent === Infinity ? 0 : indent)).join("\n");
};

// OCR text has hard line breaks and hyphenated line ends; rejoin them into paragraphs.
const ocrParagraphs = (txt) =>
  txt
    .split(/\n\s*\n/)
    .map((p) => p.replace(/-\n(\w)/g, "$1").replace(/\s*\n\s*/g, " ").trim())
    .filter((p) => p.length > 1);

function Transcript({ article }) {
  const [ocr, setOcr] = React.useState(null);
  const isScanned = Number(article.id) >= 282;
  React.useEffect(() => {
    setOcr(null);
    if (!isScanned) return;
    fetch(`/images/articles/image-${article.id}.txt`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setOcr)
      .catch(() => setOcr(false));
  }, [article.id, isScanned]);

  if (isScanned) {
    const paras = ocrParagraphs(ocr || article.text || "");
    return (
      <div className="transcript">
        <p className="ocr-note">Machine transcription of the original page. It may contain errors; the clipping and full page show the original.</p>
        {ocr === null && !article.text && <p>Loading transcription…</p>}
        {paras.map((p, i) => (
          <p key={i} className={i === 0 ? "dropcap" : ""}>
            {p}
          </p>
        ))}
      </div>
    );
  }
  if (!article.text) return <div className="transcript"><p>No transcription yet for this article.</p></div>;
  return <div className="transcript dropcap-first" dangerouslySetInnerHTML={{ __html: marked.parse(dedent(article.text)) }} />;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 400;

// Pinch (trackpad or touch) and Ctrl/⌘ + scroll-wheel zoom on the image frame, keeping the point under the
// pointer in place. Plain scrolling still scrolls. Returns zoomTo(z, clientX?, clientY?) for the +/- buttons.
function useZoomGestures(frameRef, zoom, setZoom, enabled) {
  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;
  const anchor = React.useRef(null);

  const zoomTo = React.useCallback(
    (z, cx, cy) => {
      const old = zoomRef.current;
      const next = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)));
      if (next === old) return;
      const f = frameRef.current;
      if (f) {
        const r = f.getBoundingClientRect();
        const x = cx == null ? f.clientWidth / 2 : cx - r.left;
        const y = cy == null ? f.clientHeight / 2 : cy - r.top;
        anchor.current = { x, y, sx: f.scrollLeft, sy: f.scrollTop, k: next / old };
      }
      zoomRef.current = next;
      setZoom(next);
    },
    [frameRef, setZoom],
  );

  // After the image has been resized, scroll so the anchored point is back under the pointer.
  React.useLayoutEffect(() => {
    const a = anchor.current;
    const f = frameRef.current;
    anchor.current = null;
    if (!a || !f) return;
    f.scrollLeft = (a.sx + a.x) * a.k - a.x;
    f.scrollTop = (a.sy + a.y) * a.k - a.y;
  }, [zoom, frameRef]);

  React.useEffect(() => {
    const f = frameRef.current;
    if (!f || !enabled) return undefined;
    // Trackpad pinch arrives as a wheel event with ctrlKey set (Chrome, Firefox, Edge).
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = Math.max(-25, Math.min(25, e.deltaY * (e.deltaMode === 1 ? 16 : 1)));
      zoomTo(zoomRef.current * Math.exp(-dy * 0.01), e.clientX, e.clientY);
    };
    // Safari reports trackpad pinch as gesture events.
    let gestureBase = null;
    const onGestureStart = (e) => {
      e.preventDefault();
      gestureBase = zoomRef.current;
    };
    const onGestureChange = (e) => {
      e.preventDefault();
      if (gestureBase != null) zoomTo(gestureBase * e.scale, e.clientX, e.clientY);
    };
    // Two-finger pinch on touch screens.
    let pinch = null;
    const spread = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e) => {
      if (e.touches.length === 2) pinch = { d: spread(e.touches), z: zoomRef.current };
    };
    const onTouchMove = (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const [a, b] = e.touches;
      zoomTo((pinch.z * spread(e.touches)) / pinch.d, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinch = null;
    };
    const opts = { passive: false };
    f.addEventListener("wheel", onWheel, opts);
    f.addEventListener("gesturestart", onGestureStart, opts);
    f.addEventListener("gesturechange", onGestureChange, opts);
    f.addEventListener("touchstart", onTouchStart, opts);
    f.addEventListener("touchmove", onTouchMove, opts);
    f.addEventListener("touchend", onTouchEnd);
    f.addEventListener("touchcancel", onTouchEnd);
    return () => {
      f.removeEventListener("wheel", onWheel, opts);
      f.removeEventListener("gesturestart", onGestureStart, opts);
      f.removeEventListener("gesturechange", onGestureChange, opts);
      f.removeEventListener("touchstart", onTouchStart, opts);
      f.removeEventListener("touchmove", onTouchMove, opts);
      f.removeEventListener("touchend", onTouchEnd);
      f.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [frameRef, enabled, zoomTo]);

  return zoomTo;
}

export default function ArticleDetail() {
  const { id, selection } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const article = BY_ID.get(id);
  const tab = LEGACY_TAB[selection] || (TABS.some(([t]) => t === selection) ? selection : "clipping");
  const [zoom, setZoom] = React.useState(100);
  const frameRef = React.useRef(null);
  const zoomTo = useZoomGestures(frameRef, zoom, setZoom, tab !== "text");
  React.useEffect(() => {
    setZoom(100);
  }, [id, tab]);

  if (!article) {
    return (
      <div className="empty">
        That article isn't in the archive. <Link to="/articles/archive">Browse the archive »</Link>
      </div>
    );
  }

  const { prev, next } = chronologicalNeighbors(article);
  const more = related(article);
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/articles/archive"));
  const yearLink = `/articles/archive?imp=all&year=${article.year > 1903 ? 9999 : article.year}`;

  return (
    <div className="detail">
      <div className="crumbs">
        <button type="button" className="btn" onClick={goBack}>
          ← Back
        </button>
        <em>
          Articles / {article.era.name} / {article.year || "Undated"}
        </em>
      </div>
      <div className="detail-head">
        <div className="kicker">
          {article.era.name} · {article.topic}
        </div>
        <h1>{article.title}</h1>
        {article.summary && <div className="deck">{article.summary}</div>}
        <div className="byline-strip">
          {article.publication} — {formatDate(article.sourceDate)} — {IMPORTANCE_LABEL[article.importance]}
        </div>
      </div>

      <div className="detail-body">
        <div className="viewer">
          <div className="viewer-bar">
            <div className="segmented" role="tablist" aria-label="Article view">
              {TABS.map(([t, label]) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => navigate(`/articles/${article.id}/${t}`, { replace: true })}>
                  {label}
                </button>
              ))}
            </div>
            {tab !== "text" && (
              <div className="zoom">
                <button type="button" className="btn btn-square" aria-label="Zoom out" onClick={() => zoomTo(zoom - 50)}>
                  −
                </button>
                <em title="Pinch, or hold Ctrl (⌘ on a Mac) and scroll, to zoom">{zoom}%</em>
                <button type="button" className="btn btn-square" aria-label="Zoom in" onClick={() => zoomTo(zoom + 50)}>
                  +
                </button>
              </div>
            )}
          </div>
          <div className={`viewer-frame ${tab !== "text" ? "zoomable" : ""}`} ref={frameRef}>
            {tab === "clipping" &&
              (article.crop ? <img className="ink" src={article.crop} alt={`Newspaper clipping: ${article.title}`} style={{ width: `${zoom}%` }} /> : <div className="empty">No clipping available.</div>)}
            {tab === "page" &&
              (article.pages?.length ? (
                article.pages.map((src, i) => (
                  <figure key={src}>
                    {article.pages.length > 1 && <figcaption className="page-label">Page {i + 1} of {article.pages.length}</figcaption>}
                    <img className="ink" src={src} alt={`Full newspaper page${article.pages.length > 1 ? ` ${i + 1}` : ""}`} style={{ width: `${zoom}%` }} />
                  </figure>
                ))
              ) : (
                <div className="empty">No full page available.</div>
              ))}
            {tab === "text" && <Transcript article={article} />}
          </div>
        </div>

        <aside className="detail-side">
          <dl className="meta">
            <dt>Paper</dt>
            <dd>{article.publication}</dd>
            <dt>Date</dt>
            <dd>{formatDate(article.sourceDate)}</dd>
            <dt>Chapter</dt>
            <dd>
              {article.era.name}, {article.era.range}
            </dd>
            <dt>Topic</dt>
            <dd>{article.topics.join(", ")}</dd>
          </dl>
          <div className="side-block">
            <div className="label">Where this falls</div>
            <MiniTimeline year={article.year} />
            <Link className="btn-link" to={yearLink}>
              See everything from {article.year > 1903 ? LEGACY_ERA.range : article.year} »
            </Link>
          </div>
          <div className="side-block sequence">
            {prev && (
              <Link to={`/articles/${prev.id}`}>
                <span className="label">« Preceding · {prev.year}</span>
                <span className="card-title-sm">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link to={`/articles/${next.id}`}>
                <span className="label">Following · {next.year} »</span>
                <span className="card-title-sm">{next.title}</span>
              </Link>
            )}
          </div>
          <div className="cite">
            <div className="label">Cite this article</div>
            <em>
              “{article.title}.” {article.publication}, {formatDate(article.sourceDate)}. Champion's Rest archive, champions-rest.com/articles/{article.id}.
            </em>
          </div>
          {more.length > 0 && (
            <div className="side-block">
              <div className="label">More about {article.topic.toLowerCase()}</div>
              {more.map((m) => (
                <Link key={m.id} to={`/articles/${m.id}`} className="related">
                  <Thumb article={m} />
                  <span>
                    <span className="card-title-sm">{m.title}</span>
                    <em>{m.year}</em>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
