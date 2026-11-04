/* The masked-field formatter (R4-12): one engine for phone, ZIP and SSN. Pure functions, no
   React, no "use client".

   A mask is a template ("(###) ###-####"): `#` is a slot for one significant character (a
   digit), anything else is a literal. Literals before slot k show only once slot k is filled,
   so "555" shows "(555", not "(555) " with a dangling separator the person then has to delete.

   applyEdit takes what the input held, what the browser made of it after one edit (a typed
   character, a deletion, a paste, a cut, autofill) and the caret, and returns the new significant
   characters, the new display and where the caret goes. It works out the edit by diffing the old
   display with the new raw text, so it doesn't care how the edit happened, and it places the
   caret by counting significant characters, never by string length: the caret stays after the
   digit you just typed even when a separator appears ahead of it. Deleting a separator alone
   (Backspace just after ") ") deletes the digit before it instead, the way people expect; a
   no-op that left the caret stuck is the classic masked-input bug. */

import { DEFAULT_LOCALE } from "./locale.ts"

export type Mask = {
  /** `#` = one significant character; anything else is a literal. */
  template: string
  /** Which characters are significant (default: a digit). */
  accept?: (char: string) => boolean
  /** Rewrites the significant characters after an edit: drops a leading country code, say. Must only ever remove characters from the front. */
  normalize?: (sig: string) => string
}

export type MaskOptions = {
  /** Draws significant character i as `•` (SSN while masked). The value is untouched. */
  hide?: (index: number, sig: string) => boolean
}

export type Rendered = { text: string; slots: number[] }

const isDigit = (c: string) => c >= "0" && c <= "9"
export const MASK_DOT = "•"

/** The number of significant characters a mask holds. */
export function maskCapacity(mask: Mask): number {
  return [...mask.template].filter((c) => c === "#").length
}

/** The display for the significant characters, and where each one sits in it. */
export function renderMask(mask: Mask, sig: string, options: MaskOptions = {}): Rendered {
  let text = ""
  let pending = ""
  const slots: number[] = []
  let i = 0
  for (const c of mask.template) {
    if (c !== "#") {
      pending += c
      continue
    }
    if (i >= sig.length) break
    text += pending
    pending = ""
    slots.push(text.length)
    text += options.hide?.(i, sig) ? MASK_DOT : sig[i]
    i++
  }
  return { text, slots }
}

/** The significant characters in any text (a paste, autofill, a stored value), in order. */
export function significant(mask: Mask, text: string): string {
  const accept = mask.accept ?? isDigit
  return [...text].filter(accept).join("")
}

/** Where the caret goes in a display so that `count` significant characters are before it. */
export function caretAfter(rendered: Rendered, count: number): number {
  if (count <= 0) return rendered.slots.length > 0 ? rendered.slots[0] : 0
  const k = Math.min(count, rendered.slots.length)
  return rendered.slots[k - 1] + 1
}

export type EditResult = { sig: string; text: string; caret: number }

/**
 * One edit, applied.
 * @param prev   what the input showed before the edit, and its significant characters
 * @param raw    the input's value after the browser applied the edit
 * @param caret  the caret (selectionEnd) after the edit
 * @param inputType the InputEvent's inputType when known ("deleteContentForward" decides which way a lone separator deletion goes)
 */
export function applyEdit(
  mask: Mask,
  prev: { text: string; sig: string },
  raw: string,
  caret: number,
  inputType?: string,
  options: MaskOptions = {}
): EditResult {
  const accept = mask.accept ?? isDigit
  const max = maskCapacity(mask)
  const old = renderMask(mask, prev.sig, options)
  const oldText = prev.text

  // The edit: the old display minus [start, oldEnd) plus raw[start, newEnd). The caret marks the
  // end of what was inserted, which settles repeated characters ("55" + "5").
  let suffix = 0
  while (suffix < oldText.length && suffix < raw.length && oldText[oldText.length - 1 - suffix] === raw[raw.length - 1 - suffix]) suffix++
  suffix = Math.min(suffix, raw.length - caret)
  let start = 0
  while (start < oldText.length - suffix && start < raw.length - suffix && oldText[start] === raw[start]) start++
  const oldEnd = oldText.length - suffix
  const inserted = raw.slice(start, raw.length - suffix)

  // Old display positions → significant indexes.
  const slotsBefore = (pos: number) => old.slots.filter((s) => s < pos).length
  let from = slotsBefore(start)
  let to = slotsBefore(oldEnd)
  let typed = [...inserted].filter(accept).join("")

  // A lone separator deleted: delete the significant character on that side of it instead.
  if (from === to && typed === "" && inserted === "" && oldEnd - start === 1) {
    if (inputType === "deleteContentForward") to = Math.min(to + 1, prev.sig.length)
    else from = Math.max(from - 1, 0)
  }
  // Nothing significant typed (a letter in a digit field): nothing changes, caret stays.
  if (inserted !== "" && typed === "" && from === to) {
    return { sig: prev.sig, text: old.text, caret: caretAfter(old, from) }
  }

  const before = prev.sig.slice(0, from)
  const after = prev.sig.slice(to)
  const normalize = mask.normalize ?? ((s: string) => s)
  let next = normalize(before + typed + after)
  // Too long: keep as much of what was typed as fits (a full field ignores extra keys).
  while (next.length > max && typed.length > 0) {
    typed = typed.slice(0, -1)
    next = normalize(before + typed + after)
  }
  if (next.length > max) next = next.slice(0, max)
  const dropped = before.length + typed.length + after.length - next.length
  const caretSig = Math.max(0, Math.min(next.length, before.length + typed.length - Math.max(0, dropped)))
  const rendered = renderMask(mask, next, options)
  return { sig: next, text: rendered.text, caret: caretAfter(rendered, caretSig) }
}

/* ── The masks ──────────────────────────────────────────────────────────── */

/** US phone, national: (555) 123-4567. A leading 1 (the country code) beyond ten digits is dropped, so +1 (555) 123-4567 pastes cleanly. */
export const PHONE_US: Mask = {
  template: "(###) ###-####",
  normalize: (sig) => (sig.length > 10 && sig[0] === "1" ? sig.slice(1) : sig),
}

/** US ZIP or ZIP+4: 12345, 12345-6789 (the dash appears with the sixth digit). */
export const ZIP_US: Mask = { template: "#####-####" }

/** US Social Security number: 123-45-6789. */
export const SSN_US: Mask = { template: "###-##-####" }

/** SSN with all but the last four drawn as dots: •••-••-6789. */
export const SSN_HIDE: MaskOptions["hide"] = (i) => i < 5

/** SsnField's reveal toggle (R5-02) after an event: "toggle" flips it; "leave" (focus left the field, input and toggle both) masks it again. */
export function ssnReveal(revealed: boolean, event: "toggle" | "leave"): boolean {
  return event === "toggle" ? !revealed : false
}

/** SsnField's mask options: the whole number when revealed by the toggle, or focused with `revealOnFocus`; otherwise only the last four. */
export function ssnMaskOptions(state: { revealed: boolean; focused: boolean; revealOnFocus: boolean }): MaskOptions | undefined {
  return state.revealed || (state.focused && state.revealOnFocus) ? undefined : { hide: SSN_HIDE }
}

/* ── Values ─────────────────────────────────────────────────────────────── */

/** National digits from any phone text or an E.164 value ("+15551234567" → "5551234567"). */
export function phoneDigits(text: string): string {
  const digits = significant(PHONE_US, text)
  return digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits.slice(0, 10)
}

/** A US phone's status: ten digits, and an area code that doesn't start with 0 or 1 (NANP). The exchange isn't checked: 555-123-4567-style examples stay usable. */
export function phoneStatus(digits: string): "empty" | "partial" | "invalid" | "complete" {
  if (digits === "") return "empty"
  if (digits.length < 10) return "partial"
  return /^[2-9]\d{9}$/.test(digits) ? "complete" : "invalid"
}

/** E.164 for complete national digits ("+15551234567"), else "". */
export function toE164(digits: string): string {
  return phoneStatus(digits) === "complete" ? `+1${digits}` : ""
}

/** The ZIP value: "12345" or "12345-6789" when complete, else "". */
export function zipValue(digits: string): string {
  if (digits.length === 5) return digits
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return ""
}

/** An SSN's status. Never issued: area 000, 666 or 900–999; group 00; serial 0000. */
export function ssnStatus(digits: string): "empty" | "partial" | "invalid" | "complete" {
  if (digits === "") return "empty"
  if (digits.length < 9) return "partial"
  const area = digits.slice(0, 3)
  if (area === "000" || area === "666" || area[0] === "9" || digits.slice(3, 5) === "00" || digits.slice(5) === "0000") return "invalid"
  return "complete"
}

/* ── Money ──────────────────────────────────────────────────────────────── */

export type AmountOptions = { allowNegative?: boolean; fractionDigits?: number }

/**
 * Cleans what was typed or pasted into an amount ("$1,234.5" → "1234.5") and keeps the caret
 * on the same character. Keeps digits, one decimal point and (when allowed) a leading minus;
 * "(12.50)" pastes as -12.50. Digits past the currency's fraction digits are dropped.
 */
export function sanitizeAmount(raw: string, caret: number, options: AmountOptions = {}): { text: string; caret: number } {
  const { allowNegative = false, fractionDigits = 2 } = options
  const accounting = /^\s*\(.*\)\s*$/.test(raw)
  let text = ""
  let newCaret = 0
  let seenPoint = false
  let fraction = 0
  let negative = false
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    let keep = false
    if (isDigit(c)) {
      if (!seenPoint) keep = true
      else if (fraction < fractionDigits) {
        keep = true
        fraction++
      }
    } else if (c === "." && !seenPoint && fractionDigits > 0) {
      keep = true
      seenPoint = true
    } else if (text === "" && c === "-" && allowNegative && negative === false) {
      negative = true
      keep = true
    }
    if (keep) text += c
    if (i < caret && keep) newCaret = text.length
  }
  if (accounting && allowNegative && !negative && text !== "") {
    text = `-${text}`
    newCaret++
  }
  return { text, caret: newCaret }
}

/** Minor units (cents) from cleaned amount text, or null when there is no amount. No floating point: "0.1" + "0.2" mistakes can't happen. */
export function amountToMinor(text: string, fractionDigits = 2): number | null {
  const m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text.trim())
  if (!m || (m[2] === "" && (m[3] ?? "") === "")) return null
  const whole = m[2] === "" ? "0" : m[2]
  const frac = (m[3] ?? "").padEnd(fractionDigits, "0").slice(0, fractionDigits)
  const minor = Number(whole) * 10 ** fractionDigits + Number(frac || "0")
  if (!Number.isSafeInteger(minor)) return null
  return m[1] === "-" && minor !== 0 ? -minor : minor
}

/** Plain editing text for minor units: 123450 → "1234.50", -5 → "-0.05". */
export function minorToText(minor: number, fractionDigits = 2): string {
  const sign = minor < 0 ? "-" : ""
  const abs = Math.abs(minor)
  if (fractionDigits === 0) return `${sign}${abs}`
  const unit = 10 ** fractionDigits
  return `${sign}${Math.floor(abs / unit)}.${String(abs % unit).padStart(fractionDigits, "0")}`
}

/** The currency's minor-unit digits (USD 2, JPY 0). */
export function currencyDigits(currency: string, locale: string = DEFAULT_LOCALE): number {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2
}

/** Minor units shown as money: 123450 → "$1,234.50". */
export function formatMoney(minor: number, currency = "USD", locale: string = DEFAULT_LOCALE): string {
  const digits = currencyDigits(currency, locale)
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 10 ** digits)
}
