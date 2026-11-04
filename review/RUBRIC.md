# Article review rubric

Each article in `data/database.js` gets one review record, `review/records/<id>.json`.
Reviews never change the site data directly; approved changes are merged later.

## Inputs (from `npm run review -- prep`)

`review/work/<id>/`:
- `article.json` — the current metadata and transcript
- `crop-1.jpg`, `crop-2.jpg`, … — the single-column clipping, split into readable pieces (top to bottom)
- `page.jpg` — the full newspaper page, scaled down, to check the crop and the masthead date/paper

`review/work/facts-index.txt` — existing facts (`id: fact`), to link new facts to.

Look at **every** crop piece and the page before writing the record.

## What to check

1. **Crop** — does the clipping contain the whole article about Tom Allen?
   - `ok` — the whole article, nothing important cut off
   - `cut_off` — headline, top, bottom or a side is missing (say what)
   - `wrong_article` — the clipping is a different story than the one about Allen on the page
   - `mixed` — several unrelated items; say which part is about Allen
   - `no_crop` — the clipping is really the full page or is missing
2. **OCR** — compare `article.json` text with the image.
   - `good` — readable, mostly right
   - `rough` — gist is there, many errors
   - `unusable` — mostly garbage or a different article
   - `missing` — no transcript
3. **About Tom Allen** — `yes` (the boxer), `no` (another person, a horse, nothing), or `unsure`.
4. **Title** — short, factual, in the site's plain style. Suggest a replacement only if the current one is wrong or misleading.
5. **Summary** — plain sentences in the house style: "The Daily Missouri Democrat reported that …". Name the paper as it was called on that date (see 8). No opinions. Rewrite freely when it improves accuracy or clarity, but **keep it to about 30 words (150–240 characters), never over 300** — the current summaries average 185 characters. One or two sentences: the main event and the single most important detail. Leave the rest to the facts.
6. **Importance (`focus`)** — `primary` (the article or item is about him), `secondary` (he plays a real part), `passing` (a brief mention).
7. **Tags** — one or more of: `Fights`, `Challenges`, `Exhibitions`, `Saloon`, `Legal`, `Personal life`, `Profiles`, `Legacy`. Use `Legacy` for retrospectives written after his death (1903).
8. **Date and paper** — check against the page masthead when visible. Articles are filed under the paper's **name at the time**, not a later name. Set `publication_ok: false` and give the correct name in `metadata.publication` when it differs:
   - before 1875-05: *Daily Missouri Democrat* (or *St. Louis Daily Times*, *Missouri Republican*, etc. as printed); the *St. Louis Globe-Democrat* only from the 1875 merger
   - the *St. Louis Post-Dispatch* only from 1878-12; earlier "Dispatch" items are the *St. Louis Evening Dispatch*
   - the *Missouri Republican* until 1888, then the *St. Louis Republic*
   - otherwise use the masthead as printed
9. **Facts** — the larger, citable facts about Tom Allen's life, one fact per claim:
   - **include:** birth, family, marriages and deaths; each fight (opponent, date, place, result, rounds, stakes); challenges and matches made or broken; exhibitions and tours; saloons and addresses; arrests, trials and lawsuits; illness and injury; his own quotes
   - **include travel between cities or countries** (arrivals, departures, tours, where he fought or lived) with the places named, for a future map
   - **skip:** minor detail such as local riverboat or train arrangements, gate money, who held the stakes, seconds and timekeepers (unless notable people), crowd descriptions, round-by-round action
   - aim for the handful of facts that would belong in a biography or fight record; most articles have fewer than 6
   - skip general boxing news that doesn't involve him
   - **don't** look for other Allen items elsewhere on the page outside the clipping

Be honest about uncertainty. If the image is unreadable, say so and set `needs_human: true`.

## Record format

```json
{
  "id": "308",
  "reviewed": "2026-11-04",
  "crop": { "status": "ok", "notes": "" },
  "ocr": { "status": "rough", "notes": "names mostly readable" },
  "about_tom": "yes",
  "title": { "ok": true, "suggested": "" },
  "summary": { "ok": false, "suggested": "The Daily Missouri Democrat reported that …" },
  "focus": { "current": "primary", "suggested": "primary" },
  "tags": ["Fights", "Challenges"],
  "metadata": { "date_ok": true, "publication_ok": false, "publication": "Daily Missouri Democrat", "notes": "" },
  "facts": [
    {
      "fact": "Allen challenged Charley Gallagher to a rematch for $1,000 a side",
      "date": "1869-02-23",
      "people": ["Charley Gallagher"],
      "places": ["Campbell's saloon, Fifth and Green, St. Louis"],
      "quote": "",
      "kind": "challenge",
      "confidence": "high",
      "existing_fact": ""
    }
  ],
  "needs_human": false,
  "notes": ""
}
```

- `facts[].date`: `YYYY-MM-DD`, `YYYY-MM` or `YYYY`; the date of the event, not the paper (blank if unknown).
- `facts[].kind`: `birth`, `fight`, `challenge`, `exhibition`, `saloon`, `legal`, `family`, `travel`, `health`, `death`, `quote`, `other`.
- `facts[].confidence`: `high` (stated plainly), `medium` (OCR unclear or secondhand), `low` (rumor, or the paper contradicts itself).
- `facts[].existing_fact`: the id from `facts-index.txt` if this is the same fact, otherwise blank.
- `facts[].quote`: Allen's own words, verbatim from the image, when the fact is a quote.
