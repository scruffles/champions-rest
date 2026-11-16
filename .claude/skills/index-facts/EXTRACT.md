# Extracting facts, quotes and fights from one article

You read one newspaper article about Tom Allen (English-born prize fighter, 1839–1903, heavyweight champion, later a St. Louis saloon keeper) and write down what it says about him, with proof copied from the text.

## Input and output

- Input: `review/work/facts/in/<id>.json` with `id`, `publication`, `published` (the paper's date), `title`, `text` (the article; OCR, may contain errors and unrelated items from the same page), and `hints` (claims an earlier, less careful pass found; they may be wrong or incomplete).
- Output: write `review/facts/<id>.json` (format below). Do not read or edit any other files.
- Do all your articles first. Then run `node --no-warnings scripts/facts-tools.cjs verify <all your ids>` once and fix every problem it reports; run it again until every id says ok.

## What to extract

Only things about **Tom Allen the boxer**. Ignore everything else in the text (other fights he had no part in, ads, other news) unless Allen is part of it. If Allen takes part in any way, record it, even when the article is mainly about someone else: he fought or sparred (including as "the opponent" in another man's benefit or record), refereed, seconded or backed someone, gave an opinion or quote, owned something mentioned (saloon, property, his hat), or something happened at his saloon. Only write empty lists (and say why in `notes`) when Allen does nothing in the text at all, or the text is unreadable.

### 1. `claims`: the facts

One claim per separate fact. Include: birth, family, marriages, deaths; each fight (opponent, date, place, result, rounds, stakes); challenges and matches made, broken or forfeited; exhibitions, benefits and sparring tours; travel and where he lived (with places); saloons, addresses and businesses; arrests, trials, lawsuits, fines; illness and injury; career summaries. Skip minor detail: crowd descriptions, round-by-round action, who held the stakes or timed the fight (unless a notable person), train and boat arrangements, gate money. Most articles have 1–6 claims; a long life story can have 20 or more.

Fields:
- `kind`: one of `birth`, `family`, `death`, `health`, `residence`, `travel`, `career`, `fight`, `challenge`, `exhibition`, `saloon`, `business`, `legal`, `other`. Decide in this order: police, arrest, shooting, inquest, court, bail, fine, warrant → `legal`; a contest he fought (or a match that was made and then forfeited or stopped) → `fight`; a challenge, offer or proposed match → `challenge`; sparring shows, benefits, tours → `exhibition`; seconding, backing or refereeing another man's fight → `other`; anything happening at or about his saloon that is not legal → `saloon`; other businesses → `business`; birth, nationality, age → `birth`; wife, children, brothers, sisters, marriage → `family`; illness, injury → `health`; where he lived → `residence`; journeys → `travel`; titles, retirement, career summaries → `career`.
- `statement`: one plain sentence, self-contained (use names, not "he"), saying only what the text says. Example: "Tom Allen beat Bill Davis in 43 rounds at Rhodes' Point."
- `excerpt`: the words in the text that prove it, **copied exactly, character for character, as one unbroken passage** (8–40 words). Copy OCR errors as they are; do not correct spelling, do not join two separate passages, do not add "...". If the proof is spread over a long passage, pick the most direct sentence.
- `date`: when the event happened (not the paper's date): `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, or `""` if unknown. Work out relative dates from `published`: "yesterday" in a paper dated 1869-07-09 is 1869-07-08; "last Saturday" is the Saturday before. For a forthcoming event, give its planned date.
- `date_precision`: `day`, `month`, `year`, `approx` (worked out roughly, e.g. "about 1860", or "recently"), or `unknown`.
- `people`: other people named in the claim, full names (e.g. `["Mike McCoole"]`). `places`: places named, as precise as the text allows (e.g. `["Rhodes' Point, Missouri"]`). In these name fields (and a fight's `opponent`), fix obvious OCR damage, e.g. "Beb Smiths" → "Bob Smith", "George Lies" → "George Iles"; keep the spelling the paper used otherwise ("McCool" stays "McCool"). Only the `excerpt` must stay exactly as printed. If a name is not given or cannot be read, write `"unknown"`; never invent one.
- `retrospective`: `true` if the article looks back on something from more than a year before it was printed (recollections, life stories, obituaries); otherwise `false`.
- `confidence`: `high` (stated plainly as fact), `medium` (rumour, plans, "it is said", one side's claim), `low` (garbled text or an uncertain reading).
- Never guess. If a value (a number, a name, a day) is read from garbled OCR, use `confidence: low` and say "printed as ..." in the statement. Do not invent a day, time or number the text does not give; use a coarser date or `""` instead.
- The excerpt must contain the key words of the statement (the names, numbers or event it states), not just a nearby sentence.

### 2. `quotes`: memorable words

Things Tom Allen said or wrote that show his character, opinions or story, and striking things others said about him. Only direct speech or writing (his own words, usually inside quotation marks or a signed letter), never the paper's paraphrase ("Allen says that..."). Skip routine lines ("I will be there Monday"). Usually 0–3 per article.

Fields: `speaker` (e.g. "Tom Allen", "Fred Watkins"), `text` (the quote **copied exactly** from the text, 1–3 sentences, without the surrounding quotation marks), `topic` (a few words, e.g. "on gloves versus bare knuckles").

### 3. `fights`: his fight record

Every contest Tom Allen fought or was matched for (prize fights, glove contests for a decision, matches that ended in a forfeit or were stopped). Not sparring exhibitions (those are `exhibition` claims). One entry per bout mentioned. If the article prints a list of his fights, make one entry per line of the list.

Fields: `opponent`, `date` and `date_precision` (as above), `place`, `result` from Allen's side (`win`, `loss`, `draw`, `no contest`, `forfeit`, `unknown`; write a forfeit by either side as `forfeit` and say who in `notes`), `rounds`, `duration`, `stakes`, `rules` (e.g. "London Prize Ring", "gloves"), each `""` if not given; `excerpt` (copied exactly, as for claims); `reported_as`: `report` (an account written at the time), `recollection` (told years later), or `record` (a list of results); `notes` (anything odd, such as a disputed result).

Every entry in `fights` must also have its own `fight` claim in `claims`. List a bout even when the opponent's name cannot be read (`"opponent": "unknown"`). A match that was only proposed or challenged, and never agreed, is a `challenge` claim, not a fight.

## Before you write the file: checklist

Go through the text once more and make sure you have a claim for each of these that the article mentions about Allen: his birth, birthplace or nationality; his age; family members; every fight or bout, including ones mentioned only in passing ("his fights with Mace and Gallagher") and ones with an unreadable opponent; challenges and matches; arrests, being held, bail, charges, court, inquests, fines; injuries and illness; his saloon (address, events there); titles he held or claimed ("champion of the world"); retirement; death and burial; his property or will.

## Using the hints

Check each hint against the text. Keep it (as a claim, with an excerpt) only if the text supports it; correct it if the text says something different; drop it if the text does not say it. Then look for anything the hints missed. The text is the only authority.

## Output format

```json
{
  "id": "017",
  "claims": [
    {
      "kind": "challenge",
      "statement": "Tom Allen deposited $200 with Mr. Carroll and challenged Charley Gallagher to cover it for a match.",
      "excerpt": "I wish to inform Mr. C. Gallagher that I have deposited two hundred dollars with Mr. Carroll for a match with any man",
      "date": "1869-07-08",
      "date_precision": "day",
      "people": ["Charley Gallagher", "Carroll"],
      "places": ["St. Louis"],
      "retrospective": false,
      "confidence": "high"
    }
  ],
  "quotes": [
    {
      "speaker": "Tom Allen",
      "text": "if he (Gallagher) wants a match let him cover that amount, and I will meet him at any place he may name to draw up articles.",
      "topic": "challenge to Gallagher"
    }
  ],
  "fights": [],
  "notes": ""
}
```

Write valid JSON (double quotes; escape any `"` inside a string as `\"`). Keep `notes` short.
