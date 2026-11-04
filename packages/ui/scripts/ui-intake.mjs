// npm run ui:intake -w packages/ui -- <registry-item-url> [--name <folder>] [--from-file <path>]
// INTAKE.md § Step 3 (Landed) for a third-party registry item (shadcn.io, Origin UI, Kibo UI…):
//   1. fetches the item's registry JSON (the shadcn registry-item shape) from the URL;
//   2. writes each of its files into src/labs/intake/<name>/ under an `@from` header stub, with
//      the registry's import aliases rewritten to relative paths (a registry dependency that is
//      one of our bases points at src/base; one that isn't stays a sibling import and is reported);
//   3. prints what the item wanted, for the intake table: npm dependencies, registry
//      dependencies, CSS variables, docs. Nothing is installed and nothing else is written.
// Not the shadcn CLI, on purpose: the CLI would npm-install the item's stack (tailwind-variants,
// Base UI, its own `cn`) while servers hold node_modules (GAPS #111), and write over src/base.
// A third-party item is a sketch at level 0 (INTAKE.md § What arrives); Conform replaces its stack.
// The URL may carry an account token (shadcn.io). This script never prints the URL: it prints
// the item's name and the URL's host and path with the query removed. The URL stays out of
// commits, scripts and docs (INTAKE.md § Per-source notes).
// --from-file <path> is the secret entry (George 2026-10-30): a file outside the repo holding
// either the full install URL (used as is) or the bare account token, which is sent as an
// `Authorization: Bearer` header with the URL argument (shadcn.io's token is a Bearer token; its
// MCP config says so). The secret never passes through chat or a shell line the agent writes;
// the file is read, used in memory, and the script says only that it was used. The file must be
// outside the repo; the script refuses one inside it.
// Refuses to write a file that already exists: a re-land is a new folder (--name), compared by hand.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join, resolve } from "node:path"

const pkg = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const repoRoot = resolve(pkg, "..", "..")
const args = process.argv.slice(2)
const optionValue = (flag) => {
  const at = args.indexOf(flag)
  return at >= 0 ? args[at + 1] : undefined
}
const folderName = optionValue("--name")
const fromFile = optionValue("--from-file")
const isOptionValue = (i) => i > 0 && args[i - 1].startsWith("--") && ["--name", "--from-file"].includes(args[i - 1])
let url = args.find((a, i) => !a.startsWith("--") && !isOptionValue(i))
let bearer

if (fromFile) {
  const path = resolve(fromFile)
  if (path.toLowerCase().startsWith(repoRoot.toLowerCase())) {
    console.error(`--from-file must point outside the repo (${repoRoot}); a token file inside it is one "git add -f" from a commit.`)
    process.exit(2)
  }
  if (!existsSync(path)) {
    console.error(`--from-file: ${path} does not exist`)
    process.exit(2)
  }
  const secret = readFileSync(path, "utf8").trim()
  if (secret.includes("://")) url = secret
  else bearer = secret // shadcn.io's token is a Bearer token (its MCP config: Authorization: Bearer <token>)
}

if (!url) {
  console.error("usage: npm run ui:intake -w packages/ui -- <registry-item-url> [--name <folder>] [--from-file <path outside the repo>]")
  process.exit(2)
}

let where
try {
  const u = new URL(url)
  where = `${u.host}${u.pathname}` // the query (a token, if any) is never shown
} catch {
  console.error("that is not a URL")
  process.exit(2)
}

// After the fetch, failures set exitCode and return rather than process.exit(): on Windows,
// exiting while undici still holds the connection trips a libuv assertion (UV_HANDLE_CLOSING).
const fail = (msg) => {
  console.error(msg)
  process.exitCode = 1
}

const headers = { accept: "application/json", ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) }
const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
if (!res.ok) {
  await res.arrayBuffer().catch(() => {})
  const hint = res.status === 401 || res.status === 403 ? ": the registry wants a signed-in token. Sign in on the site, copy the item's install URL into a file outside the repo and run this with --from-file." : ""
  fail(`${where} → ${res.status}${hint}`)
} else {
  const item = await res.json()
  if (!Array.isArray(item.files) || item.files.length === 0) fail(`${where} answered, but not with a registry item (no files).`)
  else land(item)
}

function land(item) {
  const name = folderName ?? item.name ?? basename(where).replace(/\.json$/, "")
  const dir = join(pkg, "src", "labs", "intake", name)
  const baseDir = join(pkg, "src", "base")
  const date = new Date().toISOString().slice(0, 10)
  const toLabs = "../../../" // src/labs/intake/<name>/ → src/

  /** The registry's aliases → paths that resolve from src/labs/intake/<name>/. */
  const unresolved = new Set()
  const rewrite = (source) =>
    source
      .replace(/from\s+["']cn["']/g, `from "${toLabs}lib/utils"`)
      .replace(/from\s+["']@\/lib\/utils["']/g, `from "${toLabs}lib/utils"`)
      .replace(/from\s+["']@\/lib\/([\w-]+)["']/g, `from "${toLabs}lib/$1"`)
      .replace(/from\s+["']@\/(?:base|components\/ui|hooks|registry\/[\w-]+\/(?:ui|hooks|components))\/([\w-]+)["']/g, (_, dep) => {
        if (existsSync(join(baseDir, `${dep}.tsx`)) || existsSync(join(baseDir, `${dep}.ts`))) return `from "${toLabs}base/${dep}"`
        unresolved.add(dep)
        return `from "./${dep}"`
      })

  const header = [
    `/* @from ${where} · ${date} · licence: (confirm and record; Pro items are Out).`,
    `   changed: nothing yet — landed as it arrived (level 0, INTAKE.md § Step 3); imports made relative.`,
    `   Landed by scripts/ui-intake.mjs. The registry's own header, if any, follows. */`,
    "",
  ].join("\n")

  mkdirSync(dir, { recursive: true })
  const written = []
  for (const f of item.files) {
    const file = basename(f.path ?? f.target ?? "")
    if (!file) continue
    const out = join(dir, file)
    if (existsSync(out)) return fail(`${out} exists; a re-land is a new folder: --name ${name}-${date}`)
    const content = typeof f.content === "string" ? f.content : ""
    writeFileSync(out, /\.(tsx?|jsx?|mjs)$/.test(file) ? header + rewrite(content) : content)
    written.push(file)
  }

  const list = (xs) => (xs && xs.length ? xs.join(", ") : "none")
  const vars = []
  for (const [scope, set] of Object.entries(item.cssVars ?? {})) for (const [k, v] of Object.entries(set ?? {})) vars.push(`${scope}: --${k}: ${v}`)

  console.log(`landed ${item.name ?? name} (${item.type ?? "type unknown"}) from ${where}${fromFile ? " (credentials from --from-file)" : ""}`)
  console.log(`  files (${written.length}) in src/labs/intake/${name}/: ${written.join(", ")}`)
  if (item.title || item.description) console.log(`  about: ${[item.title, item.description].filter(Boolean).join(" — ")}`)
  console.log(`  npm dependencies wanted (not installed): ${list(item.dependencies)}${item.devDependencies?.length ? `; dev: ${item.devDependencies.join(", ")}` : ""}`)
  console.log(`  registry dependencies: ${list(item.registryDependencies)}`)
  if (unresolved.size) console.log(`  imports left as siblings (not one of our bases; resolve in Conform): ${[...unresolved].join(", ")}`)
  console.log(`  css variables wanted: ${vars.length ? "" : "none"}`)
  for (const v of vars) console.log(`    ${v}`)
  if (item.css) console.log(`  css: ${JSON.stringify(item.css)}`)
  if (item.docs) console.log(`  docs: ${item.docs}`)
  console.log("\nNext (INTAKE.md): fill in the licence in the @from line; a story in the same folder; nothing outside labs/ or stories imports it; then Conform.")
}
