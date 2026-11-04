// The date parser and formatters behind DateField and DateOfBirthField (R4-12).
// Run: npm test -w packages/ui (node --test; Node strips the types).
import { describe, test } from "node:test"
import assert from "node:assert/strict"

import {
  addDay,
  addYears,
  ageOn,
  dateOrder,
  datePattern,
  formatDate,
  formatDateLong,
  fromIso,
  fromLocalDate,
  isValidYmd,
  monthNames,
  normalizeIso,
  parseDate,
  rangeStatus,
  toLocalDate,
  type ParseOptions,
} from "./dates.ts"

const TODAY = "2026-10-19"
const us: ParseOptions = { order: "MDY", today: TODAY }
const gb: ParseOptions = { order: "DMY", today: TODAY }
const ja: ParseOptions = { order: "YMD", today: TODAY }
const p = (text: string, o: ParseOptions = us) => parseDate(text, o)

describe("parseDate: what people type (en-US order)", () => {
  const cases: Array<[string, string]> = [
    ["3/4/26", "2026-03-04"],
    ["03/04/2026", "2026-03-04"],
    ["3/4/2026", "2026-03-04"],
    ["03042026", "2026-03-04"],
    ["030426", "2026-03-04"],
    ["3-4-2026", "2026-03-04"],
    ["3.4.2026", "2026-03-04"],
    ["3 4 2026", "2026-03-04"],
    ["  3/4/2026  ", "2026-03-04"],
    ["March 4 2026", "2026-03-04"],
    ["march 4, 2026", "2026-03-04"],
    ["Mar 4 2026", "2026-03-04"],
    ["Mar. 4, 2026", "2026-03-04"],
    ["4 Mar 2026", "2026-03-04"],
    ["4 March 2026", "2026-03-04"],
    ["4th of March 2026", "2026-03-04"],
    ["March 4th, 26", "2026-03-04"],
    ["Sept 9 2026", "2026-09-09"],
    ["sep 9 2026", "2026-09-09"],
    ["2026 March 4", "2026-03-04"],
    ["2026-03-04", "2026-03-04"],
    ["2026-3-4", "2026-03-04"],
    ["2026/3/4", "2026-03-04"],
    ["20260304", "2026-03-04"], // YYYYMMDD when MMDDYYYY is impossible
    ["12/31/1999", "1999-12-31"],
    ["2/29/2024", "2024-02-29"],
    ["2/29/2000", "2000-02-29"],
  ]
  for (const [text, iso] of cases) test(`"${text}" → ${iso}`, () => assert.equal(p(text), iso))
})

describe("parseDate: locale order", () => {
  test("en-GB reads day first", () => {
    assert.equal(p("3/4/26", gb), "2026-04-03")
    assert.equal(p("03042026", gb), "2026-04-03")
    assert.equal(p("4.3.2026.", gb), "2026-03-04")
    assert.equal(p("31/12/1999", gb), "1999-12-31")
  })
  test("ja reads year first", () => {
    assert.equal(p("2026/03/04", ja), "2026-03-04")
    assert.equal(p("20260304", ja), "2026-03-04")
    assert.equal(p("26/3/4", ja), "2026-03-04")
  })
  test("a month name means the same in every order", () => {
    for (const o of [us, gb, ja]) assert.equal(p("4 March 2026", o), "2026-03-04")
  })
  test("the owner's locale month names are understood", () => {
    const de = { ...gb, monthNames: monthNames("de-DE") }
    assert.equal(p("4. März 2026", de), "2026-03-04")
    assert.equal(p("4 Okt 2026", de), "2026-10-04")
  })
})

describe("parseDate: not a whole, real date → null", () => {
  const bad = [
    "", "   ", "2/30/2026", "2/29/2026", "2/29/1900", "13/1/2026", "0/1/2026", "1/0/2026", "4/31/2026",
    "3/4", "3/4/2", "3/4/202", "3/4/20266", "0304202", "3426", "March 2026", "March", "4 Ma 2026",
    "Ju 4 2026", "March 4 5 2026", "3/4/2026/1", "abc", "31/12/1999", "2026-02-30", "2026-13-01",
  ]
  for (const text of bad) test(JSON.stringify(text), () => assert.equal(p(text), null))
})

describe("parseDate: two-digit years", () => {
  test("window: up to 19 years ahead stays in this century, 20 ahead goes back", () => {
    assert.equal(p("1/1/45"), "2045-01-01")
    assert.equal(p("1/1/46"), "1946-01-01")
    assert.equal(p("1/1/99"), "1999-01-01")
    assert.equal(p("1/1/00"), "2000-01-01")
  })
  test("past: never after this year (dates of birth)", () => {
    const past = { ...us, pivot: "past" as const }
    assert.equal(p("1/1/26", past), "2026-01-01")
    assert.equal(p("1/1/27", past), "1927-01-01")
    assert.equal(p("4/5/52", past), "1952-04-05")
    assert.equal(p("4/5/05", past), "2005-04-05")
  })
  test("the pivot follows today", () => {
    assert.equal(p("1/1/45", { ...us, today: "2100-01-01" }), "2045-01-01")
    assert.equal(p("1/1/19", { ...us, today: "2100-01-01" }), "2119-01-01")
    assert.equal(p("1/1/20", { ...us, today: "2100-01-01" }), "2020-01-01")
  })
})

describe("ISO values", () => {
  test("fromIso reads a date-time as its written date, never shifted", () => {
    assert.deepEqual(fromIso("2026-03-04T23:30:00-08:00"), { y: 2026, m: 3, d: 4 })
    assert.deepEqual(fromIso("1952-04-05T00:00:00Z"), { y: 1952, m: 4, d: 5 })
    assert.equal(fromIso("2026-02-30"), null)
    assert.equal(fromIso("03/04/2026"), null)
    assert.equal(fromIso(null), null)
  })
  test("normalizeIso", () => {
    assert.equal(normalizeIso("2026-03-04T10:00:00Z"), "2026-03-04")
    assert.equal(normalizeIso("nope"), "")
  })
  test("isValidYmd: leap years", () => {
    assert.ok(isValidYmd(2024, 2, 29))
    assert.ok(isValidYmd(2000, 2, 29))
    assert.ok(!isValidYmd(1900, 2, 29))
    assert.ok(!isValidYmd(2026, 2, 29))
    assert.ok(!isValidYmd(2026, 4, 31))
  })
  test("round trip: format then parse gives the same date in each locale", () => {
    for (const iso of ["2026-03-04", "1952-04-05", "1999-12-31", "2024-02-29", "2000-01-01"]) {
      assert.equal(parseDate(formatDate(iso, "en-US"), us), iso)
      assert.equal(parseDate(formatDate(iso, "en-GB"), gb), iso)
      assert.equal(parseDate(formatDate(iso, "de-DE"), gb), iso)
      assert.equal(parseDate(formatDate(iso, "ja-JP"), ja), iso)
    }
  })
  test("the calendar adapter keeps the day in any time zone", () => {
    for (const iso of ["2026-03-04", "2026-03-08", "2026-11-01", "1952-04-05", "0050-06-15"]) {
      assert.equal(fromLocalDate(toLocalDate(iso)!), iso)
    }
    assert.equal(toLocalDate(""), undefined)
  })
})

describe("formatting", () => {
  test("formatDate in the locale's numeric order, padded, four-digit year", () => {
    assert.equal(formatDate("2026-03-04", "en-US"), "03/04/2026")
    assert.equal(formatDate("2026-03-04", "en-GB"), "04/03/2026")
    assert.equal(formatDate("2026-03-04", "de-DE"), "04.03.2026")
    assert.equal(formatDate("2026-03-04", "ja-JP"), "2026/03/04")
    assert.equal(formatDate("", "en-US"), "")
  })
  test("datePattern and dateOrder", () => {
    assert.equal(datePattern("en-US"), "MM/DD/YYYY")
    assert.equal(datePattern("en-GB"), "DD/MM/YYYY")
    assert.equal(datePattern("de-DE"), "DD.MM.YYYY")
    assert.equal(dateOrder("en-US"), "MDY")
    assert.equal(dateOrder("en-GB"), "DMY")
    assert.equal(dateOrder("ja-JP"), "YMD")
  })
  test("formatDateLong", () => assert.equal(formatDateLong("2026-03-04", "en-US"), "March 4, 2026"))
})

describe("arithmetic", () => {
  test("addYears keeps the day; 29 Feb becomes 28 Feb", () => {
    assert.equal(addYears("2026-10-19", -18), "2008-10-19")
    assert.equal(addYears("2024-02-29", 1), "2025-02-28")
    assert.equal(addYears("2024-02-29", -4), "2020-02-29")
  })
  test("addDay rolls months and years", () => {
    assert.equal(addDay("2026-01-31"), "2026-02-01")
    assert.equal(addDay("2026-12-31"), "2027-01-01")
    assert.equal(addDay("2024-02-28"), "2024-02-29")
  })
  test("ageOn counts the birthday on the day", () => {
    assert.equal(ageOn("2008-10-19", TODAY), 18)
    assert.equal(ageOn("2008-10-20", TODAY), 17)
    assert.equal(ageOn("1952-04-05", TODAY), 74)
  })
  test("rangeStatus (min/max inclusive)", () => {
    assert.equal(rangeStatus("2026-03-04", "2026-03-04", "2026-03-04"), "ok")
    assert.equal(rangeStatus("2026-03-03", "2026-03-04"), "before-min")
    assert.equal(rangeStatus("2026-03-05", undefined, "2026-03-04"), "after-max")
    assert.equal(rangeStatus("2026-03-05"), "ok")
  })
})

/* R5-01: en-US is the default and the only locale built and tested; with no locale passed the
   formatters are en-US whatever the machine's own locale is. */
describe("default locale (R5-01)", () => {
  test("no locale means en-US, not the environment's", () => {
    assert.equal(dateOrder(), "MDY")
    assert.equal(datePattern(), "MM/DD/YYYY")
    assert.equal(formatDate("2026-03-04"), "03/04/2026")
    assert.equal(formatDateLong("2026-03-04"), "March 4, 2026")
    assert.equal(monthNames()[2][0], "march")
  })
})
