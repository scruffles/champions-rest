# Review findings

Cross-article findings to resolve when merging records into the data. Per-article follow-ups (new screenshots, re-crops, transcription) are in `ISSUES.md`, generated with `npm run review -- issues`.

## Data decisions

- **Paper names**: file articles under the paper's name at the time. About 350 articles carry a later name: Globe-Democrat before May 1875 (150, really the Daily Missouri Democrat), Post-Dispatch before Dec 1878 (65), St. Louis Republic before 1888 (138, really the Missouri Republican). Rename in bulk by date at merge; reviewers confirm edge cases.
- **Fight record**: the 1869-08-17 Gallagher fight is a "win" in `data/fights.js`, but the headline reads "Allen the Winner, but the Fight Decided a Draw" (352, checked by hand).
- **Fight record**: the 1876 Goss fight: Goss won on a foul in round 21 (579); current title is wrong.

## Conflicts with `data/facts.js`

- 001 birth 1839: 148 and 352 imply 1840.
- 003 Crimean War: in 488 Allen says he served under Havelock in the Indian Mutiny.
- 006 cites 203 for "1979": the image says 1869.
- 040: 1000 calls him a widower of thirty years.
- 046 will: 203 says he made no will.
- Saloon address: 619 Market St (919) vs 615 (203).
- Family: "Harry Allen, a brother of Tom's" (148); 203 mentions a brother.

## Facts index cleanup

- Some entries have id `000` or no id, so new facts cannot link to them.

## Noted during the full run

- 174 and 175 give different arrival dates for Denver Ed Smith (facts dated to the month only).
- 106: the OCR says Brooks was knocked out; the image says Egan. 109: the OCR says "None" of the principals were arrested; the image says "Both". Fix the transcripts.
- 119: the current title and summary credit Tom Kelly's opinions to Allen.
- 133: "Tom Allen, the big middleweight" in a New York ear exhibit is probably a different boxer.
- 192: filed 1901-03-04 (a Monday) but the item says the case was dropped "Tuesday morning"; the date may be off (no page image to check).
- 185: the masthead date is 1899-03-03; check against the filed date.
- 186/187: the titles look swapped, and 187's date (1899-05-04) is probably about 1899-02-28 to 03-01, after the coroner's verdict.
- Burial: 208 says Calvary Cemetery, 209 says Bellefontaine.
- 210: its image paths point at image-261 files; the images may be swapped between 210 and 261.
- 201: the transcript gives the bride's age as 33; the clipped image suggests 21.
- 202: the address is 3427 Clark (the OCR says 2427).
- 237: no images or text; probably a duplicate of 236.
