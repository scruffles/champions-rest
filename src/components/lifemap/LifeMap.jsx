import React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { places } from "../../../data/places";
import { fights } from "../../../data/fights";
import StLouisMap from "./StLouisMap";
import AmericaMap from "./AmericaMap";
import PlaceCard from "./PlaceCard";
import LifeTimeline from "./LifeTimeline";
import { LIFE_ERAS, activeInEra } from "./timeline.mjs";
import { homePlace, viewOfPlace } from "./views.mjs";
import { useFullscreen } from "./useFullscreen";

const HOME_PLACE = homePlace(places);
const BY_ID = new Map([...places, HOME_PLACE].map((p) => [p.id, p]));
const DEFAULT_PLACE = { stl: "stl-417-washington", america: HOME_PLACE.id };
const PATH = { stl: "/map", america: "/map/america" };
const TABS = [
  ["stl", "St. Louis"],
  ["america", "America"],
];
const HEAD = {
  stl: ["Tom Allen’s St. Louis", "Where he kept saloon, sang and fought, drawn over the city as it was in 1875."],
  america: ["Tom Allen’s America", "Every town the papers put him in, from his landing in 1867 to Mitchell’s camp in 1894."],
};

const onViewOf = (view, p) => !!p && (view === "stl" ? p.level === "downtown" : viewOfPlace(p) === "america");

export default function LifeMap() {
  const { view: viewParam } = useParams();
  const view = viewParam === "america" ? "america" : "stl";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const asked = params.get("place");
  const selectedId = BY_ID.has(asked) ? asked : DEFAULT_PLACE[view];
  const [eraId, setEraId] = React.useState(null);
  const [centreRequest, setCentreRequest] = React.useState(0);
  const era = LIFE_ERAS.find((e) => e.id === eraId) || null;
  const full = useFullscreen();

  const go = React.useCallback(
    (id, toView) => navigate(`${PATH[toView]}?place=${encodeURIComponent(id)}`, { replace: toView === view }),
    [navigate, view],
  );
  const select = React.useCallback((id) => go(id, view), [go, view]);
  const onEra = (id) => {
    setEraId(id);
    const e = LIFE_ERAS.find((x) => x.id === id);
    if (e) {
      go(e.place, viewOfPlace(BY_ID.get(e.place)));
      setCentreRequest((n) => n + 1);
    }
  };
  const isActive = React.useCallback((p) => activeInEra(p, era), [era]);
  const place = BY_ID.get(selectedId);
  const [title, deck] = HEAD[view];

  return (
    <div className={`lifemap${full.active ? " is-full" : ""}`}>
      <div className="page-head">
        <div className="kicker">The map</div>
        <h1>{title}</h1>
        <div className="deck">{deck}</div>
      </div>
      <div className="lm-viewbar">
        <nav className="lm-tabs" aria-label="Map view">
          {TABS.map(([v, label]) => (
            <Link key={v} to={onViewOf(v, place) ? `${PATH[v]}?place=${selectedId}` : PATH[v]} aria-current={view === v ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <span className="grow" />
        {full.fits && (
          <button type="button" className="btn" aria-pressed={full.active} onClick={() => full.set(!full.active)}>
            {full.active ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </div>
      <div className="lm-body">
        {view === "stl" ? (
          <StLouisMap places={places} selectedId={selectedId} centreRequest={centreRequest} onSelect={select} isActive={isActive} />
        ) : (
          <AmericaMap places={places} home={HOME_PLACE} selectedId={selectedId} onSelect={select} isActive={isActive} />
        )}
        <aside>
          <PlaceCard place={place} onMap={onViewOf(view, place)} lookup={BY_ID} onSelect={select} />
        </aside>
      </div>
      <LifeTimeline eraId={eraId} onEra={onEra} fights={fights} />
    </div>
  );
}
