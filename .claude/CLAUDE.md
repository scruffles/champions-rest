# Champions Rest

## Changelog

When committing and pushing changes, always update `CHANGELOG.md`:

- Add a dated entry under the most recent date header (or create a new one if the date changed) describing what was added, changed, or fixed
- Keep entries concise — one line per change
- If a backlog item was completed, remove it from the Backlog section

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

## Article Review (in progress)

Every article is being reviewed (crop, OCR, title, summary, importance, tags) and its facts extracted. It is designed to stop and resume:

- `review/checklist.json` — every article and its status (`pending` → `assigned` → `reviewed` → `approved` → `merged`, or `skipped`). Committed to git; this is the restart point.
- `review/RUBRIC.md` — the instructions and record format review agents follow.
- `review/records/<id>.json` — one review record per article. Committed.
- `review/work/` — generated image pieces and inputs (gitignored; rebuild with `prep`).

- `review/ISSUES.md` — generated list of articles to revisit on newspapers.com (new screenshots, re-crops, transcription). `review/FINDINGS.md` — hand-kept cross-article findings and conflicts with the facts index.

Commands (`npm run review -- …`): `status`, `next [n]`, `assigned`, `prep <ids>` or `prep --next n`, `validate [ids]`, `set <status> <ids>`, `issues`, `init` (re-sync with the database, keeps statuses).

To resume: run `status`; first finish any `assigned` ids (prepped but never reviewed; re-run `prep` on them if `review/work/` is gone), then `prep --next 40` for a batch, give each review agent the rubric plus its ids (about 5 per agent; never more than 10), then `validate` and `issues`. Records are only proposals; merge approved changes into the data files separately.

Review status (as of 2026-11-06): all 1,010 articles have records (1,009 valid; 055 is skipped, no source image). Per-article follow-ups are in `review/ISSUES.md`; cross-article conflicts are in `review/FINDINGS.md`. The next steps are in the CHANGELOG backlog under "Article review follow-up", in order: point the database at source images, re-review, settle facts, merge, consolidate.

Source images for the review come from newspapers.com (see below). Review agents are general-purpose subagents; each gets `review/work/facts-index.txt`, the rubric, and its article IDs. Agents stop when the usage limit is hit; resume them with SendMessage rather than restarting.

## Working in this environment

- **Browser downloads:** newspapers.com pages are downloaded through Claude in Chrome, using the user's logged-in session. Each download needs explicit user approval first, with the filename shown. The "Print or Download" panel has "Entire Page" (JPG). Downloads land in `~/Downloads`; move them into `review/work/<id>/` (gitignored) right away.
- **Finding a page:** search `https://www.newspapers.com/search/results/?keyword=%22Tom+Allen%22&p_newspaper_title=<title>&date-start=YYYY-MM-DD&date-end=YYYY-MM-DD&region=us-mo` (drop the title filter for smaller papers). Open the result with `find` plus a click on its ref. Use the page's own "Find text on this page" box to locate matches.
- **Cropping:** crop from the full-resolution page with `sharp` (`extract`). Check each crop by reading it back before saving, and extend it until the item's last line (usually the start of the next item is the stopping point).
- **Commits and pushes:** the user has to ask for each push. A push to `main` deploys the site. Stage specific paths only; never commit `open_api_key.sh`, `eng.traineddata`, `new-articles/` or `.output.txt`.
- **Editing published data:** don't change `data/database.js` or `data/facts.js` as part of review work. The review records are proposals until the user approves a merge.
- **Subagents:** use them for read-only work (checking, cropping, writing review records). Downloads from newspapers.com stay in the main session so each one can get its own approval.
