import React from "react";
import { useSearchParams } from "react-router-dom";
import { places } from "../../../data/places";
import { fights } from "../../../data/fights";
import StLouisMap from "./StLouisMap";
import PlaceCard from "./PlaceCard";
import LifeTimeline from "./LifeTimeline";
import { LIFE_ERAS, activeInEra } from "./timeline.mjs";

const BY_ID = new Map(places.map((p) => [p.id, p]));
const DEFAULT_PLACE = "stl-417-washington";

export default function LifeMap() {
  const [params, setParams] = useSearchParams();
  const asked = params.get("place");
  const selectedId = BY_ID.has(asked) ? asked : DEFAULT_PLACE;
  const [eraId, setEraId] = React.useState(null);
  const era = LIFE_ERAS.find((e) => e.id === eraId) || null;

  const select = React.useCallback((id) => setParams({ place: id }, { replace: true }), [setParams]);
  const onEra = (id) => {
    setEraId(id);
    const e = LIFE_ERAS.find((x) => x.id === id);
    if (e) select(e.place);
  };
  const isActive = React.useCallback((p) => activeInEra(p, era), [era]);
  const place = BY_ID.get(selectedId);

  return (
    <div className="lifemap">
      <div className="page-head">
        <div className="kicker">The map</div>
        <h1>Tom Allen&rsquo;s St. Louis</h1>
        <div className="deck">Where he kept saloon, sang and fought, drawn over the city as it was in 1875.</div>
      </div>
      <div className="lm-body">
        <StLouisMap places={places} selectedId={selectedId} onSelect={select} isActive={isActive} />
        <aside>
          <PlaceCard place={place} onMap={place?.level === "downtown"} />
        </aside>
      </div>
      <LifeTimeline eraId={eraId} onEra={onEra} fights={fights} />
    </div>
  );
}
