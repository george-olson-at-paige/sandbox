// The ink/surface contrast matrix theme.css must keep (TOKENS.md, change-readiness). Every ratio
// the reviews cite was computed by hand once and written in a comment (S-35's 3.2:1, R2-01's
// 3.61:1, muted ink's 5.8:1); this makes each of them a test, so a palette change fails here
// instead of in someone's eyes. Pairs the reviews have *not* settled (R1-30's brand-blue call,
// control borders under WCAG 1.4.11, white glyphs on the area fills) are reported as diagnostics
// under `todo`, not asserted: the numbers are in the test output for the decision, and the test
// goes green-or-red the day the decision is made and the `todo` comes off.
// Run: npm test -w packages/ui (node --test).
import { test } from "node:test"
import assert from "node:assert/strict"

import { contrast, faded, hex, over, readTheme, resolve } from "./theme-colors.mjs"

const vars = readTheme()
const c = (name) => resolve(vars, `var(${name})`)
const white = c("--background")
/** Opaque colour of a (possibly translucent) token as it sits on `bg`. */
const on = (name, bg = white) => over(c(name), bg)
const ratio = (fg, bg) => Math.round(contrast(fg, bg) * 100) / 100
const AA_TEXT = 4.5
const AA_GRAPHIC = 3

const SURFACES = ["--background", "--card", "--popover", "--muted", "--accent", "--surface-page", "--surface-warm"]
const TEXT_INKS = ["--foreground", "--foreground-strong", "--card-foreground", "--popover-foreground", "--secondary-foreground", "--sidebar-foreground", "--muted-foreground", "--body-muted"]

test("every colour-shaped variable in layers 1–3 resolves to a colour", () => {
  const unresolved = []
  for (const [name, value] of vars) {
    if (!/^(#|var\(|color-mix\(|white|black|transparent)/.test(value)) continue
    try {
      resolve(vars, value)
    } catch (e) {
      unresolved.push(`${name}: ${e.message}`)
    }
  }
  assert.deepEqual(unresolved, [])
})

test("text inks read on every surface (≥ 4.5:1; muted ink is the 5.8:1 S-35 cites on white)", () => {
  const failures = []
  for (const ink of TEXT_INKS)
    for (const surface of SURFACES) {
      const r = ratio(on(ink), on(surface))
      if (r < AA_TEXT) failures.push(`${ink} on ${surface}: ${r}:1`)
    }
  assert.deepEqual(failures, [])
})

test("tone inks read on their subtle fills (Badge soft, Callout; ≥ 4.5:1)", () => {
  const failures = []
  for (const tone of ["info", "success", "warning", "attention"]) {
    const r = ratio(on(`--${tone}-foreground`), on(`--${tone}-subtle`))
    if (r < AA_TEXT) failures.push(`--${tone}-foreground on --${tone}-subtle: ${r}:1`)
  }
  assert.deepEqual(failures, [])
})

test("error ink is text-grade and the resting error border is 3:1 (R2-01 cites 3.61:1)", () => {
  assert.ok(ratio(on("--error"), white) >= AA_TEXT, `--error on white: ${ratio(on("--error"), white)}:1`)
  const border = ratio(on("--error-border"), white)
  assert.ok(border >= AA_GRAPHIC, `--error-border on white: ${border}:1`)
  assert.ok(Math.abs(border - 3.61) < 0.05, `--error-border drifted from the cited 3.61:1: ${border}:1`)
})

test("quiet icon actions at 75% keep 3:1 on white, the muted surface and the blue wash (S-35)", () => {
  const ink = c("--muted-foreground")
  const failures = []
  for (const surface of ["--background", "--muted", "--accent"]) {
    const bg = on(surface)
    const r = ratio(faded(ink, 0.75, bg), bg)
    if (r < AA_GRAPHIC) failures.push(`muted ink at 75% on ${surface}: ${r}:1`)
  }
  assert.deepEqual(failures, [])
})

test("on-tone ink on the solid tone fills clears 3:1 (Dot, AreaIcon solid; the brand button's ink as a graphic)", () => {
  const failures = []
  for (const fill of ["--primary", "--destructive", "--info", "--success", "--warning", "--attention"]) {
    const r = ratio(c("--on-tone"), on(fill))
    if (r < AA_GRAPHIC) failures.push(`--on-tone on ${fill}: ${r}:1`)
  }
  assert.deepEqual(failures, [])
})

test("destructive button text is text-grade at rest and on hover (white on --destructive, --destructive-hover ≥ 4.5:1)", () => {
  for (const fill of ["--destructive", "--destructive-hover"]) {
    const r = ratio(c("--primary-foreground"), on(fill))
    assert.ok(r >= AA_TEXT, `white on ${fill}: ${r}:1`)
  }
})

/* ---------- open calls: reported, not asserted ---------- */

test("brand blue as a text background (R1-30, George's call; the a11y addon stays `todo` until it is made)", { todo: "R1-30" }, (t) => {
  t.diagnostic(`white on --primary (Button primary, 14–16px/600): ${ratio(c("--primary-foreground"), on("--primary"))}:1 (text wants 4.5, large text 3)`)
  t.diagnostic(`--accent-foreground on --accent (selected/open wash with blue text): ${ratio(on("--accent-foreground"), on("--accent"))}:1`)
  t.diagnostic(`--primary on white (link text, quiet+brand): ${ratio(on("--primary"), white)}:1`)
})

test("white glyphs on the area fills (AreaIcon solid, Dot tone=area; WCAG 1.4.11 wants 3:1 for a meaningful glyph)", { todo: "no decision yet; --area-money is provisional (R2-05)" }, (t) => {
  for (const [name] of vars) {
    if (!/^--area-(personal|family|household|money|assets|health|insurance|estate|final)$/.test(name)) continue
    const r = ratio(c("--primary-foreground"), on(name))
    t.diagnostic(`white on ${name} ${hex(on(name))}: ${r}:1${r < AA_GRAPHIC ? "  ← below 3:1" : ""}`)
  }
})

test("control boundaries and placeholder ink against WCAG 1.4.11 / 1.4.3 (not yet decided; R3-01 sets placeholder weight, not colour)", { todo: "border and placeholder contrast" }, (t) => {
  for (const name of ["--border", "--input", "--border-strong", "--divider", "--placeholder"]) {
    const r = ratio(on(name), white)
    t.diagnostic(`${name} ${hex(on(name))} on white: ${r}:1`)
  }
})
