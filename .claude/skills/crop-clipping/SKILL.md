---
name: crop-clipping
description: Re-cut a newspaper clipping for a Champions Rest article from its full-page scan, as one single-column image. Use when asked to crop, re-crop or cut clippings for article ids.
---

# Cutting a clipping from a full page

Goal: for each article id, one image containing the whole printed article about Tom Allen and nothing else, as a single scrolling column. Multi-column or multi-page articles are stacked in reading order.

You do this with two scripts. You never crop by eye with your own image code; you give rough coordinates and the scripts snap to the printed column rules and blank rows.

All paths are relative to the repo root. Work one article at a time. Output goes in `review/work/<id>/` only.

## Rules

- Do not edit `data/`, `public/`, `review/checklist.json` or anything outside `review/work/<id>/`. Do not use git.
- Read as few images as possible: the `locate`/`view` picture, then the cut preview. Do not Read full pages (`image-NNNb.jpg`) or whole tall clippings directly; they are too large to read usefully.
- Coordinates are always full-resolution page pixels. The grid labels in `locate`/`view` pictures (`x3400`, `y5200`) are already in those units.

## Steps

### 1. Locate

```
node --no-warnings scripts/clip-tools.cjs locate <id>
```

Prints the page file, the `candidateBox` `[x0,y0,x1,y1]` (where an earlier pass thought the article was, drawn in green), a `score`, and writes `review/work/<id>/locate.jpg`. Read that picture.

- If `trusted` is false, or the green box is plainly not on an item about Tom Allen (the boxer; also "Allen", "the champion"), the location is wrong. Run `node --no-warnings scripts/clip-tools.cjs page <page> review/work/<id>/page-grid.jpg`, read it, find the article using the title and `review/work/<id>/article.json` (`title`, `summary`, `text`), then `view` that area.
- To look at any other area (further down the column, the next column, the top of the page):
  `node --no-warnings scripts/clip-tools.cjs view <page> <x0,y0,x1,y1> review/work/<id>/view-N.jpg`

### 2. Decide the article's extent

The candidate box is only a hint, even when `trusted` is true. It is often too short, too long, or starts mid-article (a high score only means the old crop was found on the page, not that the old crop was right). Always find the headline yourself and look above and below the box. The `locate` picture covers only about 900px below the box, so expect to need one or two `view` calls to find the article's end. Work out:

- **Start:** the article's own headline (or its first line if it has none). If the box starts mid-sentence, the article began higher up, at the bottom of the previous column, or on an earlier page.
- **End:** the last line before the next item. The next item usually shows as a short centred rule, a new headline, or a dateline. If the text runs to the bottom of the column, it continues at the top of the next column to the right; `view` that to find where it ends.
- **Scope:** if the Allen item is one paragraph or one headed section inside a column of unrelated short items (e.g. "Amusements", "Sporting Notes", "Local Brevities"), cut just that item with its own small heading. If the whole article is about the fight/Allen, cut the whole article including all its sub-headed sections.
- Sides: each segment's x0/x1 should be near the vertical rules either side of the column. Within about 50px is enough.

### 3. Cut

One segment per column piece, in reading order:

```
node scripts/cut-clipping.cjs review/work/<id>/clip.jpg <page>:x0,y0,x1,y1 [<page>:x0,y0,x1,y1 ...] --ytol=30 --preview=review/work/<id>/clip-preview.jpg
```

- `y0` goes in the blank gap just above the first line; `y1` in the blank gap just below the last line. The script snaps each to the nearest blank row band within `--ytol` pixels (default 60; use 12–30 when a rule or another item is close).
- When a rule or the previous item's last line sits close to the headline, pick y0/y1 precisely from a `view` and use `--ytol=10` to `--ytol=20`.
- The printed log line per segment gives the final `top`/`bottom` (page y pixels) and what each edge snapped to. Sides: `rule` = a printed column rule was followed (good); `from R - N` / `from L + N` = no rule on that side, so it was placed one column width N from the ruled side (fine if the width matches the other segments); `gutter` or `flat` = blank space rather than a rule (normal at a page margin; check the preview). `… parallel to R -N` / `… parallel to L +N` = that side had no usable rule (or its track disagreed with the other side's tilt), so it was found N pixels from the other side, following that side's tilt; this is normal on tilted scans and at page margins, but check that side in the preview. Top/bottom: `gapN` = snapped into a blank band N pixels tall; `none` = no blank band found near that y, so the edge is exactly where you put it and may cut through a line. A width very different from the other segments (columns on one page are equal width) means a side snapped to the wrong thing: move that x by 20–40px and re-run.
- Blank paper at the top and bottom of each segment is trimmed automatically to a small margin (`trimN` in the log), and so are horizontal rules there (`rule removed`): the divider above a headline or below the last line, and the page-top rule and margin at a column join. So a y0/y1 a little outside the text is safe; you do not need `--trim=0` for a short last line. If the log shows a `trim` much larger than the gap you expected (more than about 150px), check that end in the preview: a headline or last line may have been taken for a rule. `--trim=0` turns all trimming off.
- On a tilted scan, cut a whole column as ONE segment; do not split it into pieces to chase the drift.
- Read `clip-preview.jpg`. It shows, for each segment, its top 480px and bottom 480px side by side with red bars between.

### 4. Check the preview and fix

Check every item, then adjust coordinates and re-run until all hold (at most about 4 tries; then report it as not done):

1. No first letters clipped on the left, no last letters or hyphens clipped on the right.
2. No strip of the neighbouring column, and no vertical rule, down either side.
3. First tile starts at the article's headline/first line, with no line of the previous item and no stray horizontal rule above it.
4. Last tile ends at the article's last line, with no divider rule or next headline below it. If the last sentence is unfinished, the end is too early: raise y1.
5. At each join between segments the sentence reads on, with nothing repeated, nothing missing, and no page-top rule or running head in between.

### 5. Same article held under several ids

Run `node --no-warnings scripts/clip-tools.cjs pages <id>`. If another id on the same page (`sharesPage: true`), or a same-date entry in the same paper, is a different part of this same printed article (it starts "Continued from…", or one ends mid-sentence where the other begins, or one is a section of the other), then the two must become one article. Cut one clipping covering the whole article and record it under the lowest id; say so in the record. If another id already has a clipping that covers this whole article, do not cut: record `duplicate_of`.

Separate items on the same page (a different headline, a different topic) stay separate. `sharesPage: true` only means the two ids use the same page scan; it is not evidence they are the same article. Compare their `review/work/<id>/article.json` text to decide.

### 6. Record

Write `review/work/<id>/clip.json`:

```json
{
  "id": "478",
  "status": "done",
  "clip": "review/work/478/clip.jpg",
  "segments": ["public/images/articles/image-478b.jpg:3970,5490,4745,5960"],
  "starts": "Theatre Comique.",
  "ends": "They will appear again to-night.",
  "merge_with": [],
  "duplicate_of": null,
  "notes": ""
}
```

`status` is `done`, `duplicate`, or `not_done` (say why in `notes`: page missing, article not on this page, could not get a clean edge). `starts` is the headline plus the first few words; `ends` is the last few words as printed. `merge_with` lists other ids that are parts of this same article and are covered by this clipping.

### 7. Tiles

After a successful cut: `rm -rf review/work/<id>/tiles && node scripts/clip-tools.cjs tiles review/work/<id>/clip.jpg review/work/<id>/tiles`. Do not read the tiles; they are for the reviewer (see `REVIEW.md` beside this file).

## Final report

For each id: status, the clip path, starts/ends, any merge or duplicate finding, and anything you were unsure of. Do not claim a check you did not look at.
