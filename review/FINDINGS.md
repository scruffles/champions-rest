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
- Birth year: 266 (a book) gives April 1840, against 1839 in fact 001 (the third source for 1840, with 148 and 352).
- 265: the publication field holds the author's name. 268 is really The Wilkes-Barre Record (1882-12-01), not The Times Leader.
- 255: the crop is the whole of page 13A and the OCR is a baseball story; needs a new crop and transcript.
- 297 and 298 are the bottom and top halves of the same Missouri Republican article; consider merging.
- 303 and 304 are two parts of the same 1869-01-13 Daily Missouri Democrat fight report; neither has rounds 1–24.
- Birth year: 304 prints 1841 (against 1839 in fact 001).
- 328 duplicates 329 (same editorial; 329 is complete, 328 is cut off on the right).
- Birth year: 354 also gives 1840.
- 348 and 349 are the same article from the Sunday and Monday editions (348 lacks the headline).
- 021 belt presentation: 395 and 397 put it on Saturday 1870-04-30, not April 29.
- 394: probably ran 1870-04-24 ("to-morrow night" for the April 25 Mozart Hall exhibition); its current title and summary describe 393.
- 403 repeats 402 (reprinted the next day). 398: the masthead date is 1870-05-10, not May 9.
- 408 is a reprint of 407. 405: the date is probably 1870-05-22 (Sunday supplement masthead).
- 428 is probably a duplicate of 427 (same text; masthead date 1870-11-08, filed as 11-09).
- 438: the backing amount reads $2,000 in a faint image, not the $200 in the current summary.
- Paper name: 1873 pages read "St. Louis Democrat" (not "Daily Missouri Democrat"); reviewers follow the masthead, so expect both names before 1875. Normalize at merge.
- 481 and 483 are the same concert hall notice; 481's current title and summary describe 482.
- 518 duplicates 517 (worse crop; 517 was re-cropped by hand). 511: the current title/summary describe the Free and Easy notice in column 2, not the clipped "Prize Ring" item.
- Mace match 1875: 527/528 say the match was made in Chicago (Nov 17–18, 1875); 530 (Dec 26) says no definite match exists.
- 006 arrival in America: 543 gives 1868. 543's title is wrong (the article is about Coburn and Bauer).
- 549 duplicates 548 (same 1876-05-01 page, worse crop). 521: the fight date is printed "July 17" but was June 17, 1875.
- 015 Halifax sailing: 597 dates it 1877-05-12, not May 6. 606 is the St. Louis Evening Post (pre-merger), not the Post-Dispatch.
- 609: the clipping is the lion-and-bull story; the Allen item on that page is 610's clipping, so 609 is probably a duplicate.
- 622 probably duplicates 621 (its clipping is only the column headline and horse-racing items).
- 631 is only a headline from the same page as 632; merge or remove.
- 614 is probably a duplicate of 615 (its clipping is the turf scandal story). 617: the OCR figures are wrong; the image says $250 and 250 days.
- 655 and 657 are the same Globe-Democrat item on the same page; 657 is the better crop. 654: Allen caused the 1874 panic, not prevented it (current summary is backwards).
- Gallagher 1869-08-17: 643 says Allen won at $500 a side; 647 says a draw at $1,000 a side (see 352). 646 duplicates 645 (headline only).
- 688 is probably a duplicate of 689 (its clipping is the billiard tourney report).
- Birth year: 738 also gives 1840.
- 778 probably duplicates 777 and 780 probably duplicates 779 (no Allen text in their crops).
- 834 duplicates 833 (same notice, same page and date).
- 864 (1892) says "Tom Allen never fought Jem Mace", contradicting the 1870 Mace-Allen fight (400 etc.); its current title says the opposite.
- 876 holds only the headline deck for the Mitchell letter whose text is 877; merge or re-crop.
- 855 and 856 are two halves of one 1892-08-21 Globe-Democrat article; consider merging.
- Saloon address: 887 prints 618 Market St (other notices say 619; 203 says 615).
- 901 probably duplicates 900 (its clipping is the racing column).
- 931: the page is torn and the end is lost; the current summary says Allen fired the shot, but the text likely says his bartender Flynn did.
- 942 is a cut-off copy of 943 (1896-11-20 Republic); consider removing.
- 958 duplicates 959 (bad crop, mostly ads).
- 969 and 970 are parts of one article (Allen's quote is missing from both crops); re-crop and merge.
- 998 is a different Tom Allen (Barnes Medical College graduate); remove. 974: the crop is the wrong article; the "Badly Beaten" item is lower in the same column on a torn part of the page.
- 1005 and 1006 are two partial crops of one obituary (middle column missing); 1008 is an exact duplicate of 1007; 1009 is a store ad plus headline only.
