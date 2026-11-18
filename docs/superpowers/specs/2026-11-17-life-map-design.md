# Life map: design

Date: 2026-11-17. Status: approved by the user section by section, spec under review.

## Goal

A "map of Tom Allen's life" page on the site: his saloons, fight sites and travels from 1866 to 1903. There are two views:

- **St. Louis:** our own drawing of the 1875 city, with a swipe comparison against our own drawing of today's streets.
- **America:** arcs from St. Louis to each city he fought in or travelled to.

The mockup is at https://claude.ai/artifact/E8yjLFupeX4AnoHCGoUr39; background is in `review/places/HANDOFF.md`.

**No scanned or third-party map image ships.** The downloaded period maps (Wilson 1875, Studley 1870, Rand McNally 1888) are tracing references only. Everything shown is SVG drawn from our own geometry.

## Decisions

| Question | Decision |
|---|---|
| St. Louis 1875 map | A traced vector map: streets, blocks, levee, river, Eads Bridge, with 1875 street names |
| "Today" side of the swipe | Our own drawn modern map from OpenStreetMap data (credit: © OpenStreetMap contributors) |
| America map | Natural Earth (public domain) coastlines, lakes, rivers and state lines in our style. Period railroads come later |
| Places outside downtown | Two zoom levels: detailed downtown and citywide |
| Interaction | Clickable pins and timeline, draggable swipe, pinch/wheel zoom, works on phones. No year slider |
| Pipeline | Geography first: all geometry in lon/lat with one shared projection; the 1875 layer is OSM streets plus hand edits checked against the scan |

## 1. Data and build pipeline

### Places

- `scripts/lifemap/places.cjs` generates `data/places.js` from `review/places/places.json`.
- It keeps places with coordinates and adds `level`:
  - `downtown`: inside the downtown frame;
  - `city`: elsewhere in St. Louis;
  - `america`;
  - `atlantic`: Birmingham and London, shown in a box, not on the map.
- Fields kept: `id`, `name`, `kind`, `address`, `from`, `to`, `lat`, `lon`, `precision`, `facts`, `fights`, `notes`, `level`.
- It's new published data: show the generated file to the user before it goes into `data/`.

### Source geometry (`mapdata/`, committed)

- **`stl-modern.geojson`:** OSM streets (with names), the river, parks and highways for the downtown and citywide frames.
  - Fetch from Overpass with small bounding boxes (one large query timed out before).
  - The raw response stays in `review/work/maps/osm/` (gitignored).
  - `scripts/lifemap/fetch-osm.cjs` does the fetch.
- **`stl-1875-edits.json`:** the hand-made changes that turn today's downtown into 1875:
  - `rename`: today's name → 1875 name (for example, N Broadway → Fifth; every rename is checked against the scan, not assumed);
  - `remove`: modern-only features by OSM id or name (I-44, Memorial Drive, Busch Stadium, the Arch grounds' paths);
  - `add`: lon/lat lines and polygons (the levee and wharf, the 1875 riverbank, Main/Second/Commercial and the cross streets through the Arch grounds, and any streets since removed).
- **`stl-city-1870.geojson`:** citywide features traced from the Studley 1870 and Wilson 1875 maps:
  - the riverbank;
  - the islands (Arsenal, Chouteau, Foster's);
  - parks (Lafayette, Tower Grove);
  - Calvary and Bellefontaine cemeteries;
  - the main roads (Broadway, Olive, Gravois, Natural Bridge and others as needed);
  - the city limits.
- **America:** Natural Earth 1:10m coastline, lakes, rivers and US state lines, clipped to the frame. The raw downloads stay in `review/work/maps/ne/`.

### Tracing check

- `scripts/lifemap/check-overlay.cjs` re-aligns the 1875 scan with more control points than the old 4-point fit: a 2nd-order polynomial, or piecewise if needed.
- It renders the scan, faded, under our drawn lines and pins, and writes PNGs to `review/work/maps/check/`.
- Every traced layer is reviewed this way before it's used.

### Build

- `scripts/lifemap/build.cjs` projects everything with Web Mercator into fixed frames: downtown, citywide and America.
- It simplifies the geometry (Douglas–Peucker, with a tolerance per level).
- Frames: **downtown** runs roughly from Cass Ave to Chouteau Ave and from 18th St to the Illinois bank, so it covers every `downtown` place. **Citywide** covers the 1876 city limits plus the river islands. **America** matches the mockup's extent. Exact bounds are set in `projection.js` once the places are plotted.
- It writes ready-made SVG path data per layer to `src/components/lifemap/geo/*.json`: `stl-downtown-1875`, `stl-downtown-today`, `stl-city-1875`, `stl-city-today` and `america`.
- Street labels are written with their position and angle.
- `src/components/lifemap/projection.js` exports the frames and the projection. The build script and the runtime pin placement both use it, so pins and both layers always line up.
- No mapping library is added at runtime.
- Add `npm run build-map` to rebuild the geo files. Commit them so `npm run package` doesn't need the network.

## 2. The page and its components

### Routes

- `/map` (St. Louis) and `/map/america`.
- Add "Map" to `NAV` in `Navbar.jsx`, between Record and About.
- The selected place goes in `?place=<id>`, so each place can be linked to.

### Components (`src/components/lifemap/`)

- **`LifeMap.jsx`:** the page, with the header, the view tabs, the map, the card and the timeline.
  - State: the view, the selected place id (synced with the URL), and the highlighted era.
- **`StLouisMap.jsx`:** the SVG map.
  - Pan and zoom use `useZoomGestures`, moved out of `ArticleDetail.jsx` into `shared.jsx` so both pages use it. Pan is by drag; there are also +/- buttons.
  - Below a set zoom, the citywide drawing shows; above it, the downtown drawing. The switch crossfades.
  - The "Compare with today" switch (a real `<button role="switch">`) shows a draggable swipe handle.
    - The today layer is clipped at the handle with a `clipPath`.
    - The handle is a keyboard-operable slider (arrow keys).
    - Pins draw above both layers.
- **`AmericaMap.jsx`:** the drawn outlines, a pin per place, and arcs from St. Louis: solid for fights, dashed for other trips. Birmingham and London go in an "Across the Atlantic" box.
- **`PlaceCard.jsx`:**
  - name, kind, dates;
  - the address then, and where it is today;
  - precision ("approximate" for area places);
  - the place's facts from `data/facts.js` with links to `/articles/<id>`;
  - fights from `data/fights.js`;
  - notes, such as disputes (for example, Calvary vs. Bellefontaine).
- **`LifeTimeline.jsx`:**
  - The periods: England, Cleveland, Fifth St., 417 Washington, Toronto, England, 619 Market. Each is a button that selects its place and centres the map.
  - Fight markers come from `data/fights.js`, for American fights.
  - In the highlighted era, the map's matching pins are emphasised and the rest fade.

### Pins

- `block` and `intersection` places: a solid dot.
- `area`: a dashed ring.
- `city` precision: shown only on the America view.
- No coordinates: not drawn.
- The selected pin is larger and its label is always shown. Other labels show on hover or focus, and at high zoom.
- Pins are buttons with an `aria-label`.

### Look

- The site's ink-and-paper styles (`.less`).
- **1875 layer:** dark ink on cream, with period lettering for street names.
- **Today layer:** a cool, plain modern style, so the two sides read differently.

### Phones

- The card stacks under the map.
- The timeline scrolls sideways.
- Pinch zoom works, and touch targets are at least 44px.

## 3. Checking the work and build order

### Checks

- Overlay images for each traced layer, reviewed and shown to the user.
- Pin positions checked on both layers.
- `npm run lint` and `npm run package`.
- On the dev server, screenshots at desktop and phone widths. Check the swipe, zoom, the level switch, pin clicks, the card's links, timeline clicks, and `?place=` links.

### Build order (each step reviewable)

1. `data/places.js`, the OSM fetch, the 1875 edits for downtown, the build script, and a `/map` page showing the downtown layers with static pins.
2. The swipe, zoom, `PlaceCard` and `LifeTimeline`.
3. The citywide level (`stl-city-1870` tracing, plus the level switch).
4. The America view.

### Records

Update `CHANGELOG.md` (entry, Backlog, Status) when the user asks for a commit. Never push without being asked.

## Not in scope

- Period railroads on the America map.
- A year slider.
- Building outlines from the Whipple insurance maps.
- An inset map of England.
- Pictorial St. Louis building images on the place cards.
