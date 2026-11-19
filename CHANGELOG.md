# Changelog

## 2026-11-18

### Added
- Map, today's layer: Gateway Arch National Park with its ponds and trails, the Arch, the Arch museum entrance, the Old Courthouse and Busch Stadium with its field, each labelled (OpenStreetMap)

### Changed
- Map: pin and street labels no longer overlap; where two would collide the less important one waits for hover or focus, and the selected place's label always shows
- Map: timeline periods show their full name, short name or nothing, whichever fits, instead of cutting the name off (Cleveland)
- Map: the St. Louis view keeps the same point in the middle when the window resizes or full screen turns on or off
- Map: zoom, the compare switch and the swipe position survive a visit to the America tab

## 2026-11-17

### Added
- Map page (`/map`): Tom Allen's downtown St. Louis places on our own drawing of the 1875 city, with a swipe comparison against a drawing of today's streets (OpenStreetMap data), clickable pins, place cards with facts and sources, zoom and pan, and a clickable timeline of where he lived
- `data/places.js`: 40 located places (saloons, venues, fight sites, travels), generated from `review/places/places.json` by `scripts/lifemap/places.cjs`
- Map build (`npm run build-map`, `scripts/lifemap/`): today's streets fetched from OpenStreetMap, turned into 1875 by hand edits (`mapdata/stl-1875-edits.json`) checked against the 1875 Wm. C. Wilson & Bro. map; the scan is only a tracing reference and isn't published
- `npm test`: unit tests for the map scripts and helpers (Node's built-in test runner)
- Map: America view (`/map/america`): every town the papers put him in, drawn from Natural Earth outlines, with arcs from St. Louis (solid to fights, dashed to other trips), a St. Louis marker that lists the nearby places, and an Across the Atlantic box for Birmingham and London; timeline periods open whichever view holds their place
- Map: full-screen mode that fits the navbar, map, place card and timeline in a laptop window without scrolling; remembered per browser, Esc to exit, off on small screens

### Changed
- The article viewer's zoom gestures moved to `shared.jsx` so the map can use them too

## 2026-11-16

### Changed
- Article viewer: pinch (trackpad or touch) and Ctrl/⌘ + scroll-wheel zoom on clippings and full pages, keeping the point under the pointer in place; plain scrolling still scrolls
- "On this day": Home and the Articles hero now share one rule (`todaysPick`): lead with the most important article from the date, falling back to Article of the day only when nothing ran that date. They disagreed on 56 days a year
- `data/facts.js`, `data/fights.js` and new `data/quotes.js` replaced with the generated facts index (1,030 facts, 64 fight entries, 225 quotes); disputed facts are separate versions that point at each other
- Record page: shows the result most sources give, flags "Result disputed" and lists the other results with their sources under "Also reported"; Biography footnotes list the other versions of a disputed fact or fight

## 2026-11-15

### Added
- 47 re-cut clippings installed and uploaded to S3, each with a rebuilt thumbnail: 1000, 1004, 1009, 185, 186, 252, 407, 478, 493, 498, 506, 520, 525, 526, 539, 570, 573, 587, 633, 647, 667, 675, 681, 685, 699, 701 (crop from 702), 712, 739, 771, 777, 837, 859, 876, 891, 896, 897, 898, 906, 924, 930, 931, 942, 955, 962, 965, 974, 985
- Crop of 307 (`image-307c.jpg`) uploaded to S3; its thumbnail rebuilt
- `review/MISSING-PAGES.md`: articles whose clipping is missing a page, torn or cut short
- Facts index (`review/facts/`, `review/facts-index/`): every article re-read for facts, quotes and fights, each claim with an excerpt checked against the text (3,571 claims, 225 quotes, 783 fight entries); claims grouped into 1,027 facts and 64 bouts, with conflicts noted; disputed facts split into versions that reference each other, and fights list every disputed result. Tools: `scripts/facts-tools.cjs`, `scripts/facts-names.cjs`, `scripts/facts-group.cjs`; instructions in `.claude/skills/index-facts/`
- Draft `facts.js`, `fights.js` and `quotes.js` in `review/facts-index/draft/` (copied to `data/`); every Biography `<Ref>` and `<Fight>` id resolves in them

### Changed
- Duplicates merged and removed: 943 into 942, 986 into 985, 1005 and 1006 into 1004, 1010 into 1009
- `scripts/cut-clipping.cjs` trims horizontal rules and blank bands at each segment's ends (`--legacy=1` for the old trim); `scripts/clip-tools.cjs` and the `crop-clipping` skill added
- Search index rebuilt
- Hand-cut clippings installed and uploaded: 909 (`image-909c.jpg`), 926 (`image-926c.jpg`), 969 (`image-969c.jpg`); thumbnails rebuilt
- Merged: 906 text replaced by the full transcript and 907 removed; 909 text replaced by the full feature and 910–914 removed; 926 text replaced by the full column and 927 removed; 970 removed (same article as 969)
- `scripts/upload-images.cjs` also syncs the re-cut clippings (`image-NNNc.jpg`) from `public/images/articles`
- Article review finished and merged into the site data: new summaries for 933 articles, title fixes for 434, focus levels for 573, and tags for every article
- The records of 33 articles whose text or source changed were redone before the merge
- Hand transcripts for the Allen passages the OCR lost: 036, 045, 190, 274, 445, 892, 988
- Hand transcripts replace unusable OCR for 21 articles: 088, 094, 106, 145, 146, 147, 201, 242, 243, 255, 303, 508, 678, 891, 906, 909, 924, 926, 974, 985, 1009
- Transcript errors fixed: 106 (Egan, not Brooks, was knocked out), 109 ("both" principals arrested), 617 ($250 fine, 250 days); facts index note for 203 corrected (1869, not 1979)
- 59 more re-cut clippings installed, with thumbnails: the 44 that had passed with doubts, 145, 146, 147 and 201 (their old crops were whole pages), the re-cut fails 1017, 196, 221, 686, 723, 873, 902, 923, 963, 996, and 058. Every listed cut-off clipping is now re-cut except 769 (torn scan)
- 403 removed (reprint of 402). Dates corrected from the masthead: 030, 185, 398, 405
- `review/ISSUES.md` regenerated: no unusable transcripts and one crop left (769)

## 2026-11-14

### Added
- 467, 468 and 469 are one article over two pages: the combined crop is `image-467d.jpg` (page 5 columns 1-3 and page 8); 467 lists both full pages. The text is joined in reading order and 469 is removed. The earlier combined crop `image-467c.jpg` is kept on the site folder
- 467 and 468 are one article over two pages: the combined crop is `image-467c.jpg`, and 467 lists both full pages (`image-467b.jpg`, `image-468b.jpg`). The text is joined and 468 is removed
- Hand-cut clipping of 466 (`image-466c.jpg`); thumbnail rebuilt
- Hand-cut clipping of 452 (`image-452c.jpg`); thumbnail rebuilt
- Hand-cut clipping of 445 (`image-445c.jpg`); thumbnail rebuilt. Transcript replaced: the old text was the post-office tables
- Cut-off clipping of 441 re-cut from the full page (approved candidate): `image-441c.jpg`; thumbnail rebuilt
- Hand-cut clipping of 401 (`image-401c.jpg`); thumbnail rebuilt
- Hand-cut clipping of 354 (Missouri Republican, 1869-08-18): `image-354c.jpg`; thumbnail rebuilt
- Checked and kept: the current clippings of 338, 348, 352, 367, 400 and 455 (removed from the re-crop list)
- Cut-off clipping of 323 (Missouri Republican, 1869-06-16) re-cut from the full page: `image-323c.jpg`; thumbnail rebuilt
- Hand-cut clipping of 302 ("Tom Allen's Fight" listing, Missouri Republican 1869-01-11), now `image-302c.jpg`; thumbnail rebuilt
- 297 and 298 are one article: the merged crop is `image-298c.jpg`; 298 now holds the joined text and 297 is removed
- Re-crop of 303 (the Allen-Davis fight report, 1869-01-13): `image-303c.jpg`; thumbnail rebuilt
- Re-crop of 918 ("Bob Farrell, ex-lightweight", Post-Dispatch 1895-10-20) with its headline: `image-918c.jpg`; thumbnail rebuilt
- Re-crops: 105 (the Veteran article, `image-105c.jpg`), 133 ("Big ears of crazy men": both columns joined in reading order, `image-133c.jpg`), 615 (`image-615c.jpg`), 621 (`image-621c.jpg`) and 689 (`image-689c.jpg`); thumbnails rebuilt

### Changed
- Review notes audited against the data: records for crops and transcripts fixed after review are updated; `review/ISSUES.md` no longer lists removed articles; `review/FINDINGS.md` has a resolved section at the top

### Removed
- Duplicates 328, 518, 549, 834, 958, 1008, 646, 1001, 428, 609, 778 and 688 (header now in 689); each one's complete twin is kept
- Articles not about Allen: 614, 780, 901, 232, 233, 998
- Heading-only item 622 (its blurb text is 621)
- Article 408 (the same as 407), as you asked
- Article 304 (the same as 303), as you asked
- Articles 239, 246, 332, 362, 683 and 714, as you asked. Local and staging files are in the Trash; their S3 objects are still up (the deploy user lacks `s3:DeleteObject`)

## 2026-11-12

### Added
- Article 242's clipping: the crop of both pages (`image-242c.jpg`) replaces the full page as its clipping; the thumbnail is rebuilt from it
- Hand-cut clippings for 088, 218, 240 and 250 (`image-088c.jpg`, `image-218c.jpg`, `image-240c.jpg`, `image-250c.jpg`), replacing the old files; thumbnails rebuilt. Article 088 had no clipping on the site before

## 2026-11-10

### Fixed
- Article 195's title now matches its clipping ("Veteran Tom Allen confined to his bed")
- Article 073's summary no longer mentions McCoole, who isn't in the text

## 2026-11-08

### Added
- Article 242 has a second full page (`image-242b.jpg`). `localCopyFull` can now list several pages, and the page tab shows them in order with a "Page 1 of 2" label
- Hand crops of 13 step-1d articles (088, 091, 145, 146, 147, 149, 187, 201, 206, 218, 240, 246, 250) in `review/work/<id>/crop-by-hand.jpg`; not yet on the site
- `review/work/index.html`: local index of the step-1d pages with their file paths (gitignored)

### Removed
- Articles 232 and 233 (not about Allen) and 237 (probably a duplicate of 236) from `data/database.js`, `data/new_articles.json` and the search index. Their S3 images are still up: the deploy user lacks `s3:DeleteObject`
- Article 998 (not about Allen) from `data/database.js`, `data/new_articles.json` and the search index. Its local and staging images were moved to the Trash (`998-staging-*`). Its 4 S3 objects are still up: the deploy user lacks `s3:DeleteObject`

## 2026-11-06

### Added
- Source images from newspapers.com for the 10 articles that had none (055, 072, 073, 076, 095, 098, 105, 128, 195, 239): full page and crop for each, with thumbnails
- Transcripts for all ten new-source articles (055, 072, 073, 076, 095, 098, 105, 128, 195, 239), typed from the crops and full pages, not OCR; to be checked against the page
- Re-cut crops of 073, 095 and 195 from the full pages, which were cut off (uploaded)
- Re-cut edge-trimmed clippings 340, 345, 405 and 429 from the full pages (uploaded). Their crops live in the staging folder, which is the upload source
- Re-cut edge-trimmed or cut-off clippings 536, 549, 611, 644, 655, 687, 774, 800 and 957 from the full pages (uploaded)
- Full OCR text for 279 articles (000–281) in `data/new_articles.json`, so search covers them; 088 and 237 have no crop on disk and are still missing. Search index rebuilt

### Fixed
- `image-105.jpg` and `image-128.jpg` were copies of articles 102 and 125, so 105 and 128 showed the wrong thumbnails; replaced with their real sources
- Thumbnails are built from each article's crop (`localCopyEdited`) instead of `image-NNN.jpg`, so articles 000–281 no longer show the full-page masthead; all 1,008 rebuilt and uploaded
- Articles 055, 072, 073, 076, 095, 098, 105, 128, 195 and 239 point at their new crop and full page instead of placeholder paths
- `npm run upload-images` only synced `~/projects/claude-ancestry/staging`; run with `STAGING_DIR=public/images/articles` to upload the local article images. This sent the 20 new source files and `our-children-of-the-slums.jpg`, which was missing from S3

### Changed
- `.claude/CLAUDE.md`: image naming, working locations and the working rules for browser downloads, cropping, commits and subagents

## 2026-11-04

### Added
- Article review pipeline (`npm run review`): a restartable checklist of all 1,010 articles, a review rubric, per-article review records, a generated issues list and a findings file
- Pilot review of 20 key articles (crop, OCR, title, summary, importance, tags, paper name and extracted facts)
- Full review of all 1,010 articles: 2,194 extracted facts (455 linked to existing facts, 230 quotes), proposed title/summary/paper fixes, 440 articles flagged for new screenshots or checks in `review/ISSUES.md`, cross-article conflicts in `review/FINDINGS.md`. Not yet merged into the site data

## 2026-11-03

### Added
- Broadsheet redesign of the whole site: aged newsprint texture, worn blackletter masthead, blackletter drop caps, column rules
- New front page with lead story, "At a glance" facts, "On this day" and section teasers
- Articles split into a highlights page (article of the day / on this day hero, featured row, curated shelves) and an archive page
- Archive timeline by chapter of his life and year, with key/everything toggle and topic filters kept in the URL
- Article detail page with clipping, transcript (full OCR text for new articles) and full page views, zoom, earlier/later navigation, citation and related articles
- Fight record regrouped by period with filters, a results tally and expandable rows linking to sources
- Header search across all articles
- Thumbnail build script (`npm run build-thumbnails`) and curated collections in `data/collections.js`
- `npm run upload-images` checks AWS sign-in, builds missing thumbnails and uploads articles and thumbnails to S3

### Changed
- Article totals and year ranges are calculated from the data instead of hard-coded
- Biography keeps its full text and source footnotes, restyled to match
- Reviewed the 39 articles flagged `not_tom`: removed the 7 that are about other people or a horse, and restored the 32 that are about him with corrected titles, summaries, importance and tags (including the 1867 Goss fight report, the 1869 Gallagher rematch challenge and the 1873 indictments)
- Article 517 re-cropped to "A Card From Tom Allen" with a hand-checked transcript
- Articles can carry a `tags` field, which replaces the keyword-guessed topics
- Removed Bootstrap and Font Awesome
- Header search restyled as a printed form's fill-in-the-blank line
- Compact header (small nameplate, nav and search) slides in at the top once the full masthead scrolls away
- Deploy workflow updated to current GitHub Actions (checkout v7, setup-node v7, configure-aws-credentials v6)
- Node 24 for local development and the deploy build, set once in `.nvmrc`
- Deploys set cache headers so CloudFront picks up new versions: `index.html` is never cached, hashed build files are cached for a year, other files for five minutes
- Replaced Fuse.js with MiniSearch for full-text article search
- Search index is now built at build time and lazy-loaded (~960KB gzipped) on first search open
- Full OCR text of all 1,017 articles is searchable with fuzzy matching and prefix search

## 2026-11-02

### Added
- 736 newspaper articles (IDs 282-1017) from St. Louis Globe-Democrat, St. Louis Post-Dispatch, and St. Louis Republic (1867-1905)
- Each article includes cropped single-column image, full newspaper page image, and OCR text
- New metadata fields: `focus` (primary/secondary/passing), `tier` (1/2), `not_tom`
- Full OCR text preserved in `data/new_articles.json` for future use
- `visual-redesign` branch with dark navbar and updated color system (not yet shipped)

## Backlog

### Biography
- Rewrite the Biography from the facts index, section by section: cite the new articles as sources and add what the old text misses (the Indian Mutiny account of his army service, married or widowed, arrests, benefits, the saloon years), showing disputed facts as disputed
- Burial (Calvary or Bellefontaine) isn't stated in any article text; find the source before citing either

### Facts Index
- 219 facts still carry a free-text `conflict` note; split any that matter into versions with `review/facts-index/fact-disputes.json`
- Maybe later: a facts page and a quotes page built from the index (`data/facts.js`, `data/quotes.js`)

### Record Page
- Clean up the single-source entries ("Questionable": garbled or unknown opponents from one article each) and check the auto-made bouts against the old hand-made list
- Add more textual summaries and quotes to each entry (quotes are now in `data/quotes.js`)

### New Pages
- **Timeline:** Tom Allen's life in order (fights, saloon openings, legal troubles, death), as its own page or a section
- **People:** a page per notable figure (Jem Mace, Joe Goss, John L. Sullivan, Mike McCoole, etc.) with a mini-bio, their relationship to Allen through linked articles, and external links
- **Champion's Rest saloon:** a page for the Market Street saloon (legal incidents, patrons, entertainment, closure)
- **Map:** downtown St. Louis (`/map`), the America view (`/map/america`) and full-screen mode are done. Still to do: the citywide zoom level (Sportsman's Park, the cemeteries, the river islands, traced from the Studley 1870 map); period railroads on the America view; keyboard panning on the map frame; Home/End keys and a spoken value for the swipe handle; link fights on place cards to their Record entry; the compact navbar wraps and cuts off search below about 1000px wide (shows in full-screen mode); redirect unknown `/map/<view>` URLs; lazy-load the map page so its outlines don't weigh on the first page load
- **Media:** photographs and drawings of Tom Allen with captions and links to their articles, or merge the missing ones into the existing media page

### Articles & Scans
- Add newly found articles (review them, then extract and index their facts as described in `.claude/CLAUDE.md`)
- Download better scans for the pages in `review/MISSING-PAGES.md` where it would help, most of all 974 ("Tom Allen Badly Beaten"), 931 and 769
- Go through every full-page scan for photographs and drawings of Tom Allen (portraits, sketches), noting the page, article id and caption, for the Media page
- **Picture archive:** gather every picture we have (portraits, sketches, photographs, period maps, scans) into one archive, clean up what we can (crop, straighten, remove stains and noise, keeping the original next to each cleaned copy), and record the source of each one (paper or collection, date, page, URL, article id, rights); the Media page draws from it

### Site & Infrastructure
- Test the redesign in Safari and on iPhone (only desktop Chrome has been checked), including the new pinch zoom in the article viewer
- Pages opened directly by URL (e.g. `/articles/579`) return HTTP 404 while still rendering, because S3 serves the app as its error page. Search engines may treat them as missing; fix with a CloudFront rule that rewrites them to 200
- First load is 2.4 MB (about 900 KB compressed), mostly the article database bundled up front. Split it or load it on demand
- Resolve the 55 Dependabot security alerts on old dependencies
- Delete the S3 objects of removed articles (the deploy user needs `s3:DeleteObject`)
- Look into viewership metrics

## Status

As of 2026-11-15. Update these numbers whenever articles, crops, pages or transcripts change.

| | Count | Notes |
|---|---|---|
| Published articles | 957 | All unique: duplicates and reprints are merged or removed |
| With text | 957 | 686 good (72%; a hand transcript or clean OCR), 271 rough OCR (28%): readable but with garbled words |
| With a clipping | 956 | 074's crop is the same file as its full page; 769's clip is cut short by a tear; 222 show the whole column, not just the Allen item (accepted) |
| With the full page | 902 (94%) | 55 have no full-page image on file, mostly early articles (ids under 270) |
| Reviewed and merged | 957 | Titles, summaries, focus and tags from `review/records/` |
| Missing or damaged pages | 20 | Listed in `review/MISSING-PAGES.md` |
| Indexed for facts | 957 | 3,571 claims grouped into 1,027 facts, 64 bouts and 225 quotes (`review/facts-index/`); 3 facts split into disputed versions, 219 carry a conflict note |
