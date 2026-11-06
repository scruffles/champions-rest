# Changelog

## 2026-11-06

### Added
- Source images from newspapers.com for the 10 articles that had none (055, 072, 073, 076, 095, 098, 105, 128, 195, 239): full page and crop for each, with thumbnails
- Transcripts for 055, 076, 105, 128 and 239 (typed from the crops, not OCR; to be checked against the page)

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

1. **Get the sources right** (before anything else)
   - Point `data/database.js` at the new source images for 055, 072, 073, 076, 095, 098, 105, 128, 195, 239 (`image-NNN.jpg` full page, `image-NNNb.jpg` crop; done and uploaded). Transcripts are in for 055, 076, 105, 128, 239. Still to do: 072, 073, 095, 098 and 195 have cut-off crops, so re-crop them from the full page and transcribe; 195's title doesn't match its crop ("Veteran Tom Allen confined to his bed", Republic 1903-01-31); re-review all ten
   - Re-capture from newspapers.com the 440 articles in `review/ISSUES.md` (cut-off and mixed crops, wrong articles, unreadable full pages)
   - Re-crop and re-OCR where a full page is available; hand-transcribe the 23 unusable and 12 missing transcripts, and the transcripts with meaning-changing errors in `FINDINGS.md` (e.g. 106, 109, 203, 617)
   - Bring the full transcripts of articles 000–281 into `data/new_articles.json` so search covers them
2. **Re-review what changed**: rerun the review on the re-captured and re-transcribed articles, so each record reflects its new text
3. **Settle the facts that depend on the text**
   - Remove the 3 articles that are not about him (232, 233, 998) and decide on the 14 marked unsure (e.g. 133, 190, 332, 362, 683, 714, 918)
   - Remove or merge about 25 duplicate and split articles listed in `review/FINDINGS.md` (e.g. 328/329, 403/402, 518/517, 1007/1008, 297+298, 303+304, 855+856)
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
