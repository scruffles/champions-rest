import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ARTICLES, TOPICS, YEAR_COUNTS, KEY_COUNT, LEGACY_ERA, YEAR_SPAN, formatMonthDay } from "../../lib/articles";
import { Thumb, Timeline, LEGACY_YEAR } from "../shared";

export default function Archive() {
  const [params, setParams] = useSearchParams();
  const imp = params.get("imp") || "key";
  const topic = params.get("topic") || "All";
  const era = params.get("era");
  const year = params.get("year") ? Number(params.get("year")) : null;

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === null || v === undefined || v === "" ? next.delete(k) : next.set(k, String(v))));
    setParams(next, { replace: true });
  };

  const list = ARTICLES.filter(
    (a) =>
      (imp === "all" || a.importance === "key") &&
      (topic === "All" || a.topics.includes(topic)) &&
      (!era || a.era.name === era) &&
      (year === null || (year === LEGACY_YEAR ? a.year > 1903 : a.year === year)),
  );

  const groups = [];
  list.forEach((a) => {
    let g = groups[groups.length - 1];
    if (!g || g.year !== a.year) {
      g = { year: a.year, rows: [] };
      groups.push(g);
    }
    g.rows.push(a);
  });

  const chips = [];
  if (era) chips.push({ label: era, clear: { era: null } });
  if (year !== null) chips.push({ label: year === LEGACY_YEAR ? LEGACY_ERA.range : String(year), clear: { year: null } });
  if (topic !== "All") chips.push({ label: topic, clear: { topic: null } });

  return (
    <div className="archive">
      <div className="crumbs">
        <Link className="btn" to="/articles">
          ← Highlights
        </Link>
        <em>Articles / The Archive</em>
      </div>
      <div className="page-head">
        <h1>The Archive</h1>
        <div className="deck">Every article, {YEAR_SPAN}, arranged by the chapters of his life</div>
      </div>

      <Timeline year={year} era={era} onYear={(y) => update({ year: y, era: null })} onEra={(e) => update({ era: e, year: null })} />

      <div className="filter-row">
        {chips.length === 0 && <span className="chip chip-static">All years</span>}
        {chips.map((c) => (
          <button key={c.label} type="button" className="chip chip-active" onClick={() => update(c.clear)} aria-label={`Remove filter ${c.label}`}>
            {c.label} <span aria-hidden="true">×</span>
          </button>
        ))}
        <span className="grow" />
        <div className="segmented" role="group" aria-label="Importance">
          <button type="button" aria-pressed={imp === "key"} onClick={() => update({ imp: null })}>
            Key articles
          </button>
          <button type="button" aria-pressed={imp === "all"} onClick={() => update({ imp: "all" })}>
            Everything
          </button>
        </div>
      </div>
      <div className="topic-row" role="group" aria-label="Topic">
        {["All", ...TOPICS].map((t) => (
          <button key={t} type="button" aria-pressed={topic === t} onClick={() => update({ topic: t === "All" ? null : t })}>
            {t}
          </button>
        ))}
      </div>
      <div className="count-line">
        Showing {list.length.toLocaleString()} articles · the archive holds {imp === "key" ? `${KEY_COUNT} key articles` : `${ARTICLES.length.toLocaleString()} articles`}
      </div>

      {groups.map((g) => (
        <section key={g.year || "undated"} className="year-group">
          <div className="year-head">
            <div className="year-num">{g.year || "Undated"}</div>
            <em>
              {g.rows[0].era.name}
              {g.year && YEAR_COUNTS[g.year] ? ` · ${YEAR_COUNTS[g.year]} articles that year` : ""}
            </em>
          </div>
          <div className="year-rows">
            {g.rows.map((a) => (
              <Link key={a.id} to={`/articles/${a.id}`} className="row-card">
                <Thumb article={a} />
                <span className="row-text">
                  <span className="row-title">{a.title}</span>
                  <em>
                    {a.publication}
                    {formatMonthDay(a.sourceDate) ? `, ${formatMonthDay(a.sourceDate)}` : ""}
                  </em>
                  <span className={`row-chip imp-${a.importance}`}>{a.importance === "key" ? a.topic : a.importance === "support" ? "Supporting" : "Mention"}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {list.length === 0 && <div className="empty">No articles match these filters.</div>}
    </div>
  );
}
