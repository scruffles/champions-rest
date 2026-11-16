# Champions Rest

## Changelog

When committing and pushing changes, always update `CHANGELOG.md`:

- Add a dated entry under the most recent date header (or create a new one if the date changed) describing what was added, changed, or fixed
- Keep entries concise — one line per change
- Keep the Backlog current: remove items when they are done, update items when part of the work is done or the plan changes, and add new work the user asks for. Check an item against the data before trusting it; don't let done or obsolete items linger
- Keep the Status section at the bottom current: whenever articles, crops, full pages, transcripts or the missing-pages list change, recount from the data (not by adjusting the old numbers) and update the table and its "As of" date

## Build

- `npm run dev` — start dev server
- `npm run package` — build for production (runs search index build first)
- `npm run build-search` — rebuild the search index from `data/new_articles.json`

## Search Index

The search index (`public/search-index.json`) is built at build time by `scripts/build-search-index.cjs`. It indexes all articles with full OCR text from `data/new_articles.json`. If articles are added or text changes, rebuild the index with `npm run build-search`.

## Static Files

Article images, OCR text files and thumbnails are hosted on S3. Upload everything with `npm run upload-images` (checks AWS sign-in, builds missing thumbnails, syncs articles and thumbnails). CloudFront sits in front; deploys set `index.html` to `no-cache` so new builds appear immediately.

- Local article images: `public/images/articles/`. Thumbnails: `public/images/thumbs/`. Both are gitignored (`/public/images`), so images are never committed; they only reach the site through the upload script.
- Naming: `image-NNN.jpg` and `image-NNNb.jpg`, but the number doesn't tell you which is the crop. Don't assume it from the article ID. Check the article's `localCopyEdited` (the crop) and `localCopyFull` (the full page) in `data/database.js`. For example, 000's bare file is the crop, while 055–239 have the bare file as the full page.
- Thumbnails (`scripts/build-thumbnails.cjs`) are built from each article's `localCopyEdited` crop.
- Before overwriting any file in `public/images/`, compare checksums (`md5 -q`) against the file you expect and confirm with the user. Two wrong files (`image-105.jpg`, `image-128.jpg`) were byte-identical copies of other articles' images.

## Data

- `data/database.js` — all articles (IDs 000–1017, with gaps where articles were removed), with truncated OCR text (~1500 chars) for display. Optional `tags` replace the keyword-guessed topics.
- `data/new_articles.json` — the newer articles (IDs 282–1017) with full OCR text, the source of truth for search indexing
- `data/facts.js` — facts index (`id`, `fact`, `articles`), referenced by the Biography

## Article Review (done 2026-11-15)

Every article was reviewed (crop, OCR, title, summary, importance, tags, facts) and the results are merged into `data/database.js` and `data/new_articles.json`. For a new article, follow the same process:

- `review/checklist.json` — every article and its status (all `merged` or `skipped` now).
- `review/RUBRIC.md` — the instructions and record format review agents follow.
- `review/records/<id>.json` — one review record per article, including the extracted facts (not yet merged into `data/facts.js`).
- `review/ISSUES.md` — generated list of what is still flagged (`npm run review -- issues`). What's left there is accepted: whole-column clippings, a few unconfirmed paper names and dates. `review/FINDINGS.md` — cross-article findings and conflicts with the facts index. `review/MISSING-PAGES.md` — articles whose scan is missing a page, torn or cut short.

Commands (`npm run review -- …`): `status`, `prep <ids>`, `validate [ids]`, `set <status> <ids>`, `issues`, `init` (re-sync with the database, keeps statuses).

Hand transcripts are in `review/work/<id>/transcript.txt` (gitignored). Agents stop when the usage limit is hit; resume them with SendMessage rather than restarting.

## Facts Index

Facts, quotes and fights from every article, each with an excerpt checked against the text. Pipeline (instructions in `.claude/skills/index-facts/`):

1. `scripts/facts-tools.cjs prep|batches|verify` — Haiku follows `EXTRACT.md` and writes `review/facts/<id>.json`; `verify` checks every excerpt against the text.
2. `scripts/facts-names.cjs build` — joins name spellings into `review/facts-index/names.json`; decisions in `aliases.json`.
3. `scripts/facts-group.cjs index`, then `bouts` (fight entries into bouts, seeded by `bout-seeds.json`; its `ref` is the Biography's `<Fight id>`), then `buckets` → Haiku follows `GROUP.md` → `check`, `existing` (for the undated buckets), `merge`.
4. Fixes after grouping: `fact-joins.json` (same episode in two buckets), `fact-seeds.json` (pin a `data/facts.js` id to a fact), `manual-facts.json` (claims added by hand), `fact-disputes.json` (split a fact into versions that name each other in `disputed`). Re-run `merge`. In `bout-seeds.json`, `result` fixes a bout's main result; other results given stay under the fight's `disputed`.
5. `build` writes draft `facts.js`, `fights.js` and `quotes.js` to `review/facts-index/draft/`. Copy them to `data/` only after the user approves.

For a new article: `prep` and extract it, then re-run steps 2–5 (add its claims to a fact with `manual-facts.json` or a join rather than re-grouping everything).

## Clippings

Clippings are cut from the full page with the `crop-clipping` skill (`.claude/skills/crop-clipping/`): `SKILL.md` for the agent cutting, `REVIEW.md` for the reviewer, `BATCH.md` for batches. Tools: `scripts/cut-clipping.cjs` (snaps to column rules, follows tilt, stacks columns) and `scripts/clip-tools.cjs` (`todo`, `locate`, `view`, `page`, `tiles`, `pages`). Re-cut clippings are installed as `public/images/articles/image-<id>c.jpg` with `localCopyEdited` pointing at them; `npm run upload-images` syncs them to S3. The re-cut of all cut-off clippings finished on 2026-11-15 (only 769, a torn scan, is left).

## Working in this environment

- **Browser downloads:** newspapers.com pages are downloaded through Claude in Chrome, using the user's logged-in session. Each download needs explicit user approval first, with the filename shown. The "Print or Download" panel has "Entire Page" (JPG). Downloads land in `~/Downloads`; move them into `review/work/<id>/` (gitignored) right away.
- **Finding a page:** search `https://www.newspapers.com/search/results/?keyword=%22Tom+Allen%22&p_newspaper_title=<title>&date-start=YYYY-MM-DD&date-end=YYYY-MM-DD&region=us-mo` (drop the title filter for smaller papers). Open the result with `find` plus a click on its ref. Use the page's own "Find text on this page" box to locate matches.
- **Cropping:** crop from the full-resolution page with `sharp` (`extract`). Check each crop by reading it back before saving, and extend it until the item's last line (usually the start of the next item is the stopping point).
- **Commits and pushes:** the user has to ask for each push. A push to `main` deploys the site. Stage specific paths only; never commit `open_api_key.sh`, `eng.traineddata`, `new-articles/` or `.output.txt`.
- **Editing published data:** don't change `data/database.js` or `data/facts.js` as part of review work. The review records are proposals until the user approves a merge.
- **Subagents:** use them for read-only work (checking, cropping, writing review records). Downloads from newspapers.com stay in the main session so each one can get its own approval.
