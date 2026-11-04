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
