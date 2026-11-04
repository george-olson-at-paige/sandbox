import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"
import { fileLine, type FileKind, type FileLike } from "../../lib/file-kind"
import {
  Attachment as UiAttachment,
  AttachmentActions as UiAttachmentActions,
  AttachmentContent as UiAttachmentContent,
  AttachmentDescription as UiAttachmentDescription,
  AttachmentMedia as UiAttachmentMedia,
  AttachmentTitle as UiAttachmentTitle,
  AttachmentTrigger as UiAttachmentTrigger,
} from "../../base/attachment"
import { Button, type ButtonProps } from "../actions/button"
import { FileIcon } from "./file-icon"

/* @archetype Item (ARCHETYPES.md).
   Attachment (R19-01, R19-02; shadcn attachment, 2026-10-30): one file as a row — its glyph or
   thumbnail, its name, a line under the name, actions at the end, and, with `onOpen`, the whole
   row as the way to open it. Not the capture (UploadRow asks for the file; this shows one) and
   not a product document (that is the Vault's: an Attachment can stand for one before it exists).
   - `status` is where the file is in the stream, in the stream's own words (uploadProgress.ts:
     `uploading` until the server says stored, `reading` until it says complete): uploading ·
     reading · done · failed. Not `state`: that is an Item's life (rest · expanded · new · struck).
     In flight the name shimmers (the base, `shimmer` in theme.css) and the row is `aria-busy`;
     failed turns the media and the line to the destructive tone, and the line says what to do
     (the state is never colour alone). The line is a polite live region, so a change of stage
     is read out without moving focus.
   - The line under the name: `description` when given (a stage with an estimate, "Uploading ·
     40%"; the reading result), else the status's own words while in flight, else what the file
     is ("PDF · 2.4 MB", `fileLine`) when done. Copy is the spike's until Product's lands.
     The base truncates the line; a failed row's reason wraps instead, because the reason is
     the content and a toast is narrow (356px).
   - The media is the glyph for the file's kind (FileIcon), or a thumbnail when `image` is given
     (a raw <img>: a picture of the file, not a person, so not Avatar; alt is empty because the
     name beside it is the text).
   - `framed` off drops the border, fill and padding, for a row that sits inside another surface
     (a toast carries one this way, R19-06; the same boolean Callout has).
   - `density` compact is the base's sm (a 32px media, 12px text), for a toast or a dense list.
     The base's xs size, vertical orientation and dashed `idle` state are not exposed until a
     screen needs them; the base's AttachmentGroup (a snapping strip) stays upstream's.
   - Actions: AttachmentAction is a ghost icon Button (remove, retry, download); pass another
     variant through. The base's own AttachmentAction (upstream's Button) is not used.
   - Focus (R15-17): the base's `focus-within` ring on the row is off — it lit the whole card
     on a mouse click of any action and kept it lit (George 2026-10-31). An action keeps
     Button's keyboard-only ring; a row with `onOpen` takes the card cue, the halo outside the
     border, while its trigger has keyboard focus.
   - The row spans its container (`w-full`), unlike upstream's chip (`w-fit`): here it sits
     under a card or inside a toast, never in a composer's strip. */
const UPSTREAM_STATE = { uploading: "uploading", reading: "processing", done: "done", failed: "error" } as const
const UPSTREAM_SIZE = { default: "default", compact: "sm" } as const

export type AttachmentStatus = keyof typeof UPSTREAM_STATE

/** The line under the name while the file is in flight or failed, when the caller gives none. Spike copy. */
const STATUS_LINE: Record<Exclude<AttachmentStatus, "done">, string> = {
  uploading: "Uploading…",
  reading: "Reading…",
  failed: "We couldn’t read this one. Try again.",
}

/** One file as a row: glyph or thumbnail, name, a status or metadata line, actions, and the row as the way to open it. */
function Attachment({
  name,
  file,
  kind,
  status = "done",
  description,
  image,
  actions,
  onOpen,
  openLabel,
  density = "default",
  framed = true,
  className,
  ...data
}: {
  /** The file's name, as the title. */
  name: string
  /** Its MIME type and size, for the glyph and the "PDF · 2.4 MB" line. The name is read from `name`. */
  file?: Omit<FileLike, "name">
  /** The glyph, when the file's kind is known better than its type or name says. */
  kind?: FileKind
  /** Where the file is in the stream: uploading · reading · done (default) · failed. */
  status?: AttachmentStatus
  /** The line under the name. Default: the status's words in flight; what the file is when done. */
  description?: ReactNode
  /** A thumbnail URL in place of the glyph (an object URL, a signed URL). */
  image?: string
  /** AttachmentActions at the end of the row: remove, retry, download. */
  actions?: ReactNode
  /** Makes the whole row open the file (a preview, a download). Gets an accessible name from `name`. */
  onOpen?: () => void
  /** The open control's accessible name. Default "Open {name}". */
  openLabel?: string
  /** default · compact (a 32px media and smaller text, for a toast or a dense list). */
  density?: keyof typeof UPSTREAM_SIZE
  /** Off: no border, fill or padding, for a row inside another surface (a toast). */
  framed?: boolean
  /** Placement (margins), not restyling. */
  className?: string
} & { [key: `data-${string}`]: string | undefined }) {
  const busy = status === "uploading" || status === "reading"
  const line = description ?? (status === "done" ? fileLine({ name, ...file }) || undefined : STATUS_LINE[status])
  return (
    <UiAttachment
      state={UPSTREAM_STATE[status]}
      size={UPSTREAM_SIZE[density]}
      aria-busy={busy || undefined}
      className={cn(
        // The base rings the whole row on `focus-within` — any focus inside, a mouse click on an
        // action included, and it stays lit until focus leaves. Off: the action keeps its own
        // ring (Button's, keyboard only). A row that opens takes the card cue (R15-17, cardFocus):
        // the halo outside the border, only while its trigger has keyboard focus.
        "w-full shadow-card focus-within:ring-0 has-[>a,>button]:hover:bg-card has-[>a,>button]:hover:layer-hover",
        onOpen && "has-[[data-slot=attachment-trigger]:focus-visible]:ring-2 has-[[data-slot=attachment-trigger]:focus-visible]:ring-focus-halo",
        !framed &&
          "rounded-none border-0 bg-transparent shadow-none has-data-[slot=attachment-content]:px-0 has-data-[slot=attachment-content]:py-0 has-data-[slot=attachment-media]:p-0 has-[>a,>button]:hover:bg-transparent",
        className
      )}
      {...data}
    >
      <UiAttachmentMedia variant={image ? "image" : "icon"} className={cn(!image && "text-muted-foreground")}>
        {image ? (
          <img src={image} alt="" />
        ) : (
          // 32 in the 40 media (the format band shows from 32), 20 in the compact 32; a failed file
          // takes the media's destructive ink over the kind's colour.
          <FileIcon
            kind={kind}
            file={{ name, ...file }}
            className={cn(density === "compact" ? "size-icon-lg" : "size-8", status === "failed" && "text-destructive")}
          />
        )}
      </UiAttachmentMedia>
      <UiAttachmentContent>
        <UiAttachmentTitle className="font-semibold text-card-foreground">{name}</UiAttachmentTitle>
        {line && (
          <UiAttachmentDescription
            aria-live="polite"
            className={cn("font-medium", status === "failed" && "text-clip whitespace-normal")}
          >
            {line}
          </UiAttachmentDescription>
        )}
      </UiAttachmentContent>
      {actions && <UiAttachmentActions className="gap-1">{actions}</UiAttachmentActions>}
      {onOpen && <UiAttachmentTrigger aria-label={openLabel ?? `Open ${name}`} onClick={onOpen} />}
    </UiAttachment>
  )
}

/** An action at the end of an Attachment: a ghost icon Button by default (remove, retry, download); any variant passes through. */
function AttachmentAction({ variant = "ghost", size = "icon", ...props }: ButtonProps) {
  return <Button variant={variant} size={size} {...props} />
}

export { Attachment, AttachmentAction }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AttachmentProps = ComponentProps<typeof Attachment>
export type AttachmentActionProps = ComponentProps<typeof AttachmentAction>
