/* One popover look for Select and DropdownMenu (R1-25). Both open beside their trigger, never
   over it, the same distance away, with the same surface, item, label, separator and check
   indicator. Server-safe: plain strings and numbers, no "use client" (GAPS #19). */

/** Gap between the trigger and the popover, in px (the prototype's menu gap). */
export const POPOVER_SIDE_OFFSET = 8

/** Which side of the trigger the popover opens on, and how it lines up with it. */
export type PopoverSide = "top" | "right" | "bottom" | "left"
export type PopoverAlign = "start" | "center" | "end"

/** Surface: 12px radius, 8px padding, the pop shadow (prototype vault.css:304-310); a long list scrolls with the theme's thin scrollbar (R10-08). */
export const popoverContent = "min-w-menu-wide rounded-lg p-2 text-card-foreground shadow-pop scrollbar-thin"

/** The item row both menus share: 10px side padding, 8px tall padding, 16px icons 10px from
    the label, 500 text in ink. */
const itemBase = "cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-card-foreground"

/** A popover item (DropdownMenu, Select). The highlighted item (pointer or keyboard; Radix moves
    focus) and an open submenu's trigger get the relative overlay (R4-01), not a fixed muted
    fill, so a menu on a muted surface still shows which item is highlighted. Upstream items
    carry the rest (flex, disabled opacity, svg sizing); their focus:bg-accent is cancelled. */
export const popoverItem = `${itemBase} focus:bg-transparent focus:layer-hover focus:text-card-foreground data-[state=open]:bg-transparent data-[state=open]:layer-hover data-[state=open]:text-card-foreground`

/** A standalone Menu item (R4-08): a real button or link in the tab order, with the same look.
    Hover (real pointers) and keyboard focus get the relative overlay; focus also shows the ring.
    It carries what upstream items give the popover form: flex, icon sizing, disabled opacity. */
export const menuItem = `${itemBase} flex w-full items-center text-left outline-none select-none focus-ring hover:layer-hover focus-visible:layer-hover disabled:pointer-events-none disabled:opacity-disabled aria-disabled:pointer-events-none aria-disabled:opacity-disabled [&_svg]:pointer-events-none [&_svg]:size-icon [&_svg]:shrink-0 [&_svg:not([class*='text-'])]:text-muted-foreground`

/** A Combobox option (U-01): the same row; cmdk marks the highlighted one with `data-selected`
    rather than focus (focus stays in the field), and its accent fill is cancelled for the relative
    overlay. A disabled option keeps the pointer so the not-allowed cursor shows. */
export const comboboxItem = `${itemBase} data-[selected=true]:bg-transparent data-[selected=true]:text-card-foreground data-[selected=true]:layer-hover data-[disabled=true]:pointer-events-auto data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-disabled`

/** A Combobox group: popoverLabel's look, said for cmdk's heading element (cmdk renders it, so
    the classes reach it from the group); the group's own padding goes, the surface has it. */
export const comboboxGroup =
  "p-0 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-eyebrow [&_[cmdk-group-heading]]:text-card-foreground [&_[cmdk-group-heading]]:uppercase"

/** Room on the right for the check indicator (Select items, checkbox and radio items). */
export const popoverItemWithIndicator = "pr-control-sm"

/** The check indicator: a 16px check, 10px in from the right edge. */
export const popoverIndicator = "pointer-events-none absolute right-2.5 flex size-icon items-center justify-center"

/** Items inside a labelled group are indented one step, like a native optgroup. */
export const popoverGroupedItem = "pl-5"

/** Group label: the eyebrow style at 600 in the ink colour. */
export const popoverLabel = "px-2.5 pt-2 pb-1 text-xs font-semibold tracking-eyebrow text-card-foreground uppercase"

/** Separator: edge to edge inside the padding, the light rule. */
export const popoverSeparator = "-mx-2 my-2 bg-divider-tint"

/** Keyboard shortcut text at the end of an item. */
export const popoverShortcut = "pl-4 text-xs font-medium tracking-widest text-muted-foreground"
