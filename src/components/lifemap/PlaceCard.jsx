import React from "react";
import { Link } from "react-router-dom";
import { facts } from "../../../data/facts";
import { fights } from "../../../data/fights";
import { formatDate } from "../../lib/articles";
import { placeYears } from "./timeline.mjs";

const FACT_BY_ID = new Map(facts.map((f) => [f.id, f]));
const FIGHT_BY_ID = new Map(fights.map((f) => [f.id, f]));
const SHOWN_FACTS = 6;

const KIND = {
  saloon: "Saloon",
  "saloon-other": "Another man's saloon",
  venue: "Venue",
  fight: "Fight",
  training: "Training camp",
  travel: "Travel",
  residence: "Home",
  legal: "Court",
  family: "Family",
  hotel: "Hotel",
  property: "Property",
  death: "Death",
  burial: "Burial",
};

export default function PlaceCard({ place, onMap }) {
  if (!place) {
    return (
      <article className="lm-card">
        <p className="muted">Choose a pin on the map or a period on the timeline.</p>
      </article>
    );
  }
  const placeFacts = (place.facts || [])
    .map((id) => FACT_BY_ID.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const placeFights = (place.fights || []).map((id) => FIGHT_BY_ID.get(id)).filter(Boolean);
  const articleCount = new Set(placeFacts.flatMap((f) => f.articles || [])).size;
  const years = placeYears(place);

  return (
    <article className="lm-card">
      <p className="sr" aria-live="polite">
        Selected: {place.name}
      </p>
      <div className="lm-card-kicker">Selected place · {KIND[place.kind] || place.kind}</div>
      <h2>{place.name}</h2>
      <p className="lm-card-addr">
        {place.address || place.city}
        {years && (
          <>
            {" "}
            · <i>{years}</i>
          </>
        )}
      </p>
      {place.today && <p className="lm-card-today">Today: {place.today}</p>}
      {place.precision === "area" && <p className="lm-card-note">The pin is approximate.</p>}
      {!onMap && <p className="lm-card-note">Not shown on this map.</p>}
      {placeFights.length > 0 && (
        <ul className="lm-card-fights">
          {placeFights.map((f) => (
            <li key={f.id}>
              <Link to="/record">vs. {f.opponent}</Link>, {formatDate(f.date)} · {f.result}
            </li>
          ))}
        </ul>
      )}
      {placeFacts.length > 0 && (
        <ul className="lm-card-facts">
          {placeFacts.slice(0, SHOWN_FACTS).map((f) => (
            <li key={f.id}>
              {f.date && <b>{formatDate(f.date, "short")} </b>}
              {f.fact}
              {f.articles?.[0] && (
                <>
                  {" "}
                  <Link to={`/articles/${f.articles[0]}`} className="lm-src">
                    source
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {place.notes && <p className="lm-card-notes">{place.notes}</p>}
      <div className="lm-card-foot">
        {placeFacts.length} facts from {articleCount} articles
        {placeFacts.length > SHOWN_FACTS && ` · ${SHOWN_FACTS} shown`}
      </div>
    </article>
  );
}
