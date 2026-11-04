import React from "react";
import { Link } from "react-router-dom";
import { ARTICLES, BY_ID, FIRST_YEAR, LAST_YEAR, MONTHS_LONG, onThisDay } from "../lib/articles";

const SECTIONS = [
  { to: "/biography", img: "/images/pictures/image-180a.jpg", pos: "center 20%", kicker: "Biography", title: "His Life, From Birmingham to Market Street", body: "Gunsmith, soldier, prize fighter and saloon keeper, told from the newspapers of the day with every claim sourced.", cta: "Read the biography" },
  { to: "/record", img: "/images/pictures/image-255b.jpg", pos: "center 35%", kicker: "The record", title: "Every Fight, Challenge and Rumor", body: "Bouts from 1860 to 1882, with stakes, rounds and the conflicting reports behind each result.", cta: "See the fight record" },
  { to: "/articles", img: "/images/thumbs/image-400.jpg", pos: "top", kicker: "Articles", title: "The Press on Tom Allen", body: "Featured stories, collections and the full archive arranged by the chapters of his life.", cta: "Browse the articles" },
  { to: "/about", img: "/images/pictures/champions-rest.jpg", pos: "center 60%", kicker: "About", title: "Why “Champion's Rest”?", body: "How a genealogy project turned into this archive, and the saloon it is named after.", cta: "About this site" },
];

export default function Home() {
  const today = new Date();
  const todays = onThisDay(today).slice(0, 3);
  const lead = todays[0];

  return (
    <div className="home">
      <section className="home-lead">
        <figure>
          <img className="ink" src="/images/pictures/fighting-stance.jpg" alt="Tom Allen in a fighting stance, bare chested" />
          <figcaption>Tom Allen in the ring.</figcaption>
        </figure>
        <div className="home-lead-copy">
          <div className="kicker">Twice champion of the prize ring</div>
          <h1>Tom Allen, Champion Pugilist of the World</h1>
          <div className="deck">Bare-knuckle heavyweight, immigrant from Birmingham, and for thirty years the keeper of a St. Louis saloon.</div>
          <div className="byline-strip">Born 1839, Birmingham — Died 1903, St. Louis</div>
          <div className="text-cols">
            <p className="dropcap">
              Champion's Rest chronicles the life of heavyweight boxer Tom Allen, who held the championship title twice in the 1870s. Allen immigrated to the United States from England in the 1860s, eventually settling down in St. Louis, Missouri.
            </p>
            <p>He fought bare knuckle and retired shortly after the introduction of the Queensberry Rules. He continued training fighters while running his saloon in St. Louis until his death in 1903.</p>
            <p>
              In 2014 he was inducted into the <a href="http://www.ibhof.com/pages/about/inductees/pioneer/allen.html">International Boxing Hall of Fame</a>.
            </p>
          </div>
          <div className="actions">
            <Link className="btn btn-solid" to="/biography">
              Read his life story
            </Link>
            <Link className="btn" to="/articles">
              Browse the articles
            </Link>
          </div>
        </div>
      </section>

      <section className="cols home-boxes">
        <div>
          <div className="box-head">At a glance</div>
          <dl className="glance">
            <dt>Born</dt>
            <dd>April 23, 1839, Birmingham, England</dd>
            <dt>Came to America</dt>
            <dd>July 1867</dd>
            <dt>Champion</dt>
            <dd>Defeated Mike McCoole for the title, September 1873</dd>
            <dt>Last fight</dt>
            <dd>Jim Stewart, England, March 10, 1879</dd>
            <dt>Died</dt>
            <dd>April 5, 1903, Baptist Hospital, St. Louis</dd>
            <dt>Honors</dt>
            <dd>International Boxing Hall of Fame, 2014</dd>
          </dl>
        </div>
        <div>
          <div className="box-head red">
            On this day · {MONTHS_LONG[today.getMonth()]} {today.getDate()}
          </div>
          {lead ? (
            <>
              <Link to={`/articles/${lead.id}`} className="today-lead">
                <span className="today-year">{lead.year}</span>
                <span className="card-title">{lead.title}</span>
                <em>{lead.publication}</em>
              </Link>
              {todays.slice(1).map((a) => (
                <Link key={a.id} to={`/articles/${a.id}`} className="today-more">
                  <strong>{a.year}</strong> · <em>{a.title}</em>, {a.publication}
                </Link>
              ))}
            </>
          ) : (
            <p className="muted">Nothing in the archive ran on this date. <Link to="/articles">See today's article »</Link></p>
          )}
        </div>
        <div>
          <div className="box-head">In his own words</div>
          <blockquote className="pull">“The dirtiest deal I ever got, and I have had some pretty hard ones, was in my fight with Joe Goss.”</blockquote>
          <div className="attribution">
            — Tom Allen, on the 1876 fight in Kentucky{BY_ID.get("167") ? <> (<Link to="/articles/167">source</Link>)</> : null}
          </div>
        </div>
      </section>

      <section>
        <h2 className="rule-head">In this edition</h2>
        <div className="cols sections">
          {SECTIONS.map((s) => (
            <Link key={s.to} to={s.to} className="section-card">
              <span className="thumb">
                <img className="ink" src={s.img} alt="" style={{ objectPosition: s.pos }} />
              </span>
              <span className="kicker-sm">{s.kicker}</span>
              <span className="card-title-lg">{s.title}</span>
              <span className="section-body">{s.body}</span>
              <em className="underline">{s.cta} »</em>
            </Link>
          ))}
        </div>
      </section>

      <section className="band">
        <div>
          <div className="label">From the archive</div>
          <div className="band-title">
            {ARTICLES.length.toLocaleString()} newspaper articles, {FIRST_YEAR} to {LAST_YEAR}
          </div>
          <em>Clippings, full pages and transcriptions from the St. Louis press and beyond.</em>
        </div>
        <Link className="btn btn-solid" to="/articles/archive">
          Open the archive
        </Link>
      </section>
    </div>
  );
}
