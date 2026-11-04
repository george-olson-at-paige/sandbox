// npm run check:vocab (ARCHETYPES.md §7.3): every component file declares its archetype and speaks
// the vocabulary. The words are packages/ui/src/lib/vocabulary.ts (imported here; Node strips the
// types), the parsing is audit.mjs's (source-axes.mjs). Findings:
//   ARCHETYPE  no `@archetype X` in the header, or a name that isn't one of ARCHETYPES
//   AXIS       a vocabulary axis the file's archetype doesn't have (`size` on a Composite)
//   VALUE      a value on a vocabulary axis that isn't in the axis's set (Dot's `tone: primary`),
//              or a retired word with a new home (RETIRED_VALUES)
//   RETIRED    a retired prop name (`variant`, `appearance`; RETIRED_PROPS)
//   INLINE     an inline string union on a vocabulary axis (`tone?: "a" | "b"`): import the type
// Mode (§8 step 3): warnings, exit 0, until the words are decided; `--strict` exits 1 when a file
// at level 2 or above (the story's `level-n` tag or the header's `@level n`) has a finding.
// `kind` is a discriminant and is allowed everywhere; booleans are not axes.
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { constMaps, cvaAxes, exportedComponents, namedUnions, propAxes, read, walk } from "./source-axes.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = join(root, "packages/ui/src")
const vocab = await import(pathToFileURL(join(src, "lib/vocabulary.ts")).href)
const { ARCHETYPES, ARCHETYPE_AXES, AXIS_VALUES, RETIRED_PROPS, RETIRED_VALUES } = vocab
const strict = process.argv.includes("--strict")
const AXES = Object.keys(AXIS_VALUES)
const NOT_AXES = new Set(["className", "children", "id", "name", "label", "href", "value", "kind"])

const levelOf = (file, source) => {
  const header = /@level\s+(\d)/.exec(source)
  if (header) return Number(header[1])
  const story = file.replace(/\.tsx?$/, ".stories.tsx")
  if (!existsSync(story)) return null
  const tag = /"level-(\d)"/.exec(readFileSync(story, "utf8"))
  return tag ? Number(tag[1]) : null
}

const findings = []
const report = (kind, file, level, msg) => findings.push({ kind, file, level, msg })

for (const f of walk(src).sort()) {
  const s = read(f)
  const components = exportedComponents(s)
  if (!components.length) continue
  const rel = relative(src, f).split(sep).join("/")
  const level = levelOf(f, s)
  const archetype = /@archetype\s+([A-Z]\w*)/.exec(s)?.[1]
  if (!archetype) report("ARCHETYPE", rel, level, "no `@archetype` in the header (ARCHETYPES.md §2; one of " + ARCHETYPES.join(" · ") + ")")
  else if (!ARCHETYPES.includes(archetype)) report("ARCHETYPE", rel, level, `\`@archetype ${archetype}\` is not one of ${ARCHETYPES.join(" · ")}`)
  const allowed = archetype && ARCHETYPES.includes(archetype) ? ARCHETYPE_AXES[archetype] : null

  const axes = propAxes(s, namedUnions(s), constMaps(s))
  for (const [k, v] of Object.entries(cvaAxes(s))) axes[k] = [...new Set([...(axes[k] ?? []), ...v])]
  for (const [axis, values] of Object.entries(axes)) {
    if (NOT_AXES.has(axis)) continue
    if (values.every((v) => /^(true|false)$/.test(v))) continue
    if (RETIRED_PROPS[axis]) {
      report("RETIRED", rel, level, `prop \`${axis}\` (${values.join(" · ")}) is retired: ${RETIRED_PROPS[axis]}`)
      for (const r of RETIRED_VALUES) if (r.onAxis === axis && values.includes(r.word)) report("VALUE", rel, level, `\`${axis}: ${r.word}\` → ${r.use}`)
      continue
    }
    if (!AXES.includes(axis)) continue
    if (allowed && !allowed.includes(axis)) report("AXIS", rel, level, `\`${axis}\` is not an axis of ${archetype} (${allowed.length ? allowed.join(" · ") : "none of its own"})`)
    const set = AXIS_VALUES[axis]
    for (const v of values) {
      if (/^(true|false|default)$/.test(v)) continue
      const retired = RETIRED_VALUES.find((r) => r.onAxis === axis && r.word === v)
      if (retired) report("VALUE", rel, level, `\`${axis}: ${v}\` → ${retired.use}`)
      else if (!set.includes(v)) report("VALUE", rel, level, `\`${axis}: ${v}\` is not in the ${axis} set (${set.join(" · ")})`)
    }
  }

  const inline = new RegExp(`^\\s+(?:readonly\\s+)?(${AXES.join("|")})\\??:\\s*"[\\w-]+"(?:\\s*\\|\\s*"[\\w-]+")+`, "gm")
  for (const m of s.matchAll(inline)) report("INLINE", rel, level, `\`${m[1]}\` is an inline union; import the type from lib/vocabulary (\`Extract<…>\` to narrow)`)
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.kind.localeCompare(b.kind))
const errors = findings.filter((x) => strict && x.level != null && x.level >= 2)
for (const x of findings) {
  const sev = errors.includes(x) ? "error" : "warn"
  console.log(`${sev.padEnd(5)} ${x.kind.padEnd(9)} ${x.file}${x.level != null ? `  (level ${x.level})` : ""}  ${x.msg}`)
}
const byKind = Object.entries(findings.reduce((acc, x) => ((acc[x.kind] = (acc[x.kind] ?? 0) + 1), acc), {}))
  .map(([k, n]) => `${k} ${n}`)
  .join(", ")
console.log(`${findings.length} vocabulary finding(s)${findings.length ? ` (${byKind})` : ""} in ${new Set(findings.map((x) => x.file)).size} file(s); ${strict ? `${errors.length} error(s) at level 2+` : "warn mode (--strict to fail at level 2+)"}.`)
process.exit(errors.length ? 1 : 0)
