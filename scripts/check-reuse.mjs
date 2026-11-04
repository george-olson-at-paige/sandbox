// npm run check:reuse (REUSE.md §3): the reuse rules that are settled enough to fail the build.
// audit-reuse.mjs asks the open questions and writes a report; this one holds the answers.
//   PRESSABLE  a Paige file that writes a raw <button> says how it focuses (R15-17, U-07): it uses
//              one of the focus helpers (`pressable`, `focus-ring`, `cardFocus`, `controlFocus`,
//              `menuItem`, `popoverItem`, or a `focus-visible:` class of its own), or composes a
//              class constant imported from a Paige file that does (QuickAdd's `personPill`).
//              Otherwise the button has the browser's default ring, not Paige's.
//   ARROWKEYS  a Paige file that handles "ArrowDown"/"ArrowUp" is one of the known homes (U-01): a
//              list you type over is Combobox (cmdk under it) or a Radix menu/select, not a third
//              set of arrow keys. The homes are listed in ARROW_OK with the reason each one is not
//              a list; anything else is flagged.
// Base files, stories, tests and the story-only folders are not checked.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = join(root, "packages/ui/src")
const SKIP_DIRS = new Set(["base", "stories", "docs", "foundations", "fixtures", "labs", "node_modules"])

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(n) ? [] : walk(p)
    return /\.tsx?$/.test(n) && !/\.(stories|test)\.tsx?$/.test(n) ? [p] : []
  })
const rel = (f) => relative(src, f).split(sep).join("/")
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const files = walk(src).map((f) => ({ file: rel(f), source: stripComments(readFileSync(f, "utf8")) }))
const bySrcPath = new Map(files.map((f) => [f.file.replace(/\.tsx?$/, ""), f]))
/** Relative imports of a file, resolved to src-relative paths without extension. */
const localImports = (f) =>
  [...f.source.matchAll(/from "(\.{1,2}\/[^"]+)"/g)].map((m) => {
    const parts = dirname(f.file).split("/").filter((p) => p && p !== ".")
    for (const seg of m[1].split("/")) {
      if (seg === "..") parts.pop()
      else if (seg !== ".") parts.push(seg)
    }
    return parts.join("/").replace(/\.tsx?$/, "")
  })

const FOCUS_HELPER = /focus-ring|cardFocus|controlFocus|\bpressable\b|\bmenuItem\b|popoverItem|focus-visible:/
/** Named imports from Paige files, as [exported name, source-relative target path]. */
const namedImports = (f) =>
  [...f.source.matchAll(/import\s*\{([^}]*)\}\s*from\s*"(\.{1,2}\/[^"]+)"/g)].flatMap((m) => {
    const target = localImports({ file: f.file, source: `from "${m[2]}"` })[0]
    return m[1].split(",").map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]).filter(Boolean).map((name) => [name, target])
  })
/** Whether `name`, as exported by `target`, is a class constant whose declaration composes a focus helper. */
const composesFocus = (target, name) => {
  if (!target) return false
  const alias = new RegExp(`\\b(\\w+)\\s+as\\s+${name}\\b`).exec(target.source) // export { PILL as personPill }
  const decl = new RegExp(`(?:const|let)\\s+${alias ? alias[1] : name}\\s*=\\s*([^\\n]*)`).exec(target.source)
  return Boolean(decl && FOCUS_HELPER.test(decl[1]))
}
const saysHowItFocuses = (f) => FOCUS_HELPER.test(f.source) || namedImports(f).some(([name, path]) => composesFocus(bySrcPath.get(path), name))

// Files that may handle "ArrowDown"/"ArrowUp" themselves, and why (U-01).
const ARROW_OK = new Map([
  ["components/inputs/combobox.tsx", "the home: opens the list on Arrow when closed; cmdk moves the highlight once it is open"],
  ["forms/fields/date-field.tsx", "Alt+ArrowDown opens the calendar (the date picker convention), not a list"],
  ["charts/dag-frame.tsx", "pans the graph canvas, not a list"],
])

let findings = 0
const report = (kind, msg) => {
  findings++
  console.log(`${kind.padEnd(9)} ${msg}`)
}

for (const f of files) {
  const buttons = (f.source.match(/<button(?=[\s/>])/g) ?? []).length
  if (buttons && !saysHowItFocuses(f))
    report("PRESSABLE", `packages/ui/src/${f.file}  writes <button> ×${buttons} and no focus style (compose \`pressable\` from components/internal/control.ts, or one of the other focus helpers)`)
  const arrows = (f.source.match(/"Arrow(?:Down|Up)"/g) ?? []).length
  if (arrows && !ARROW_OK.has(f.file))
    report("ARROWKEYS", `packages/ui/src/${f.file}  handles Arrow keys ×${arrows}; a list you type over is Combobox (components/inputs/combobox.tsx), or add it to ARROW_OK with the reason it is not a list`)
}

console.log(`${files.length} files. ${findings} reuse finding(s).`)
process.exit(findings > 0 ? 1 : 0)
