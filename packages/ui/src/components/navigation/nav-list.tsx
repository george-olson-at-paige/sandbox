import type { ElementType } from "react"

import { cn } from "../../lib/utils"
import { formatMetric } from "../../lib/metrics"
import { Dot } from "../display/dot"
import { pressable } from "../internal/control"

/* @archetype Item (ARCHETYPES.md).
   NavList (R21-12): a vertical in-page nav — the Journeys page's list of screens ("All screens",
   then Welcome · 101, About you · 89 … with a dot on the biggest drop). Not Sidebar: Sidebar is
   the app's nav (it collapses to a rail and becomes a sheet on a phone); this is a list of the
   views of one page, inside it.
   - Each item is a label, an optional trailing count (12px muted, tabular) and an optional marker
     (a Dot in the attention tone with a name, "Biggest drop", so it isn't colour alone: the name
     is part of the item's accessible name).
   - Real controls: an item with `href` is a link (the app's `linkAs`, `aria-current="page"` when
     current, so back and deep links work); without one it is a button calling `onSelect(id)`
     (`aria-current="true"` when current: it shows that view on this page). Every item is in the
     tab order (a short list; no roving focus) and wears `pressable`'s gapped ring.
   - The current item uses the sidebar's active roles (`--sidebar-accent` tint, the dark blue ink,
     700) and a 3px brand bar along its left edge (the mock's inset bar), drawn by `::before` so
     nothing shifts. The rest: 14/500 body ink, the relative hover and press (R4-01).
   - `framed` puts the list on a white card on the surface edge (the mock's box); without it the
     list sits on whatever holds it. 40px rows (`py-2.5` around a 20px line). Server-safe. */

/** One destination in the list. */
type NavListItem = {
  id: string
  label: string
  /** A trailing count ("101"); omit for none. */
  count?: number | null
  /** A named attention dot after the label ("Biggest drop"); the name is part of the item's name. */
  marker?: string
  /** A link to this view; without it the item is a button calling `onSelect`. */
  href?: string
}

/** A vertical list of a page's views with counts and an attention marker; the current one is tinted with a brand bar. */
function NavList({
  items,
  current,
  onSelect,
  label,
  framed = false,
  linkAs: Link = "a",
  className,
}: {
  /** The destinations, in order. */
  items: readonly NavListItem[]
  /** The current item's id. */
  current?: string
  /** Called with an item's id when an item without `href` is pressed. */
  onSelect?: (id: string) => void
  /** The nav's accessible name ("Screens"). */
  label: string
  /** On a white card with the surface edge (the list stands alone in a column). */
  framed?: boolean
  /** The app's router link for items with `href` (default `a`). */
  linkAs?: ElementType
  /** Placement, not restyling. */
  className?: string
}) {
  return (
    <nav aria-label={label} data-slot="nav-list" className={cn(framed && "rounded-md border border-surface-edge bg-card p-2", className)}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isCurrent = item.id === current
          const classes = cn(
            pressable,
            "relative flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-medium text-card-foreground hover:layer-hover active:layer-press",
            "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:rounded-l-sm before:border-l-3 before:border-transparent",
            isCurrent && "bg-sidebar-accent font-bold text-sidebar-accent-foreground before:border-primary"
          )
          const body = (
            <>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.marker && <Dot tone="attention" size="xs" label={item.marker} />}
              {item.count !== undefined && (
                <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">{item.count === null ? "—" : formatMetric(item.count, { kind: "count" })}</span>
              )}
            </>
          )
          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} aria-current={isCurrent ? "page" : undefined} data-slot="nav-list-item" className={classes}>
                  {body}
                </Link>
              ) : (
                <button type="button" aria-current={isCurrent ? "true" : undefined} data-slot="nav-list-item" onClick={() => onSelect?.(item.id)} className={classes}>
                  {body}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { NavList }
export type { NavListItem }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type NavListProps = Parameters<typeof NavList>[0]
