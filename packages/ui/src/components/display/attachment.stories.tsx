import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { DownloadIcon, RotateCcwIcon, XIcon } from "lucide-react"

import { Attachment, AttachmentAction } from "./attachment"
import { FILE_KINDS } from "../../lib/file-kind"
import { Stack } from "../../primitives/stack"

const KB = 1024
const MB = 1024 * KB

/* A thumbnail for the stories: the app's own art (apps/web/public, served by Storybook's staticDirs). */
const THUMB = "/assets/watercolor.png"

const meta = {
  component: Attachment,
  args: {
    name: "IMG_4821.jpg",
    file: { type: "image/jpeg", size: 1.1 * MB },
    status: "done",
  },
  argTypes: {
    status: { control: "select", options: ["uploading", "reading", "done", "failed"] },
    kind: { control: "select", options: [...FILE_KINDS] },
    density: { control: "select", options: ["default", "compact"] },
    actions: { control: false },
    description: { control: "text" },
  },
  decorators: [(S) => <div className="max-w-lg"><S /></div>],
  tags: ["r19-01", "r19-02", "r19-03"],
  parameters: {
    docs: {
      description: {
        component:
          "**Attachment** (R19-01, shadcn attachment, 2026-10-30): one file as a row — its glyph or thumbnail, its name, a line under the name, actions at the end, and with `onOpen` the whole row as the way to open it. `status` is where the file is in its stream, in the stream's own words (`uploading` until the server says stored, `reading` until it says complete, then `done`, or `failed`): in flight the name shimmers and the row is busy; failed turns the media and the line to the destructive tone and says what to do. The line is the status's words in flight and what the file is when done (`fileLine`: \"PDF · 2.4 MB\"); pass `description` for a stage with an estimate or a reading result. Not the capture (UploadRow asks for the file) and not a product document. The same row rides inside a toast (`attachmentToast`, Components › Feedback › Toast) with its frame off.",
      },
    },
  },
} satisfies Meta<typeof Attachment>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The glyph and the type word follow the file's kind: MIME type first, then the name's extension. */
export const ByKind: Story = {
  name: "By kind",
  render: () => (
    <Stack gap={2}>
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg", size: 1.1 * MB }} />
      <Attachment name="will-2026.pdf" file={{ type: "application/pdf", size: 2.4 * MB }} />
      <Attachment name="letter-of-wishes.docx" file={{ size: 48 * KB }} />
      <Attachment name="accounts.xlsx" file={{ size: 212 * KB }} />
      <Attachment name="scans.zip" file={{ type: "application/zip", size: 9.6 * MB }} />
      <Attachment name="notes.txt" file={{ type: "text/plain", size: 3 * KB }} />
      <Attachment name="statement" file={{ size: 120 * KB }} />
    </Stack>
  ),
}

/** The four statuses with their default lines. Uploading and reading shimmer the name; failed says what to do. */
export const States: Story = {
  render: () => (
    <Stack gap={2}>
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="uploading" />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="reading" />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg", size: 1.1 * MB }} status="done" />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="failed" />
    </Stack>
  ),
}

/** The caller's line: a stage with an estimate (the server sends stages, not bytes, so the number is estimated), and a reading result. */
export const WithDescription: Story = {
  name: "With a description",
  render: () => (
    <Stack gap={2}>
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="uploading" description="Uploading · 40%" />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="reading" description="Reading · 80%" />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg", size: 1.1 * MB }} description="Driver’s license · read and filled in for you" />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="failed" description="We couldn’t make out the photo. Try a clearer one." />
    </Stack>
  ),
}

/** Actions at the end of the row: a ghost icon Button each. A failed row offers the retry; a done row the download and remove. */
export const WithActions: Story = {
  name: "With actions",
  render: () => (
    <Stack gap={2}>
      <Attachment
        name="will-2026.pdf"
        file={{ type: "application/pdf", size: 2.4 * MB }}
        actions={
          <>
            <AttachmentAction icon={<DownloadIcon />} aria-label="Download will-2026.pdf" />
            <AttachmentAction icon={<XIcon />} aria-label="Remove will-2026.pdf" />
          </>
        }
      />
      <Attachment
        name="IMG_4821.jpg"
        file={{ type: "image/jpeg" }}
        status="failed"
        actions={<AttachmentAction icon={<RotateCcwIcon />} aria-label="Try IMG_4821.jpg again" />}
      />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="uploading" description="Uploading · 40%" actions={<AttachmentAction icon={<XIcon />} aria-label="Cancel the upload" />} />
    </Stack>
  ),
}

function Opens() {
  const [opened, setOpened] = useState(0)
  return (
    <Stack gap={3}>
      <Attachment
        name="will-2026.pdf"
        file={{ type: "application/pdf", size: 2.4 * MB }}
        onOpen={() => setOpened((n) => n + 1)}
        actions={<AttachmentAction icon={<XIcon />} aria-label="Remove will-2026.pdf" />}
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {opened === 0 ? "Click the row, or tab to it and press Enter. The remove button stays its own control." : `Opened ${opened} time${opened === 1 ? "" : "s"}.`}
      </p>
    </Stack>
  )
}

/** With `onOpen` the whole row opens the file (a preview, a download) while the actions stay separately clickable and focusable. */
export const OpensTheFile: Story = {
  name: "Opens the file",
  render: () => <Opens />,
}

/** A thumbnail in place of the glyph; while in flight it is dimmed, as the base does. */
export const Thumbnail: Story = {
  render: () => (
    <Stack gap={2}>
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg", size: 1.1 * MB }} image={THUMB} />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} image={THUMB} status="reading" />
    </Stack>
  ),
}

/** Compact: the base's sm — a 32px media and smaller text, for a toast or a dense list. */
export const Compact: Story = {
  render: () => (
    <Stack gap={2}>
      <Attachment density="compact" name="IMG_4821.jpg" file={{ type: "image/jpeg", size: 1.1 * MB }} actions={<AttachmentAction icon={<XIcon />} aria-label="Remove IMG_4821.jpg" />} />
      <Attachment density="compact" name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="reading" description="Reading · 80%" />
    </Stack>
  ),
}

/** Unframed, inside another surface: the surface is the one frame. This is how a toast carries it. */
export const Unframed: Story = {
  name: "Unframed (inside a surface)",
  render: () => (
    <div className="rounded-xl border bg-popover p-4 shadow-pop">
      <Attachment framed={false} density="compact" name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="reading" description="Reading · 80%" />
    </div>
  ),
}