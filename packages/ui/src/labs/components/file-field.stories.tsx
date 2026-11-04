import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { FileField, type FileFieldFile } from "./file-field"

/* Level 0 (COLLECTIONS-PLAN.md §3): an item's files while it's edited. One story per limit the
   three collections need: a memory's one, a message's two, an account's any number. The
   upload is faked: a file is uploading for a moment, then done (or failed, for "fail" in its
   name). */
const meta = {
  tags: ["level-0", "collections-plan"],
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const COPY = {
  add: "Add a file",
  replace: "Replace the file",
  tooMany: (max: number) => (max === 1 ? "One file only." : `Up to ${max} files.`),
  wrongKind: "That kind of file can’t go here.",
  remove: (name: string) => `Remove ${name}`,
  retry: (name: string) => `Try ${name} again`,
}

let next = 100

function Demo({ start, max, accept, line, full }: { start: FileFieldFile[]; max?: number; accept?: string; line?: string; full?: string }) {
  const [files, setFiles] = useState(start)
  function upload(added: File[]) {
    const fresh = added.map((f) => ({ id: String(next++), name: f.name, status: "uploading" }) satisfies FileFieldFile)
    setFiles((now) => (max === 1 ? fresh : [...now, ...fresh]))
    setTimeout(
      () =>
        setFiles((now) => now.map((f) => (fresh.some((n) => n.id === f.id) ? { ...f, status: f.name.includes("fail") ? "failed" : "done" } : f))),
      1200,
    )
  }
  return (
    <FileField
      files={files}
      max={max}
      accept={accept}
      onAdd={upload}
      onRemove={(id) => setFiles((now) => now.filter((f) => f.id !== id))}
      onRetry={(id) => setFiles((now) => now.map((f) => (f.id === id ? { ...f, status: "done" } : f)))}
      onOpen={() => {}}
      copy={{ ...COPY, line, full }}
    />
  )
}

/** A memory's one photo or video: with one there, the zone replaces it. */
export const One: Story = {
  render: () => <Demo max={1} accept="image/*,video/*,application/pdf" line="A photo, a video or a PDF" start={[{ id: "1", name: "wedding-1987.jpg" }]} />,
}

/** A message's two files: at two, the zone goes. */
export const UpToTwo: Story = {
  render: () => (
    <Demo
      max={2}
      line="Up to 2 files"
      full="That’s 2 files, the most a message takes."
      start={[
        { id: "1", name: "letter-scan.pdf" },
        { id: "2", name: "photo-of-us.jpg" },
      ]}
    />
  ),
}

/** An account's files, any number; one still uploading, one failed. */
export const Any: Story = {
  render: () => (
    <Demo
      line="Statements, recovery sheets, anything that helps"
      start={[
        { id: "1", name: "recovery-codes.pdf" },
        { id: "2", name: "statement-oct.pdf", status: "uploading" },
        { id: "3", name: "card-front.jpg", status: "failed" },
      ]}
    />
  ),
}

/** Nothing yet: only the zone. */
export const Empty: Story = { render: () => <Demo line="Any kind of file" start={[]} /> }
