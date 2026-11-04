// npm run check:scripts (R17-04): every tooling script parses. ui-add.mjs once carried a raw
// newline inside a string and couldn't run at all, and nothing noticed until the next ui:add
// window; `node --check` on each script catches that class of break without running anything.
import { execFileSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { join } from "node:path"

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const dirs = ["scripts", "packages/ui/scripts"]
const files = dirs.flatMap((d) => readdirSync(join(root, d)).filter((f) => f.endsWith(".mjs")).map((f) => join(d, f)))
const broken = []
for (const f of files) {
  try {
    execFileSync(process.execPath, ["--check", join(root, f)], { stdio: "pipe" })
  } catch (e) {
    broken.push(`${f}\n${String(e.stderr || e.message).trim()}`)
  }
}
for (const b of broken) console.error(b)
console.log(`${files.length} scripts. ${broken.length} that don't parse.`)
process.exit(broken.length ? 1 : 0)
