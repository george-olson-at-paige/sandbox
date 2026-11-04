// npm run ui:add -w packages/ui -- <name> [<name>…]   (R2-39, GAPS #18; non-interactive since R9-05)
// Adds upstream shadcn components to src/base and makes them build in this package:
//   1. runs the shadcn CLI (pinned) from packages/ui with --yes --overwrite, so it never prompts
//      (GAPS #110: with no terminal the first overwrite prompt ended the run half-written);
//      components.json puts the files in src/base;
//   2. rewrites their imports to relative paths (shadcn-imports.mjs);
//   3. keeps every file that existed before: an existing base the CLI rewrote, or theme.css, is
//      put back as it was and reported as a would-overwrite (identical after the import rewrite
//      = nothing to report). `--replace-existing` keeps the CLI's version of existing bases
//      instead (a deliberate re-add; run diff-base after); theme.css is always kept, and the
//      variables the CLI wanted to add are printed so they can be mapped onto Paige tokens;
//   4. removes the unrelated `cn` npm package if the CLI installed it (the registry lists it);
//   5. runs the package typecheck.
// --rewrite-only skips steps 1 and 3 (re-run the rewrite over src/base). Then add a Base story,
// wrap what a screen needs in src/components, and run diff-base to keep the tripwire honest.
import { execSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { rewriteShadcnImports } from "./shadcn-imports.mjs"

const SHADCN = "shadcn@4.21.1" // pinned; bump deliberately and re-run diff-base afterwards
const pkg = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const args = process.argv.slice(2)
const rewriteOnly = args.includes("--rewrite-only")
const replaceExisting = args.includes("--replace-existing")
const names = args.filter((a) => !a.startsWith("--"))
const run = (cmd) => execSync(cmd, { cwd: pkg, stdio: "inherit" })

const baseDir = join(pkg, "src", "base")
const themePath = join(pkg, "src", "theme.css")
const baseFiles = () => readdirSync(baseDir).filter((n) => /\.tsx?$/.test(n) && !n.endsWith(".stories.tsx"))
/** What existed before the CLI ran: every base file and the theme, by path. */
const before = new Map()

if (!rewriteOnly) {
  if (names.length === 0) {
    console.error("usage: npm run ui:add -w packages/ui -- <name> [<name>…] [--replace-existing]  (or --rewrite-only)")
    process.exit(2)
  }
  // GAPS #111: the CLI installs npm packages; on Windows, a reify while Storybook or the app
  // holds files in node_modules can fail halfway and strip it. Refuse while either answers.
  // STORYBOOK_URL names another worktree's Storybook (as run-plays.mjs and catalog.mjs do);
  // a different tree's server holds a different node_modules, so only this tree's counts.
  const storybook = (process.env.STORYBOOK_URL ?? "http://localhost:6106").replace(/\/?$/, "/")
  const running = []
  for (const [name, url] of [["Storybook", storybook], ["the app", "http://localhost:3105/"]]) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1500) })
      running.push(name)
    } catch {
      /* not running */
    }
  }
  if (running.length && !args.includes("--allow-running")) {
    // R12-02 (GAPS #121): the procedure, said where it's needed. Agents never add a base mid-build.
    console.error(
      [
        `Stop ${running.join(" and ")} first: the shadcn CLI runs npm install, which can strip node_modules while dev servers hold its files (GAPS #111).`,
        "The procedure (packages/ui/CLAUDE.md, How to add a base component):",
        `  1. stop Storybook (${storybook}) and the app (3105), whoever started them (an agent asks; it never stops a server it didn't start)`,
        "  2. npm run ui:add -w packages/ui -- <name>",
        "  3. npm ci (from the spike root: a clean install from the lock file, so nothing half-reified survives)",
        "  4. start Storybook and the app again",
        "--allow-running skips this check (don't).",
      ].join("\n")
    )
    process.exit(2)
  }
  for (const f of baseFiles()) before.set(join(baseDir, f), readFileSync(join(baseDir, f), "utf8"))
  before.set(themePath, readFileSync(themePath, "utf8"))
  // --yes skips the confirmation, --overwrite answers every "file exists" question up front, so
  // the CLI never waits on a terminal; step 3 below puts back what it shouldn't have changed.
  execSync(`npx --yes ${SHADCN} add ${names.join(" ")} --yes --overwrite`, { cwd: pkg, stdio: ["ignore", "inherit", "inherit"] })
}

let changed = 0
for (const f of baseFiles()) {
  const p = join(baseDir, f)
  const before = readFileSync(p, "utf8")
  const after = rewriteShadcnImports(before)
  if (after !== before) {
    writeFileSync(p, after)
    changed++
    console.log(`rewrote imports: src/base/${f}`)
  }
}
console.log(`${changed} file(s) rewritten.`)

if (!rewriteOnly) {
  const kept = []
  for (const [p, original] of before) {
    if (!existsSync(p)) continue
    const now = readFileSync(p, "utf8")
    if (now === original) continue
    const name = relative(pkg, p).split(sep).join("/")
    if (p === themePath) {
      const had = new Set(original.split(/\r?\n/).map((l) => l.trim()))
      const wanted = now.split(/\r?\n/).filter((l) => l.trim() && !had.has(l.trim()))
      writeFileSync(p, original)
      console.log(`\nwould overwrite ${name} (kept as it was). The CLI wanted to add ${wanted.length} line(s); map any it needs onto Paige tokens by hand (light only):`)
      for (const l of wanted) console.log(`  ${l.trim()}`)
      continue
    }
    if (replaceExisting) {
      console.log(`replaced ${name} with the registry's version (--replace-existing); run ui:diff-base`)
      continue
    }
    writeFileSync(p, original)
    kept.push(name)
  }
  if (kept.length) {
    console.log(`\nwould overwrite ${kept.length} existing base file(s), kept as they were:`)
    for (const k of kept) console.log(`  ${k}`)
    console.log("Re-add one on purpose with --replace-existing, then run ui:diff-base.")
  }
}

const deps = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).dependencies ?? {}
if (deps.cn) {
  console.log("removing the unrelated `cn` package the registry lists")
  run("npm uninstall cn")
}
run("npx tsc --noEmit")
