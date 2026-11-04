import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BY_ID, ERAS, ERA_COUNTS, ARTICLES, FIRST_YEAR, LAST_YEAR, formatDate, onThisDay, dayOfYear, MONTHS_LONG } from "../../lib/articles";
import { FEATURED, DAILY, SHELVES } from "../../../data/collections";
import { Thumb, EraSpark } from "../shared";

const archiveLink = (go) => {
  const params = new URLSearchParams({ imp: "all" });
  Object.entries(go).forEach(([k, v]) => params.set(k, String(v)));
  return `/articles/archive?${params}`;
};

function pickHero(offset) {
  const today = new Date();
  const todays = onThisDay(today).filter((a) => a.importance === "key" && a.crop);
  if (todays.length && offset === 0) {
    return {
      kind: "today",
      article: todays[0],
      also: onThisDay(today).filter((a) => a.id !== todays[0].id).slice(0, 3),
      kicker: `On this day · ${MONTHS_LONG[today.getMonth()]} ${today.getDate()}, ${todays[0].year}`,
    };
  }
  const pool = DAILY.map((id) => BY_ID.get(id)).filter(Boolean);
  const article = pool[(dayOfYear(today) + offset) % pool.length];
  return { kind: "daily", article, also: [], kicker: "Article of the day" };
}

export default function Highlights() {
  const navigate = useNavigate();
  const [offset, setOffset] = React.useState(0);
  const hero = pickHero(offset);
  const a = hero.article;
  const featured = FEATURED.map((id) => BY_ID.get(id)).filter(Boolean);

  return (
    <div className="highlights">
      <section className="hero">
        <Link to={`/articles/${a.id}`} className="hero-image" aria-label={`Read ${a.title}`}>
          <Thumb article={a} full />
        </Link>
        <div className="hero-copy">
          <div className="kicker">{hero.kicker}</div>
          <h1 className="hero-title">{a.title}</h1>
          <div className="byline-strip">
            {a.publication} — {formatDate(a.sourceDate)}
          </div>
          {a.summary && <p className="dropcap hero-summary">{a.summary}</p>}
          {hero.also.length > 0 && (
            <div className="also">
              <div className="label">Also on this date</div>
              {hero.also.map((o) => (
                <Link key={o.id} to={`/articles/${o.id}`}>
                  <span className="also-year">{o.year}</span>
                  <em>{o.title}</em>
                </Link>
              ))}
            </div>
          )}
          <div className="actions">
            <Link className="btn btn-solid" to={`/articles/${a.id}`}>
              Read the full article
            </Link>
            <button type="button" className="btn" onClick={() => setOffset(offset + 1)}>
              Another story
            </button>
            <Link className="btn-link" to="/articles/archive">
              Browse all {ARTICLES.length.toLocaleString()} articles »
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="rule-head">Featured articles</h2>
        <div className="cols featured">
          {featured.map((f) => (
            <Link key={f.id} to={`/articles/${f.id}`} className="feature-card">
              <Thumb article={f} />
              <span className="kicker-sm">{f.topic}</span>
              <span className="card-title">{f.title}</span>
              <span className="card-meta">
                {f.publication}, {formatDate(f.sourceDate)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {SHELVES.map((s) => (
        <section key={s.title} className="shelf">
          <div className="shelf-head">
            <div>
              <h2>{s.title}</h2>
              <div className="shelf-sub">{s.sub}</div>
            </div>
            <Link className="btn-link" to={archiveLink(s.go)}>
              The complete file in the archive »
            </Link>
          </div>
          <div className="cols shelf-row">
            {s.ids
              .map((id) => BY_ID.get(id))
              .filter(Boolean)
              .map((c) => (
                <Link key={c.id} to={`/articles/${c.id}`} className="shelf-card">
                  <Thumb article={c} />
                  <span className="card-title-sm">{c.title}</span>
                  <span className="card-meta">{formatDate(c.sourceDate)}</span>
                </Link>
              ))}
          </div>
        </section>
      ))}

      <section className="gateway">
        <div className="gateway-head">
          <h2>The Full Archive</h2>
          <div className="gateway-sub">
            {ARTICLES.length.toLocaleString()} articles, {FIRST_YEAR} to {LAST_YEAR}, in {ERAS.length} chapters
          </div>
        </div>
        <div className="cols gateway-eras">
          {ERAS.map((e) => (
            <button key={e.name} type="button" onClick={() => navigate(archiveLink({ era: e.name, imp: "key" }))}>
              <span className="kicker-sm">Chapter {e.numeral}</span>
              <span className="era-name">{e.name}</span>
              <span className="card-meta">
                {e.range} · {ERA_COUNTS[e.name] || 0} articles
              </span>
              <EraSpark era={e} />
            </button>
          ))}
        </div>
        <div className="center">
          <Link className="btn btn-solid" to="/articles/archive">
            Open the archive
          </Link>
        </div>
      </section>
    </div>
  );
}
