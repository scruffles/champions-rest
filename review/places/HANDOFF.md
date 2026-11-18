# Handoff: Tom Allen life map (period maps)

> **Update 2026-11-17:** the downtown St. Louis map is now a real page (`/map`), built from our own drawn 1875 and today layers rather than the scans. See `docs/superpowers/specs/2026-11-17-life-map-design.md` and `docs/superpowers/plans/2026-11-17-life-map-st-louis.md`. `places.json` here is the source for `data/places.js` (`node scripts/lifemap/places.cjs`). Still to do: the citywide level and the America view (CHANGELOG Backlog). The mockup notes below are kept for reference.

Written 2026-11-17 to restart this work in a new session. Nothing below is committed.

## Goal

A "Google Maps of Tom Allen's life": pins for his saloons, fight sites and travels (1866–1903) on period maps. There are two views:

- **St. Louis**: a period base map with an on/off **swipe** comparison against today's streets. The user chose swipe only (no fade).
- **America**: arcs from St. Louis to each city he fought or travelled to.

So far this is a static mockup. It doesn't need to be interactive yet.

## Where things are

| What | Path |
|---|---|
| Places (52, 38 with coordinates) | `review/places/places.json` (not committed) |
| Period map sources | `review/places/maps.json` (not committed) |
| Mockup source (design-canvas files) | `review/work/maps/lifemap/project/` (gitignored) |
| Mockup images (old map, modern map, plates) | `review/work/maps/lifemap/img/` |
| Image-building script | `review/work/maps/geo/align.cjs`; run with `node review/work/maps/geo/align.cjs` |
| Downloaded scans and cached OSM tiles | `review/work/maps/dl/` |
| Published mockup | https://claude.ai/artifact/E8yjLFupeX4AnoHCGoUr39 ("Tom Allen Life Map", Design canvas type) |

Copies of the mockup files were also in the old session's scratchpad, which gets cleared. The `review/work/maps/` copies are the ones to use.

### Updating the published mockup

1. Read the artifact first (`Artifact action: read` on the URL).
2. Publish to the same `url` with `root` set to `review/work/maps/lifemap` and the changed `project/*.dc.html` files.
3. Images are uploaded assets referenced as `/_blob/<id>`:
   - `old1875.jpg` → `/_blob/b52d190e5e32fab0de5465ba47528519`
   - `modern.jpg` → `/_blob/a0daffa96f67e731aef4d38a5c88edfc`
   - plate 21 crop → `/_blob/58d146b6ef881652c9a668ab273e85b9`
4. If an image changes, re-upload it with `asset: true` and swap the blob id.

## The mockup's boards (`canvas.json`)

- **Main.dc.html** (1440×1130): header and nav, the embedded St. Louis map, and a side panel. The panel has the period-map list and the selected-place card for the Champion's Rest, 417 Washington, 1870–76, with the plate 21 image and four dated facts. Below is a timeline from 1866 to 1904 with a marker at 1874.
- **America.dc.html** (1440×1080): a hand-projected US map, with `x = (lon+98)*35.7` and `y = (45-lat)*44.6`.
  - 18 cities, with solid arcs for fights and dashed arcs for other trips.
  - An "Across the Atlantic" box and the timeline.
- **StLMap.dc.html** (880×776): the map component. Main embeds it with `split=600`.
  - Props are `mode` (`period` or `swipe`) and `split` (in px).
  - Pins are in figure pixels: 417 Wash (476,212), Hennessy's (523,131, approximate), the fight steamer (702,678), 619 Market (301,464), the Daly fight (274,440) and Kelly's (140,414).

## How the St. Louis images were made (`align.cjs`)

- **Base map:** 1875 Wm. C. Wilson & Bro. map, from SHSMO IIIF `https://digital.shsmo.org/iiif/2/Maps:193`.
  - North is to the right on the sheet, so the downtown crop was rotated north-up (`dl/core_rot.jpg`).
  - That image was cropped to x 110–850, y 120–725 and scaled to 880×720 (output at 2×).
- **Alignment:** a least-squares affine fit from 4 control points: 417 Washington, 619 Market, 9 N. Ninth, and Seventh between Market and Chestnut.
- **Modern image:** OSM z17 tiles warped into the same frame, with bilinear resampling done by hand. CARTO tiles need an API key, so they were not used.
- **Accuracy:** about a block. Walnut, Eads Bridge and the riverfront line up. The 1875 map's own lettering is crude and sits 50–90 m off.

## Facts worth keeping

- St. Louis already used 100 numbers per block in the 1870s, so there was **no renumbering**. Fifth Street is now Broadway.
- Places notes:
  - Burial: Calvary (article 208) vs. Bellefontaine (article 209), unresolved.
  - "Fitch street" in fact 098 / article 278 is probably OCR for Fifth.
  - Fight 004: Foster's Island vs. Chouteau Island (fact 149).
- *Pictorial St. Louis* (Compton & Dry, 1875): the LOC image number is plate + 4.
  - IIIF URL: `https://tile.loc.gov/image-services/iiif/service:gmd:gmd416m:g4164m:g4164sm:gpm00001:paNNNNNm/full/3000,/0/default.jpg`
  - Plate 1: the levee. Plate 2: Eads Bridge.
  - Plate 21: Court House, Theatre Comique, Lindell Hotel.
  - Plate 22: Fourth at Christy and Morgan (Hennessy's area). It is **not** Washington Ave, despite the file name `plate22_fourth_washington.jpg`.
- Studley 1870 "St. Louis and Environs" (SHSMO `Maps:196`, 13800×10593) shows the river islands used as fight grounds.

## Access notes

- These sites block automated requests:
  - The WashU Whipple insurance maps site.
  - David Rumsey and LOC HTML pages. LOC's `?fo=json` and its tile.loc.gov IIIF work.
- Claude in Chrome was **not** connected in the last session. The Whipple volumes and the Rumsey georeferenced tiles need it.
- Overpass API timed out. Nominatim street geometries worked for intersections.

## Not done yet / next options

1. ~~Check the rendered mockup.~~ Done 2026-11-17 (version 11). The pins sit on the right streets on both maps. Fixed: swipe moved to 600 so it no longer cuts the 417 Washington pin; Kelly and Daly labels no longer overlap; short timeline eras abbreviated (full name on hover); fight legend moved off the axis; OSM credit only in swipe mode; on America, the St. Louis label is clear of Kansas City, the map caption moved top-left, and Gulf of Mexico is visible. To preview locally, run `review/work/maps/geo/render-preview.cjs` (it substitutes `{{}}`, `sc-for`, `sc-if` and `dc-import`) and take headless Chrome screenshots.
2. Find the 417 Washington building on Pictorial St. Louis plate 21 (or the right plate), and crop it for the place card.
3. A proper georeference with more control points (Allmaps on the SHSMO IIIF image) instead of the 4-point affine fit.
4. A river-islands fight-site view from the Studley 1870 map.
5. The Whipple 1870s and 1895 insurance maps, which show building outlines (needs a browser).
6. Turn the mockup into a real page on the site. Not started, and the user hasn't asked for it yet.

## Rules (from CLAUDE.md)

- Commit or push only when asked; a push to `main` deploys.
- Stage specific paths only.
- Don't edit `data/database.js` or `data/facts.js` for this work.
- `review/places/` is untracked. Ask before committing it, and update CHANGELOG.md (Backlog, Status) when you do.
