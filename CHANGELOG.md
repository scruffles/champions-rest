# Changelog

## 2026-11-03

### Changed
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

### Filtering & Navigation
- Filter articles by tier (default show tier 1, button to show all)
- Filter/hide articles where Tom Allen is only mentioned in passing (`focus: passing`)
- Review 39 articles flagged `not_tom` (different Tom Allen or unrelated content) - decide whether to hide or remove

### Article Viewer
- Better zoom for full-page newspaper images (pinch/scroll zoom, not just fullscreen)
- Cite sources in existing biography and fact pages using the new articles as references

### Record Page
- Re-calculate Tom Allen's match history (wins/losses/opponents) by cross-referencing all 1,017 articles - current record page may be incomplete or inaccurate
- Update Record page format with more textual summaries and quotes

### Biography
- Extract new facts from the 736 new articles (dates, opponents, locations, results, quotes)
- Build a new, more complete biography grounded in primary sources

### Timeline
- Redesign the articles page as a timeline or more scalable presentation - the current list doesn't scale to 1,017 articles
- Visual chronological timeline of Tom Allen's life (fights, bar openings, legal troubles, death) as a standalone page or section

### People Network
- Page per notable figure in Tom Allen's life (Jem Mace, Joe Goss, John L. Sullivan, Mike McCoole, etc.)
- Each person page shows their relationship to Allen through linked articles, mini-bio, and links to external resources

### Champion's Rest Saloon
- Dedicated page for his Market Street saloon if the articles provide enough content (legal incidents, patrons, entertainment, closure)

### "On This Day"
- Surface articles by calendar date to connect visitors to what was happening on today's date in Tom Allen's life

### Interactive Map
- Map of fight locations, bar locations, and other significant places pulled from the articles
- Visual links from map locations to the relevant articles
- Consider historic St. Louis map overlay for the city locations

### Maps
- Google maps of bar locations (maybe use a historic St. Louis map)
- Google maps of fight locations

### Bugs
- Fix full-screen articles for Safari
- Fix articles page on iPhone

### Housekeeping
- Finish going over articles for references (stopped at article 221)
- Go through articles for quotes
- Continue adding articles under /articles/to-sort
- Look into viewership metrics
