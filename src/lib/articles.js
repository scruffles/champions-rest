import { db } from "../../data/database";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// `range` and `shortRange` are filled in below once the article years are known.
export const ERAS = [
  { name: "Early career", from: 0, to: 1872, grow: 8, numeral: "I" },
  { name: "Champion", from: 1873, to: 1876, grow: 4, numeral: "II" },
  { name: "Saloon years", from: 1877, to: 1898, grow: 22, numeral: "III" },
  { name: "Final years", from: 1899, to: 1903, grow: 5, numeral: "IV" },
  { name: "Legacy", from: 1904, to: 3000, grow: 3, numeral: "V" },
];

export const TOPICS = ["Fights", "Challenges", "Exhibitions", "Saloon", "Legal", "Personal life", "Profiles", "Legacy"];

// Keyword rules stand in for real tags until articles are tagged individually.
const TOPIC_RULES = [
  ["Legal", /arrest|court|bond|\bshot\b|shoot|kill|murder|police|charged|discharg|indict|jail|raid|trial|fined|assault/i],
  ["Saloon", /saloon|concert|free and easy|champion.?s rest|market street|bar patron|music hall/i],
  ["Personal life", /\bwed\b|marri|wife|daughter|sweetheart|family|\bill\b|sick|hospital|\bdead\b|death|died|obituary|estate|funeral|grave|nurse|bed\b/i],
  ["Challenges", /challeng|stakes|wager|backer|purse|forfeit|articles of agreement|match arranged|proposed/i],
  ["Exhibitions", /exhibition|sparring|benefit|tournament|wrestl|sword/i],
  ["Fights", /fight|bout|round|\bmill\b|ring|battle|knock|pugilis|prize/i],
];

const yearOf = (d) => {
  const m = String(d || "").match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
};

const importanceOf = (a) => (a.focus === "secondary" ? "support" : a.focus === "passing" ? "mention" : "key");

const topicsOf = (a, year) => {
  if (year && year >= 1904) return ["Legacy"];
  const match = (text) => TOPIC_RULES.filter(([, re]) => re.test(text || "")).map(([t]) => t);
  const fromTitle = match(a.title);
  const fromSummary = match(a.summary).filter((t) => !fromTitle.includes(t));
  const found = [...fromTitle, ...fromSummary];
  return found.length ? found : ["Profiles"];
};

const imagePath = (p) => {
  if (!p || p === "missing" || p.includes("?")) return null;
  return "/" + p.replace(/^\/?(public\/)?/, "");
};

export const eraOfYear = (y) => ERAS.find((e) => y >= e.from && y <= e.to) || ERAS[0];

export function formatDate(d, style = "long") {
  const s = String(d || "");
  const full = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) {
    const months = style === "short" ? MONTHS : MONTHS_LONG;
    return `${months[Number(full[2]) - 1]} ${Number(full[3])}, ${full[1]}`;
  }
  const ym = s.match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${(style === "short" ? MONTHS : MONTHS_LONG)[Number(ym[2]) - 1]} ${ym[1]}`;
  return s;
}

export function formatMonthDay(d) {
  const full = String(d || "").match(/^\d{4}-(\d{2})-(\d{2})$/);
  return full ? `${MONTHS[Number(full[1]) - 1]} ${Number(full[2])}` : "";
}

export const ARTICLES = db
  .filter((a) => !a.not_tom)
  .map((a) => {
    const year = yearOf(a.sourceDate);
    const topics = topicsOf(a, year);
    return {
      ...a,
      year,
      era: eraOfYear(year || 0),
      importance: importanceOf(a),
      topics,
      topic: topics[0],
      crop: imagePath(a.localCopyEdited),
      page: imagePath(a.localCopyFull),
      thumb: `/images/thumbs/image-${a.id}.jpg`,
      monthDay: String(a.sourceDate || "").slice(5, 10),
    };
  })
  .sort((x, y) => String(x.sourceDate).localeCompare(String(y.sourceDate)) || x.id.localeCompare(y.id));

export const BY_ID = new Map(ARTICLES.map((a) => [a.id, a]));

const DATED_YEARS = ARTICLES.map((a) => a.year).filter(Boolean);
export const FIRST_YEAR = Math.min(...DATED_YEARS);
export const LAST_YEAR = Math.max(...DATED_YEARS);
export const YEAR_SPAN = `${FIRST_YEAR}–${LAST_YEAR}`;

ERAS.forEach((e) => {
  const from = Math.max(e.from, FIRST_YEAR);
  const to = Math.min(e.to, LAST_YEAR);
  e.range = `${from}–${to}`;
  e.shortRange = e.to >= LAST_YEAR ? `${from}+` : e.range;
});
export const LEGACY_ERA = ERAS[ERAS.length - 1];

export const YEAR_COUNTS = ARTICLES.reduce((acc, a) => {
  if (a.year) acc[a.year] = (acc[a.year] || 0) + 1;
  return acc;
}, {});

export const ERA_COUNTS = ARTICLES.reduce((acc, a) => {
  acc[a.era.name] = (acc[a.era.name] || 0) + 1;
  return acc;
}, {});

export const KEY_COUNT = ARTICLES.filter((a) => a.importance === "key").length;

export const IMPORTANCE_LABEL = { key: "Key article", support: "Supporting article", mention: "Passing mention" };

export function onThisDay(date = new Date()) {
  const md = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return ARTICLES.filter((a) => a.monthDay === md && a.year && a.year <= 1903).sort((x, y) => {
    const rank = { key: 0, support: 1, mention: 2 };
    return rank[x.importance] - rank[y.importance] || x.year - y.year;
  });
}

export function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export function todayLabel(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function chronologicalNeighbors(article) {
  const i = ARTICLES.indexOf(article);
  return { prev: i > 0 ? ARTICLES[i - 1] : null, next: i >= 0 && i < ARTICLES.length - 1 ? ARTICLES[i + 1] : null };
}

export function related(article, n = 3) {
  return ARTICLES.filter((a) => a.id !== article.id && a.topic === article.topic && a.importance === "key" && a.crop)
    .sort((x, y) => Math.abs((x.year || 0) - (article.year || 0)) - Math.abs((y.year || 0) - (article.year || 0)))
    .slice(0, n);
}

export function publicationCounts() {
  const norm = (p) => (p || "Unknown").replace(/^The /, "").replace("St Louis", "St. Louis");
  const counts = {};
  ARTICLES.forEach((a) => {
    const k = norm(a.publication);
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
