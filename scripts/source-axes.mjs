// The source parsing audit.mjs and check-vocab.mjs share (ARCHETYPES.md §7.3: "the parsing is
// audit.mjs's"). Everything is read from the source by regex, as catalog.mjs reads purpose lines:
// no Storybook server, no TypeScript program. Where that is approximate the caller's column says so.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/** Folders under src that hold no component files: the bases, internals, lib, icons, schemas, and the story-only folders. */
export const SKIP_DIRS = new Set(["base", "stories", "docs", "foundations", "fixtures", "lib", "icons", "schemas", "internal", "node_modules"])

/** Every component file under dir: .ts/.tsx, not a story or a test, not in SKIP_DIRS. */
export const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(n) ? [] : walk(p)
    return /\.tsx?$/.test(n) && !/\.(stories|test)\.tsx?$/.test(n) ? [p] : []
  })

export const read = (f) => readFileSync(f, "utf8").replace(/\r\n/g, "\n")

/** The source of a balanced {…} block starting at `open` (src[open] === "{"), without the braces. */
export function block(s, open) {
  let depth = 0
  let quote = null
  for (let i = open; i < s.length; i++) {
    const c = s[i]
    if (quote) {
      if (c === "\\") i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === "`") quote = c
    else if (c === "/" && s[i + 1] === "*") i = s.indexOf("*/", i + 2) + 1
    else if (c === "/" && s[i + 1] === "/") i = s.indexOf("\n", i)
    else if (c === "{") depth++
    else if (c === "}" && --depth === 0) return s.slice(open + 1, i)
  }
  return s.slice(open + 1)
}

/** The keys at depth 0 of an object-literal body, with the index where each value starts. */
export function topKeys(body) {
  const keys = []
  let depth = 0
  let quote = null
  let lineStart = true
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (quote) {
      if (c === "\\") i++
      else if (c === quote) quote = null
      continue
    }
    if (c === "/" && body[i + 1] === "*") {
      i = body.indexOf("*/", i + 2) + 1
      continue
    }
    if (c === "/" && body[i + 1] === "/") {
      i = body.indexOf("\n", i)
      continue
    }
    if (c === "`") {
      quote = c
      continue
    }
    if (c === "{" || c === "(" || c === "[") depth++
    else if (c === "}" || c === ")" || c === "]") depth--
    else if (depth === 0 && (lineStart || body[i - 1] === "," || /\s/.test(body[i - 1] ?? ""))) {
      const m = /^(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:/.exec(body.slice(i))
      if (m) {
        keys.push({ key: m[1] ?? m[2] ?? m[3], at: i + m[0].length })
        i += m[0].length - 1
      }
    }
    if (c === '"' || c === "'") quote = c
    lineStart = c === "\n"
  }
  return keys
}

/** Axes from every cva() in the file: { axis: [values] }. */
export function cvaAxes(s) {
  const axes = {}
  const re = /\bcva\(/g
  let m
  while ((m = re.exec(s))) {
    const v = s.indexOf("variants:", m.index)
    if (v < 0) break
    const open = s.indexOf("{", v)
    const body = block(s, open)
    for (const { key, at } of topKeys(body)) {
      const inner = body.indexOf("{", at)
      if (inner < 0 || /^[\s]*[^{\s]/.test(body.slice(at, inner))) continue
      const values = topKeys(block(body, inner)).map((k) => k.key)
      if (values.length) axes[key] = [...new Set([...(axes[key] ?? []), ...values])]
    }
  }
  return axes
}

/** Named string unions in the file: type Name = "a" | "b" (one line or many). */
export function namedUnions(s) {
  const out = {}
  const re = /\btype\s+(\w+)\s*=\s*((?:\s*\|?\s*"[\w-]+"\s*)+(?:\|\s*"[\w-]+"\s*)*)(?=[\n;]|$)/g
  let m
  while ((m = re.exec(s))) {
    const values = [...m[2].matchAll(/"([\w-]+)"/g)].map((x) => x[1])
    if (values.length > 1) out[m[1]] = values
  }
  // type Name = A | B where A and B are named unions already seen
  const re2 = /\btype\s+(\w+)\s*=\s*(\w+(?:\s*\|\s*\w+)+)\s*$/gm
  while ((m = re2.exec(s))) {
    const parts = m[2].split("|").map((p) => p.trim())
    if (parts.every((p) => out[p])) out[m[1]] = parts.flatMap((p) => out[p])
  }
  return out
}

/** `as const` maps whose keys are used as an axis: const NAME = { a: …, b: … } as const. */
export function constMaps(s) {
  const out = {}
  const re = /\bconst\s+([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=\s*\{/g
  let m
  while ((m = re.exec(s))) {
    const body = block(s, m.index + m[0].length - 1)
    const keys = topKeys(body).map((k) => k.key)
    if (keys.length > 1) out[m[1]] = keys
  }
  return out
}

/** Axes from props: inline unions, named unions, keyof typeof MAP, and `kind` discriminants. */
export function propAxes(s, unions, maps) {
  const axes = {}
  const add = (k, vs) => (axes[k] = [...new Set([...(axes[k] ?? []), ...vs])])
  let m
  const inline = /^\s+(?:readonly\s+)?([a-z]\w*)\??:\s*((?:\s*\|?\s*"[\w-]+"\s*)+(?:\|\s*"[\w-]+"\s*)*)(?=[\n;]|$)/gm
  while ((m = inline.exec(s))) {
    const vs = [...m[2].matchAll(/"([\w-]+)"/g)].map((x) => x[1])
    if (vs.length > 1) add(m[1], vs)
  }
  const named = /^\s+(?:readonly\s+)?([a-z]\w*)\??:\s*(\w+)\s*$/gm
  while ((m = named.exec(s))) if (unions[m[2]]) add(m[1], unions[m[2]])
  const keyed = /\b([a-z]\w*)\??:\s*keyof typeof (\w+)/g
  while ((m = keyed.exec(s))) if (maps[m[2]]) add(m[1], maps[m[2]])
  const kinds = [...s.matchAll(/\bkind:\s*"([\w-]+)"/g)].map((x) => x[1])
  if (kinds.length > 1) add("kind", kinds)
  return axes
}

/** Exported PascalCase components: `export function X`, `export { X, Y }`, `export const X = (`. */
export function exportedComponents(s) {
  const names = new Set()
  for (const m of s.matchAll(/^export\s+(?:default\s+)?function\s+([A-Z]\w*)/gm)) names.add(m[1])
  for (const m of s.matchAll(/^export\s+\{([^}]+)\}/gm))
    for (const part of m[1].split(","))
      {
        const n = part.trim().split(/\s+as\s+/).pop()
        if (n && /^[A-Z]\w*$/.test(n) && !/^(?!use)[a-z]/.test(n)) names.add(n)
      }
  return [...names].filter((n) => new RegExp(`\\bfunction\\s+${n}\\b|\\bconst\\s+${n}\\s*=`).test(s))
}
