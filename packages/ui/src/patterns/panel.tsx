import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"
import { Card } from "../components/display/card"

/* @archetype Surface (ARCHETYPES.md).
   Panel: the generic Area page container. default · muted · quiet. Returns nothing when empty.
   quiet (R2-13, George 2026-10-18; prototype vault.css:329,349) is "More that belongs here":
   the muted surface, a muted slab title, and lighter open rows (ItemRow reads data-panel), so
   the owner can tell that none of it is waiting on them. */
/** A titled container on an Area page or its rail: count, a more link, description. */
function Panel({
  title,
  count,
  more,
  description,
  variant = "default",
  id,
  children,
  className,
}: {
  /** Panel heading. */
  title?: ReactNode
  /** Small count after the title, e.g. "3". */
  count?: ReactNode
  /** A link at the right of the heading row ("See all"). */
  more?: ReactNode
  /** A line under the heading. With no children, the description alone keeps the panel. */
  description?: ReactNode
  /** default (card) · muted (tinted, for provenance and side notes) · quiet (tinted, muted title, lighter open rows: nothing here waits on the owner). */
  variant?: "default" | "muted" | "quiet"
  /** Anchor id, for in-page links to the panel. */
  id?: string
  /** The body. With no children and no description the panel renders nothing. */
  children?: ReactNode
  /** Extra classes for placement, not restyling. */
  className?: string
}) {
  if (!children && !description) return null
  return (
    <Card
      variant={variant === "default" ? "default" : "muted"}
      id={id}
      className={cn("group/panel gap-0 px-5 py-5", className)}
      data-slot="panel"
      data-panel={variant}
    >
      {title && (
        <div className="mb-1 flex items-baseline gap-2.5">
          <h2 className={cn("font-display text-base font-bold", variant === "quiet" ? "text-muted-foreground" : "text-card-foreground")}>{title}</h2>
          {count != null && <span className="text-xs font-semibold text-muted-foreground">{count}</span>}
          {more && <span className="ml-auto text-sm">{more}</span>}
        </div>
      )}
      {description && <p className="mb-4 text-sm font-medium text-muted-foreground last:mb-0">{description}</p>}
      {children}
    </Card>
  )
}

export { Panel }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PanelProps = ComponentProps<typeof Panel>
