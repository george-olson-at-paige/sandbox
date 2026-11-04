// AddressField's logic: the address shape, its lines, list matching, the query and state names.
// node --test (type stripping).
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  emptyPostalAddress,
  formatLocality,
  formatPostalAddress,
  formatStreetLine,
  hasAddressParts,
  postalAddressMatches,
  queryPostalAddresses,
} from "./postal-address.ts"
import { US_STATE_OPTIONS, US_STATES, usStateName } from "./us-states.ts"

const willow = emptyPostalAddress({ street: "418 Willow Creek Dr", unit: "Apt 2", city: "Round Rock", state: "Texas", postalCode: "78664" })
const ashcroft = emptyPostalAddress({ street: "1408 Ashcroft Lane", city: "Portland", state: "Oregon", postalCode: "97216" })

test("an address always has every key; overrides are trimmed", () => {
  assert.deepEqual(emptyPostalAddress(), { street: "", unit: "", city: "", state: "", postalCode: "", country: "US" })
  assert.equal(emptyPostalAddress({ street: "  12 Elm St " }).street, "12 Elm St")
  assert.equal(emptyPostalAddress({ country: "CA" }).country, "CA")
})

test("parts: anything after the street counts; the street or the country alone doesn't", () => {
  assert.equal(hasAddressParts(emptyPostalAddress({ street: "12 Elm St" })), false)
  assert.equal(hasAddressParts(emptyPostalAddress({ country: "US" })), false)
  assert.equal(hasAddressParts(emptyPostalAddress({ postalCode: "97216" })), true)
  assert.equal(hasAddressParts(willow), true)
})

test("lines: the street line, the locality, and the whole address, skipping empty parts", () => {
  assert.equal(formatStreetLine(willow), "418 Willow Creek Dr, Apt 2")
  assert.equal(formatLocality(willow), "Round Rock, Texas 78664")
  assert.equal(formatPostalAddress(willow), "418 Willow Creek Dr, Apt 2, Round Rock, Texas 78664")
  assert.equal(formatLocality(emptyPostalAddress({ state: "Texas" })), "Texas")
  assert.equal(formatPostalAddress(emptyPostalAddress({ street: "12 Elm St" })), "12 Elm St")
})

test("matching: street or whole line, any case, two characters at least", () => {
  assert.equal(postalAddressMatches(ashcroft, "ash"), true)
  assert.equal(postalAddressMatches(ashcroft, "PORTLAND"), true)
  assert.equal(postalAddressMatches(ashcroft, "a"), false)
  assert.equal(postalAddressMatches(ashcroft, "willow"), false)
})

test("query: a list is filtered and limited; a lookup is asked; short queries ask nothing", async () => {
  assert.deepEqual(await queryPostalAddresses([ashcroft, willow], "willow"), [willow])
  assert.deepEqual(await queryPostalAddresses([ashcroft, willow], "r", 6), [])
  assert.equal((await queryPostalAddresses([ashcroft, willow], "an", 1)).length, 1)
  const asked: string[] = []
  const lookup = async (q: string) => {
    asked.push(q)
    return [{ ...ashcroft, unit: undefined as unknown as string }]
  }
  const rows = await queryPostalAddresses(lookup, " 1408 ")
  assert.deepEqual(asked, ["1408"])
  assert.equal(rows[0]?.unit, "")
  await queryPostalAddresses(lookup, "x")
  assert.deepEqual(asked, ["1408"])
})

test("states: 50 and DC; a name or code in any case gives the full name", () => {
  assert.equal(US_STATES.length, 51)
  assert.deepEqual(US_STATE_OPTIONS[0], { value: "Alabama", label: "Alabama" })
  assert.equal(usStateName("tx"), "Texas")
  assert.equal(usStateName(" texas "), "Texas")
  assert.equal(usStateName("DC"), "District of Columbia")
  assert.equal(usStateName("Ontario"), "Ontario")
  assert.equal(usStateName(""), "")
})
