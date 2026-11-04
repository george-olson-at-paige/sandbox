import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { FileIcon } from "./file-icon"
import { Attachment } from "./attachment"
import { FILE_KINDS, type FileKind, type FileLike } from "../../lib/file-kind"
import { Stack } from "../../primitives/stack"

const meta = {
  component: FileIcon,
  args: { file: { name: "will-2026.pdf" }, className: "size-10" },
  argTypes: {
    kind: { control: "select", options: [undefined, ...FILE_KINDS] },
    file: { control: "object" },
  },
  tags: ["r19-03", "r20-17"],
  parameters: {
    docs: {
      description: {
        component:
          "**FileIcon** (R19-03, R20-17): the glyph for a kind of file, so every place that shows a file draws the same one. The kind is one of `lib/file-kind`'s seven (image · pdf · document · spreadsheet · archive · text · other), worked out from a file's MIME type first and its name's extension second (`fileKind`); pass `kind` to say it outright, or `file` to let the icon decide. Each kind is one outline in its own colour (`--file-*`). From 32px, a file with a format also shows it on a band across the page (`fileFormat`: PDF, DOCX, JPG; ReUI's `file-type`, conformed); under 32px the kind's own outline stays, because a word under 7px is a smudge. Sized by whatever holds it (32px in an Attachment's 40px media); decorative, the name beside it carries the meaning. The same helper gives the type word and the size for a row's line (`fileLine`: \"PDF · 2.4 MB\").",
      },
    },
  },
} satisfies Meta<typeof FileIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** A file of each kind, at the four sizes a file is drawn: 18 (a grid row), 24 (the icon scale's largest), 32 and 40 (the media column). Up to 24 the kind's own outline; the format band from 32, where its word is 7px or more. */
export const AllKinds: Story = {
  name: "All kinds",
  render: () => {
    const sample: Record<FileKind, FileLike> = {
      image: { name: "IMG_4821.jpg" },
      pdf: { name: "will-2026.pdf" },
      document: { name: "letter.docx" },
      spreadsheet: { name: "accounts.xlsx" },
      archive: { name: "scans.zip" },
      text: { name: "notes.txt" },
      other: { name: "walkthrough.mp4" },
    }
    const sizes = [
      ["18", "size-4.5"],
      ["24", "size-icon-xl"],
      ["32", "size-8"],
      ["40", "size-10"],
    ] as const
    return (
      <div className="grid max-w-md grid-cols-5 items-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
        <span />
        {sizes.map(([px]) => (
          <span key={px}>{px}px</span>
        ))}
        {FILE_KINDS.map((kind) => (
          <div key={kind} className="contents">
            <span>{kind}</span>
            {sizes.map(([px, size]) => (
              <span key={px}>
                <FileIcon kind={kind} file={sample[kind]} className={size} />
              </span>
            ))}
          </div>
        ))}
      </div>
    )
  },
}

/** A dozen formats at 40px, each word on its band, in its kind's colour. A name with no format, or one longer than the band holds, shows no band. */
export const Formats: Story = {
  render: () => (
    <div className="flex flex-wrap gap-5 text-xs font-medium text-muted-foreground">
      {[
        { name: "IMG_4821.jpg", type: "image/jpeg" },
        { name: "logo.png" },
        { name: "will-2026.pdf" },
        { name: "letter.docx" },
        { name: "deck.pptx" },
        { name: "accounts.xlsx" },
        { name: "accounts.csv", type: "text/csv" },
        { name: "scans.zip" },
        { name: "notes.txt" },
        { name: "schema.json" },
        { name: "ledger.numbers" },
        { name: "walkthrough.mp4" },
        { name: "statement" },
      ].map((file) => (
        <span key={file.name} className="flex w-24 flex-col items-center gap-1 text-center">
          <FileIcon file={file} className="size-10" />
          {file.name}
        </span>
      ))}
    </div>
  ),
}

/** The same files as the media of an Attachment (32px in the 40px well; the compact row's 20px shows the outline alone). A failed file takes the destructive ink. */
export const InAnAttachment: Story = {
  name: "In an Attachment",
  render: () => (
    <Stack gap={2} className="max-w-lg">
      <Attachment name="will-2026.pdf" file={{ type: "application/pdf", size: 2.4 * 1024 * 1024 }} />
      <Attachment name="accounts.xlsx" file={{ size: 212 * 1024 }} />
      <Attachment name="scans.zip" file={{ type: "application/zip", size: 9.6 * 1024 * 1024 }} />
      <Attachment name="statement" file={{ size: 120 * 1024 }} />
      <Attachment name="IMG_4821.jpg" file={{ type: "image/jpeg" }} status="failed" />
      <Attachment density="compact" name="letter.docx" file={{ size: 48 * 1024 }} />
    </Stack>
  ),
}

/** Each icon says its kind and format to tests, and is hidden from assistive technology. */
export const Attributes: Story = {
  name: "Kind, format, hidden",
  render: () => (
    <div className="flex gap-4 text-muted-foreground">
      <FileIcon file={{ name: "will-2026.pdf" }} className="size-10" />
      <FileIcon file={{ name: "photo.jpeg", type: "image/jpeg" }} className="size-10" />
      <FileIcon file={{ name: "statement" }} className="size-10" />
      <FileIcon kind="archive" className="size-10" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const icons = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="file-icon"]')]
    await expect(icons).toHaveLength(4)
    const [pdf, jpeg, bare, bareKind] = icons
    await expect(pdf).toHaveAttribute("data-kind", "pdf")
    await expect(pdf).toHaveAttribute("data-format", "PDF")
    await expect(jpeg).toHaveAttribute("data-kind", "image")
    await expect(jpeg).toHaveAttribute("data-format", "JPG")
    // No extension, no type: the blank page, and no band to draw.
    await expect(bare).toHaveAttribute("data-kind", "other")
    await expect(bare).not.toHaveAttribute("data-format")
    await expect(bare.querySelector('[data-slot="file-icon-band"]')).toBeNull()
    // A kind with no file has no format either.
    await expect(bareKind).toHaveAttribute("data-kind", "archive")
    await expect(bareKind).not.toHaveAttribute("data-format")
    for (const icon of icons) await expect(icon).toHaveAttribute("aria-hidden", "true")
    // The band carries the word (the format in capitals) for a file that has one.
    await expect(pdf.querySelector('[data-slot="file-icon-band"]')).toHaveTextContent("PDF")
  },
}
