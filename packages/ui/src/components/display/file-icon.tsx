import type { ComponentProps } from "react"
import { FileArchiveIcon, FileCode2Icon, FileIcon as FileBlankIcon, FileSpreadsheetIcon, FileTextIcon, FileType2Icon, ImageIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { fileFormat, fileKind, type FileKind, type FileLike } from "../../lib/file-kind"

/* @archetype Media (ARCHETYPES.md). FileIcon (R19-03, R20-17): the glyph for a kind of file — a
   picture, a page, a sheet, an archive — so every place that shows a file (an Attachment's
   media, an Item's file media, a table cell) draws the same one. The kind comes from `fileKind`
   (lib/file-kind: MIME first, then the name's extension); pass it, or pass the file and let the
   icon work it out. Sized by whatever holds it (18 in a grid row, 32 in an Attachment's 40
   media; default `size-icon`, 16); decorative, so hidden from assistive technology — the name
   beside it carries the meaning.
   - The glyph is one lucide outline per kind, in the kind's colour (`--file-*`, theme.css; the
     holder's `text-*` replaces it, as Attachment does for a failed file). From 32px up, when
     the file has a format (`fileFormat`: "PDF", "DOCX"), the glyph is a blank page with a band
     across it carrying the format in capitals, in the same colour; under 32px the word would
     be under 7px and a smudge (at 24 it is 5.6), so the kind's own glyph stays. The switch is
     a container query on the icon's own width, so any size class decides and nothing is passed.
   - The band is drawn in the icon's 24-unit box (an SVG rect and its text), so it scales with
     whatever size class the holder sets; the source's `cqw` text, bands and 172 bespoke
     per-format drawings are not needed for one kind per colour.
   - The source's `variant` (outline · solid · light · mono) is not carried: Documents needs
     one look, `variant` is a retired prop name (ARCHETYPES.md §3), and a holder's `text-*`
     already recolours the glyph to one ink (mono).
   @from reui.io/r/file-type.json · 2026-10-31 · MIT
   changed: its 172 per-format drawings, `FileType` / `getFileType` and the extension and MIME tables
   → lib/file-kind (`fileKind`, `fileFormat`); this file keeps the label band and nothing of its
   page, fold or per-category glyph paths: lucide outlines, one per kind.
   changed: its colour per format (brand and family `text-*` shades) → one `--file-*` token per kind
   (theme.css), used as `text-file-*`; its dark-mode lift, `--file-type-*` variables and `mono`/`light`/`solid`
   variants are dropped (light only, R2-11).
   changed: its `cqw` band and text (and its 21px container rungs) → an SVG band in a 24-unit box, drawn
   from 32px by a container query; under it the kind's glyph shows, with no 5.8px text (the source
   draws one at 18).
   changed: its `size` cva (mini … xl) → none: the holder's size class (18 · 24 · 32 · 40 are the
   Review's; 24 is `size-icon-xl`, the rest wait for the media scale's tokens, T-03), default
   `size-icon` (16).
   changed: its `role="img"` and `aria-label` per format → `aria-hidden`; the name beside the icon is the
   text, as for every file glyph here; `data-kind` and `data-format` for tests.
   changed: `label`, `glyph` and `icon` props → not carried (the band word is `fileFormat(file)`). */
const ICON: Record<FileKind, typeof FileBlankIcon> = {
  image: ImageIcon,
  pdf: FileTextIcon,
  document: FileType2Icon,
  spreadsheet: FileSpreadsheetIcon,
  archive: FileArchiveIcon,
  text: FileCode2Icon,
  other: FileBlankIcon,
}

/** The kind's ink: the page outline, the glyph and the band's fill. */
const INK: Record<FileKind, string> = {
  image: "text-file-image",
  pdf: "text-file-pdf",
  document: "text-file-document",
  spreadsheet: "text-file-spreadsheet",
  archive: "text-file-archive",
  text: "text-file-text",
  other: "text-file-other",
}

/* The band, in the lucide page's 24-unit box (page x 4–20, y 2–22): it overhangs the page by 2.5
   units a side, its middle on the page's. The text is bold capitals, 5.6 units, shrinking from
   five characters so the widest word stays inside the band (0.66em is a wide capital). */
const BAND = { x: 1.5, y: 11.5, width: 21, height: 8, rx: 2 } as const
const BAND_TEXT = { x: 12, y: 15.5, size: 5.6, inner: 18, em: 0.66 } as const

/** The glyph for a kind of file (picture, page, sheet, archive…), from the kind or from the file itself; with the file's format on a band from 32px. */
function FileIcon({
  kind,
  file,
  className,
  ...props
}: Omit<ComponentProps<"span">, "children" | "ref"> & {
  /** Which glyph. Default: worked out from `file`, else `other`. */
  kind?: FileKind
  /** The file to read the kind from (its MIME type, then its name) when `kind` is not given, and the format for the band (`fileFormat`). */
  file?: FileLike
}) {
  const k = kind ?? (file ? fileKind(file) : "other")
  const format = file ? fileFormat(file) : undefined
  const Glyph = ICON[k]
  const fontSize = Math.min(BAND_TEXT.size, BAND_TEXT.inner / ((format?.length ?? 1) * BAND_TEXT.em))
  return (
    <span
      aria-hidden
      data-slot="file-icon"
      data-kind={k}
      data-format={format}
      className={cn("@container relative inline-block size-icon shrink-0 align-middle leading-none", INK[k], className)}
      {...props}
    >
      {/* With a format the kind's glyph gives way to the page and band from 32px; without one it stays. */}
      <Glyph aria-hidden data-slot="file-icon-glyph" className={cn("absolute inset-0 size-full icon-stroke-small", format && "@min-[32px]:hidden")} />
      {format && (
        <>
          <FileBlankIcon aria-hidden data-slot="file-icon-page" className="absolute inset-0 hidden size-full icon-stroke-small @min-[32px]:block" />
          <svg
            aria-hidden
            focusable="false"
            viewBox="0 0 24 24"
            data-slot="file-icon-band"
            className="absolute inset-0 hidden size-full @min-[32px]:block"
          >
            <rect {...BAND} className="fill-current" />
            <text
              x={BAND_TEXT.x}
              y={BAND_TEXT.y}
              fontSize={fontSize}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-on-tone font-bold"
            >
              {format}
            </text>
          </svg>
        </>
      )}
    </span>
  )
}

export { FileIcon }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FileIconProps = ComponentProps<typeof FileIcon>
