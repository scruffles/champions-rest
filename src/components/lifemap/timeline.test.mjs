import { test } from "node:test";
import assert from "node:assert/strict";
import { LIFE_ERAS, toYear, placeSpan, activeInEra, placeYears, americanFights } from "./timeline.mjs";

const era = (id) => LIFE_ERAS.find((e) => e.id === id);

test("toYear reads year, year-month and full dates", () => {
  assert.equal(toYear("1870"), 1870);
  assert.equal(toYear("1870", true), 1871);
  assert.equal(toYear("1870-03"), 1870 + 2 / 12);
  assert.equal(toYear("1870-03", true), 1870 + 3 / 12);
  assert.equal(toYear("1888-06-17"), 1888 + 5 / 12 + 16 / 365);
  assert.equal(toYear("pre-1868"), null);
  assert.equal(toYear(undefined), null);
});

test("placeSpan falls back to the one date given", () => {
  assert.deepEqual(placeSpan({ from: "1870-03", to: "1876-04" }), [1870 + 2 / 12, 1876 + 4 / 12]);
  assert.deepEqual(placeSpan({ from: null, to: "1901-02" }), [1901 + 1 / 12, 1901 + 2 / 12]);
  assert.equal(placeSpan({ from: null, to: null }), null);
});

test("activeInEra matches overlapping places only", () => {
  const wash = { from: "1870-03", to: "1876-04" };
  const kelly = { from: "1876-09", to: "1876-09" };
  assert.equal(activeInEra(wash, era("washington-417")), true);
  assert.equal(activeInEra(kelly, era("washington-417")), false);
  assert.equal(activeInEra(kelly, null), true);
});

test("placeYears", () => {
  assert.equal(placeYears({ from: "1870-03", to: "1876-04" }), "1870–1876");
  assert.equal(placeYears({ from: "1888-06-17", to: "1888-06-17" }), "1888");
  assert.equal(placeYears({ from: null, to: "1901-02" }), "1901");
  assert.equal(placeYears({}), "");
});

test("americanFights keeps fights that happened in America, 1868-1903", () => {
  const fx = [
    { id: "a", date: "1866-06-13", result: "win", location: "England" },
    { id: "b", date: "1869-08-17", result: "win", location: "Foster's Island or near St. Louis" },
    { id: "c", date: "1870-09-13", result: "canceled", location: "near St. Louis", plannedOnly: true },
    { id: "d", date: "1873-10-28", result: "broken up", location: "Omaha" },
    { id: "e", date: "1877-10-29", result: "win", location: "London district, England or England" },
    { id: "f", date: "1879-03-10", result: "win", location: "England or Glasgow" },
    { id: "g", date: undefined, result: "loss", location: "near New Orleans" },
    { id: "h", date: "1888-06-17", result: "loss", location: "Seventh street" },
    { id: "i", date: "1869-03-24", result: "?" },
  ];
  assert.deepEqual(americanFights(fx).map((f) => f.id), ["b", "h"]);
});

test("eras are in order and don't overlap", () => {
  for (let i = 1; i < LIFE_ERAS.length; i++) assert.ok(LIFE_ERAS[i].from >= LIFE_ERAS[i - 1].to, LIFE_ERAS[i].id);
});
