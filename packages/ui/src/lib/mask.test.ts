// The masked-field formatter (R4-12): formatting, caret placement across insert, delete and
// paste for each mask, and value round trips.
// Run: npm test -w packages/ui (node --test; Node strips the types).
import { describe, test } from "node:test"
import assert from "node:assert/strict"

import {
  PHONE_US,
  SSN_HIDE,
  SSN_US,
  ZIP_US,
  amountToMinor,
  applyEdit,
  formatMoney,
  minorToText,
  phoneDigits,
  phoneStatus,
  renderMask,
  sanitizeAmount,
  ssnMaskOptions,
  ssnReveal,
  ssnStatus,
  toE164,
  zipValue,
  type Mask,
  type MaskOptions,
} from "./mask.ts"

/* A tiny input simulator: the state an <input> holds, and the browser's own edit before our
   formatter sees it. `|` marks the caret, `[…]` a selection, in the expected strings. */
type Field = { mask: Mask; options?: MaskOptions; sig: string; text: string; start: number; end: number }

function field(mask: Mask, sig = "", options?: MaskOptions): Field {
  const text = renderMask(mask, sig, options).text
  return { mask, options, sig, text, start: text.length, end: text.length }
}
function at(f: Field, start: number, end = start): Field {
  return { ...f, start, end }
}
function edit(f: Field, raw: string, caret: number, inputType: string): Field {
  const r = applyEdit(f.mask, { text: f.text, sig: f.sig }, raw, caret, inputType, f.options)
  return { ...f, sig: r.sig, text: r.text, start: r.caret, end: r.caret }
}
/** Types text one character at a time, as a keyboard does. */
function type(f: Field, text: string): Field {
  for (const c of text) {
    const raw = f.text.slice(0, f.start) + c + f.text.slice(f.end)
    f = edit(f, raw, f.start + 1, "insertText")
  }
  return f
}
function paste(f: Field, text: string): Field {
  const raw = f.text.slice(0, f.start) + text + f.text.slice(f.end)
  return edit(f, raw, f.start + text.length, "insertFromPaste")
}
function backspace(f: Field, times = 1): Field {
  for (let i = 0; i < times; i++) {
    if (f.start !== f.end) f = edit(f, f.text.slice(0, f.start) + f.text.slice(f.end), f.start, "deleteContentBackward")
    else if (f.start > 0) f = edit(f, f.text.slice(0, f.start - 1) + f.text.slice(f.start), f.start - 1, "deleteContentBackward")
  }
  return f
}
function del(f: Field): Field {
  if (f.start !== f.end) return edit(f, f.text.slice(0, f.start) + f.text.slice(f.end), f.start, "deleteContentForward")
  return edit(f, f.text.slice(0, f.start) + f.text.slice(f.start + 1), f.start, "deleteContentForward")
}
/** The field as "text|" with the caret. */
const show = (f: Field) => f.text.slice(0, f.start) + "|" + f.text.slice(f.start)

describe("renderMask", () => {
  test("literals appear only before a filled slot", () => {
    const r = (s: string) => renderMask(PHONE_US, s).text
    assert.equal(r(""), "")
    assert.equal(r("5"), "(5")
    assert.equal(r("555"), "(555")
    assert.equal(r("5551"), "(555) 1")
    assert.equal(r("555123"), "(555) 123")
    assert.equal(r("5551234"), "(555) 123-4")
    assert.equal(r("5551234567"), "(555) 123-4567")
  })
  test("ZIP shows the dash only with a sixth digit", () => {
    assert.equal(renderMask(ZIP_US, "12345").text, "12345")
    assert.equal(renderMask(ZIP_US, "123456").text, "12345-6")
    assert.equal(renderMask(ZIP_US, "123456789").text, "12345-6789")
  })
  test("SSN hides the first five as dots", () => {
    assert.equal(renderMask(SSN_US, "123456789", { hide: SSN_HIDE }).text, "•••-••-6789")
    assert.equal(renderMask(SSN_US, "1234", { hide: SSN_HIDE }).text, "•••-•")
    assert.equal(renderMask(SSN_US, "123456789").text, "123-45-6789")
  })
})

describe("phone: typing", () => {
  test("digit by digit, the caret stays after the last digit as separators appear", () => {
    let f = field(PHONE_US)
    f = type(f, "5")
    assert.equal(show(f), "(5|")
    f = type(f, "554")
    assert.equal(show(f), "(555) 4|")
    f = type(f, "567890")
    assert.equal(show(f), "(555) 456-7890|")
  })
  test("a full field ignores extra digits and keeps the caret", () => {
    let f = type(field(PHONE_US), "5551234567")
    f = type(f, "8")
    assert.equal(show(f), "(555) 123-4567|")
    f = type(at(f, 3), "9")
    assert.equal(show(f), "(55|5) 123-4567")
  })
  test("letters are ignored and the caret doesn't move", () => {
    let f = type(field(PHONE_US), "555")
    f = type(f, "a")
    assert.equal(show(f), "(555|")
    f = type(at(f, 2), "x")
    assert.equal(show(f), "(5|55")
  })
  test("typing in the middle: the caret follows the inserted digit, not the end", () => {
    let f = type(field(PHONE_US), "555123")
    f = type(at(f, 4), "9") // after "(555"
    assert.equal(show(f), "(555) 9|12-3")
    f = type(at(f, 2), "0") // after "(5"
    assert.equal(show(f), "(50|5) 591-23")
  })
  test("typing over a selection replaces it", () => {
    let f = type(field(PHONE_US), "5551234567")
    f = type(at(f, 6, 9), "999") // select "123"
    assert.equal(show(f), "(555) 999|-4567")
  })
  test("a repeated digit inserts where the caret is", () => {
    let f = type(field(PHONE_US), "5")
    f = type(at(f, 1), "5")
    assert.equal(show(f), "(5|5")
  })
})

describe("phone: deleting", () => {
  test("Backspace from the end removes digits and the separators that led to them", () => {
    let f = type(field(PHONE_US), "5551234")
    f = backspace(f)
    assert.equal(show(f), "(555) 123|")
    f = backspace(f, 3)
    assert.equal(show(f), "(555|")
    f = backspace(f, 2)
    assert.equal(show(f), "(5|")
    f = backspace(f)
    assert.equal(show(f), "|") // the bracket goes with the last digit
  })
  test("Backspace just after a separator deletes the digit before it (never stuck)", () => {
    let f = type(field(PHONE_US), "5551234567")
    f = backspace(at(f, 6)) // caret after ") "
    assert.equal(show(f), "(55|1) 234-567")
    f = type(field(PHONE_US), "5551234567")
    f = backspace(at(f, 10)) // caret after "-"
    assert.equal(show(f), "(555) 12|4-567")
  })
  test("Delete just before a separator deletes the digit after it", () => {
    let f = type(field(PHONE_US), "5551234567")
    f = del(at(f, 4)) // caret before ")"
    assert.equal(show(f), "(555|) 234-567")
  })
  test("Backspace in the middle keeps the caret in place", () => {
    let f = type(field(PHONE_US), "5551234567")
    f = backspace(at(f, 8)) // after "(555) 12"
    assert.equal(show(f), "(555) 1|34-567")
  })
  test("deleting a selection (cut) closes the gap", () => {
    let f = type(field(PHONE_US), "5551234567")
    f = backspace(at(f, 1, 9)) // "555) 123"
    assert.equal(show(f), "(|456) 7")
  })
  test("Backspace right after the opening bracket does nothing", () => {
    let f = type(field(PHONE_US), "555")
    f = backspace(at(f, 1))
    assert.equal(show(f), "(|555")
  })
})

describe("phone: paste and autofill", () => {
  const forms = ["+1 (555) 123-4567", "5551234567", "555.123.4567", "555-123-4567", "(555) 123-4567", "1 555 123 4567", "+15551234567", "tel: 555 123 4567"]
  for (const text of forms) {
    test(`"${text}" normalises`, () => {
      const f = paste(field(PHONE_US), text)
      assert.equal(show(f), "(555) 123-4567|")
      assert.equal(toE164(f.sig), "+15551234567")
    })
  }
  test("autofill replaces the whole value", () => {
    let f = type(field(PHONE_US), "212")
    f = edit(f, "+1 415 555 0100", 15, "insertReplacementText")
    assert.equal(f.text, "(415) 555-0100")
  })
  test("pasting into the middle", () => {
    let f = type(field(PHONE_US), "555")
    f = paste(f, "123")
    assert.equal(show(f), "(555) 123|")
  })
  test("a paste longer than the field keeps what fits", () => {
    const f = paste(field(PHONE_US), "555123456789")
    assert.equal(show(f), "(555) 123-4567|")
  })
})

describe("phone: values", () => {
  test("phoneDigits accepts E.164 and display text", () => {
    assert.equal(phoneDigits("+15551234567"), "5551234567")
    assert.equal(phoneDigits("(555) 123-4567"), "5551234567")
    assert.equal(phoneDigits(""), "")
  })
  test("status", () => {
    assert.equal(phoneStatus(""), "empty")
    assert.equal(phoneStatus("555123"), "partial")
    assert.equal(phoneStatus("5551234567"), "complete")
    assert.equal(phoneStatus("1551234567"), "invalid") // area code can't start with 1
    assert.equal(phoneStatus("0551234567"), "invalid") // nor with 0
    assert.equal(phoneStatus("5550234567"), "complete") // the exchange isn't checked
  })
  test("E.164 only when complete", () => {
    assert.equal(toE164("555123"), "")
    assert.equal(toE164("0551234567"), "")
  })
  test("round trip: value → digits → display → value", () => {
    const value = "+12125550100"
    const shown = renderMask(PHONE_US, phoneDigits(value)).text
    assert.equal(shown, "(212) 555-0100")
    assert.equal(toE164(phoneDigits(shown)), value)
  })
})

describe("ZIP", () => {
  test("typing past five adds the dash with the caret after the new digit", () => {
    let f = type(field(ZIP_US), "12345")
    assert.equal(show(f), "12345|")
    f = type(f, "6")
    assert.equal(show(f), "12345-6|")
    f = type(f, "7890")
    assert.equal(show(f), "12345-6789|")
  })
  test("Backspace after the dash's digit removes the dash too", () => {
    let f = type(field(ZIP_US), "123456")
    f = backspace(f)
    assert.equal(show(f), "12345|")
  })
  test("Backspace just after the dash deletes the fifth digit", () => {
    let f = type(field(ZIP_US), "123456789")
    f = backspace(at(f, 6))
    assert.equal(show(f), "1234|6-789")
  })
  test("paste", () => {
    assert.equal(paste(field(ZIP_US), "12345-6789").text, "12345-6789")
    assert.equal(paste(field(ZIP_US), "123456789").text, "12345-6789")
    assert.equal(paste(field(ZIP_US), " 02134 ").text, "02134")
  })
  test("value: five or nine digits, else empty", () => {
    assert.equal(zipValue("02134"), "02134")
    assert.equal(zipValue("021341234"), "02134-1234")
    assert.equal(zipValue("0213"), "")
    assert.equal(zipValue("021341"), "")
  })
})

describe("SSN", () => {
  test("typing shows the dashes in place", () => {
    const f = type(field(SSN_US), "123456789")
    assert.equal(show(f), "123-45-6789|")
    assert.equal(f.sig, "123456789")
  })
  test("typing while masked: dots for the first five, the caret still tracks", () => {
    let f = type(field(SSN_US, "", { hide: SSN_HIDE }), "1234")
    assert.equal(show(f), "•••-•|")
    f = type(f, "56789")
    assert.equal(show(f), "•••-••-6789|")
    assert.equal(f.sig, "123456789")
  })
  test("editing a masked value maps dots back to the right digits", () => {
    let f = field(SSN_US, "123456789", { hide: SSN_HIDE })
    f = backspace(at(f, 2)) // the second dot = digit 2
    assert.equal(f.sig, "13456789")
    f = type(f, "2")
    assert.equal(f.sig, "123456789")
    assert.equal(show(f), "••|•-••-6789")
  })
  test("paste", () => {
    assert.equal(paste(field(SSN_US), "123-45-6789").sig, "123456789")
    assert.equal(paste(field(SSN_US), "123 45 6789").text, "123-45-6789")
  })
  test("status: never-issued numbers are invalid", () => {
    assert.equal(ssnStatus(""), "empty")
    assert.equal(ssnStatus("1234"), "partial")
    assert.equal(ssnStatus("123456789"), "complete")
    for (const bad of ["000456789", "666456789", "912456789", "123006789", "123450000"]) assert.equal(ssnStatus(bad), "invalid")
  })
  test("reveal: the toggle flips it, leaving the field masks it again", () => {
    assert.equal(ssnReveal(false, "toggle"), true)
    assert.equal(ssnReveal(true, "toggle"), false)
    assert.equal(ssnReveal(true, "leave"), false)
    assert.equal(ssnReveal(false, "leave"), false)
  })
  test("reveal: masked by default; the whole number only when revealed (or focused with revealOnFocus)", () => {
    const show = (state: Parameters<typeof ssnMaskOptions>[0]) => renderMask(SSN_US, "123456789", ssnMaskOptions(state)).text
    assert.equal(show({ revealed: false, focused: false, revealOnFocus: false }), "•••-••-6789")
    assert.equal(show({ revealed: false, focused: true, revealOnFocus: false }), "•••-••-6789")
    assert.equal(show({ revealed: true, focused: true, revealOnFocus: false }), "123-45-6789")
    assert.equal(show({ revealed: true, focused: false, revealOnFocus: false }), "123-45-6789")
    assert.equal(show({ revealed: false, focused: true, revealOnFocus: true }), "123-45-6789")
    assert.equal(show({ revealed: false, focused: false, revealOnFocus: true }), "•••-••-6789")
  })
  test("reveal keeps every character in place, so the caret index means the same digit", () => {
    const masked = renderMask(SSN_US, "123456789", ssnMaskOptions({ revealed: false, focused: true, revealOnFocus: false }))
    const shown = renderMask(SSN_US, "123456789", ssnMaskOptions({ revealed: true, focused: true, revealOnFocus: false }))
    assert.equal(masked.text.length, shown.text.length)
    assert.deepEqual(masked.slots, shown.slots)
  })
})

describe("currency text", () => {
  const s = (raw: string, caret = raw.length, o = {}) => sanitizeAmount(raw, caret, o)
  test("keeps digits and one point; strips symbols and grouping", () => {
    assert.deepEqual(s("1234.5"), { text: "1234.5", caret: 6 })
    assert.deepEqual(s("$1,234.50"), { text: "1234.50", caret: 7 })
    assert.deepEqual(s("1.2.3"), { text: "1.23", caret: 4 })
    assert.deepEqual(s("12a"), { text: "12", caret: 2 })
  })
  test("the caret stays on the same character when something is stripped", () => {
    assert.deepEqual(s("12a34", 3), { text: "1234", caret: 2 })
    assert.deepEqual(s("$1,234", 3), { text: "1234", caret: 1 })
  })
  test("fraction digits past the currency's are dropped", () => {
    assert.equal(s("1.234").text, "1.23")
    assert.equal(s("12.5", 4, { fractionDigits: 0 }).text, "125")
  })
  test("minus only when allowed, only at the front; accounting brackets", () => {
    assert.equal(s("-12").text, "12")
    assert.equal(s("-12", 3, { allowNegative: true }).text, "-12")
    assert.equal(s("1-2", 3, { allowNegative: true }).text, "12")
    assert.equal(s("($12.50)", 8, { allowNegative: true }).text, "-12.50")
    assert.equal(s("($12.50)").text, "12.50")
  })
  test("minor units without floating point", () => {
    assert.equal(amountToMinor("1234.5"), 123450)
    assert.equal(amountToMinor("0.1"), 10)
    assert.equal(amountToMinor("0.29"), 29)
    assert.equal(amountToMinor("19.99"), 1999)
    assert.equal(amountToMinor(".5"), 50)
    assert.equal(amountToMinor("12."), 1200)
    assert.equal(amountToMinor("-0.05"), -5)
    assert.equal(amountToMinor("-0"), 0)
    assert.equal(amountToMinor(""), null)
    assert.equal(amountToMinor("-"), null)
    assert.equal(amountToMinor("."), null)
    assert.equal(amountToMinor("125", 0), 125)
  })
  test("round trip: minor → editing text → minor", () => {
    for (const m of [0, 5, 10, 99, 100, 123450, -5, -123450, 999999999999]) assert.equal(amountToMinor(minorToText(m)), m)
    assert.equal(minorToText(123450), "1234.50")
    assert.equal(minorToText(-5), "-0.05")
    assert.equal(minorToText(125, 0), "125")
  })
  test("formatMoney", () => {
    assert.equal(formatMoney(123450, "USD", "en-US"), "$1,234.50")
    assert.equal(formatMoney(123450), "$1,234.50") // en-US and USD by default (R5-01)
    assert.equal(formatMoney(-5, "USD", "en-US"), "-$0.05")
    assert.equal(formatMoney(1250, "JPY", "ja-JP").replace(/\s/g, ""), "￥1,250")
  })
})
