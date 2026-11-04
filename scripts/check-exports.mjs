// Public surface (R7-05). packages/ui/package.json `exports` lists every entry point by name; no
// wildcards. An entry's key is its file's path under src/ without the extension
// (`./forms/fields/date-field` → `./src/forms/fields/date-field.tsx`), so the import names the
// file. Rules:
//   MISSING  an exports target doesn't exist.
//   PRIVATE  an entry points at base/, an internal/ folder, a story, a test or a story-only folder.
//   KEY      an entry's key isn't its file's path (the rule above).
//   UNLISTED a public file (any .ts/.tsx in a tier folder outside internal/, not a story or test)
//            has no entry. Make it internal (move it into the folder's internal/) or list it.
//   APP      apps/web imports an @paige/ui path that isn't an entry.
// `node scripts/check-exports.mjs --write` rewrites the exports map from the tree (sorted), for
// after a move; review the diff.
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs"
import { join, relative, sep } from "node:path"

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const pkgDir = join(root, "packages/ui")
const pkgFile = join(pkgDir, "package.json")
const pkg = JSON.parse(readFileSync(pkgFile, "utf8"))
const src = join(pkgDir, "src")
/** Folders whose files are public unless under internal/ (the tiers in check-layers.mjs, minus base). */
// fixtures (R17-03) is an entry so the app imports the same data the stories use; dev data, not product code.
const PUBLIC = ["lib", "icons", "schemas", "primitives", "components", "charts", "forms", "patterns", "shell", "vault", "admin", "setup", "templates", "fixtures"]
/** Non-code entries, listed by hand. */
const ASSETS = { "./theme.css": "./src/theme.css" }

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (n === "node_modules" || n === ".next" || n === "storybook-static") return []
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const posix = (p) => p.split(sep).join("/")
const isPrivatePath = (p) =>
  /(^|\/)(internal|base|stories|foundations|docs)\//.test(p) || /\.(stories|test)\.tsx?$/.test(p) || /\.mdx$/.test(p)
const keyOf = (target) => "./" + target.replace(/^\.\/src\//, "").replace(/\.tsx?$/, "")

const expected = {}
for (const folder of PUBLIC) {
  const dir = join(src, folder)
  if (!existsSync(dir)) continue
  for (const f of walk(dir)) {
    const p = posix(relative(pkgDir, f))
    if (isPrivatePath(p.replace(/^src\//, ""))) continue
    if (!/\.(tsx?|json)$/.test(p)) continue
    expected[keyOf("./" + p)] = "./" + p
  }
}

if (process.argv.includes("--write")) {
  const sorted = Object.fromEntries(Object.entries({ ...ASSETS, ...expected }).sort(([a], [b]) => a.localeCompare(b)))
  pkg.exports = sorted
  writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n")
  console.log(`wrote ${Object.keys(sorted).length} entries to packages/ui/package.json`)
}

let findings = 0
const report = (kind, msg) => {
  findings++
  console.log(`${kind.padEnd(8)} ${msg}`)
}
const exportsMap = pkg.exports ?? {}
for (const [key, target] of Object.entries(exportsMap)) {
  if (typeof target !== "string" || /\*/.test(key)) {
    report("KEY", `${key}: entries are single files, no wildcards or conditions`)
    continue
  }
  if (!existsSync(join(pkgDir, target))) report("MISSING", `${key} → ${target}`)
  if (isPrivatePath(target.replace(/^\.\/src\//, ""))) report("PRIVATE", `${key} → ${target}`)
  if (!ASSETS[key] && keyOf(target) !== key) report("KEY", `${key} → ${target} (key should be ${keyOf(target)})`)
}
for (const [key, target] of Object.entries(expected)) if (!exportsMap[key]) report("UNLISTED", `${target} (list it as "${key}", or move it into an internal/ folder)`)

const importRe = /(?:from|import)\s*\(?\s*["'](@paige\/ui\/[^"']+)["']|@import\s+["'](@paige\/ui\/[^"']+)["']/g
for (const f of walk(join(root, "apps/web"))) {
  if (!/\.(tsx?|css|mjs)$/.test(f)) continue
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(importRe)) {
      const spec = (m[1] ?? m[2]).replace(/^@paige\/ui/, ".")
      if (!exportsMap[spec]) report("APP", `${posix(relative(root, f))}:${i + 1}  imports @paige/ui${spec.slice(1)}, which is not an entry point`)
    }
  })
}
// PROOF (R8-11): a package file marked `@public-entry-points-only` (the admin proof story) is
// built the way an app route is: no relative imports, and every @paige/ui import an entry point.
for (const f of walk(src)) {
  if (!/\.tsx?$/.test(f)) continue
  const text = readFileSync(f, "utf8")
  if (!text.includes("@public-entry-points-only")) continue
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const spec = m[1]
      const where = `${posix(relative(root, f))}:${i + 1}`
      if (spec.startsWith(".")) report("PROOF", `${where}  imports ${spec} (public entry points only: @paige/ui/<entry>)`)
      else if (spec.startsWith("@paige/ui") && !exportsMap[spec.replace(/^@paige\/ui/, ".")]) report("PROOF", `${where}  imports ${spec}, which is not an entry point`)
    }
  })
}

console.log(`\n${Object.keys(exportsMap).length} entry points. ${findings} export finding(s).`)
process.exit(findings > 0 ? 1 : 0)
