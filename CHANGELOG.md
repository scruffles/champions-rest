# Changelog

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
- Articles flagged `not_tom` are hidden
- Removed Bootstrap and Font Awesome
- Header search restyled as a printed form's fill-in-the-blank line
- Deploy workflow updated to current GitHub Actions (checkout v7, setup-node v7, configure-aws-credentials v6)
- Node 24 for local development and the deploy build, set once in `.nvmrc`
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

### Header
- Sticky compact header: once the full masthead scrolls away, keep a small version pinned to the top (small nameplate, nav and search)

### Filtering & Navigation
- Review 39 articles flagged `not_tom` (different Tom Allen or unrelated content) - currently hidden; decide whether to remove
- Replace keyword-guessed topics with real per-article tags
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
- Extract new facts from the 736 new articles (dates, opponents, locations, results, quotes)
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
- Cover bar locations and fight locations (folds in the earlier Google Maps items)

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
