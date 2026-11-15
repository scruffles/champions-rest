# Running the clipping batches (for the coordinating session)

The coordinating session does as little as possible itself: it launches agents and reads their short reports. It does not read images unless settling a FAIL.

1. `node --no-warnings scripts/clip-tools.cjs todo` lists what is left (`todo`), what is cut and waiting (`cut`), and `not_done`.
2. Take the next 10 `todo` ids. Launch two Sonnet general-purpose agents in parallel, five ids each, with this prompt:

   > Work in /Users/bryanyoung/Projects/champions-rest. Read .claude/skills/crop-clipping/SKILL.md and follow it exactly. Cut clippings for these article ids, one at a time: <IDS>. Only write inside review/work/<id>/; do not edit data/, public/ or the checklist; no git. Give up on an id after about 4 cut attempts and record it as not_done. Build tiles after each successful cut (step 7). Final message: one line per id with status, clip size, starts/ends, cut attempts, and any merge/duplicate finding or doubt. Nothing else.

3. When both report, launch Haiku general-purpose agents with the prompt in `REVIEW.md` (about 30 tiles per agent; a clipping has roughly height/1000 tiles).
4. Record each id's review verdict in its `clip.json` (`"review": "pass" | "doubt: …" | "fail: …"`). Do not fix failures during the run; list them for a second pass at the end.
5. Repeat. Report to the user after every 20 ids: counts of pass / doubt / fail / not_done / merge findings, nothing more.

Known reviewer false alarm: page damage (tears, creases) crossing the text gets reported as a neighbouring column. Check the page with `clip-tools.cjs view` before treating it as a failure.

Not part of the batch run (do these only when the user asks): installing clippings into `public/images/articles/image-<id>c.jpg`, pointing `localCopyEdited` at them, merging ids, rebuilding thumbnails. Merges follow the rule in memory (`merge-split-articles`): one article, all full pages listed, one long clipping, lowest id kept.
