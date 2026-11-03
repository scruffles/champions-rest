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

Article images and OCR text files are hosted on S3 (`s3://champions-rest.com/images/articles/`). Upload with:

```
aws s3 sync ~/projects/claude-ancestry/staging/images/articles/ s3://champions-rest.com/images/articles/
```

## Data

- `data/database.js` — all 1,017 articles with truncated OCR text (~1500 chars) for display
- `data/new_articles.json` — 736 new articles (IDs 282–1017) with full OCR text, the source of truth for search indexing
