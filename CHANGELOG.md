# Changelog

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

### Search
- Full-text search performance: current approach loads all OCR text into Fuse.js index (~2MB); explore lazy-loading or a separate search index

### Record Page
- Re-calculate Tom Allen's match history (wins/losses/opponents) by cross-referencing all 1,017 articles - current record page may be incomplete or inaccurate
- Update Record page format with more textual summaries and quotes

### Biography
- Extract new facts from the 736 new articles (dates, opponents, locations, results, quotes)
- Build a new, more complete biography grounded in primary sources

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
