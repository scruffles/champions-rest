import React from "react";
import { useNavigate } from "react-router-dom";
import MiniSearch from "minisearch";
import { BY_ID, formatDate } from "../lib/articles";

const OPTIONS = {
  fields: ["title", "summary", "publication", "text"],
  storeFields: ["id"],
  searchOptions: { boost: { title: 3, summary: 2, publication: 1, text: 1 }, fuzzy: 0.2, prefix: true },
};

let indexPromise = null;
const loadIndex = () => {
  if (!indexPromise) {
    indexPromise = fetch("/search-index.json")
      .then((r) => r.text())
      .then((json) => MiniSearch.loadJSON(json, OPTIONS));
  }
  return indexPromise;
};

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const boxRef = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = React.useMemo(() => {
    if (!index || query.trim().length < 3) return [];
    return index
      .search(query)
      .map((r) => BY_ID.get(r.id))
      .filter(Boolean)
      .slice(0, 12);
  }, [index, query]);

  const go = (article) => {
    setOpen(false);
    setQuery("");
    navigate(`/articles/${article.id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="search" ref={boxRef}>
      <label className="search-box">
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span className="sr">Search articles</span>
        <input
          type="search"
          placeholder="Search the archive"
          value={query}
          onFocus={() => {
            loadIndex().then(setIndex);
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          aria-expanded={open && results.length > 0}
          aria-controls="search-results"
        />
      </label>
      {open && query.trim().length >= 3 && (
        <div className="search-results" id="search-results" role="listbox">
          {!index && <div className="search-empty">Loading the index…</div>}
          {index && results.length === 0 && <div className="search-empty">No articles found.</div>}
          {results.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(a)}
            >
              <span className="search-title">{a.title}</span>
              <span className="search-meta">
                {a.publication}, {formatDate(a.sourceDate)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
