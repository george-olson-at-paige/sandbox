import type { ComponentProps } from "react"
import { useId, type ElementType, type ReactNode } from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { groupedFlags, ItemLabel, offItem } from "../internal/menu-entry"
import { menuItem, popoverGroupedItem, popoverIndicator, popoverItemWithIndicator, popoverLabel, popoverShortcut } from "../internal/popover-surface"

/* @archetype Composite (ARCHETYPES.md).
   Menu (R4-08, George 2026-10-19; name and intent from Orbit's Menu): the list of items itself,
   as a component, so the same entries render standalone (an in-page list of actions) or in a
   popover (DropdownMenu, "a Menu in a popover"). Both take the typed entries below (R1-25) and
   share one item look (popover-surface.ts).
   What differs is the interaction each place needs:
   - Menu: a group of real buttons and links in the page's tab order; no roving focus, no
     typeahead, no ARIA menu roles (those promise arrow-key handling a page list doesn't have).
     A checkbox entry is a toggle button (aria-pressed); a radio group is a labelled group of
     toggle buttons, one pressed. Submenus don't exist here.
   - DropdownMenu: the same entries as Radix menu items (arrow keys, typeahead, Escape), plus
     `sub` for submenus.
   Icons: an entry that does something or goes somewhere (an action, a link) carries an icon, and
   the typed ListAction vocabulary requires it; the raw `item` keeps `icon?` for a pick-list,
   where the entries are values to choose (Personal / Family / Household) and the label is the
   whole entry (R20-04, George 2026-10-31). */

/** `destructive` draws red text: irreversible actions only (delete), always behind a confirm.
    Nothing that can be undone is red (R2-03, George 2026-10-18). */
type MenuTone = "default" | "destructive"

/** One entry of a Menu or a DropdownMenu. */
type MenuEntry =
  /** An action. `disabledReason` (R13-21): the action can't apply here; the item stays focusable
      but does nothing (`aria-disabled`), and the reason shows under its label and is its
      accessible description, so keyboard and screen-reader users reach it too. `disabled`
      removes it from the keys entirely (use it only when there is nothing to explain). */
  | { kind: "item"; label: ReactNode; icon?: ReactNode; shortcut?: string; onSelect: () => void; disabled?: boolean; disabledReason?: string; tone?: MenuTone }
  /** A route. Rendered with the menu's `linkAs` (the app's router link). */
  | { kind: "link"; label: ReactNode; icon?: ReactNode; href: string; disabled?: boolean }
  /** A toggle; the check shows when on. */
  | { kind: "checkbox"; label: ReactNode; icon?: ReactNode; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }
  /** One choice of several; the check marks the chosen option. `label` titles the group. */
  | {
      kind: "radio-group"
      label?: string
      value: string
      onValueChange: (value: string) => void
      options: Array<{ value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean }>
    }
  | { kind: "separator" }
  /** Not focusable. A string is a section heading (the eyebrow, like Select's group labels);
      an element is a block of content (e.g. the account's name and email). */
  | { kind: "label"; label: ReactNode }

const destructive = "text-destructive [&_svg:not([class*='text-'])]:text-destructive"

function Check({ on }: { on: boolean }) {
  return <span className={popoverIndicator}>{on && <CheckIcon className="size-icon text-card-foreground" aria-hidden />}</span>
}

function Entry({ entry, grouped, linkAs: Link }: { entry: MenuEntry; grouped: boolean; linkAs: ElementType }) {
  const reasonId = useId()
  const indent = grouped && popoverGroupedItem
  switch (entry.kind) {
    case "item": {
      const off = Boolean(entry.disabledReason)
      return (
        <button
          type="button"
          onClick={off ? undefined : entry.onSelect}
          disabled={entry.disabled}
          aria-disabled={off || undefined}
          aria-describedby={off ? reasonId : undefined}
          className={cn(menuItem, "aria-disabled:pointer-events-auto aria-disabled:opacity-100", off ? offItem : entry.tone === "destructive" && destructive, indent)}
        >
          {entry.icon}
          <ItemLabel label={entry.label} reason={entry.disabledReason} reasonId={reasonId} />
          {entry.shortcut && <span className={cn(popoverShortcut, "ml-auto")}>{entry.shortcut}</span>}
        </button>
      )
    }
    case "link":
      /* A disabled route is not a link (no href to follow), just its label, dimmed. */
      return entry.disabled ? (
        <span aria-disabled="true" className={cn(menuItem, indent)}>
          {entry.icon}
          {entry.label}
        </span>
      ) : (
        <Link href={entry.href} className={cn(menuItem, indent)}>
          {entry.icon}
          {entry.label}
        </Link>
      )
    case "checkbox":
      return (
        <button
          type="button"
          aria-pressed={entry.checked}
          onClick={() => entry.onCheckedChange(!entry.checked)}
          disabled={entry.disabled}
          className={cn(menuItem, popoverItemWithIndicator, "relative", indent)}
        >
          {entry.icon}
          {entry.label}
          <Check on={entry.checked} />
        </button>
      )
    case "radio-group":
      return (
        <div role="group" aria-label={entry.label} className="flex flex-col">
          {entry.label && <div aria-hidden className={popoverLabel}>{entry.label}</div>}
          {entry.options.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={entry.value === o.value}
              onClick={() => entry.onValueChange(o.value)}
              disabled={o.disabled}
              className={cn(menuItem, popoverItemWithIndicator, "relative", entry.label && popoverGroupedItem)}
            >
              {o.icon}
              {o.label}
              <Check on={entry.value === o.value} />
            </button>
          ))}
        </div>
      )
    case "separator":
      return <div role="separator" className="my-2 h-px bg-divider-tint" />
    case "label":
      return typeof entry.label === "string" ? (
        <div className={popoverLabel}>{entry.label}</div>
      ) : (
        <div className="px-2.5 py-2 font-medium">{entry.label}</div>
      )
  }
}

/** A list of actions and links given as data, standalone in the page; DropdownMenu shows the same entries in a popover. */
function Menu({
  items,
  linkAs = "a",
  "aria-label": ariaLabel,
  className,
}: {
  /** The entries, in order: the same typed entries DropdownMenu takes (no submenus). */
  items: MenuEntry[]
  /** The app's router link for `link` entries (GAPS #42). */
  linkAs?: ElementType
  /** Names the group for screen readers ("Document actions"). */
  "aria-label"?: string
  /** Placement and width, not restyling. */
  className?: string
}) {
  const grouped = groupedFlags(items)
  return (
    <div data-slot="menu" role="group" aria-label={ariaLabel} className={cn("flex flex-col", className)}>
      {/* Menus are static lists; the index is a stable key. */}
      {items.map((entry, i) => <Entry key={i} entry={entry} grouped={grouped[i]} linkAs={linkAs} />)}
    </div>
  )
}

export { Menu }
export type { MenuEntry, MenuTone }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type MenuProps = ComponentProps<typeof Menu>
