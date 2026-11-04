/* theme-colors: the colour values theme.css defines, resolved to sRGB, and WCAG contrast over them.
   Used by scripts/theme-contrast.test.mjs (the ink/surface matrix every colour change must keep)
   and available to check:tokens. Reads the file; no Tailwind, no browser.

   Resolves: `#rgb` / `#rrggbb`, `white`/`black`/`transparent`, `var(--x)` chains, and
   `color-mix(in <space>, var(--x) N%, transparent|white)`. A mix "in oklab" is approximated in
   sRGB: for a colour at N% over transparent that is exactly an alpha of N/100, which is what the
   compositing below needs; for a mix with white the sRGB blend is within ~1% of oklab's for the
   near-greys and reds the theme uses (R2-01's error border computes to 3.61:1 either way). */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const THEME = join(dirname(fileURLToPath(import.meta.url)), "../src/theme.css")

/** Every `--name: value;` inside a `:root { … }` block, first definition wins (layers 1–3). */
export function readTheme(path = THEME) {
  const css = readFileSync(path, "utf8")
  const vars = new Map()
  for (const m of css.matchAll(/:root\s*\{([\s\S]*?)\}/g)) {
    const body = m[1].replace(/\/\*[\s\S]*?\*\//g, "")
    for (const d of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!vars.has(d[1])) vars.set(d[1], d[2].trim())
  }
  return vars
}

const NAMED = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0] }

/** `[r, g, b, a]` for a theme variable or a literal; throws on a form it doesn't know. */
export function resolve(vars, value, seen = new Set()) {
  const v = value.trim()
  if (v in NAMED) return NAMED[v]
  if (v.startsWith("#")) {
    const h = v.length === 4 ? [...v.slice(1)].map((c) => c + c).join("") : v.slice(1)
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]
  }
  const ref = v.match(/^var\((--[\w-]+)\)$/)
  if (ref) {
    if (seen.has(ref[1])) throw new Error(`cycle at ${ref[1]}`)
    if (!vars.has(ref[1])) throw new Error(`${ref[1]} is not defined in theme.css`)
    return resolve(vars, vars.get(ref[1]), new Set([...seen, ref[1]]))
  }
  const mix = v.match(/^color-mix\(in \w+,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*(\w+)\)$/)
  if (mix) {
    const [r, g, b, a] = resolve(vars, mix[1], seen)
    const p = Number(mix[2]) / 100
    if (mix[3] === "transparent") return [r, g, b, a * p]
    const [r2, g2, b2] = resolve(vars, mix[3], seen)
    return [r * p + r2 * (1 - p), g * p + g2 * (1 - p), b * p + b2 * (1 - p), 1]
  }
  throw new Error(`cannot resolve ${value}`)
}

/** `fg` composited over an opaque `bg` (alpha blending in sRGB). */
export function over(fg, bg) {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]
}

/** Opaque colour at `alpha` over `bg`: what `opacity-75` does to an ink (S-35). */
export const faded = (color, alpha, bg) => over([color[0], color[1], color[2], color[3] * alpha], bg)

const channel = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
export const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

/** WCAG 2.x contrast ratio of two opaque colours. */
export function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export const hex = ([r, g, b]) => "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
