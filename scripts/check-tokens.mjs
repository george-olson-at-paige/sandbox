// Cheap stand-in for the D10 lint rules: grep-level checks over the spike's own code.
// Upstream shadcn files (packages/ui/src/base) are reported separately,
// because they ship arbitrary values of their own (see GAPS.md).
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (n === "node_modules" || n === ".next") return []
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) ? [p] : []
  })

const files = [...walk(join(root, "packages/ui/src")), ...walk(join(root, "apps/web"))]
const rules = [
  // arbitrary *values* (not arbitrary variants like data-[state=open]:)
  { id: "arbitrary-value", re: /(?<![\w-])(?:[a-z]+:)*[a-z][\w-]*-\[[^\]]+\](?!:)/g, skip: (f) => f.endsWith(".css") },
  // `!` important modifier inside a class string (quoted), e.g. "p-4 !mt-0"
  { id: "important", re: /"[^"]*(?:^|[\s:])![a-z][\w-]*[^"]*"/g, skip: (f) => f.endsWith(".css") },
  // A gap reference ("GAPS #106", "GAPS #102, #106") is not a colour (three-digit gap numbers, R8).
  { id: "hex", re: /(?<!GAPS (?:#\d+, )*)#[0-9a-fA-F]{3,8}\b/g, skip: (f) => f.endsWith("theme.css") },
  { id: "inline-style", re: /style=\{\{/g },
  { id: "cva-outside-ui", re: /\bcva\(/g, skip: (f) => f.includes(join("packages", "ui")) },
  // Page layout (R1-23, R7-01): the frame, gutter and page widths belong to the templates and
  // primitives (packages/ui/src/templates, src/primitives) (and AppHeader's row). Flags a class string that centres a wrapper (mx-auto) and also sets a max
  // width or horizontal padding, and any page-level layout utility used elsewhere.
  {
    id: "page-layout",
    re: /"[^"]*\bmx-auto\b[^"]*(?:max-w-|\bpx-)[^"]*"|"[^"]*(?:max-w-|\bpx-)[^"]*\bmx-auto\b[^"]*"|\b(?:page-frame|px-gutter|max-w-(?:page|focused|wide|[5-7]xl|screen-\w+))\b/g,
    skip: (f) =>
      f.endsWith(".css") ||
      f.includes(join("ui", "src", "templates")) ||
      f.includes(join("ui", "src", "primitives")) ||
      f.includes(join("ui", "src", "base")) ||
      f.includes(join("ui", "src", "lib")) || // the tailwind-merge registry and its tests name the utility
      f.endsWith("app-header.tsx") ||
      f.endsWith(join("foundations", "layout.stories.tsx")),
  },
  // Spacing steps (R2-40, GAPS #3): padding, margin and gap on Tailwind's 4px grid. Layout code
  // (packages/ui/src/primitives, src/templates and the app) uses whole steps only (multiples of
  // 4px); components, forms, patterns, shell and vault may also use half steps (2px) for optical
  // alignment inside a component.
  // Anything finer (0.25, 1.75…) is off the scale everywhere. Named tokens (gap-section,
  // pt-page-top) and px/auto aren't numbers and pass.
  {
    id: "spacing-step",
    re: /(?<![\w-])(?:[\w-]+:)*-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-(\d+(?:\.\d+)?)(?![\w.\-[])/g,
    skip: (f) => f.endsWith(".css") || f.includes(join("ui", "src", "base")),
    allow: (hit, f) => {
      const step = Number(hit.match(/-(\d+(?:\.\d+)?)$/)[1])
      const layout = ["primitives", "templates"].some((d) => f.includes(join("ui", "src", d))) || f.includes(join("apps", "web"))
      return layout ? Number.isInteger(step) : Number.isInteger(step * 2)
    },
  },
  // Motion and stacking (T-12): one speed (--default-transition-duration) and three named
  // stacking steps (z-raised, z-sticky, z-overlay). A bare duration-n or z-n in component code is
  // a number the theme already owns. Stories may still show a speed side by side.
  {
    id: "motion-stack",
    re: /(?<![\w-])(?:[\w\[\]=:-]+:)*(?:duration|z)-\d+(?![\w-])/g,
    skip: (f) =>
      f.endsWith(".css") ||
      f.includes(join("ui", "src", "base")) ||
      f.includes(join("ui", "src", "lib")) || // the tailwind-merge registry and its tests name z-10 as the class a step replaces
      /\.stories\.tsx?$/.test(f),
  },
  // State, ink and alpha (T-07, T-08, T-09): a state is opacity-disabled / -quiet / -dim, never a
  // number (0 and 100 are transition endpoints, not states); white on a tone is text-on-tone; an
  // alpha over a role colour (bg-overlay/8, ring-ring/50, bg-destructive/90) is a named token in
  // theme.css (--overlay-hover, --focus-halo, --destructive-hover), so the number lives once.
  // Geometry (T-01, T-02, T-04, T-05, T-06): a literal whose value has a name in its family.
  // Control: h-11 and min-h-11 (44, h-control), min-h-18 (72, min-h-textarea), size-9 (36, the
  // icon button), pl-9 / pr-9 (a field's 36px inset, pl-control-sm), min-h-9 (a toolbar's or
  // pill's floor). Icon: size-3 / 3.5 / 4 / 5 / 6 through an svg variant ([&_svg]:, [&>svg]:)
  // or on a capitalised JSX element (a lucide icon: <CheckIcon className="size-4" />); a bare
  // size-4 on a span may be a mark or a thumb, which the mark and media scales (T-03) will name.
  // Overlay: w-80 / w-96 / w-112 (popover, popover-wide, dialog-sm), min-w-56 (menu-wide),
  // max-w-md / 2xl / 4xl (the dialogs). Chart: h-40 / 64 / 80 (chart), h-112 / 160 (dag),
  // max-h-96 / 160 (table). Row and bar: h-10 (row-header), h-14 / min-h-14 (bar), h-16
  // (app-header). h-9 (Skeleton's number line) and h-12 (PartnerOffers' logo thumb) are a text
  // line and a media thumb, not on these scales.
  {
    id: "geometry",
    re: /(?<![\w-])(?:[\w\[\]=:*'@/-]+:)*(?:(?:min-h|h)-11|min-h-18|size-9|p[lr]-9|min-h-9|w-(?:80|96|112)|min-w-56|max-w-(?:md|2xl|4xl)|h-(?:40|64|80|112|160)|max-h-(?:96|160)|h-10|(?:min-h|h)-14|h-16)(?![\w.-])|(?<=svg[^"\s]*\]:)size-(?:3|3\.5|4|5|6)(?![\w.-])|(?<=<[A-Z]\w*\b[^>\n]*className="[^"]*?(?:^|\s)?)size-(?:3|3\.5|4|5|6)(?=[\s"])/g,
    skip: (f) =>
      f.endsWith(".css") ||
      f.includes(join("ui", "src", "base")) ||
      f.includes(join("ui", "src", "lib")) || // the merge tests name the classes a token replaces
      f.includes(join("ui", "src", "stories")) || // story helpers (Placeholder) are story scaffolding
      /\.stories\.tsx?$/.test(f),
    allow: (hit, f) =>
      // Two 36s that are not controls and not yet on a scale: Avatar's paw at 2xl (half the 74
      // avatar) and ChoiceCard's icon well. The media scale (T-03, D-07) names or moves them.
      (hit === "size-9" && /(?:avatar|choice-card)\.tsx$/.test(f)) ||
      // ItemMedia's file thumb is the 40px media column (T-03's --spacing-media-column), not a row.
      (hit === "h-10" && f.endsWith(join("display", "item.tsx"))) ||
      // DagFrame's loading blocks are a node at the auto zoom (72 × .75 ≈ 56), not a bar; and
      // height="auto" is its own ladder of 32px steps in dag-shape.ts (384 … 560).
      (hit === "h-14" && f.endsWith("dag-frame.tsx")) ||
      (/^h-(?:96|112)$/.test(hit) && f.endsWith("dag-shape.ts")) ||
      // HeaderSearch's results list caps at 384: a floating list's height, not a table's. A list
      // token waits for a second site that agrees (MultiSelect's list caps at 320).
      (hit === "max-h-96" && f.endsWith("header-search.tsx")),
  },
  {
    id: "state-ink-alpha",
    re: /(?<![\w-])(?:[\w\[\]=:-]+:)*(?:opacity-(?!0(?![\w-])|100(?![\w-]))\d+|text-(?:white|black)|(?:bg|ring|border|text)-(?:overlay|ring|primary|destructive|error|info|success|warning|attention|area|foreground|muted-foreground)\/\d+)(?![\w-])/g,
    skip: (f) =>
      f.endsWith(".css") ||
      f.includes(join("ui", "src", "base")) ||
      f.includes(join("ui", "src", "lib")) || // the merge tests name the classes a token replaces
      /\.stories\.tsx?$/.test(f),
  },
]

let own = 0
let upstream = 0
for (const f of files) {
  const rel = relative(root, f)
  // Upstream code as it arrived: shadcn's bases, and a third-party item landed by ui:intake
  // (INTAKE.md § Step 3, level 0). Counted and shown, never failing; Conform (Step 4) is where
  // its findings go to zero, and a landed item that isn't conformed is visible here until then.
  const isUpstream = rel.includes(join("ui", "src", "base")) || rel.includes(join("ui", "src", "labs", "intake"))
  const lines = readFileSync(f, "utf8").split("\n")
  for (const r of rules) {
    if (r.skip?.(f)) continue
    lines.forEach((line, i) => {
      const hits = (line.match(r.re) ?? [])
        .filter((h) => !/^(data|group-data|has|aria|group-has|not|peer-data|in-data)-/.test(h.replace(/^(?:[a-z]+:)*/, "")))
        .filter((h) => !r.allow?.(h, f))
      for (const h of hits) {
        if (isUpstream) upstream++
        else own++
        console.log(`${isUpstream ? "upstream" : "PAIGE   "} ${r.id.padEnd(16)} ${rel}:${i + 1}  ${h.trim()}`)
      }
    })
  }
}
console.log(`\n${own} finding(s) in Paige code, ${upstream} in upstream files (src/base, labs/intake).`)
process.exit(own > 0 ? 1 : 0)
