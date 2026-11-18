// Where Tom Allen lived or kept saloon, period by period. place = id in data/places.js.
export const T_START = 1866;
export const T_END = 1904;

export const LIFE_ERAS = [
  { id: "england-1", label: "England", short: "Eng.", from: 1866, to: 1867.4, place: "birmingham", tone: "away" },
  { id: "cleveland", label: "Cleveland", short: "Clev.", from: 1867.4, to: 1868.2, place: "cleveland", tone: "away" },
  { id: "fourth-washington", label: "Fourth & Washington", short: "4th", from: 1868.2, to: 1869.2, place: "stl-saloon-4th-washington-1868", tone: "stl" },
  { id: "fifth-street", label: "Fifth Street", short: "5th", from: 1869.2, to: 1870.2, place: "stl-saloon-fifth-1869", tone: "stl" },
  { id: "washington-417", label: "417 Washington Ave.", from: 1870.2, to: 1876.3, place: "stl-417-washington", tone: "main" },
  { id: "toronto", label: "Toronto", short: "", from: 1876.7, to: 1877.3, place: "toronto", tone: "away" },
  { id: "england-2", label: "England", from: 1877.3, to: 1882.8, place: "london", tone: "away" },
  { id: "market-619", label: "619 Market Street · the Champion's Rest", from: 1883.2, to: 1903.3, place: "stl-619-market", tone: "main" },
];

// "1870" | "1870-03" | "1870-03-04" → decimal year (start of that period, or its end with end=true)
export function toYear(d, end = false) {
  const m = String(d ?? "").match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!m[2]) return end ? y + 1 : y;
  const mo = Number(m[2]) - 1;
  if (!m[3]) return y + (mo + (end ? 1 : 0)) / 12;
  return y + mo / 12 + (Number(m[3]) - 1) / 365;
}

export function placeSpan(p) {
  const a = toYear(p.from) ?? toYear(p.to);
  const b = toYear(p.to, true) ?? toYear(p.from, true);
  return a == null || b == null ? null : [a, b];
}

export function activeInEra(p, era) {
  if (!era) return true;
  const s = placeSpan(p);
  return !!s && s[0] < era.to && s[1] > era.from;
}

export function placeYears(p) {
  const a = String(p.from ?? "").slice(0, 4);
  const b = String(p.to ?? "").slice(0, 4);
  if (!a && !b) return "";
  if (!a || !b || a === b) return a || b;
  return `${a}–${b}`;
}

const NO_FIGHT = ["?", "none", "not fought", "canceled", "broken up"];

export function americanFights(fights) {
  return fights
    .filter((f) => !f.plannedOnly && !NO_FIGHT.includes(f.result))
    .map((f) => ({ ...f, year: toYear(f.date) }))
    .filter((f) => f.year != null && f.year >= 1868 && f.year < 1904 && !/England|Glasgow|London/.test(f.location || ""));
}
