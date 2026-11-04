import type { ComponentProps } from "react"
import { useId, type ReactNode } from "react"
import { XIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../components/actions/button"
import { Inline } from "../primitives/inline"

/* @archetype Surface (ARCHETYPES.md).
   CaptureCard (R2-49, R6-05; prototype components/capture/CaptureCard.tsx, styles/capture.css
   .vt-capture / .vt-inline): the card an Area page opens when the owner adds something. One at a
   time, at the top of the main column (`placement="top"`), or opened in place under the row or
   slot that asked for it (`placement="inline"`, the prototype's InlineCapture). It hosts one
   capture unit as its children: a small form, an UploadRow, a PersonPicker.
   - A shell only. What the unit saves, and when the card closes, is the caller's: the card never
     closes itself. `onClose` is the Close button (an X, "Close"); a unit's own Done or Never
     mind calls the same handler.
   - The header is a slab title and an optional one-line description (500, the prototype's
     .vt-capture__h span); inline cards use the smaller title.
   - The surface is the prototype's blue wash: a primary-subtle (blue-100) border and an accent
     (blue-bg) → card gradient. Not area-toned: the prototype sets the area variables on it but its wash and
     border are the brand blue, so a capture reads the same on every Area.
   - `actions` is the row under the unit (Done, "Type it instead"), wrapping on a narrow card.
   - A <section> named by its title (aria-labelledby). Focus is the unit's: its first control
     takes autoFocus, as the prototype's did. */
/** The card an Area page opens to add something: title, description, close, the capture unit and its actions. */
function CaptureCard({
  title,
  description,
  onClose,
  closeLabel = "Close",
  placement = "top",
  actions,
  id,
  children,
  className,
}: {
  /** What is being added ("Name a guardian", "Upload your will"). Names the section. */
  title: ReactNode
  /** One line under the title: why, or what happens next. */
  description?: ReactNode
  /** The Close button. Omit it and the card has no close (a unit that must be finished or declined). */
  onClose?: () => void
  /** Accessible name of the Close button. Default "Close". */
  closeLabel?: string
  /** top (default): the card at the top of the main column · inline: opened in place under a row or slot (smaller title, tighter padding). */
  placement?: "top" | "inline"
  /** The row under the unit: Done, "Type it instead", a decline. Wraps on a narrow card. */
  actions?: ReactNode
  /** Anchor id, so the page can scroll the card into view. */
  id?: string
  /** The capture unit: a form, an UploadRow, a PersonPicker. */
  children?: ReactNode
  /** Placement (margins), not restyling. */
  className?: string
}) {
  const titleId = useId()
  const inline = placement === "inline"
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-slot="capture-card"
      data-placement={placement}
      className={cn(
        "relative scroll-mt-4 border border-primary-subtle bg-linear-to-b from-accent to-card",
        inline ? "rounded-lg to-80% px-4.5 py-4" : "rounded-xl to-70% px-5.5 pt-5 pb-4.5",
        className
      )}
    >
      <div className={cn("flex items-start gap-3.5", inline ? "mb-3" : "mb-3.5")}>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className={cn("font-display font-bold text-card-foreground", inline ? "text-base" : "text-lg", "leading-display")}>
            {title}
          </h2>
          {description && <p className="mt-1 max-w-measure text-sm font-medium text-muted-foreground">{description}</p>}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" icon={<XIcon />} aria-label={closeLabel} onClick={onClose} className="-mt-1 -mr-1 shrink-0" />
        )}
      </div>
      {children}
      {actions && (
        <Inline gap={4} className="mt-3.5">
          {actions}
        </Inline>
      )}
    </section>
  )
}

export { CaptureCard }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type CaptureCardProps = ComponentProps<typeof CaptureCard>
