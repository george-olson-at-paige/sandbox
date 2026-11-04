import type { ComponentProps } from "react"
import type { ReactNode } from "react"
import { CheckIcon, MinusIcon, SlashIcon, XIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Dot, type DotTone } from "./dot"

/* @archetype Mark (ARCHETYPES.md).
   StatusMark (R10-12, GAPS #113): the one status vocabulary and mark, in components/ so both the
   Vault's StatusDot and the charts' graph draw it (charts/ sits below vault/ and can't import
   it; before this the graph kept its own copy of the marks).
   Item statuses: open (dashed ring), partial (half), present (the area fill with a tick; the
   area comes from [data-area], R3-15), declined (grey). Work statuses: waiting (dashed ring),
   working (the prototype's turning ring, setup.css:135, still under reduced motion), done
   (success fill, tick), attention (warning fill, cross; red stays for irreversible actions,
   R2-03), skipped (grey with a minus) and canceled (grey with a slash), so the two greys differ
   by more than colour.
   Strokes are the prototype's 1.5px (vault.css:333-337; R1-14). At md (20px, R4-05) the icon is
   12px at stroke 3 (R4-15: whole device pixels at 100/125/150%); sm (16px) is for a legend or a
   table row, icon 10px. Built on Dot (R4-09): Dot gives the circle and the fill tone; the marks
   that aren't a fill are drawn here. Decorative by default: the text beside it says the status. */

type ItemStatus = "open" | "partial" | "present" | "declined"
type WorkStatus = "waiting" | "working" | "done" | "attention" | "skipped" | "canceled"
/** Every status a mark can show. */
type MarkStatus = ItemStatus | WorkStatus

const grey = "border-dot border-border bg-muted"
const MARK: Record<MarkStatus, { tone: DotTone; className?: string; icon?: ReactNode }> = {
  open: { tone: "none", className: "border-dot border-dashed border-muted-foreground" },
  partial: { tone: "none", className: "border-dot border-placeholder bg-linear-to-r from-placeholder from-50% to-transparent to-50%" },
  present: { tone: "area", icon: <CheckIcon strokeWidth={3} /> },
  declined: { tone: "none", className: grey },
  waiting: { tone: "none", className: "border-dot border-dashed border-placeholder" },
  working: { tone: "none", className: "border-2 border-primary-subtle border-t-primary motion-safe:animate-spin" },
  done: { tone: "success", icon: <CheckIcon strokeWidth={3} /> },
  attention: { tone: "warning", icon: <XIcon strokeWidth={3} /> },
  skipped: { tone: "none", className: cn(grey, "text-muted-foreground"), icon: <MinusIcon strokeWidth={3} /> },
  canceled: { tone: "none", className: cn(grey, "text-muted-foreground"), icon: <SlashIcon strokeWidth={3} /> },
}

/** One status as a mark: an item's (open, partial, present, declined) or a piece of work's (waiting, working, done, attention, skipped, canceled), at 20px or 16px. */
function StatusMark({
  status,
  size = "md",
  label,
  className,
}: {
  /** Item: open · partial · present · declined. Work: waiting · working · done · attention · skipped · canceled. */
  status: MarkStatus
  /** md 20 (a row, a node, a panel) · sm 16 (a legend, a table row). */
  size?: "sm" | "md"
  /** Accessible name; without it the mark is decorative (the text beside it carries the status). */
  label?: string
  className?: string
}) {
  const m = MARK[status]
  return (
    <Dot
      size={size === "md" ? "xl" : "lg"}
      tone={m.tone}
      label={label}
      data-slot="status-mark"
      data-status={status}
      className={cn("transition-colors motion-reduce:transition-none", size === "md" ? "[&>svg]:size-icon-xs" : "[&>svg]:size-2.5", m.className, className)}
    >
      {m.icon}
    </Dot>
  )
}

export { StatusMark }
export type { ItemStatus, MarkStatus, WorkStatus }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type StatusMarkProps = ComponentProps<typeof StatusMark>
