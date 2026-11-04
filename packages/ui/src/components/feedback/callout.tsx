import type { ComponentProps } from "react"
import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Alert as UiAlert, AlertDescription as UiAlertDescription, AlertTitle as UiAlertTitle } from "../../base/alert"
import { Split } from "../../primitives/split"
import { Button, type ButtonProps } from "../actions/button"

/* @archetype Surface (ARCHETYPES.md).
   Callout over upstream Alert: a short piece set apart in the page's flow — a note, or a report
   of something — with a tone (neutral · info · success · attention), an icon, an optional title,
   body and actions. One component since 2026-10-30 (D-05, D-19, George): it was Message
   (Feedback; renamed from Alert at R4-14 because "alert" also means the browser's alert(), the
   confirm dialog and the assertive role) plus a separate Callout (Display; a note, no tone).
   "Message" went because it is a Paige product noun (the Messages mode, the messages people
   leave), the copy map (forms/messages.ts) and, on shadcn.io, a chat bubble; "Callout" is the
   markdown word and Radix Themes' for this exact shape. The shadcn base keeps its name, `alert`.
   The live-region role follows the tone: `note` for neutral (a static aside, not announced —
   the old Callout's role), `status` (polite) for info and success, `alert` (assertive) only for
   attention, the tone failures and errors use. Not a toast and not a dialog.
   Upstream is a grid of svg/title/description with no actions slot (GAPS #22); here the icon
   sits beside a Split whose content takes the whole row, so the actions always follow the text
   on their own line (George 2026-10-30: a button beside a one-line callout sat below the line,
   and centring it on the line was more machinery than the look was worth).
   Actions (R3-06, George 2026-10-30): CalloutAction is a Button at sm. The default is the white
   button; `muted` is the outline, and either passes down, so a confirming action stays primary
   (R2-07) by passing that variant.
   Dismiss (R2-35, GAPS #22): `onDismiss` adds an icon button at the end (accessible name
   "Dismiss" unless `dismissLabel` says otherwise); the caller hides the callout and remembers it.
   `framed={false}` drops the border, fill and padding for a callout that sits in a surface of
   its own (the Sections banner in a PageBand).
   Icon: upstream's 16px (`size-icon`, the glyph in a button, a menu row, a field) at lucide's
   own weight, nudged 2px down to centre on the first 20px line — the base's `translate-y-0.5`,
   which stands. R3-04 (2026-10-19) had it at 20px with the stroke held at 2px
   (non-scaling-stroke) to cure a soft 1.67px stroke; at 1× that read as a heavy, jaggy ring
   beside the fine glyphs everywhere else (George 2026-10-30: "too big, pixelated"), so the
   base's size and weight came back and the utility went. Neutral has no visible border (the
   muted fill is its edge; George 2026-10-28 for the note) and a muted icon. */
const calloutTone = cva("flex items-start gap-3", {
  variants: {
    tone: {
      neutral: "border-transparent bg-muted text-foreground [&>svg]:text-muted-foreground",
      info: "border-info-border bg-info-subtle text-info-foreground [&>svg]:text-info",
      success: "border-success-border bg-success-subtle text-success-foreground [&>svg]:text-success",
      attention: "border-attention-border bg-attention-subtle text-attention-foreground [&>svg]:text-attention",
    },
    framed: { true: "", false: "rounded-none border-0 bg-transparent p-0" },
  },
  defaultVariants: { tone: "neutral", framed: true },
})

type CalloutProps = VariantProps<typeof calloutTone> & {
  /** Leading icon (lucide), drawn in the tone colour (muted for neutral). */
  icon?: ReactNode
  /** A bold first line, when the callout needs a heading. A report usually has one; a note often doesn't. */
  title?: ReactNode
  /** Body text. */
  children?: ReactNode
  /** Buttons: CalloutAction (white, sm) by default; `muted` for the outline. They follow the text, on their own line. */
  actions?: ReactNode
  /** Adds a dismiss button at the end; called when it's pressed. The caller hides the callout. */
  onDismiss?: () => void
  /** The dismiss button's accessible name. Default "Dismiss". */
  dismissLabel?: string
  className?: string
}

/* The live-region role follows the tone: `note` for neutral (a static aside), `status`
   (polite) for info and success, `alert` (assertive) only for attention. */
const ROLE = { neutral: "note", info: "status", success: "status", attention: "alert" } as const

/** A short piece set apart in the page's flow — a note or a report: a tone, an icon, an optional title, a body and actions (not a toast, not a dialog). */
function Callout({
  tone,
  framed,
  icon,
  title,
  children,
  actions,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
}: CalloutProps) {
  const t = tone ?? "neutral"
  return (
    <UiAlert
      role={ROLE[t]}
      data-slot="callout"
      data-tone={t}
      className={cn(calloutTone({ tone, framed }), className)}
    >
      {icon}
      {/* basis-full on the content: the text takes the whole row, so the actions always follow
          it instead of sitting beside it. */}
      <Split aside={actions} gap={3} className="min-w-0 flex-1 **:data-[slot=split-content]:basis-full">
        {title && <UiAlertTitle className={cn("line-clamp-none font-semibold", t === "neutral" && "text-foreground-strong")}>{title}</UiAlertTitle>}
        {children && <UiAlertDescription className={cn("block font-medium text-current", title && "mt-0.5")}>{children}</UiAlertDescription>}
      </Split>
      {onDismiss && (
        <Button variant="ghost" size="icon" icon={<XIcon />} aria-label={dismissLabel} onClick={onDismiss} className="-my-1.5 -mr-1.5 shrink-0" />
      )}
    </UiAlert>
  )
}

/** A button for a Callout's actions: the white button at sm, unless `variant` says otherwise (`muted` is the outline). */
function CalloutAction({ variant = "secondary", size = "sm", ...props }: ButtonProps) {
  return <Button variant={variant} size={size} {...props} />
}

export { Callout, CalloutAction }
export type { CalloutProps }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type CalloutActionProps = ComponentProps<typeof CalloutAction>
