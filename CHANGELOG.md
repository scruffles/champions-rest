# Changelog

## 2026-11-15

### Added
- 47 re-cut clippings installed and uploaded to S3, each with a rebuilt thumbnail: 1000, 1004, 1009, 185, 186, 252, 407, 478, 493, 498, 506, 520, 525, 526, 539, 570, 573, 587, 633, 647, 667, 675, 681, 685, 699, 701 (crop from 702), 712, 739, 771, 777, 837, 859, 876, 891, 896, 897, 898, 906, 924, 930, 931, 942, 955, 962, 965, 974, 985
- Crop of 307 (`image-307c.jpg`) uploaded to S3; its thumbnail rebuilt
- `review/MISSING-PAGES.md`: articles whose clipping is missing a page, torn or cut short

### Changed
- Duplicates merged and removed: 943 into 942, 986 into 985, 1005 and 1006 into 1004, 1010 into 1009
- `scripts/cut-clipping.cjs` trims horizontal rules and blank bands at each segment's ends (`--legacy=1` for the old trim); `scripts/clip-tools.cjs` and the `crop-clipping` skill added
- Search index rebuilt
- Hand-cut clippings installed and uploaded: 909 (`image-909c.jpg`), 926 (`image-926c.jpg`), 969 (`image-969c.jpg`); thumbnails rebuilt
- Merged: 906 text replaced by the full transcript and 907 removed; 909 text replaced by the full feature and 910–914 removed; 926 text replaced by the full column and 927 removed; 970 removed (same article as 969)
- `scripts/upload-images.cjs` also syncs the re-cut clippings (`image-NNNc.jpg`) from `public/images/articles`

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

### Article review follow-up (from the full review, see `review/`)

Run in this order. Source fixes come first, so the later steps don't have to be redone.

1. **Get the sources right** (before anything else). Each sub-section is a unit of work with a clear done-state.
   - **1a. Ten new-source articles** (055, 072, 073, 076, 095, 098, 105, 128, 195, 239): pointers, crops and transcripts are done and uploaded. Fixed: 195's title and 073's summary. Left: the ten are re-reviewed (goes with 2).
   - **1b. Edge-trimmed clippings** (done: 340, 345, 405, 429, 536, 549, 611, 644, 655, 687, 774, 800, 957). Open: 328 is a duplicate of 329, so merge it in step 3 rather than re-cropping; 348 has no match on its page (retry with a different locator, e.g. its headline).
   - **1c. Cut-off and wrong-article clippings** (151 items in `review/work/index-batch.html`): re-crop each from its full page. Seven have no full page on disk, so find those on newspapers.com first. Open.
   - **1d. Missing pages**: done. Hand crops are on the site for 088, 218, 240, 250, 242 (both pages), 105, 133, 615, 621, 689, 918 and 303. 262 is covered by its existing clipping (no full page on file). Open: 297 and 298 are one article, with a merged crop saved as `298b-cropped.jpg` in Downloads; merge the two records and publish. 278 is a duplicate to remove once the 278 crop is identified.
   - **1e. Mixed clippings** (223 items in `review/work/index-batch.html`): trim each clip to the Allen item only. Open.
   - **1f. Transcripts**: write the 12 missing and the unusable ones (35 items in `review/ISSUES.md`) from the re-captured crops, and fix the meaning-changing errors in `FINDINGS.md` (106, 109, 203, 617). Open: all.
2. **Re-review what changed**: rerun the review on the re-captured and re-transcribed articles, so each record reflects its new text
3. **Settle the facts that depend on the text**
   - Removed (not about him or duplicates): 232, 233, 998, 237, 239, 246, 332, 362, 683, 714, 614, 622, 688, 780, 901, 428, 609, 778. Still to do: delete their S3 objects (the deploy user lacks `s3:DeleteObject`). Unsure items: 190 has no other evidence in the data that Allen owned the Geyer Avenue lot (the listing is the only source). 055 and 128 are keep.
   - Decide on the remaining unsure: 133 (re-cropped), 190 (keep or remove), 918 (re-cropped), 128 (keep)
   - Remove or merge the remaining duplicates in `review/FINDINGS.md`: 297 + 298 (one article, merge), 403/402, 855/856, 1005/1006, 278 (duplicate, see 1d). Removed so far: 328, 518, 549, 834, 958, 1008, 646, 1001, 428, 609, 778, 688
   - Resolve the fact conflicts in `review/FINDINGS.md`: birth year (1839 vs 1840/1841), arrival in America, Crimean War vs Indian Mutiny, belt presentation date, Halifax sailing date, burial (Calvary vs Bellefontaine), saloon address (615/618/619 Market), will, widower, brothers and sister
   - Settle the 1869-08-17 Gallagher result in `data/fights.js`: it is still listed as a win, while 352 and 647 say draw and 643 says Allen won (the sources are now linked and noted there)
4. **Merge the records into the site data**
   - Fix 8 article dates flagged against the masthead (e.g. 030, 185, 187, 192, 394, 398, 405, 428)
   - Rename papers to their name at the time (424 records): Daily Missouri Democrat / St. Louis Democrat before May 1875, St. Louis Evening Dispatch or Evening Post before Dec 1878, Missouri Republican before 1888. Normalize "St. Louis Democrat" vs "Daily Missouri Democrat" and "The Republican" vs "Missouri Republican" first
   - Approve and merge the review records into `data/database.js`: 458 title fixes, 979 summary rewrites, 503 focus changes, and tags for every article (replaces the keyword-guessed topics)
5. **Consolidate the facts last**: merge the 2,194 extracted facts into `data/facts.js`, keeping existing fact ids; give the facts with id `000` or no id real ids first

### Filtering & Navigation
- Tag the remaining articles (32 have real tags; the rest still use keyword-guessed topics)
- The `not_tom` flag was wrong for 32 of 39 articles, so the automatic `focus` levels may also be unreliable; spot-check them
- Fix automatic crops that cut off multi-column headlines (e.g. article 1000)

### Home & Highlights
- "On this day" can disagree between pages: on about 72 days a year the Home box shows a supporting article or passing mention while the Articles hero falls back to Article of the day. Pick one rule for both

### Article Viewer
- Pinch and scroll-wheel zoom on clippings and full pages (the +/− buttons already work)
- Cite sources in existing biography and fact pages using the new articles as references

### Record Page
- Re-calculate Tom Allen's match history (wins/losses/opponents) by cross-referencing all 1,017 articles - current record page may be incomplete or inaccurate
- Update Record page format with more textual summaries and quotes
- Check two likely date typos in `data/fights.js`: George Rooke "1978-07-15" and Cleary "1978 ish" (probably 1878); they currently show under "Uncertain dates"

### Biography
- Build a new, more complete biography grounded in primary sources

### Timeline
- Visual chronological timeline of Tom Allen's life (fights, bar openings, legal troubles, death) as a standalone page or section

### People Network
- Page per notable figure in Tom Allen's life (Jem Mace, Joe Goss, John L. Sullivan, Mike McCoole, etc.)
- Each person page shows their relationship to Allen through linked articles, mini-bio, and links to external resources

### Champion's Rest Saloon
- Dedicated page for his Market Street saloon if the articles provide enough content (legal incidents, patrons, entertainment, closure)

### Interactive Map
- Map of fight locations, bar locations, and other significant places pulled from the articles
- Visual links from map locations to the relevant articles
- Consider historic St. Louis map overlay for the city locations

### Bugs & Testing
- Test the redesign in Safari and on iPhone (only desktop Chrome has been checked; replaces the old full-screen and iPhone bugs on the retired Articles page)
- Pages opened directly by URL (e.g. `/articles/579`) return HTTP 404 while still rendering, because S3 serves the app as its error page. Search engines may treat them as missing; fix with a CloudFront rule that rewrites them to 200

### Performance & Maintenance
- First load is 2.4 MB (about 900 KB compressed), mostly the article database bundled up front. Split it or load it on demand
- Resolve the 55 Dependabot security alerts on old dependencies

### Housekeeping
- Finish going over articles for references (stopped at article 221)
- Go through articles for quotes
- Continue adding articles under /articles/to-sort
- Look into viewership metrics

### Media
- Scan every full-page scan for photographs and drawings of Tom Allen (the portraits, the sketches and any photographs in the articles), noting the page, article id and caption
- Build a "media" page of those images with captions and links to the articles, or merge any photos that are missing into the existing media page
