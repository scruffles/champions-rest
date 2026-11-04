// Hand-picked articles for the Articles highlights page.
export const FEATURED = ["400", "579", "986", "259"];

// Pool for "Article of the day" when nothing notable ran on today's date.
export const DAILY = ["400", "579", "986", "259", "044", "352", "272", "234", "243", "691"];

// Each shelf links to the archive with `go` applied as filters.
export const SHELVES = [
  {
    title: "Joe Goss and the 1876 championship",
    sub: "The challenge, the training camps, the fight in Kentucky and its aftermath",
    go: { year: 1876 },
    ids: ["067", "076", "563", "579", "085"],
  },
  {
    title: "Champion's Rest, the saloon",
    sub: "Concerts, regulars and the business on Market Street",
    go: { topic: "Saloon" },
    ids: ["468", "691", "870", "216", "199"],
  },
  {
    title: "Trouble with the law",
    sub: "Arrests, raids and the 1899 shooting",
    go: { topic: "Legal" },
    ids: ["039", "173", "986", "987", "182"],
  },
  {
    title: "Remembered",
    sub: "How later writers looked back on him",
    go: { era: "Legacy" },
    ids: ["259", "225", "234", "243"],
  },
];
