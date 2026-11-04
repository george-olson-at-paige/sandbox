import type { ElementType } from "react"
import { ChevronRightIcon, CornerUpLeftIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import {
  Breadcrumb as UiBreadcrumb,
  BreadcrumbEllipsis as UiBreadcrumbEllipsis,
  BreadcrumbItem as UiBreadcrumbItem,
  BreadcrumbLink as UiBreadcrumbLink,
  BreadcrumbList as UiBreadcrumbList,
  BreadcrumbPage as UiBreadcrumbPage,
  BreadcrumbSeparator as UiBreadcrumbSeparator,
} from "../../base/breadcrumb"
import { DropdownMenu, type DropdownMenuEntry } from "../actions/dropdown-menu"
import { pressable } from "../internal/control"

/* @archetype Frame (ARCHETYPES.md).
   Paige Breadcrumb over upstream Breadcrumb (R20-15): the trail from the top of a section down
   to the page you are on, as data: `items={[{ label, href }, …]}`, the last one being the page.
   The archetype list has no Navigation entry (Sidebar and TabsPill, the other navigation parts,
   are Frames: they place named slots and take no tone or size), so this is a Frame that exposes
   no axes of its own.

   Inks: earlier levels are muted links that darken on hover and ring on focus (`focus-ring`, the
   rule for links); the current page is the base's `BreadcrumbPage` (`aria-current="page"`, not a
   link) in the card ink at 500, so the trail reads as a muted path ending in one strong word.
   The separator is a 14px chevron, muted, drawn by the list (aria-hidden: assistive tech hears
   an ordered list of levels, not punctuation).

   Collapse (the simplest honest version): `maxItems` (default 3) is applied always. A trail
   longer than that shows the first level, an ellipsis button, and the last `maxItems − 1`
   levels; the ellipsis opens a DropdownMenu listing the hidden levels as links, so no level is
   ever unreachable. Whether a trail collapses at phone width is the caller's call (pass a
   smaller `maxItems` where the container is narrow, or `Infinity` to never collapse): rendering
   both versions and hiding one with `sm:` classes would put every link in the page twice for
   assistive tech, and the width that matters is the container's, which CSS breakpoints can't
   see. A level without an `href` is plain text in the trail and a non-focusable entry in the
   menu (the last item's `href` is ignored: the page you are on is not a link).

   `linkAs` is the app's router link (default `a`), used for the trail's links and for the menu's
   entries, the same slot DropdownMenu and Menu have. Server-safe: no state of its own (the
   menu is DropdownMenu's), so a server component can render it, passing `linkAs` only from a
   client module as everywhere else. */

/** One level of the trail. */
type BreadcrumbEntry = {
  /** What the level is called ("Documents"). */
  label: string
  /** Where it goes. Omit for a level that has no page of its own; ignored on the last level. */
  href?: string
}

type BreadcrumbProps = {
  /** The trail, top level first; the last item is the current page. */
  items: BreadcrumbEntry[]
  /** The landmark's name for assistive tech. Default "Breadcrumb". */
  label?: string
  /** Most levels shown before the middle ones collapse into the ellipsis menu. Default 3; `Infinity` never collapses. Keeps the first level and the last `maxItems − 1`. */
  maxItems?: number
  /** The app's router link for the levels (default `a`). */
  linkAs?: ElementType
  /** Extra classes for placement, not restyling. */
  className?: string
}

const LINK = "rounded-xs text-muted-foreground hover:text-card-foreground focus-ring"

/** The hidden levels as the menu's entries: a link each, a plain label for a level without a page. */
function hiddenEntries(hidden: BreadcrumbEntry[]): DropdownMenuEntry[] {
  return hidden.map((level) =>
    level.href
      ? { kind: "link", label: level.label, href: level.href, icon: <CornerUpLeftIcon aria-hidden /> }
      : { kind: "label", label: <span className="text-muted-foreground">{level.label}</span> },
  )
}

/** The trail to the current page: muted links, the page itself strong, long trails collapsed into a menu of the hidden levels. */
function Breadcrumb({ items, label = "Breadcrumb", maxItems = 3, linkAs: Link = "a", className }: BreadcrumbProps) {
  const tail = Math.max(1, maxItems - 1)
  const collapsed = items.length > Math.max(2, maxItems)
  const head = collapsed ? items.slice(0, 1) : items
  const hidden = collapsed ? items.slice(1, items.length - tail) : []
  const rest = collapsed ? items.slice(items.length - tail) : []
  const lastIndex = items.length - 1

  const level = (entry: BreadcrumbEntry, index: number) => {
    const last = index === lastIndex
    return (
      <UiBreadcrumbItem key={`${index}-${entry.label}`}>
        {last ? (
          <UiBreadcrumbPage className="font-medium text-card-foreground">{entry.label}</UiBreadcrumbPage>
        ) : entry.href ? (
          <UiBreadcrumbLink asChild className={LINK}>
            <Link href={entry.href}>{entry.label}</Link>
          </UiBreadcrumbLink>
        ) : (
          <span>{entry.label}</span>
        )}
      </UiBreadcrumbItem>
    )
  }
  const separator = (key: string) => (
    <UiBreadcrumbSeparator key={key} className="[&>svg]:size-icon-sm">
      <ChevronRightIcon aria-hidden />
    </UiBreadcrumbSeparator>
  )

  const shown: Array<{ entry: BreadcrumbEntry; index: number } | "ellipsis"> = [
    ...head.map((entry, i) => ({ entry, index: i })),
    ...(collapsed ? (["ellipsis"] as const) : []),
    ...rest.map((entry, i) => ({ entry, index: items.length - rest.length + i })),
  ]

  return (
    <UiBreadcrumb aria-label={label} className={className}>
      <UiBreadcrumbList>
        {shown.flatMap((part, i) => {
          const node =
            part === "ellipsis" ? (
              <UiBreadcrumbItem key="ellipsis">
                <DropdownMenu
                  modal={false}
                  align="start"
                  linkAs={Link}
                  items={hiddenEntries(hidden)}
                  trigger={
                    <button type="button" aria-label={`Show ${hidden.length} hidden ${hidden.length === 1 ? "level" : "levels"}`} className={cn(pressable, "rounded-xs text-muted-foreground hover:text-card-foreground")}>
                      <UiBreadcrumbEllipsis className="size-control-sm" />
                    </button>
                  }
                />
              </UiBreadcrumbItem>
            ) : (
              level(part.entry, part.index)
            )
          return i === 0 ? [node] : [separator(`sep-${i}`), node]
        })}
      </UiBreadcrumbList>
    </UiBreadcrumb>
  )
}

export { Breadcrumb }
export type { BreadcrumbEntry, BreadcrumbProps }
