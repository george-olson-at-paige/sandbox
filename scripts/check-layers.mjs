// Layer order (R7-02, R1-22). A grep-level stand-in for an ESLint rule (no ESLint in the spike;
// the real package moves this to @paige/guardrails, R2-42). Rules:
//   TIER   a package file imports only its own tier or a lower one (TIERS below, lowest first).
//          Peers listed together in one tier ([vault, admin]) may not
//          import each other.
//   BASE   only the Paige layer over upstream imports src/base (shadcn): src/components,
//          src/charts (the chart base, R8-09), and src/forms for the bases it wraps (Field,
//          Calendar, Popover; R7-03). Base files may import each other.
//   CYCLE  no runtime import cycle between package files, whatever their tiers (`import type`
//          erases at build and is not an edge; a dynamic import() is).
//   GROUP  inside a GROUPED folder the root holds the parts its groups share and each subfolder is
//          a group: a group imports the root, never another group; the root never imports a group.
//          src/vault (the fact groups areas, people, documents… S-17; they meet only through the
//          catalog) and src/admin (one group, pages/: a page module imports the site's parts, a
//          part never imports a page; 2026-10-30, after PartnerLogo was found the wrong way round).
//   FOLDER every package folder is in TIERS or FREE, so a new folder can't dodge the order.
//   ALIAS  no `@/…` or `"cn"` import inside the package (R2-39).
//   CLIENT a "use client" file outside src/base exports no cva helper (R2-33).
//   FIELDID no `id=` on a control (Input, Textarea, Select, the typed fields) written inside a
//          <Field> (R8-05, GAPS #106): the Field owns the id and ignores the control's; set it on
//          <Field id>. Checked in the package (stories too) and the app.
//   PRIMITIVE outside src/base, a primitive (`radix-ui`, `cmdk`) is imported only for a part the
//          base does not export (U-12): the file and the parts it may touch are listed in
//          PRIMITIVE_OK with the reason.
//          Everything the base re-exports (Root, Trigger, Portal, Overlay, Title…) is taken from
//          the base, so an upstream change to those is inherited.
// Stories (*.stories.tsx), src/stories, src/foundations and src/docs show things side by side and
// may import any tier (BASE still applies). src/setup is the third product area (Essential Setup:
// its parts, FlowFooter and StepRail, and its composed steps as stories), a peer of vault and admin
// since 2026-10-30. The app is held to the package's public entry points by scripts/check-exports.mjs.
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"

/** The layer order, lowest first: the single declared list. Paths are relative to packages/ui/src. */
const TIERS = [
  ["lib"],
  ["icons", "schemas"],
  ["base"],
  ["primitives"],
  ["components"],
  // charts/ is its own tier just above components (R9-06; R8-06 had them as peers): its own
  // entry points, its libraries (Recharts, React Flow, dagre) behind lazy imports, so a page that
  // never imports charts/ never loads them; and it may build on components (the graph frame's
  // buttons, tooltip, table, skeleton). Nothing in components imports charts.
  ["charts"],
  ["forms"],
  ["patterns"],
  // Shared chrome below the products (R8-06): both vault/ and admin/ may use shell/.
  ["shell"],
  // The products' own pieces: customer (vault), admin, Essential Setup (setup: FlowFooter,
  // StepRail; its page frame, SetupBeat, is a template like AreaPage and AdminPage) and the door
  // (auth, REVIEW-18: the sign-in, register, code, password and email-link pages as stories of
  // the AuthPage template; parts land here when two pages share one), peers that never import
  // each other.
  ["vault", "admin", "setup", "auth"],
  ["templates"],
]
/** Folders outside the order: they may import any tier. */
// fixtures (R17-03): the one copy of the story and app data; free to import anything, and never imported by package code.
// labs (LEVELS.md, level 0): sketches; may use anything, and nothing in the package may import them.
const FREE = ["stories", "fixtures", "foundations", "docs", "labs"]

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const src = join(root, "packages/ui/src")
const baseDir = join(src, "base")
/** The folders that wrap upstream bases (BASE rule). */
const BASE_IMPORTERS = ["components", "charts", "forms"].map((d) => join(src, d))
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (n === "node_modules" || n === ".next" || n === "storybook-static") return []
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : []
  })

/** Folders whose root holds shared parts and whose subfolders are groups (GROUP rule). */
const GROUPED = ["vault", "admin"].map((name) => ({ name, dir: join(src, name) }))
/** A file's group folder inside `dir`, or "" for the root. */
const groupOf = (dir, f) => {
  const parts = relative(dir, f).split(sep)
  return parts.length > 1 ? parts[0] : ""
}
const inside = (file, dir) => !relative(dir, file).startsWith("..")
const groupedOf = (f) => GROUPED.find(({ dir }) => inside(f, dir))
const rel = (f) => relative(root, f).split(sep).join("/")
const top = (f) => relative(src, f).split(sep)[0]
const isStory = (f) => /\.stories\.tsx?$/.test(f) || /\.test\.ts$/.test(f)
const tierOf = (f) => {
  const t = top(f)
  if (FREE.includes(t)) return { free: true }
  const i = TIERS.findIndex((group) => group.includes(t))
  return i < 0 ? null : { index: i, folder: t }
}
const importRe = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g
const exts = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]
const resolveRel = (from, spec) => {
  const p = resolve(dirname(from), spec)
  for (const e of exts) {
    try {
      if (statSync(p + e).isFile()) return p + e
    } catch {
      /* try the next extension */
    }
  }
  return null
}

let findings = 0
const report = (kind, msg) => {
  findings++
  console.log(`${kind.padEnd(6)} ${msg}`)
}

const pkgFiles = walk(src)
const graph = new Map()

for (const f of pkgFiles) {
  const tier = tierOf(f)
  if (!tier && !isStory(f)) report("FOLDER", `${rel(f)}  is in src/${top(f)}, which is in neither TIERS nor FREE (scripts/check-layers.mjs)`)
  const edges = []
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(importRe)) {
      const spec = m[1]
      if (/^@\//.test(spec) || spec === "cn")
        report("ALIAS", `${rel(f)}:${i + 1}  imports ${spec} (use a relative path; npm run ui:add -w packages/ui -- --rewrite-only)`)
      if (!spec.startsWith(".")) continue
      const target = resolveRel(f, spec)
      if (!target || !inside(target, src)) continue
      if (inside(target, baseDir) && !inside(f, baseDir) && !BASE_IMPORTERS.some((d) => inside(f, d)))
        report("BASE", `${rel(f)}:${i + 1}  imports ${spec} (use the Paige layer: src/components or src/forms)`)
      if (isStory(f)) continue
      // A type-only import erases at build, so it is not a runtime cycle (the tier rule still applies).
      if (!/^\s*import\s+type\b/.test(line)) edges.push(target)
      const grouped = groupedOf(f)
      if (grouped && inside(target, grouped.dir)) {
        const from = groupOf(grouped.dir, f)
        const into = groupOf(grouped.dir, target)
        if (into && into !== from)
          report("GROUP", `${rel(f)}:${i + 1}  imports ${spec}: ${from ? `${grouped.name}/${from}` : `the ${grouped.name} root`} may not import the group ${grouped.name}/${into} (groups import the root, never each other)`)
      }
      if (!tier || tier.free) continue
      const to = tierOf(target)
      if (!to || to.free) {
        if (to?.free) report("TIER", `${rel(f)}:${i + 1}  imports ${spec} from src/${top(target)} (story-only folders are not importable by package code)`)
        continue
      }
      if (to.index > tier.index)
        report("TIER", `${rel(f)}:${i + 1}  imports ${spec}: ${tier.folder} may not import ${to.folder} (upward; order is ${TIERS.map((g) => g.join("|")).join(" → ")})`)
      else if (to.index === tier.index && to.folder !== tier.folder)
        report("TIER", `${rel(f)}:${i + 1}  imports ${spec}: ${tier.folder} and ${to.folder} are peers and may not import each other`)
    }
  })
  if (!isStory(f)) graph.set(f, edges)
}

// Cycles: Tarjan's strongly connected components over package (non-story) files.
{
  let n = 0
  const idx = new Map()
  const low = new Map()
  const stack = []
  const on = new Set()
  const sccs = []
  const visit = (v) => {
    idx.set(v, n)
    low.set(v, n++)
    stack.push(v)
    on.add(v)
    for (const w of graph.get(v) ?? []) {
      if (!graph.has(w)) continue
      if (!idx.has(w)) {
        visit(w)
        low.set(v, Math.min(low.get(v), low.get(w)))
      } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)))
    }
    if (low.get(v) === idx.get(v)) {
      const scc = []
      let w
      do {
        w = stack.pop()
        on.delete(w)
        scc.push(w)
      } while (w !== v)
      if (scc.length > 1 || (graph.get(v) ?? []).includes(v)) sccs.push(scc)
    }
  }
  for (const v of graph.keys()) if (!idx.has(v)) visit(v)
  for (const scc of sccs) report("CYCLE", scc.map(rel).join(" ↔ "))
}

// Server-safe helpers (R2-33, GAPS #19): a "use client" file must not export a cva helper,
// because a server component that calls it fails at build. Helpers pages may call live in a
// file without the directive (tabs-pill-styles.ts, control.ts, card.tsx…). Upstream bases
// (src/base) are exempt: they're upstream as written, and only the Paige layer imports them.
for (const f of pkgFiles) {
  if (inside(f, baseDir)) continue
  const text = readFileSync(f, "utf8")
  if (!/^\s*["']use client["']/.test(text)) continue
  const cvaNames = [...text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*cva\(/g)].map((m) => m[1])
  const exported = new Set([
    ...[...text.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop())),
    ...[...text.matchAll(/export\s+(?:const|let)\s+(\w+)\s*=\s*cva\(/g)].map((m) => m[1]),
  ])
  for (const name of cvaNames.filter((n) => exported.has(n)).concat([...text.matchAll(/export\s+(?:const|let)\s+(\w+)\s*=\s*cva\(/g)].map((m) => m[1]).filter((n) => !cvaNames.includes(n))))
    report("CLIENT", `${rel(f)}  exports cva helper ${name} from a "use client" file (move it to a file without the directive)`)
}

// The app never reaches into the package by path (it imports @paige/ui/…; check:exports holds
// it to the public entry points).
const app = join(root, "apps/web")
for (const f of walk(app)) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(importRe)) {
      const spec = m[1]
      if (spec.startsWith(".") && inside(resolve(dirname(f), spec), join(root, "packages")))
        report("PATH", `${rel(f)}:${i + 1}  imports ${spec} (import @paige/ui/<entry>, never a path into the package)`)
      if (/^@paige\/ui\/base(\/|$)/.test(spec)) report("BASE", `${rel(f)}:${i + 1}  imports ${spec} (use the Paige layer: src/components)`)
    }
  })
}

// FIELDID (R8-05): an id written on a Field-hosted control inside a <Field> … </Field> region.
{
  const CONTROL = /<(Input|Textarea|Select|DateField|DateOfBirthField|PhoneField|PostalCodeField|SsnField|CurrencyField|PasswordField)\b[^>]*\bid=/
  const files = [...pkgFiles.filter((f) => !inside(f, baseDir)), ...walk(app)].filter((f) => f.endsWith(".tsx"))
  for (const f of files) {
    let depth = 0
    readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      depth += (line.match(/<Field(?=[\s>])/g) ?? []).length - (line.match(/<Field(?=[\s>])[^>]*\/>/g) ?? []).length
      if (depth > 0 && CONTROL.test(line)) report("FIELDID", `${rel(f)}:${i + 1}  sets id on a control inside a Field (the Field owns it: <Field id="…">)`)
      depth = Math.max(0, depth - (line.match(/<\/Field>/g) ?? []).length)
    })
  }
}

// PRIMITIVE (U-12): the Paige layer reaches past its base into radix-ui or cmdk only for a part the base
// does not export. Each file names the parts it may use; any other part, or any other file, is a
// finding (take it from the base's re-exports, or add the part here with its reason).
{
  const PRIMITIVE_OK = {
    // The base's DialogContent carries its own overlay and a centred box that can't cap its height
    // at the viewport; Root, Portal, Overlay, Title, Description and Close come from the base.
    "packages/ui/src/components/overlays/dialog.tsx": ["Dialog", ["Content"]],
    // Same for AlertDialogContent; the base's Cancel also applies buttonVariants, which would fight
    // the Paige Button it wraps with asChild.
    "packages/ui/src/components/overlays/confirm-dialog.tsx": ["AlertDialog", ["Content", "Cancel"]],
    // ItemIndicator is not re-exported by the base (upstream draws it inside CheckboxItem/RadioItem).
    "packages/ui/src/components/actions/dropdown-menu.tsx": ["DropdownMenu", ["ItemIndicator"]],
    // Slot for asChild, as the base's own Button uses it.
    "packages/ui/src/components/actions/button.tsx": ["Slot", []],
    // Slot for asChild on the list and the item (R20-19); no base re-exports it.
    "packages/ui/src/components/inputs/sortable.tsx": ["Slot", []],
    // The `card` item (R21-01): the base's Item applies toggleVariants (a 36px inline toggle) that a
    // segment card had to undo class by class; Radix's Item with asChild puts the behaviour on a
    // plain button. The Root, and the `icon` item, still come from the base.
    "packages/ui/src/components/inputs/toggle-group.tsx": ["ToggleGroup", ["Item"]],
  }
  for (const f of pkgFiles) {
    if (inside(f, baseDir) || isStory(f)) continue
    const text = readFileSync(f, "utf8")
    const m = /import\s*\{([^}]*)\}\s*from\s*["'](?:radix-ui|@radix-ui\/[\w-]+|cmdk)["']/.exec(text)
    if (!m) continue
    const ok = PRIMITIVE_OK[rel(f)]
    if (!ok) {
      report("PRIMITIVE", `${rel(f)}  imports a primitive (radix-ui, cmdk) directly (take the part from src/base's re-exports, or list it in PRIMITIVE_OK with the reason)`)
      continue
    }
    const [name, parts] = ok
    const imported = m[1].split(",").map((s) => s.trim())
    const alias = imported.map((s) => s.split(/\s+as\s+/)).find(([n]) => n === name)
    if (!alias || imported.length > 1) report("PRIMITIVE", `${rel(f)}  imports ${imported.join(", ")} from a primitive; only ${name} is listed in PRIMITIVE_OK`)
    const local = alias?.[1] ?? alias?.[0]
    if (!local || !parts.length) continue
    const used = new Set([...text.matchAll(new RegExp(`\\b${local}\\.(\\w+)`, "g"))].map((x) => x[1]))
    for (const p of used) if (!parts.includes(p)) report("PRIMITIVE", `${rel(f)}  uses ${local}.${p}; the base re-exports it (or add it to PRIMITIVE_OK with the reason)`)
  }
}

console.log(`\nLayer order: ${TIERS.map((g) => g.join("|")).join(" → ")}  (free: ${FREE.join(", ")})`)
console.log(`${findings} layer finding(s).`)
process.exit(findings > 0 ? 1 : 0)
