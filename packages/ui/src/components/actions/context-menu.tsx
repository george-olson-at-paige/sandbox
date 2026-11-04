"use client"

import type { ComponentProps } from "react"
import { useId, type ElementType, type ReactElement, type ReactNode } from "react"

import { cn } from "../../lib/utils"
import {
  ContextMenu as UiContextMenu,
  ContextMenuContent as UiContextMenuContent,
  ContextMenuItem as UiContextMenuItem,
  ContextMenuLabel as UiContextMenuLabel,
  ContextMenuSeparator as UiContextMenuSeparator,
  ContextMenuShortcut as UiContextMenuShortcut,
  ContextMenuSub as UiContextMenuSub,
  ContextMenuSubContent as UiContextMenuSubContent,
  ContextMenuSubTrigger as UiContextMenuSubTrigger,
  ContextMenuTrigger as UiContextMenuTrigger,
} from "../../base/context-menu"
import { POPOVER_SIDE_OFFSET, popoverContent, popoverGroupedItem, popoverItem, popoverLabel, popoverSeparator, popoverShortcut } from "../internal/popover-surface"
import { groupedFlags, ItemLabel, offItem } from "../internal/menu-entry"
import type { MenuEntry } from "./menu"

/* @archetype Overlay (ARCHETYPES.md).
   ContextMenu (S-41, George 2026-10-29): the menu that opens where a person right-clicks (or
   long-presses on touch, or presses Shift+F10 or the Menu key on something focused inside the
   target). Over upstream ContextMenu (src/base/context-menu.tsx), with DropdownMenu's typed
   entries and the same item look (popover-surface.ts), so a right-click menu and a ⋯ menu built
   from the same list are the same menu.
   - Entries: actions, links, separators, labels and submenus: the kinds a list of actions uses.
     No checkbox or radio entries: settings belong in a ⋯ or a page, not behind a right-click.
   - A shortcut, never the only way in: whatever offers a right-click menu also shows its ⋯
     (useActionMenu gives both from one list). It replaces the browser's own menu over the target.
   - The target is the caller's element (asChild); it receives the trigger's event props, so it
     must pass them on (a plain element does). */

/** One entry of a ContextMenu: an action, a link, a separator, a label, or a submenu of those. */
type ContextMenuEntry =
  | Extract<MenuEntry, { kind: "item" | "link" | "separator" | "label" }>
  | { kind: "sub"; label: ReactNode; icon?: ReactNode; items: ContextMenuEntry[]; disabled?: boolean }

function Entry({ entry, grouped, linkAs: Link }: { entry: ContextMenuEntry; grouped: boolean; linkAs: ElementType }) {
  const reasonId = useId()
  const indent = grouped && popoverGroupedItem
  switch (entry.kind) {
    case "item": {
      // An off item (R13-21) stays in the arrow-key order so its reason is read; selecting it does nothing.
      const off = Boolean(entry.disabledReason)
      return (
        <UiContextMenuItem
          onSelect={off ? (e) => e.preventDefault() : entry.onSelect}
          disabled={entry.disabled}
          aria-disabled={off || undefined}
          aria-describedby={off ? reasonId : undefined}
          data-off={off || undefined}
          variant={off ? "default" : (entry.tone ?? "default")}
          className={cn(popoverItem, off && offItem, off && "focus:text-muted-foreground", indent)}
        >
          {entry.icon}
          <ItemLabel label={entry.label} reason={entry.disabledReason} reasonId={reasonId} />
          {entry.shortcut && <UiContextMenuShortcut className={popoverShortcut}>{entry.shortcut}</UiContextMenuShortcut>}
        </UiContextMenuItem>
      )
    }
    case "link":
      return (
        <UiContextMenuItem asChild disabled={entry.disabled} className={cn(popoverItem, indent)}>
          <Link href={entry.href}>
            {entry.icon}
            {entry.label}
          </Link>
        </UiContextMenuItem>
      )
    case "sub":
      return (
        <UiContextMenuSub>
          <UiContextMenuSubTrigger disabled={entry.disabled} className={cn(popoverItem, "data-[disabled]:pointer-events-none data-[disabled]:opacity-disabled", indent)}>
            {entry.icon}
            {entry.label}
          </UiContextMenuSubTrigger>
          <UiContextMenuSubContent sideOffset={POPOVER_SIDE_OFFSET} className={cn(popoverContent, "min-w-menu")}>
            <Entries items={entry.items} linkAs={Link} />
          </UiContextMenuSubContent>
        </UiContextMenuSub>
      )
    case "separator":
      return <UiContextMenuSeparator className={popoverSeparator} />
    case "label":
      return (
        <UiContextMenuLabel className={typeof entry.label === "string" ? popoverLabel : "px-2.5 py-2 font-medium"}>
          {entry.label}
        </UiContextMenuLabel>
      )
  }
}

function Entries({ items, linkAs }: { items: ContextMenuEntry[]; linkAs: ElementType }) {
  // Menus are static lists; the index is a stable key. Items under a string label are indented (R13-05).
  const grouped = groupedFlags(items)
  return items.map((entry, i) => <Entry key={i} entry={entry} grouped={grouped[i]} linkAs={linkAs} />)
}

/** A menu that opens where a person right-clicks the target: actions and links given as data, the same entries as DropdownMenu's. */
function ContextMenu({
  children,
  items,
  linkAs = "a",
  "aria-label": ariaLabel,
}: {
  /** The target: right-clicking it (or long-pressing it) opens the menu. One element that passes event props on. */
  children: ReactElement
  items: ContextMenuEntry[]
  /** The app's router link for `link` entries. */
  linkAs?: ElementType
  /** Names the menu for screen readers ("Actions for David Reyes"). */
  "aria-label"?: string
}) {
  return (
    <UiContextMenu>
      <UiContextMenuTrigger asChild>{children}</UiContextMenuTrigger>
      <UiContextMenuContent aria-label={ariaLabel} className={popoverContent}>
        <Entries items={items} linkAs={linkAs} />
      </UiContextMenuContent>
    </UiContextMenu>
  )
}

export { ContextMenu }
export type { ContextMenuEntry }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ContextMenuProps = ComponentProps<typeof ContextMenu>
