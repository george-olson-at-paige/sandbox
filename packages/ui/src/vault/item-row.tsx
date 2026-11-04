import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"
import { cardVariants } from "../components/display/card"
import { Eyebrow } from "../components/display/eyebrow"
import { Split } from "../primitives/split"
import { StatusDot, type ItemStatus } from "./status-dot"

/* @archetype Item (ARCHETYPES.md).
   ItemRow (R2-34, GAPS #43): one item on an Area page, the Row every Area shares
   (prototype ItemRow.tsx:476-490, vault.css:330-349). Header: StatusDot, title, why, a chip,
   actions on a Split capped at half the row (asideMax="half", R2-15), dropping under the text
   on narrow rows. Body: the item's records, indented to the text (32px from md). Rows sit in a
   Panel with a divider between them; the first step is a highlighted card with an eyebrow.
   Declined rows are muted; inside a quiet Panel (R2-13) open rows are lighter. The bodies
   (people, documents, key details, and the Will, Sweep and Inventory hosts) stay features. */
/** A row, not a container: one item on an Area page (status, title, why, a chip, actions, its records below), inside a Panel. */
function ItemRow({
  status,
  title,
  why,
  eyebrow,
  highlight,
  chip,
  actions,
  id,
  children,
}: {
  /** open (nothing yet) · partial · present (done) · declined (the owner said it doesn't apply). */
  status: ItemStatus
  /** The item, in the owner's words. */
  title: ReactNode
  /** One line on why it matters, or what the owner told us ("You told us: …"). */
  why?: ReactNode
  /** Small label above the title in the area colour, e.g. "Start here". Use with highlight. */
  eyebrow?: ReactNode
  /** The first step: a card in the area tint instead of a divided row. */
  highlight?: boolean
  /** A Badge under the why line, e.g. the partial chip (neutral outline). */
  chip?: ReactNode
  /** Buttons at the end of the row (at most half its width; they wrap inside it). */
  actions?: ReactNode
  /** Anchor id, for in-page links (the rail's What's left). */
  id?: string
  /** The item's records (FactItems, a FactFieldGrid), indented to the text. */
  children?: ReactNode
}) {
  return (
    <div
      id={id}
      data-slot="item-row"
      data-status={status}
      className={
        highlight
          ? cardVariants({ variant: "highlight", className: "my-1 gap-0 rounded-lg px-4 py-4" })
          : "border-t border-divider py-4 first:border-t-0"
      }
    >
      <div className="flex items-start gap-3">
        <StatusDot status={status} className="mt-0.5" />
        <Split gap={4} align="start" asideMax="half" className="min-w-0 flex-1 text-sm" aside={actions || null}>
          {eyebrow && <Eyebrow tone="area" className="mb-1 block">{eyebrow}</Eyebrow>}
          <b
            className={cn(
              "block text-base font-semibold",
              status === "declined" ? "text-muted-foreground" : "text-card-foreground",
              status === "open" && "group-data-[panel=quiet]/panel:font-medium group-data-[panel=quiet]/panel:text-foreground"
            )}
          >
            {title}
          </b>
          {why && <span className="mt-0.5 block max-w-prose font-medium text-muted-foreground">{why}</span>}
          {chip && <span className="mt-1.5 block">{chip}</span>}
        </Split>
      </div>
      {children && <div data-slot="item-row-body" className="mt-2 md:ml-8">{children}</div>}
    </div>
  )
}

export { ItemRow }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ItemRowProps = ComponentProps<typeof ItemRow>
