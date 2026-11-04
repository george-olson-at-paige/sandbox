"use client"

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type RefObject } from "react"

import { cn } from "../../lib/utils"
import { Command as UiCommand, CommandGroup as UiCommandGroup, CommandItem as UiCommandItem, CommandList as UiCommandList } from "../../base/command"
import { comboboxGroup, comboboxItem, type PopoverAlign } from "../internal/popover-surface"
import { Popover, PopoverAnchor, PopoverContent } from "../overlays/popover"
import { InputGroupInput } from "./input-group"

/* @archetype Control (ARCHETYPES.md).
   Combobox (U-01) over upstream Command (cmdk) and Popover: a text field whose typed text brings
   up things to pick from. Before it, AddressField, HeaderSearch and PersonPicker's search each
   wrote their own: the arrow keys, the highlighted row, the listbox and its ids, the scroll into
   view. cmdk gives those (Up/Down with wrap, the first match highlighted, pointer highlight, the
   option ids and `aria-selected`, `aria-activedescendant`, scroll into view, groups, an empty
   state); this layer gives the Paige field and list, and the places where cmdk's own input and
   keys don't fit a field in a form:
   - The field is the Paige InputGroupInput, not cmdk's Input: cmdk's forces its own `id` (a
     Field's label would point elsewhere) and `aria-expanded="true"` even when nothing is open.
     The highlighted option's id and the listbox's id are read from the list once it's there, so
     `aria-activedescendant` and `aria-controls` point at something only while it is on screen.
   - Enter clicks the highlighted option (a link opens, an option picks) instead of cmdk's own
     Enter, which dispatches an event a link can't act on and prevents a form's submit even with
     nothing to pick. With the list closed, Enter is the form's. Home and End stay the caret's.
     Down or Up with the list closed asks to open it (`onOpenChange(true)`).
   - The list: a Popover under the field (default; the field's width, the popover surface, focus
     never leaves the field, a click outside or Escape closes it), or `inline`, in the flow under
     the field for a region that may not open a popover (R14-04: PersonPicker in an open Add).
   - Filtering is the caller's: what is passed is what lists (`shouldFilter` off), since the
     suggestions are typed-for (a lookup, a search) rather than a fixed set to filter. That
     means options mount and unmount as the suggestions change, which cmdk's own filter never
     does, and cmdk loses the highlight when the highlighted option leaves together with others
     (its scheduler keeps one unmount callback per commit). So the highlight is held here: cmdk's
     value is controlled, and after each change of the list, with nothing highlighted, the first
     option that can be is.
   `open` is the caller's state (it has suggestions; the field is focused): the Combobox asks
   for changes through `onOpenChange`. Each option needs a `value` unique in the list. */

type ComboboxContextValue = {
  open: boolean
  onOpenChange: ((open: boolean) => void) | undefined
  inline: boolean
  listId: string | undefined
  setListId: (id: string | undefined) => void
  rootRef: RefObject<HTMLDivElement | null>
  /** cmdk's highlighted value, controlled here so the highlight can be kept on a listed option. */
  value: string
  setValue: (value: string) => void
  /** The highlighted option's element id (aria-activedescendant), read from the list. */
  activeId: string | undefined
  setActiveId: (id: string | undefined) => void
  /** Whether the list has any option (else `empty` shows and the listbox is hidden). */
  hasOptions: boolean
  setHasOptions: (has: boolean) => void
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null)

function useCombobox(part: string) {
  const ctx = useContext(ComboboxContext)
  if (!ctx) throw new Error(`@paige/ui: ${part} must be inside a Combobox`)
  return ctx
}

type ComboboxProps = {
  /** Whether the list shows. The caller's: it has suggestions, the field is focused. */
  open: boolean
  /** Asked to close (a click outside, Escape, focus leaving) or to open (Down or Up in the field). */
  onOpenChange?: (open: boolean) => void
  /** The list in the flow under the field instead of a popover: for a region that may not open one (R14-04). */
  inline?: boolean
  /** Layout (width, flex) only, not restyling. */
  className?: string
  children: ReactNode
}

/** A text field with things to pick from as you type: the Paige field, cmdk's list and keys, in a popover or inline. */
function Combobox({ open, onOpenChange, inline = false, className, children }: ComboboxProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [listId, setListId] = useState<string>()
  const [value, setValue] = useState("")
  const [activeId, setActiveId] = useState<string>()
  const [hasOptions, setHasOptions] = useState(false)
  const ctx = useMemo(
    () => ({ open, onOpenChange, inline, listId, setListId, rootRef, value, setValue, activeId, setActiveId, hasOptions, setHasOptions }),
    [open, onOpenChange, inline, listId, value, activeId, hasOptions]
  )
  const root = (
    <UiCommand
      ref={rootRef}
      // What is passed is what lists; the caller filters or looks up.
      shouldFilter={false}
      value={value}
      onValueChange={setValue}
      loop
      // Ctrl+N/P/J/K are a palette's; in a field they'd fight the browser's own.
      vimBindings={false}
      // Not a tab stop or a click target of its own: the field inside is.
      tabIndex={undefined}
      data-slot="combobox"
      data-state={open ? "open" : "closed"}
      className={cn("block h-auto w-full overflow-visible rounded-none bg-transparent text-inherit", className)}
    >
      <ComboboxContext.Provider value={ctx}>{children}</ComboboxContext.Provider>
    </UiCommand>
  )
  if (inline) return root
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{root}</PopoverAnchor>
    </Popover>
  )
}

type ComboboxInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "role" | "type" | "autoComplete" | "aria-autocomplete" | "aria-expanded" | "aria-controls" | "aria-activedescendant"
>

/** The field (inside an InputGroup): the Paige input with the combobox's ARIA and keys. */
function ComboboxInput({ onKeyDown, ...props }: ComboboxInputProps) {
  const { open, onOpenChange, listId, activeId } = useCombobox("ComboboxInput")
  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    switch (e.key) {
      case "Home":
      case "End":
        // The caret's, not the list's.
        e.stopPropagation()
        break
      case "ArrowDown":
      case "ArrowUp":
        if (open) break // cmdk moves the highlight
        e.preventDefault()
        e.stopPropagation()
        onOpenChange?.(true)
        break
      case "Enter": {
        // cmdk's Enter would prevent a form's submit even with nothing to pick, and can't open a link.
        e.stopPropagation()
        const active = open && activeId ? e.currentTarget.ownerDocument.getElementById(activeId) : null
        if (active) {
          e.preventDefault()
          active.click()
        }
        break
      }
    }
  }
  return (
    <InputGroupInput
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open && activeId ? activeId : undefined}
      autoComplete="off"
      spellCheck={false}
      onKeyDown={keys}
      {...props}
    />
  )
}

type ComboboxListProps = {
  /** The listbox's name ("Suggested addresses", "Search results"). cmdk's default is "Suggestions". */
  label?: string
  /** Name the listbox by an element instead (the eyebrow over a picker). */
  "aria-labelledby"?: string
  /** Popover: how it lines up with the field (default start). */
  align?: PopoverAlign
  /** Popover: width and height only (default the field's width, 18rem tall); inline: placement. */
  className?: string
  /** Shown instead of the options when there are none: what to say ("Nothing matches…", an invitation to type). Outside the listbox, so a listbox is never empty. */
  empty?: ReactNode
  children: ReactNode
}

const stop = (e: Event) => e.preventDefault()

/** The options, as a popover under the field (default) or inline; shown while the Combobox is open. */
function ComboboxList({ label, "aria-labelledby": labelledBy, align = "start", className, empty, children }: ComboboxListProps) {
  const { open, inline, setListId, rootRef, hasOptions } = useCombobox("ComboboxList")
  const listEl = useRef<HTMLDivElement | null>(null)
  // cmdk owns the listbox's id; the field reads it from here for aria-controls while it's on screen.
  // A callback ref, not an effect: the popover's portal mounts the list a commit after this renders.
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      listEl.current = el
      setListId(el?.id)
    },
    [setListId]
  )
  const list = (
    <>
      <UiCommandList
        ref={attach}
        label={label}
        aria-labelledby={labelledBy}
        data-slot="combobox-list"
        // No options: the listbox is hidden (never an empty one on screen) and `empty` says why.
        hidden={!hasOptions}
        // The panel scrolls (popover) or the flow does (inline); the list itself doesn't cap.
        className={cn("max-h-none overflow-visible", inline && "flex flex-col")}
      >
        {children}
      </UiCommandList>
      {!hasOptions && empty !== undefined && (
        <div data-slot="combobox-empty" className="px-2.5 py-2 text-sm font-medium text-muted-foreground">
          {empty}
        </div>
      )}
      <TrackHighlight list={listEl} />
    </>
  )
  if (inline) {
    if (!open) return null
    // A press on an option keeps focus in the field; the click picks.
    return (
      <div data-slot="combobox-panel" onMouseDown={(e) => e.preventDefault()} className={className}>
        {list}
      </div>
    )
  }
  return (
    <PopoverContent
      align={align}
      aria-label={label}
      // Focus stays in the field (combobox): the popover never takes it, opening or closing.
      onOpenAutoFocus={stop}
      onCloseAutoFocus={stop}
      // A press on an option keeps focus in the field; a press on the field isn't "outside".
      onMouseDown={(e) => e.preventDefault()}
      onInteractOutside={(e) => {
        if (rootRef.current?.contains(e.target as Node)) e.preventDefault()
      }}
      className={cn("max-h-72 w-(--radix-popover-trigger-width) overflow-auto", className)}
    >
      {list}
    </PopoverContent>
  )
}

/* After each change of the list or the highlight (both re-render this), finds the highlighted
   option among the committed ones by its value: its id is the field's aria-activedescendant;
   with none (the highlighted option left the list, or the list is new), the first option that can
   be highlighted is. cmdk does the latter when a list mounts, but not when the highlighted option
   leaves with others (see the header); and its own `selectedItemId` lags a controlled value, so
   the id is read here. Rendered after the list; nothing on screen. */
function TrackHighlight({ list }: { list: RefObject<HTMLDivElement | null> }) {
  const { value, setValue, setActiveId, setHasOptions } = useCombobox("ComboboxList")
  useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    setHasOptions(el.querySelector("[cmdk-item]") !== null)
    const options = Array.from(el.querySelectorAll<HTMLElement>('[cmdk-item]:not([aria-disabled="true"])'))
    const highlighted = options.find((o) => o.dataset.value === value)
    if (highlighted) return setActiveId(highlighted.id)
    const first = options[0]
    if (first?.dataset.value !== undefined) setValue(first.dataset.value)
    else setActiveId(undefined)
  })
  return null
}

type ComboboxItemProps = Omit<ComponentProps<typeof UiCommandItem>, "value" | "onSelect" | "style"> & {
  /** Unique in the list; cmdk tracks the highlight by it. */
  value: string
  /** Picked: a click, or Enter on the highlighted option. */
  onSelect?: (value: string) => void
}

/** One option. `asChild` makes something else the option (a link). */
function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  return <UiCommandItem className={cn(comboboxItem, className)} {...props} />
}

type ComboboxGroupProps = Omit<ComponentProps<typeof UiCommandGroup>, "style" | "heading"> & {
  /** The group's heading, in the popover's label style. */
  heading: ReactNode
}

/** Options under a heading ("People", "Documents"). */
function ComboboxGroup({ className, ...props }: ComboboxGroupProps) {
  return <UiCommandGroup className={cn(comboboxGroup, className)} {...props} />
}

export { Combobox, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList }
export type { ComboboxGroupProps, ComboboxInputProps, ComboboxItemProps, ComboboxListProps, ComboboxProps }
