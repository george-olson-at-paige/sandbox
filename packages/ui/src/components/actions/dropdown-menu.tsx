import { useId, type ElementType, type ReactElement, type ReactNode } from "react"
import { CheckIcon } from "lucide-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"
import {
  DropdownMenu as UiDropdownMenu,
  DropdownMenuCheckboxItem as UiDropdownMenuCheckboxItem,
  DropdownMenuContent as UiDropdownMenuContent,
  DropdownMenuGroup as UiDropdownMenuGroup,
  DropdownMenuItem as UiDropdownMenuItem,
  DropdownMenuLabel as UiDropdownMenuLabel,
  DropdownMenuRadioGroup as UiDropdownMenuRadioGroup,
  DropdownMenuRadioItem as UiDropdownMenuRadioItem,
  DropdownMenuSeparator as UiDropdownMenuSeparator,
  DropdownMenuShortcut as UiDropdownMenuShortcut,
  DropdownMenuSub as UiDropdownMenuSub,
  DropdownMenuSubContent as UiDropdownMenuSubContent,
  DropdownMenuSubTrigger as UiDropdownMenuSubTrigger,
  DropdownMenuTrigger as UiDropdownMenuTrigger,
} from "../../base/dropdown-menu"
import {
  POPOVER_SIDE_OFFSET,
  popoverContent,
  popoverGroupedItem,
  popoverIndicator,
  popoverItem,
  popoverItemWithIndicator,
  popoverLabel,
  popoverSeparator,
  popoverShortcut,
  type PopoverAlign,
  type PopoverSide,
} from "../internal/popover-surface"
import type { MenuEntry, MenuTone } from "./menu"
import { GroupedDropdownRoot } from "../internal/popover-group"
import { groupedFlags, ItemLabel, offItem } from "../internal/menu-entry"

/* @archetype Overlay (ARCHETYPES.md).
   Paige DropdownMenu over upstream DropdownMenu (R1-25): a Menu in a popover (R4-08). It takes
   Menu's typed entries (plus `sub`) and its item look, rendered as Radix menu items (arrow
   keys, typeahead, Escape); Menu renders the same entries standalone in the page. The
   entries are a typed union, so every upstream piece is available (icons, shortcuts, checkbox
   and radio items, submenus, labels, separators, links) without callers assembling markup.
   The trigger is the caller's element (asChild): a Button, a DisclosureTrigger (R1-18), an
   avatar button. The popover look is shared with Select (popover-surface.ts): 8px from the
   trigger, beside it, never over it; `side`/`align` override the default (below, end). */

/** A Menu's entries (R4-08) plus `sub`, a submenu that opens to the side (popover only). */
type DropdownMenuEntry = MenuEntry | { kind: "sub"; label: ReactNode; icon?: ReactNode; items: DropdownMenuEntry[]; disabled?: boolean }

type DropdownMenuProps = {
  /** The element that opens the menu; it receives the trigger's aria and event props. */
  trigger: ReactElement
  items: DropdownMenuEntry[]
  side?: PopoverSide
  align?: PopoverAlign
  /** The app's router link for `link` entries (GAPS #42). */
  linkAs?: ElementType
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Modal menus block the page and trap focus (Radix default). Header menus pass false. */
  modal?: boolean
  /** Shares one open state with the other popovers in the enclosing PopoverGroup (the header, R11-10): opening this closes them. Replaces `open`/`onOpenChange`. */
  group?: string
  "aria-label"?: string
}

/* Upstream checkbox/radio items draw their indicator on the left (a radio as a dot); hide it
   and draw the shared check on the right, where Select draws it. */
const hideUpstreamIndicator = "pl-2.5 [&>span:first-child]:hidden"

function Indicator() {
  return (
    <span data-slot="menu-indicator" className={popoverIndicator}>
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-icon" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
  )
}

function Entry({ entry, grouped, linkAs: Link }: { entry: DropdownMenuEntry; grouped: boolean; linkAs: ElementType }) {
  const reasonId = useId()
  const indent = grouped && popoverGroupedItem
  switch (entry.kind) {
    case "item": {
      // An off item (R13-21) stays in the arrow-key order so its reason is read; selecting it does
      // nothing and keeps the menu open. Radix's `disabled` would skip it.
      const off = Boolean(entry.disabledReason)
      return (
        <UiDropdownMenuItem
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
          {entry.shortcut && <UiDropdownMenuShortcut className={popoverShortcut}>{entry.shortcut}</UiDropdownMenuShortcut>}
        </UiDropdownMenuItem>
      )
    }
    case "link":
      return (
        <UiDropdownMenuItem asChild disabled={entry.disabled} className={cn(popoverItem, indent)}>
          <Link href={entry.href}>
            {entry.icon}
            {entry.label}
          </Link>
        </UiDropdownMenuItem>
      )
    case "checkbox":
      return (
        <UiDropdownMenuCheckboxItem
          checked={entry.checked}
          onCheckedChange={(c) => entry.onCheckedChange(c === true)}
          disabled={entry.disabled}
          onSelect={(e) => e.preventDefault() /* toggles keep the menu open */}
          className={cn(popoverItem, popoverItemWithIndicator, hideUpstreamIndicator, indent)}
        >
          {entry.icon}
          {entry.label}
          <Indicator />
        </UiDropdownMenuCheckboxItem>
      )
    case "radio-group":
      return (
        <UiDropdownMenuGroup>
          {entry.label && <UiDropdownMenuLabel className={popoverLabel}>{entry.label}</UiDropdownMenuLabel>}
          <UiDropdownMenuRadioGroup value={entry.value} onValueChange={entry.onValueChange}>
            {entry.options.map((o) => (
              <UiDropdownMenuRadioItem
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className={cn(popoverItem, popoverItemWithIndicator, hideUpstreamIndicator, entry.label && popoverGroupedItem)}
              >
                {o.icon}
                {o.label}
                <Indicator />
              </UiDropdownMenuRadioItem>
            ))}
          </UiDropdownMenuRadioGroup>
        </UiDropdownMenuGroup>
      )
    case "sub":
      return (
        <UiDropdownMenuSub>
          <UiDropdownMenuSubTrigger disabled={entry.disabled} className={cn(popoverItem, "data-[disabled]:pointer-events-none data-[disabled]:opacity-disabled", indent)}>
            {entry.icon}
            {entry.label}
          </UiDropdownMenuSubTrigger>
          <UiDropdownMenuSubContent sideOffset={POPOVER_SIDE_OFFSET} alignOffset={-8 /* first sub item level with its trigger */} className={cn(popoverContent, "min-w-menu")}>
            <Entries items={entry.items} linkAs={Link} />
          </UiDropdownMenuSubContent>
        </UiDropdownMenuSub>
      )
    case "separator":
      return <UiDropdownMenuSeparator className={popoverSeparator} />
    case "label":
      return (
        <UiDropdownMenuLabel className={typeof entry.label === "string" ? popoverLabel : "px-2.5 py-2 font-medium"}>
          {entry.label}
        </UiDropdownMenuLabel>
      )
  }
}

function Entries({ items, linkAs }: { items: DropdownMenuEntry[]; linkAs: ElementType }) {
  // Menus are static lists; the index is a stable key. Items under a string label are indented (R13-05).
  const grouped = groupedFlags(items)
  return items.map((entry, i) => <Entry key={i} entry={entry} grouped={grouped[i]} linkAs={linkAs} />)
}

/** A Menu in a popover: actions or links from a button, given as data (the same entries as Menu, plus submenus). */
function DropdownMenu({
  trigger,
  items,
  side = "bottom",
  align = "end",
  linkAs = "a",
  open,
  defaultOpen,
  onOpenChange,
  modal,
  group,
  "aria-label": ariaLabel,
}: DropdownMenuProps) {
  const body = (
    <>
      <UiDropdownMenuTrigger asChild>{trigger}</UiDropdownMenuTrigger>
      <UiDropdownMenuContent side={side} align={align} sideOffset={POPOVER_SIDE_OFFSET} aria-label={ariaLabel} className={popoverContent}>
        <Entries items={items} linkAs={linkAs} />
      </UiDropdownMenuContent>
    </>
  )
  // In a PopoverGroup the open state is the group's (a client root); the entries stay here.
  if (group !== undefined)
    return (
      <GroupedDropdownRoot group={group} modal={modal}>
        {body}
      </GroupedDropdownRoot>
    )
  return (
    <UiDropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      {body}
    </UiDropdownMenu>
  )
}

export { DropdownMenu }
export type { DropdownMenuEntry, DropdownMenuProps, MenuTone }
