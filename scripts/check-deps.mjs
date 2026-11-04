// npm run check:deps (George 2026-10-31, before the data grid round: "now is the time to make sure
// we have the right tools that don't clash with each other"). packages/ui/STACK.md is the ledger:
// one tool per job. This script holds it from the lockfile and packages/ui/package.json:
//   EXCLUDED   a direct runtime dependency that does a job a listed tool already does
//   DUPLICATE  a family that must resolve to one version resolves to more (runtime tree only)
//   UNLISTED   a direct runtime dependency with no row in STACK.md § 1
// Transitive packages (date-fns under react-day-picker, zustand under xyflow…) are not findings:
// STACK.md § 2 names them so they are recognised, and rule 2 catches a second copy of the ones
// that matter.
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const pkg = JSON.parse(readFileSync(join(root, "packages/ui/package.json"), "utf8"))
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"))
const stack = readFileSync(join(root, "packages/ui/STACK.md"), "utf8")

const findings = []
const report = (kind, msg) => findings.push(`${kind.padEnd(10)} ${msg}`)

// 1. Excluded tools (STACK.md § 4.1). A pattern is a string (exact) or a RegExp (family).
const EXCLUDED = [
  ["@base-ui/react", "Radix through src/base (I-02); re-base the item at Conform"],
  ["@headlessui/react", "radix-ui"],
  ["react-aria-components", "radix-ui"],
  [/^@radix-ui\/react-(?!icons$).+/, "the radix-ui meta-package, through src/base"],
  ["tailwind-variants", "class-variance-authority (INTAKE.md § 5.2)"],
  ["motion", "Radix Presence + tw-animate-css (D-03)"],
  ["framer-motion", "Radix Presence + tw-animate-css (D-03)"],
  ["tailwindcss-animate", "tw-animate-css"],
  ["react-icons", "lucide-react"],
  ["@heroicons/react", "lucide-react"],
  ["@tabler/icons-react", "lucide-react"],
  ["@radix-ui/react-icons", "lucide-react"],
  ["date-fns", "Intl in lib/dates.ts (it is react-day-picker's, not ours)"],
  ["dayjs", "Intl in lib/dates.ts"],
  ["luxon", "Intl in lib/dates.ts"],
  ["moment", "Intl in lib/dates.ts"],
  ["react-hook-form", "src/forms (Field by name, values.ts)"],
  ["zod", "src/forms + the API error adapter (zod is Storybook's dev dependency only)"],
  ["yup", "src/forms"],
  ["valibot", "src/forms"],
  ["@hello-pangea/dnd", "@dnd-kit (D-04)"],
  ["react-beautiful-dnd", "@dnd-kit (D-04)"],
  ["@dnd-kit/react", "@dnd-kit/core (the classic kit; the rewrite is watched, not adopted)"],
  ["react-window", "@tanstack/react-virtual"],
  ["react-virtuoso", "@tanstack/react-virtual"],
  ["reactflow", "@xyflow/react (the same library's new name)"],
  [/^ag-grid-/, "@tanstack/react-table (DataTable)"],
  [/^@mui\//, "radix-ui + Tailwind"],
  ["antd", "radix-ui + Tailwind"],
  ["classnames", "clsx + tailwind-merge (cn)"],
  ["react-hot-toast", "sonner (Toast, R19-05)"],
  ["@tanstack/react-query", "a consumer's concern, not the package's"],
  ["swr", "a consumer's concern, not the package's"],
]
const direct = Object.keys(pkg.dependencies ?? {})
for (const name of direct) {
  const hit = EXCLUDED.find(([p]) => (p instanceof RegExp ? p.test(name) : p === name))
  if (hit) report("EXCLUDED", `${name}  does a job the stack already covers: ${hit[1]} (STACK.md § 1)`)
}

// 2. One version per family in the runtime tree (STACK.md § 4.2).
const FAMILIES = [
  /^react$/, /^react-dom$/, /^radix-ui$/, /^@radix-ui\//, /^@tanstack\//, /^@dnd-kit\//, /^@floating-ui\//,
  /^@tiptap\//, /^prosemirror-/, /^lucide-react$/, /^class-variance-authority$/, /^tailwind-merge$/, /^clsx$/,
  /^cmdk$/, /^sonner$/, /^recharts$/, /^@xyflow\/react$/,
]
const versions = new Map()
for (const [path, entry] of Object.entries(lock.packages ?? {})) {
  if (!path || entry.dev) continue
  const name = path.split("node_modules/").pop()
  if (!FAMILIES.some((f) => f.test(name))) continue
  if (!versions.has(name)) versions.set(name, new Map())
  const where = versions.get(name)
  where.set(entry.version, [...(where.get(entry.version) ?? []), path])
}
for (const [name, where] of [...versions].sort(([a], [b]) => a.localeCompare(b))) {
  if (where.size < 2) continue
  const detail = [...where].map(([v, paths]) => `${v} (${paths[0]}${paths.length > 1 ? ` +${paths.length - 1}` : ""})`).join(", ")
  report("DUPLICATE", `${name}  resolves to ${where.size} versions: ${detail}`)
}

// 3. Every direct runtime dependency has a row in STACK.md § 1.
const section = stack.split(/^## 2\./m)[0]
for (const name of direct) {
  if (!section.includes(`\`${name}\``)) report("UNLISTED", `${name}  has no row in packages/ui/STACK.md § 1 (one tool per job: say the job, who imports it, what it excludes)`)
}

for (const f of findings) console.error(f)
console.log(`${direct.length} runtime dependencies, ${versions.size} watched packages. ${findings.length} dependency finding(s).`)
process.exit(findings.length ? 1 : 0)
