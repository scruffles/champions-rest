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
