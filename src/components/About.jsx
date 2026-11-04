import React from "react";
import { ARTICLES, publicationCounts } from "../lib/articles";

export default function About() {
  const years = ARTICLES.map((a) => a.year).filter(Boolean);
  const pubs = publicationCounts().slice(0, 3);
  const stats = [
    [ARTICLES.length.toLocaleString(), "Articles"],
    [`${Math.min(...years)}–${Math.max(...years)}`, "Years covered"],
    ...pubs.map(([name, n]) => [n.toLocaleString(), `From the ${name.replace("St. Louis ", "")}`]),
  ];

  return (
    <div className="about">
      <div className="page-head">
        <div className="kicker">About this paper</div>
        <h1>A Family Archive, Made Public</h1>
        <div className="byline-strip">Compiled by Bryan Young, great-great-great-grandson of Tom Allen</div>
      </div>

      <section className="about-main">
        <figure>
          <img className="ink" src="/images/pictures/champions-rest.jpg" alt="Engraving of the front of the saloon with a sign reading Tom Allen's Champion's Rest" />
          <figcaption>“Tom Allen's Champion's Rest,” the Market Street saloon this site is named after.</figcaption>
        </figure>
        <div className="body">
          <h2>Why?</h2>
          <p className="dropcap">
            Champions-rest.com was created by Bryan Young, a great-great-great-grandson of Tom Allen. The project started as genealogy research, and it turned up a huge amount of information that didn't seem to be available anywhere else on the internet. Common genealogy apps didn't seem appropriate for organizing and presenting this kind of content, so digital notes and clippings evolved into this website.
          </p>
          <h2>The Name</h2>
          <p>Champions-rest.com is named after Tom Allen's saloon, which entertained patrons from the 1870s until after Allen's death in 1903.</p>
        </div>
      </section>

      <section className="about-archive">
        <h2 className="center-head">What is in the archive</h2>
        <div className="cols stats">
          {stats.map(([n, label]) => (
            <div key={label}>
              <div className="stat-num">{n}</div>
              <div className="label">{label}</div>
            </div>
          ))}
        </div>
        <div className="text-cols body">
          <p>
            Each article is kept three ways: a clipping of the single column where Tom Allen appears, the full newspaper page it came from, and a transcription of its text. Most transcriptions are made with optical character recognition and may contain errors, so the original page is always one click away.
          </p>
          <p>
            Articles are tagged by how central Tom Allen is to the story, from key articles about him to passing mentions, and arranged by the chapters of his life. Claims in the biography and the fight record link back to the articles that support them.
          </p>
        </div>
      </section>

      <section className="band">
        <div>
          <div className="label">Corrections and contributions</div>
          <em>Have a clipping, a photograph or a correction? Get in touch.</em>
        </div>
        <a href="http://www.ibhof.com/pages/about/inductees/pioneer/allen.html" className="btn-link">
          Tom Allen at the International Boxing Hall of Fame »
        </a>
      </section>
    </div>
  );
}
