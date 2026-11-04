import { test } from "node:test"
import assert from "node:assert/strict"

import { biggestDrop, entryLabel, fromForRange, isLow, nextOf, rangeOf, screenStats, stopsMost, timeDomain, type JourneyTask, type JourneyUsage } from "./journey-rules.ts"

const untimed = { count: 0, p25: null, median: null, p75: null, p90: null }
const task = (key: string, reached: number, extra: Partial<JourneyTask> = {}): JourneyTask => ({ key, label: key, optional: false, reached, activeSpread: untimed, next: [], ...extra })
const line = (...keys: string[]) => keys.slice(1).map((to, i) => ({ from: keys[i]!, to }))

/* Essential Setup's counts as the local stack served them on 1 Nov 2026 (the recording): a line,
   with Check what we read on a branch off Getting in, and Your people reached by one more person
   than About you (people resume past a screen). */
const setup: Pick<JourneyUsage, "tasks" | "edges" | "people"> = {
  people: 106,
  tasks: [
    task("welcome", 106),
    task("about", 94),
    task("your-people", 95),
    task("what-they-need", 65),
    task("documents", 63),
    task("who-steps-in", 58),
    task("getting-in", 55),
    task("check", 19, { optional: true }),
    task("in-place", 18),
  ],
  edges: [...line("welcome", "about", "your-people", "what-they-need", "documents", "who-steps-in", "getting-in", "in-place"), { from: "getting-in", to: "check" }, { from: "check", to: "in-place" }],
}

test("went on is the next task's people over this one's; the optional branch is skipped", () => {
  const stats = screenStats(setup)
  const gettingIn = stats.find((s) => s.key === "getting-in")!
  assert.equal(gettingIn.wentOn, 18 / 55)
  assert.equal(gettingIn.stopped, 37)
  assert.equal(gettingIn.nextLabel, "in-place")
  const check = stats.find((s) => s.key === "check")!
  assert.equal(check.wentOn, null)
  assert.equal(check.stopped, null)
  const end = stats.at(-1)!
  assert.equal(end.wentOn, null)
  assert.equal(end.share, 18 / 106)
})

test("more people on the next screen than this one is 100% and nobody stopped, never over", () => {
  const about = screenStats(setup).find((s) => s.key === "about")!
  assert.equal(about.wentOn, 1)
  assert.equal(about.stopped, 0)
})

test("on a branch every next task is required, so the one fewest reached is the measure (Sign-up: phone and email)", () => {
  const signup = { people: 167, tasks: [task("create-account", 167), task("verify-phone", 163), task("verify-email", 167)], edges: [{ from: "create-account", to: "verify-phone" }, { from: "create-account", to: "verify-email" }] }
  const [account, phone, email] = screenStats(signup)
  assert.equal(account!.wentOn, 163 / 167)
  assert.equal(account!.stopped, 4)
  assert.equal(account!.nextLabel, "verify-phone")
  assert.equal(phone!.wentOn, null)
  assert.equal(email!.wentOn, null)
})

test("the biggest drop is the lowest went-on rate (After Getting in: 37 of 55)", () => {
  assert.equal(biggestDrop(screenStats(setup))?.key, "getting-in")
  assert.equal(biggestDrop(screenStats({ ...setup, edges: [] })), null)
  // Nobody stopped anywhere: no drop, even though every rate is "lowest".
  assert.equal(biggestDrop(screenStats({ people: 1, tasks: [task("a", 1), task("b", 1)], edges: line("a", "b") })), null)
})

test("where people stop most: the three lowest rates, in reading order", () => {
  assert.deepEqual(
    stopsMost(screenStats(setup)).map((s) => s.key),
    ["welcome", "your-people", "getting-in"]
  )
})

test("a rate under 75% is low; no rate is not", () => {
  assert.equal(isLow(0.74), true)
  assert.equal(isLow(0.75), false)
  assert.equal(isLow(null), false)
})

test("what they did next: known keys fold into kinds, an Area place is elsewhere, anything else is other", () => {
  assert.deepEqual(nextOf("continue", 4), { kind: "on", label: "Went on", count: 4 })
  assert.equal(nextOf("exit", 1).kind, "left")
  assert.deepEqual(nextOf("area.money", 2), { kind: "elsewhere", label: "To Money", count: 2 })
  assert.deepEqual(nextOf("unknown", 2), { kind: "other", label: "Not known", count: 2 })
  assert.deepEqual(nextOf("teleport", 1), { kind: "other", label: "teleport", count: 1 })
  const stats = screenStats({ people: 1, tasks: [task("a", 1, { next: [{ key: "continue", visits: 3 }, { key: "back", visits: 1 }] })], edges: [] })
  assert.deepEqual(stats[0]!.then.map((n) => n.kind), ["on", "back"])
})

test("the time scale is a round step above the slowest 10%; none timed is no scale", () => {
  const timed = (p90: number) => task("t", 1, { activeSpread: { count: 1, p25: 1, median: 2, p75: 3, p90 } })
  assert.deepEqual(timeDomain([timed(33), task("u", 1)]), [0, 60])
  assert.deepEqual(timeDomain([timed(108)]), [0, 120])
  assert.deepEqual(timeDomain([timed(4000)]), [0, 7200])
  assert.equal(timeDomain([task("u", 1)]), null)
})

test("a range starts at local midnight that many days back; all time has no start", () => {
  const today = new Date(2026, 10, 1, 15, 30)
  assert.equal(fromForRange("7d", today), new Date(2026, 9, 25).toISOString())
  assert.equal(fromForRange("30d", today), new Date(2026, 9, 2).toISOString())
  assert.equal(fromForRange("all", today), null)
  assert.equal(rangeOf("30d"), "30d")
  assert.equal(rangeOf("yesterday"), "7d")
})

test("an entry's words, or the key as sent", () => {
  assert.equal(entryLabel("not-started"), "Not started")
  assert.equal(entryLabel("partner-link"), "partner-link")
})
