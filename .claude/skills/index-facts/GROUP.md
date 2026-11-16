# Grouping claims into facts

Many newspaper articles report the same thing about Tom Allen (boxer, 1839–1903, later a St. Louis saloon keeper). Each article's statements were extracted as separate **claims**. Your job is to group claims that state **the same fact** so that each fact lists all its sources.

## Input and output

- Input: `review/facts-index/group/in/<bucket>.json`: `{bucket, kind, undated, claims: [{cid, date, published, retro, conf, statement}]}`. `date` is when the event happened ("" if unknown), `published` is the paper's date, `retro: true` means told years later, `conf` is only present when medium or low.
- Seeds: `review/facts-index/group/seeds.json`: facts already cited on the website, `{id, fact}`.
- For an undated bucket only: `review/facts-index/group/existing/<kind>.json` lists facts already made from dated claims of the same kind, `{key, date, fact}`.
- Output: write `review/facts-index/group/out/<bucket>.json` (format below). Do not edit other files.
- After all your buckets: run `node scripts/facts-group.cjs check <your buckets>` and fix every problem until all say ok.

## Rules

1. **Every claim goes in exactly one fact.** A claim that matches nothing else becomes a fact on its own. Never drop a claim.
2. **Same fact = same event or same state of affairs**, at the same time: the same challenge, the same arrest, the same benefit night, the same trip, his saloon being at the same address in the same period. Claims about the same topic but different events are different facts (two separate arrests in 1884 and 1888; a challenge in March and a new one in October).
3. **One fact per episode.** All the steps and details of one episode belong together: an arrest, the bail, the hearing and the release in the same case are one fact; a funeral, its pallbearers and the procession are one fact; a benefit, who sparred at it and the takings are one fact. Write the fact sentence as a short summary of the episode (one or two sentences). Split only when the episodes are different (two separate arrests; a challenge in March and a new one in October), or when one group would mix unrelated things just because they share a topic. A fact with more than about 20 claims is usually two episodes.
4. **Contradictions stay together and are written down.** If claims are about the same event but disagree (a date, a number, an address, a name, an outcome), put them in one fact and describe the disagreement in `conflict`, naming the claims, e.g. `"burial: Calvary (204.c3) vs Bellefontaine (262.c5)"`. Otherwise `conflict` is `""`.
5. `fact`: one plain sentence stating what the sources agree on (names, not "he"). When they conflict, state the common part ("Tom Allen was buried in St. Louis.") and leave the disputed detail to `conflict`. Use no information that is not in the claims.
6. `date`: the event date the claims support (`YYYY-MM-DD`, `YYYY-MM`, `YYYY`, or `""`). If they differ, use the date most claims give and mention the difference in `conflict`.
7. `seed`: if the fact is the same as one of the seeds, give the seed's `id` (e.g. `"017"`); otherwise `""`. Only use a seed when the fact really says the same thing; several of your facts may share one seed if the seed is broad (e.g. "Allen seconds and manages other boxers").
8. **Undated buckets:** if a claim belongs with one of the existing facts, put it in a fact with `"join": "<key>"` (the existing fact's key) and copy that fact's text; don't make a new fact for it. Use join only when it is clearly the same fact.
9. Medium or low confidence claims (rumours, garbled readings) still go in a fact; if a rumour contradicts the fact, note it in `conflict`.

## Output format

```json
{
  "bucket": "legal-1884-1896",
  "facts": [
    {
      "fact": "Tom Allen was fined $25 in the Court of Criminal Correction for a fight with Dan Daly in June 1888.",
      "date": "1888-06",
      "seed": "029",
      "conflict": "fine: $25 (612.c2) vs $50 (615.c1)",
      "claims": ["612.c2", "613.c1", "615.c1"]
    }
  ]
}
```

Order facts by date. Write valid JSON (escape `"` inside strings as `\"`).
