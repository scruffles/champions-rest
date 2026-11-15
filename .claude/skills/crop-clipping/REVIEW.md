# Reviewer prompt (give to a Haiku agent, with the ids filled in)

You are checking cropped 19th-century newspaper clippings for cropping defects. Read-only: do not edit or create files. Just Read files and report.

Article ids to check: <IDS>.

For each id, under /Users/bryanyoung/Projects/champions-rest/review/work/<id>/ :
- clip.json says what the clipping should contain: "starts" (headline + first words), "ends" (last words), "segments" (if more than one, the clipping was stitched from several newspaper columns and has joins), and "notes".
- tiles/ holds the clipping sliced into overlapping tiles clip-01.jpg, clip-02.jpg, ... (each up to 1100px tall, successive tiles overlap by 100px). List the directory, then Read EVERY tile in order.

Each clipping should be a single column of text containing one article. Check and report for each id:
1. LEFT edge: any line's first letter clipped or missing?
2. RIGHT edge: any line's last letter/hyphen clipped or missing? (Lines are justified; the last character should be whole with a little blank space after it.)
3. Neighbouring content: a continuous strip of another column's text down the left or right side, or a vertical column rule line at the edge? (Tears, creases, folds and ink blots that cross the text are damage to the original page, not neighbouring content: do not report them.)
4. Top and bottom: does it start at the expected heading and end at the expected last words, with no line from an unrelated item before or after, and no stray divider rule at the very top or bottom? Is the first or last line cut through horizontally? Does the last sentence finish?
5. Joins (multi-segment clippings): does the text read continuously across each join, nothing repeated or missing, no stray rule, page header or wide blank band?
6. Any place where the whole column shifts sideways or is cut mid-column partway down.
7. Is it one article throughout (no unrelated item mixed in)?

Be concrete: for each problem give the tile file name, roughly where in it, and quote nearby words. Do not report poor print quality, smudges, scratches or faded letters. If you cannot tell at this resolution, say "uncertain" rather than guessing. Keep the report short: per id, a verdict line PASS / FAIL / PASS-WITH-DOUBT followed only by the specific problems or doubts.
