import React from "react";
import { Link } from "react-router-dom";
import { fights } from "../../data/fights";
import { formatDate } from "../lib/articles";

const NO_FIGHT = ["?", "none", "not fought", "canceled", "broken up"];

const GROUPS = [
  { key: "eng", title: "In England", sub: "1860–1867, before he emigrated" },
  { key: "usa", title: "In America", sub: "1868–1876, the championship years" },
  { key: "back", title: "Back in England", sub: "1877–1879, and the last fights" },
  { key: "late", title: "After the ring", sub: "1882 and later challenges" },
  { key: "odd", title: "Uncertain dates", sub: "undated claims, and dates the sources record oddly" },
];

const yearOf = (d) => {
  const m = String(d).match(/(1[89]\d\d)/);
  return m ? Number(m[1]) : null;
};

const groupOf = (f) => {
  const y = yearOf(f.date);
  if (String(f.date).startsWith("pre")) return "eng";
  if (y === null || y > 1903) return "odd";
  if (y <= 1867) return "eng";
  if (y <= 1876) return "usa";
  if (y <= 1879) return "back";
  return "late";
};

const happened = (f) => !f.plannedOnly && !NO_FIGHT.includes(f.result);

const kindOf = (f) => {
  if (!happened(f)) return "other";
  if (f.result === "win") return "win";
  if (f.result === "draw") return "draw";
  if (f.result === "loss or draw") return "disputed";
  if (f.result.startsWith("loss")) return "loss";
  return "other";
};

const STAMP = { win: "Win", loss: "Loss", draw: "Draw", disputed: "Disputed" };

const sortKey = (f) => (String(f.date).startsWith("pre") ? 1868 : yearOf(f.date) ?? 9999);

const ROWS = fights
  .map((f, i) => ({ ...f, i }))
  .sort((a, b) => sortKey(a) - sortKey(b) || String(a.date).localeCompare(String(b.date)));

const FIGHT_YEARS = fights.map((f) => yearOf(f.date)).filter((y) => y && y <= 1903);
const FIRST_FIGHT = Math.min(...FIGHT_YEARS);
const LAST_FIGHT = Math.max(...FIGHT_YEARS);

const FILTERS = [
  ["all", "All entries"],
  ["fights", "Fights only"],
  ["questionable", "Questionable"],
  ["planned", "Planned / unfought"],
];

export default function Record() {
  const [filter, setFilter] = React.useState("all");
  const [open, setOpen] = React.useState(null);

  const keep = (f) => (filter === "all" ? true : filter === "fights" ? happened(f) : filter === "questionable" ? f.questionable : !happened(f));
  const list = ROWS.filter(keep);
  const fought = fights.filter(happened);
  const count = (k) => fought.filter((f) => kindOf(f) === k).length;

  return (
    <div className="record">
      <div className="page-head">
        <div className="kicker">The sporting record</div>
        <h1>Tom Allen in the Ring</h1>
        <div className="deck">
          Bouts, challenges and rumored matches, {FIRST_FIGHT} to {LAST_FIGHT}
        </div>
      </div>

      <section className="cols tally">
        {[
          [count("win"), "Wins", ""],
          [count("loss"), "Losses", "red"],
          [count("draw"), "Draws", ""],
          [count("disputed"), "Disputed", "muted"],
          [fights.length - fought.length, "Planned or unfought", "muted"],
        ].map(([n, label, tone]) => (
          <div key={label}>
            <div className={`stat-num ${tone}`}>{n}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </section>

      <div className="record-intro">
        <p className="dropcap">
          Below is Tom Allen's fight record as pieced together from dozens of sources. Because boxing wasn't widely covered, especially at an international level, early reporters relied on the fighters to honestly recall their past fights. Many entries carry two or three versions of the date, the rounds or the stakes. Each one is annotated to reference the original sources. Please review them and make your own judgements.
        </p>
        <div>
          <div className="label">Show</div>
          <div className="segmented wrap" role="group" aria-label="Filter entries">
            {FILTERS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={filter === v}
                onClick={() => {
                  setFilter(v);
                  setOpen(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <em className="count-line">
            Showing {list.length} of {fights.length} entries. Click any row for stakes, times, notes and sources.
          </em>
        </div>
      </div>

      {GROUPS.map((g) => {
        const rows = list.filter((f) => groupOf(f) === g.key);
        if (!rows.length) return null;
        return (
          <section key={g.key} className="record-group">
            <div className="record-group-head">
              <h2>{g.title}</h2>
              <em>{g.sub}</em>
            </div>
            <div className="record-row record-cols-head" aria-hidden="true">
              <span>Date</span>
              <span>Result</span>
              <span>Opponent</span>
              <span>Where</span>
              <span>Rounds</span>
            </div>
            {rows.map((f) => {
              const kind = kindOf(f);
              const isOpen = open === f.i;
              const flags = [f.questionable && "Questionable sources", f.plannedOnly && "Planned only"].filter(Boolean);
              const stamp = STAMP[kind] || (f.result === "?" ? (f.plannedOnly ? "Planned" : "Unknown") : f.result);
              return (
                <div key={f.i} className={`record-entry ${isOpen ? "open" : ""} ${f.questionable || f.plannedOnly ? "dim" : ""}`}>
                  <button type="button" className="record-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.i)}>
                    <em>{formatDate(f.date, "short")}</em>
                    <span>
                      <span className={`stamp stamp-${kind}`}>{stamp}</span>
                    </span>
                    <span className="opponent">
                      {f.opponent}
                      {flags.length > 0 && <span className="flag">{flags.join(" · ")}</span>}
                    </span>
                    <span>{f.location || "—"}</span>
                    <span className="rounds">
                      {f.rounds || "—"}
                      <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="record-details">
                      <dl className="meta">
                        <dt>Stakes</dt>
                        <dd>{f.stakes || "—"}</dd>
                        <dt>Fight time</dt>
                        <dd>{f.time || "—"}</dd>
                        <dt>Result</dt>
                        <dd>{f.result}</dd>
                      </dl>
                      <div>
                        {f.details && f.details.length > 0 && (
                          <ul>
                            {f.details.map((d) => (
                              <li key={d}>{d}</li>
                            ))}
                          </ul>
                        )}
                        <div className="sources">
                          <span className="label">Sources</span>
                          {(f.articles || []).map((id, j) => (
                            <Link key={id} to={`/articles/${id}`} aria-label={`Source ${j + 1}, article ${id}`}>
                              {j + 1}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
      {list.length === 0 && <div className="empty">No entries match this filter.</div>}
    </div>
  );
}
