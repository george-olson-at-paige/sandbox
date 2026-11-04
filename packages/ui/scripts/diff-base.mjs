// npm run ui:diff-base -w packages/ui [-- <name>…] [--full]   (R2-41, GAPS #67)
// Compares each upstream file in src/base with a fresh copy from the shadcn registry (the
// new-york-v4 style, imports rewritten the way ui-add does), so an upstream change to a slot
// name or structure that the Paige layer reaches into (data-slot selectors in
// components/{progress,select,message}.tsx) shows up before it breaks a wrapper silently.
// Run it on every re-add and every shadcn bump. Prints a stat per file; --full prints diffs.
// Exit code 1 when anything differs. Needs network.
import { spawnSync } from "node:child_process"
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { rewriteShadcnImports } from "./shadcn-imports.mjs"

const REGISTRY = "https://ui.shadcn.com/r/styles/new-york-v4"
const pkg = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const args = process.argv.slice(2)
const full = args.includes("--full")
const only = args.filter((a) => !a.startsWith("--"))
const baseDir = join(pkg, "src", "base")
const tmp = mkdtempSync(join(tmpdir(), "paige-ui-diff-base-"))
const norm = (s) => s.replace(/\r\n/g, "\n")

let differs = 0
for (const f of readdirSync(baseDir).filter((n) => n.endsWith(".tsx") && !n.endsWith(".stories.tsx"))) {
  const name = f.replace(/\.tsx$/, "")
  if (only.length && !only.includes(name)) continue
  const res = await fetch(`${REGISTRY}/${name}.json`)
  if (!res.ok) {
    console.log(`?? ${name}: registry returned ${res.status}`)
    continue
  }
  const item = await res.json()
  const file = item.files?.find((x) => x.path.endsWith(`/${name}.tsx`)) ?? item.files?.[0]
  const fresh = join(tmp, f)
  writeFileSync(fresh, norm(rewriteShadcnImports(file.content)))
  const local = join(tmp, `local-${f}`)
  writeFileSync(local, norm(readFileSync(join(baseDir, f), "utf8")))
  const git = (...a) => spawnSync("git", ["diff", "--no-index", ...a, local, fresh], { encoding: "utf8" })
  if (git("--quiet").status === 0) {
    console.log(`== ${name}`)
    continue
  }
  differs++
  const [added, removed] = git("--numstat").stdout.trim().split(/\s+/)
  console.log(`!= ${name}: upstream now +${added} -${removed} lines against src/base/${f}`)
  if (full) process.stdout.write(git().stdout)
}
console.log(`\n${differs} base file(s) differ from the registry.`)
process.exit(differs > 0 ? 1 : 0)
