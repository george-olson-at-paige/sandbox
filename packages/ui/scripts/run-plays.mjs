#!/usr/bin/env node
/* npm run plays (R13-15, GAPS #127, #122, #136): runs every story's play function in a headless
   browser against a running Storybook and reports the failures.

   How: it opens Storybook's manager page (not the preview iframe: Storybook 10's preview exposes
   no channel until it has loaded, the manager always does, `__STORYBOOK_ADDONS_CHANNEL__`) in a headless
   Chrome or Edge at a desktop size (1600 × 1000, the sidebar and addon panel hidden, so admin
   stories render with the desktop sidebar, not the phone sheet; a story with its own
   `globals.viewport` gets that width), then for each story id from
   Storybook's index.json emits `setCurrentStory` and waits for that story's `storyFinished`.
   A story fails when its play throws (`playFunctionThrewException`; `storyFinished` says
   "success" either way, GAPS #117), its render throws (`storyThrewException`, `storyErrored`),
   or it doesn't finish in time. axe findings from the a11y addon (the reporter on
   `storyFinished`) are listed, colour contrast aside (R1-30 item 6); they fail the run only
   with --a11y (the addon is `test: "todo"`).

   No new packages: it drives the browser over the DevTools protocol with Node's own WebSocket
   (Node 22+), and uses the Chrome or Edge already installed (CHROME_PATH overrides).

   Usage (from packages/ui, with Storybook up on 6106):
     npm run plays                       every story
     npm run plays -- people list-page   only ids containing any of these words
     npm run plays -- --a11y             axe findings fail the run too
     STORYBOOK_URL=http://localhost:6106 npm run plays
   Exit code 0 when every story passed, 1 otherwise. The browser it starts is stopped on exit. */

import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const BASE = (process.env.STORYBOOK_URL ?? "http://localhost:6106").replace(/\/$/, "")
const args = process.argv.slice(2)
const failOnA11y = args.includes("--a11y")
const filters = args.filter((a) => !a.startsWith("--")).map((a) => a.toLowerCase())
const TIMEOUT_MS = Number(process.env.PLAY_TIMEOUT_MS ?? 30_000)

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean)
  const found = candidates.find((p) => existsSync(p))
  if (!found) throw new Error("No Chrome or Edge found; set CHROME_PATH.")
  return found
}

let startPath
async function storyIds() {
  const res = await fetch(`${BASE}/index.json`).catch(() => null)
  if (!res?.ok) throw new Error(`Storybook isn't answering at ${BASE} (index.json). Start it first.`)
  const index = await res.json()
  const entries = Object.values(index.entries)
  // Open on a docs page, so the first story is a real switch (showing the story already shown sends no event).
  startPath = entries.find((e) => e.type === "docs")?.id
  return entries
    .filter((e) => e.type === "story")
    .map((e) => e.id)
    // "promotion-codes" finds admin-promotioncodes--…: dashes don't count.
    .filter((id) => filters.length === 0 || filters.some((f) => id.replace(/-/g, "").includes(f.replace(/-/g, ""))))
}

/** Starts the browser; resolves with its DevTools WebSocket URL. */
function launch(path, profile) {
  const proc = spawn(
    path,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--window-size=1600,1000",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--mute-audio",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  )
  return new Promise((resolve, reject) => {
    let err = ""
    const t = setTimeout(() => reject(new Error(`The browser didn't start: ${err.slice(-500)}`)), 20_000)
    proc.stderr.on("data", (d) => {
      err += d
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(err)
      if (m) {
        clearTimeout(t)
        resolve({ proc, ws: m[1] })
      }
    })
    proc.on("exit", (code) => reject(new Error(`The browser exited (${code}): ${err.slice(-500)}`)))
  })
}

/** A minimal DevTools protocol client: send(method, params, sessionId). */
function connect(url) {
  const ws = new WebSocket(url)
  let next = 1
  const pending = new Map()
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String(ev.data))
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    }
  })
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve)
    ws.addEventListener("error", reject)
  })
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = next++
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  return { ready, send, close: () => ws.close() }
}

/* Runs in the manager page: shows one story and resolves with what happened to it. */
const RUN_ONE = (id, timeout) => `(async () => {
  // A story's own viewport (globals.viewport, e.g. the phone stories' w375, the w1280 checks):
  // the manager applies it only through its toolbar, not on a channel switch (GAPS #117), so the
  // preview iframe is sized here from the story's viewport option, and back to full width after.
  const iframe = document.querySelector("#storybook-preview-iframe")
  let width = ""
  try {
    const store = iframe.contentWindow.__STORYBOOK_PREVIEW__.storyStoreValue
    const story = await store.loadStory({ storyId: ${JSON.stringify(id)} })
    const g = story.storyGlobals || story.globals || {}
    const value = g.viewport && g.viewport.value
    const option = value && story.parameters.viewport && story.parameters.viewport.options && story.parameters.viewport.options[value]
    if (option && option.styles && option.styles.width) width = option.styles.width
  } catch (e) {}
  iframe.style.width = width
  iframe.style.flex = width ? "none" : ""
  return new Promise((resolve) => {
  const ch = window.__STORYBOOK_ADDONS_CHANNEL__
  if (!ch) return resolve({ status: "error", error: "No Storybook channel in the manager page." })
  let error = null
  const mine = (p) => !p || !p.storyId || p.storyId === ${JSON.stringify(id)}
  const handlers = {
    playFunctionThrewException: (e) => { error = error || ("play: " + (e && (e.message || e.description) || String(e))) },
    storyThrewException: (e) => { error = error || ("render: " + (e && e.message || String(e))) },
    storyErrored: (e) => { error = error || ("error: " + (e && (e.title + " " + (e.description || "")) || String(e))) },
    storyMissing: () => { error = error || "missing" },
  }
  const finish = (result) => {
    clearTimeout(timer)
    for (const [k, f] of Object.entries(handlers)) ch.off(k, f)
    ch.off("storyFinished", onFinished)
    resolve(result)
  }
  const onFinished = (p) => {
    if (!mine(p)) return
    const a11y = ((p && p.reporters) || []).filter((r) => r.type === "a11y").flatMap((r) => (r.result && r.result.violations) || [])
      .filter((v) => v.id !== "color-contrast").map((v) => v.id + " (" + (v.nodes ? v.nodes.length : 0) + ")")
    finish({ status: error ? "failed" : "passed", error, a11y })
  }
  for (const [k, f] of Object.entries(handlers)) ch.on(k, f)
  ch.on("storyFinished", onFinished)
  const timer = setTimeout(() => finish({ status: "failed", error: error || "timed out", a11y: [] }), ${timeout})
  ch.emit("setCurrentStory", { storyId: ${JSON.stringify(id)}, viewMode: "story" })
  })
})()`

async function main() {
  const ids = await storyIds()
  if (ids.length === 0) {
    console.log("No stories match.")
    return 0
  }
  const profile = mkdtempSync(join(tmpdir(), "paige-plays-"))
  const { proc, ws } = await launch(findBrowser(), profile)
  const cdp = connect(ws)
  let code = 1
  try {
    await cdp.ready
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId)
    await cdp.send("Page.enable", {}, sessionId)
    await cdp.send("Page.navigate", { url: `${BASE}/?path=${startPath ? `/docs/${startPath}` : `/story/${ids[0]}`}&nav=false&panel=false` }, sessionId)
    // Wait for the manager's channel and the first story's preview.
    const started = Date.now()
    for (;;) {
      const { result } = await cdp.send("Runtime.evaluate", { expression: "Boolean(window.__STORYBOOK_ADDONS_CHANNEL__) && Boolean(document.querySelector('#storybook-preview-iframe'))", returnByValue: true }, sessionId)
      if (result.value) break
      if (Date.now() - started > 60_000) throw new Error("Storybook's manager didn't load.")
      await new Promise((r) => setTimeout(r, 250))
    }
    await new Promise((r) => setTimeout(r, 3000))

    const failed = []
    const a11y = []
    let i = 0
    for (const id of ids) {
      i++
      let r = (await cdp.send("Runtime.evaluate", { expression: RUN_ONE(id, TIMEOUT_MS), awaitPromise: true, returnByValue: true }, sessionId)).result.value
      // The very first switch can race the preview's start: once more before calling it.
      if (r.status === "failed" && r.error === "timed out" && i === 1)
        r = (await cdp.send("Runtime.evaluate", { expression: RUN_ONE(id, TIMEOUT_MS), awaitPromise: true, returnByValue: true }, sessionId)).result.value
      if (r.status !== "passed") failed.push({ id, error: r.error })
      if (r.a11y?.length) a11y.push({ id, found: r.a11y })
      process.stdout.write(r.status === "passed" ? "." : "F")
      if (i % 80 === 0) process.stdout.write(` ${i}/${ids.length}\n`)
    }
    process.stdout.write(`\n\n${ids.length - failed.length} passed, ${failed.length} failed (of ${ids.length}).\n`)
    for (const f of failed) console.log(`  FAIL ${f.id}\n       ${String(f.error).split("\n")[0].slice(0, 300)}`)
    if (a11y.length) {
      console.log(`\naxe findings (colour contrast aside) in ${a11y.length} stor${a11y.length === 1 ? "y" : "ies"}${failOnA11y ? "" : " (not failing: --a11y to fail on them)"}:`)
      for (const a of a11y) console.log(`  ${a.id}: ${a.found.join(", ")}`)
    }
    code = failed.length > 0 || (failOnA11y && a11y.length > 0) ? 1 : 0
  } finally {
    cdp.close()
    proc.kill()
    await new Promise((r) => setTimeout(r, 500))
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {
      /* the profile folder can stay locked a moment after the browser exits; it's in the temp dir */
    }
  }
  return code
}

// exitCode, not exit(): exiting while fetch's sockets close trips a libuv assertion on Windows.
main().then(
  (code) => {
    process.exitCode = code
  },
  (e) => {
    console.error(e.message)
    process.exitCode = 1
  }
)
