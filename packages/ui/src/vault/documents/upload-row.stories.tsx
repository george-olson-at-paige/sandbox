import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { Button } from "../../components/actions/button"
import { UploadRow, type UploadRowFile } from "./upload-row"

/* UploadRow (R2-49, R6-05): one document being filed into an Area. Copy is the prototype's
   (DocumentCapture.tsx); file names are obviously fake. */
const meta = {
  component: UploadRow,
  args: {
    promise: "We’ll keep it safe, filed in this area",
    upload: { label: "Upload a document", onFile: fn() },
  },
  decorators: [(S) => <div className="max-w-2xl"><S /></div>],
  tags: ["r2-49", "r6-05"],
  parameters: {
    docs: {
      description: {
        component:
          "One document being filed into an Area: an icon, what will happen to it (or the files given so far), a note, and the upload button at the end, dropping under the text on a narrow row. States come from the props: open, partial (some parts of a two-sided card), busy (reading), given (success look; `actions` replaces the upload). The upload button opens the browser's file picker (on a phone it offers the camera). Never red: a failed read is a note.",
      },
    },
  },
} satisfies Meta<typeof UploadRow>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const NotReady: Story = { name: "Open · no type chosen yet (upload off)", args: { upload: { label: "Upload a document", onFile: fn(), disabled: true } } }
export const ReadableCard: Story = {
  name: "Open · a card we read",
  args: { kind: "card", promise: "We’ll read it and fill in the details", upload: { label: "Upload a document", onFile: fn(), accept: "image/*" } },
}
export const Partial: Story = {
  name: "Partial · the front is in",
  args: {
    kind: "card",
    files: [{ name: "health-card-front.jpg", part: "front" }],
    note: "The back carries the Rx numbers and the member services line.",
    upload: { label: "Add the back", onFile: fn(), accept: "image/*" },
  },
}
export const Reading: Story = {
  name: "Busy · reading",
  args: { kind: "card", given: false, busy: true, note: "Reading…", files: [{ name: "drivers-licence-front.jpg" }] },
}
export const Read: Story = {
  name: "Given · read",
  args: {
    kind: "card",
    given: true,
    files: [{ name: "drivers-licence-front.jpg" }],
    note: "Four details read and tagged Auto-filled below. Have a look and confirm them.",
    actions: <Button size="sm">Done</Button>,
  },
}
/** Given · couldn't read (a note, never red) */
export const ReadFailed: Story = {
  name: "Given · couldn't read",
  args: {
    kind: "card",
    given: true,
    files: [{ name: "drivers-licence-front.jpg" }],
    note: "We couldn’t read that photo, so nothing was filled in. Try another photo from the documents list, or type the details in.",
    actions: <Button size="sm">Done</Button>,
  },
}
export const Filed: Story = {
  name: "Given · filed",
  args: { given: true, files: [{ name: "Last will and testament.pdf" }], actions: <Button size="sm">Done</Button> },
}
export const LongName: Story = {
  name: "Long file name (truncates)",
  args: { given: true, files: [{ name: "scan-2026-10-19-homeowners-insurance-declarations-page-final-final.pdf" }], actions: <Button size="sm">Done</Button> },
}
export const Narrow: Story = { name: "Narrow (the button drops under the text)", decorators: [(S) => <div className="max-w-xs"><S /></div>] }

/* The whole unit: pick a file, a second of reading, then read. Uses the real file picker. */
function Walkthrough() {
  const [files, setFiles] = useState<UploadRowFile[]>([])
  const [busy, setBusy] = useState(false)
  const given = files.length > 0 && !busy
  return (
    <UploadRow
      kind="card"
      promise="We’ll read it and fill in the details"
      files={files}
      busy={busy}
      given={given}
      note={busy ? "Reading…" : given ? "Four details read and tagged Auto-filled below. Have a look and confirm them." : undefined}
      upload={{
        label: "Upload a document",
        accept: "image/*",
        onFile: (file) => {
          setFiles([{ name: file.name }])
          setBusy(true)
          setTimeout(() => setBusy(false), 1000)
        },
      }}
      actions={<Button size="sm" onClick={() => setFiles([])}>Done</Button>}
    />
  )
}

export const Interactive: Story = { name: "Interactive: pick a file, reading, read", render: () => <Walkthrough /> }

/* The button opens the hidden file input; a chosen file reaches onFile. A play can't drive the
   browser's picker, so it hands the input a file directly. */
export const PicksAFile: Story = {
  name: "A file reaches onFile",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: "Upload a document" })
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!
    await expect(input).toHaveAttribute("tabindex", "-1")
    await expect(input).toHaveAttribute("accept", "image/*,.pdf")
    await userEvent.upload(input, new File(["%PDF"], "will.pdf", { type: "application/pdf" }))
    await expect(args.upload!.onFile).toHaveBeenCalledOnce()
    await expect(input.value).toBe("")
    await expect(button).toBeEnabled()
  },
}
