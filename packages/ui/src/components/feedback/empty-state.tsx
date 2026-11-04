import type { ReactNode } from "react"

import { cn } from "../../lib/utils"
import { Empty as UiEmpty, EmptyContent as UiEmptyContent, EmptyDescription as UiEmptyDescription, EmptyHeader as UiEmptyHeader, EmptyMedia as UiEmptyMedia, EmptyTitle as UiEmptyTitle } from "../../base/empty"

/* @archetype Composite (ARCHETYPES.md).
   Paige EmptyState over upstream Empty (U-03): the one "nothing here" for a table, a list, a pane
   or a page. Before it, DataTable, ListPage and DagFrame each composed theirs (a muted line; the
   line with a Clear all; an icon in a disc with a line), and the five admin lists passed strings
   into the first two. The base gives the stack (media, header, content), the centring and the
   text balance; this layer gives it Paige's sizes and inks and a `kind`.
   - `kind` says why it's empty, so a reader and a test can tell them apart (`data-kind`):
     nothing-yet (nothing exists: "No one has signed up yet."), no-results (what was asked for
     isn't there: "No people match “smith”.", with Clear all), error (the load failed: the message
     and Try again; the stack is `role="alert"` and the title takes the attention ink).
   - `size` is the place it sits (R20-07, D-05): sm (default) is the line in a table's body, 14px
     at 500 in the muted ink, 40px of padding above and below, the reading measure wide; md is
     a pane's (a card, a side panel), the base's 18px title and 14px description at its 384px
     measure, more room around it; lg is a page's (ReUI's basic empty state), the title at 20px
     in the strong ink, one 14px muted description line, up to two actions side by side, and
     the most room above and below. Same axis words as the rest of the scale; the docs page
     shows them by place ("In a table", "In a pane", "A page").
   - `icon`: a lucide glyph in a muted disc above the title (DagFrame's "Nothing has run yet");
     the disc is round here, not the base's square: 40px with a 20px glyph at sm and md, 48px
     with a 24px glyph at lg.
   Copy is the caller's (the noun and the query are theirs); the words follow Paige's rule of
   saying what to do next where there is a next thing (an action, not a hint). */

type EmptyStateProps = {
  /** The one line: what there is none of, in the person's words. */
  title: ReactNode
  /** A second line under it, when the title needs one. */
  description?: ReactNode
  /** A lucide glyph, drawn in a muted disc above the title. */
  icon?: ReactNode
  /** What to do next: a Button (Clear all, Try again, Add …). */
  actions?: ReactNode
  /** nothing-yet (default) · no-results · error (an alert; the title in the attention ink). */
  kind?: "nothing-yet" | "no-results" | "error"
  /** By place: sm (default) a table's body, one muted line · md a pane (a card, a side panel) · lg a page, with a larger disc and title. */
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE = {
  sm: {
    root: "gap-3 px-6 py-10 md:px-6 md:py-10",
    header: "max-w-measure",
    disc: "",
    glyph: "[&_svg:not([class*='size-'])]:size-icon-lg",
    title: "text-sm font-medium tracking-normal",
    description: "text-xs/relaxed font-medium",
  },
  md: {
    root: "gap-6 p-6 md:p-12",
    header: undefined,
    disc: "",
    glyph: "[&_svg:not([class*='size-'])]:size-icon-lg",
    title: "text-lg font-medium tracking-tight text-card-foreground",
    description: "text-sm/relaxed",
  },
  lg: {
    root: "gap-8 px-6 py-16 md:py-24",
    header: "max-w-measure gap-3",
    disc: "size-12",
    glyph: "[&_svg:not([class*='size-'])]:size-icon-xl",
    title: "text-xl font-semibold tracking-tight text-card-foreground",
    description: "text-sm/relaxed",
  },
} as const

/** Nothing here: a title, an optional glyph and description, and what to do next (`kind` says why it's empty). */
function EmptyState({ title, description, icon, actions, kind = "nothing-yet", size = "sm", className }: EmptyStateProps) {
  const s = SIZE[size]
  return (
    <UiEmpty role={kind === "error" ? "alert" : undefined} data-slot="empty-state" data-kind={kind} data-size={size} className={cn("min-w-0", s.root, className)}>
      {/* The base holds the header to 384px; a table's line runs to the reading measure (one line where it fits). */}
      <UiEmptyHeader className={s.header}>
        {icon && (
          <UiEmptyMedia variant="icon" aria-hidden className={cn("mb-0 rounded-full text-muted-foreground", s.disc, s.glyph)}>
            {icon}
          </UiEmptyMedia>
        )}
        <UiEmptyTitle className={cn("text-muted-foreground", s.title, kind === "error" && "text-attention-foreground")}>{title}</UiEmptyTitle>
        {description && <UiEmptyDescription className={cn("text-muted-foreground", s.description)}>{description}</UiEmptyDescription>}
      </UiEmptyHeader>
      {/* The base caps content at 384px, which folds two md Buttons; the actions row is as wide as its buttons and wraps only when the place is narrower. */}
      {actions && <UiEmptyContent className="w-auto max-w-none flex-row flex-wrap justify-center gap-2">{actions}</UiEmptyContent>}
    </UiEmpty>
  )
}

export { EmptyState }
export type { EmptyStateProps }
