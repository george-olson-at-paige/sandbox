"use client"

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"
import type { Orientation } from "../../lib/vocabulary"
import { IconButton, type IconButtonProps } from "../actions/icon-button"

/* @archetype Control (ARCHETYPES.md) — it holds a value, the order of a set of ids, and the person changes
   it with the keyboard or a pointer; a Control, not an Item, because it draws no row of its own: the
   rows are the caller's content (an Item, a chip, a card) and Sortable is the list, the handle and the
   reorder around them.
   Sortable (R20-19, George 2026-10-31: "they are really all the same with different content"): the
   part is the list + the handle + the keyboard reorder; what sits in each row is the caller's. It is
   controlled, like every Control here: `items` is the order, `onReorder(next)` is the whole new order
   after a drop, the caller stores it. Compositional (`SortableItem` children, in the order of
   `items`) or by data (`renderItem(id)`, Sortable keeps the order itself).
   @from reui.io/r/sortable.json · 2026-10-31 · MIT
   changed: `@base-ui/react` `useRender` + `mergeProps` → Radix `Slot` (`asChild` on the list and the item; Slot merges the
   props and handlers, `mergeProps` did that); its `cn` → `src/lib/utils`; `value`/`onValueChange`/`getItemValue` over
   an array of objects → `items` (ids) and `onReorder(next ids)`, the caller keeps its own objects (R20-21's rows will
   map ids the same way); `MouseSensor` + `TouchSensor` → one `PointerSensor` (4px to start, so a click inside the
   content still works) with `KeyboardSensor` and `sortableKeyboardCoordinates` kept (Space picks up, arrows move,
   Space drops, Escape cancels); `<div>`s → `<ul role="list">` / `<li>`, the list named by `label`; the handle, a bare
   div with the listeners → our IconButton (`GripVerticalIcon`, `aria-label`, `focus-ring`, `cursor-grab`), a real button
   that holds the keyboard sensor's attributes and the pointer listeners; `handle: false` puts them on the row itself
   (the row is then focusable, `aria-roledescription="sortable"`, no inner button semantics); dnd-kit's default
   announcements and instructions → ours, in plain words, with the item's name from `itemLabel` and its position;
   the half-faded dragged item and its bare stacking number → the lifted look: `shadow-lift`, `z-raised`, `bg-card`,
   `data-dragging`; `cursor-grabbing!` (important) → the `data-dragging` variant; `strategy` "horizontal" | "grid" |
   "vertical" → `orientation` "vertical" | "horizontal" (a wrapping row of chips is `rect`); the dragged item's
   transition is dnd-kit's own, off under reduced motion; the `DragOverlay` (`SortableOverlay`, a portal clone of the
   item) and its client-mount gate dropped: the item itself moves with `CSS.Transform` in its list, so one list needs
   no clone (a second copy of every row in `document.body` doubles each id and each query), and `modifiers` with it
   (`@dnd-kit/modifiers` is not installed; the axis follows the strategy); `onMove`, `onValueCommit` (with its
   `meta`), `onDragStart`/`onDragEnd`/`onDragCancel` pass-throughs and the duplicate-id `console.warn` dropped
   (nothing asks for them: ids are unique, the caller's job, said on `items`).
   Sensors. `PointerSensor` serves mouse, pen and touch; a touch only drags from an element with `touch-action:
   none`, so the handle has `touch-none` and the whole-row form doesn't (a row you can't scroll past on a phone
   is worse than one you can't drag by touch): on a touch screen use the handle (GAPS).
   Accessibility. Each activator (the handle, or the row without one) has dnd-kit's `aria-roledescription="sortable"`
   and `aria-describedby` for the instructions ("To reorder, focus an item and press Space…"); a live region
   announces the pick up, each move ("Ada Park is now at position 2 of 5."), the drop and a cancel, in our words.
   The row form is a `listitem` that is also the control, so it drops dnd-kit's `role="button"` and `aria-pressed`
   (a button around the caller's own buttons would nest them). Focus is `focus-ring` on the handle (IconButton's) or
   on the row. A disabled item is off the keys and the pointer, dimmed once (the item, not the item and its handle). */

const MOVE_DISTANCE = 4
const POINTER_OPTIONS = { activationConstraint: { distance: MOVE_DISTANCE } }
const KEYBOARD_OPTIONS = { coordinateGetter: sortableKeyboardCoordinates }

/* The drop animation: dnd-kit skips it when the order changed, so the item jumps to its new place;
   `wasDragging` keeps the glide. */
const animateLayoutChanges: AnimateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true })

/* Our words, in one place (the package has no copy map below forms). */
const COPY = {
  instructions: "To reorder, focus an item and press Space to pick it up. Use the arrow keys to move it, Space to drop, Escape to cancel.",
  handle: "Drag to reorder",
  handleFor: (name: string) => `Drag ${name} to reorder`,
  pickedUp: (name: string, at: number, of: number) =>
    `Picked up ${name}, position ${at} of ${of}. Use the arrow keys to move it, Space to drop, Escape to cancel.`,
  movedTo: (name: string, at: number, of: number) => `${name} is now at position ${at} of ${of}.`,
  dropped: (name: string, at: number, of: number) => `Dropped ${name} at position ${at} of ${of}.`,
  cancelled: (name: string, at: number, of: number) => `Cancelled. ${name} is back at position ${at} of ${of}.`,
} as const

/** The live region's words for a reorder, from how an id is named and where it sits; shared with DataTable's column reordering (R20-23), so a column and a list item are announced alike. */
function sortableAnnouncements({ nameOf, positionOf, total }: { nameOf: (id: UniqueIdentifier) => string; positionOf: (id: UniqueIdentifier) => number; total: number }): Announcements {
  return {
    onDragStart: ({ active }) => COPY.pickedUp(nameOf(active.id), positionOf(active.id), total),
    onDragOver: ({ active, over }) => (over ? COPY.movedTo(nameOf(active.id), positionOf(over.id), total) : undefined),
    onDragEnd: ({ active, over }) => COPY.dropped(nameOf(active.id), positionOf(over?.id ?? active.id), total),
    onDragCancel: ({ active }) => COPY.cancelled(nameOf(active.id), positionOf(active.id), total),
  }
}

/** The sensors a reorderable thing uses: a pointer that starts after 4px (a click stays a click) and the keyboard (Space, arrows, Space, Escape). A hook: call it once per DndContext. */
function useSortableSensors() {
  return useSensors(useSensor(PointerSensor, POINTER_OPTIONS), useSensor(KeyboardSensor, KEYBOARD_OPTIONS))
}

/** The screen reader's instructions and the handle's words, for a reorderable thing that isn't a Sortable list. */
const SORTABLE_COPY = { instructions: COPY.instructions, handleFor: COPY.handleFor } as const

const REDUCE = "(prefers-reduced-motion: reduce)"
const subscribeReduce = (notify: () => void) => {
  const query = window.matchMedia(REDUCE)
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}

/* prefers-reduced-motion for the item's slide; the charts keep their own copy (`charts/internal/reduced-motion.ts`),
   which a component, one tier below, can't import. */
const useReducedMotion = () => useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE).matches, () => true)

/** The direction the items run, in the vocabulary's words (`lib/vocabulary.ts`, the ARIA ones). */
type SortableOrientation = Orientation

/** How the activator is placed: a handle each item draws (true), no handle so the row drags (false), or the caller's own SortableHandle ("custom"). */
type SortableHandleMode = boolean | "custom"

type ListContextValue = {
  orientation: SortableOrientation
  handle: SortableHandleMode
  disabled: boolean
  /** The accessible name for an id, for the handle's label. */
  nameOf: (id: string) => string | undefined
}

const ListContext = createContext<ListContextValue>({ orientation: "vertical", handle: true, disabled: false, nameOf: () => undefined })

type ItemContextValue = {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  setActivatorNodeRef: (element: HTMLElement | null) => void
  isDragging: boolean
  disabled: boolean
  name: string | undefined
}

const ItemContext = createContext<ItemContextValue | null>(null)

type SortableProps = Omit<ComponentProps<"ul">, "style" | "onReorder" | "children"> & {
  /** The order: the ids of the items, first to last. Ids are unique; the caller keeps its own objects and finds them by id. */
  items: string[]
  /** Called once per drop that changed the order, with the whole new order (a new array; `items` is never changed in place). Store it and pass it back as `items`. */
  onReorder: (items: string[]) => void
  /** The list's accessible name ("Beneficiaries"). Required: a list of draggable things is announced by it. */
  label: string
  /** The direction the items run: a column (the default) or a row that wraps (chips). */
  orientation?: SortableOrientation
  /** How an item is picked up: `true` (default) draws a drag handle at the start of each item; `false` makes the whole row the handle (a touch screen scrolls rather than drags there); `"custom"` draws none, and the item holds its own `SortableHandle`. */
  handle?: SortableHandleMode
  /** Take every item off the pointer and the keys (read-only order). Items can also be disabled one by one. */
  disabled?: boolean
  /** The name of an item for the screen reader and the handle's label ("Ada Park"), by id. Without it the id is read out, so pass it when ids aren't words. */
  itemLabel?: (id: string) => string
  /** Draw the items from the data: each id's content. Without it, the children are the `SortableItem`s, in the order of `items`. */
  renderItem?: (id: string) => ReactNode
  /** The caller's own list element (an `ol`) in place of the `ul`; its props and handlers are merged with ours. */
  asChild?: boolean
  /** The `SortableItem`s, in the order of `items`; ignored when `renderItem` is given. */
  children?: ReactNode
}

/** A list the person can reorder: pick up an item by its handle (or the row) with the pointer or the keyboard, and `onReorder` gets the new order. */
function Sortable({
  items,
  onReorder,
  label,
  orientation = "vertical",
  handle = true,
  disabled = false,
  itemLabel,
  renderItem,
  asChild = false,
  className,
  children,
  ...props
}: SortableProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const contextId = useId()
  const sensors = useSortableSensors()

  const nameOf = (id: UniqueIdentifier) => itemLabel?.(String(id)) ?? String(id)
  const total = items.length
  const positionOf = (id: UniqueIdentifier) => items.indexOf(String(id)) + 1

  const announcements = sortableAnnouncements({ nameOf, positionOf, total })

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = items.indexOf(String(active.id))
    const to = items.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    onReorder(arrayMove(items, from, to))
  }

  const context = useMemo<ListContextValue>(
    () => ({ orientation, handle, disabled, nameOf: (id) => (itemLabel ? itemLabel(id) : undefined) }),
    [orientation, handle, disabled, itemLabel]
  )

  const Comp = asChild ? Slot.Root : "ul"

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions: { draggable: COPY.instructions } }}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items} strategy={orientation === "vertical" ? verticalListSortingStrategy : rectSortingStrategy}>
        <ListContext.Provider value={context}>
          <Comp
            role="list"
            aria-label={label}
            data-slot="sortable"
            data-orientation={orientation}
            data-dragging={activeId !== null ? "" : undefined}
            className={cn(
              "flex gap-2 data-dragging:[&_*]:cursor-grabbing",
              orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
              className
            )}
            {...props}
          >
            {renderItem ? items.map((id) => <SortableItem key={id} id={id}>{renderItem(id)}</SortableItem>) : children}
          </Comp>
        </ListContext.Provider>
      </SortableContext>
    </DndContext>
  )
}

type SortableItemProps = Omit<ComponentProps<"li">, "style" | "id"> & {
  /** This item's id: one of the list's `items`. */
  id: string
  /** Keep this item where it is: it can't be picked up, and is dimmed. Others can still be moved past it. */
  disabled?: boolean
  /** The caller's own element in place of the `li` (its props and handlers are merged with ours). No handle is drawn for it: place a `SortableHandle` inside, or the element is the row that drags when the list's `handle` is `false`. */
  asChild?: boolean
}

/** One item of a Sortable: the element that slides, with the drag handle at its start; its children are the caller's content. */
function SortableItem({ id, disabled = false, asChild = false, className, children, ...props }: SortableItemProps) {
  const list = useContext(ListContext)
  const reduceMotion = useReducedMotion()
  const isDisabled = disabled || list.disabled
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    disabled: isDisabled,
    animateLayoutChanges,
    transition: reduceMotion ? null : undefined,
  })

  const name = list.nameOf(id)
  const onRow = list.handle === false
  const drawsHandle = list.handle === true && !asChild
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition }

  // The row form: the row is the activator, so it keeps the instructions and the role description but
  // not dnd-kit's role="button" / aria-pressed (it is a listitem around the caller's own controls).
  const rowActivator = onRow
    ? {
        tabIndex: isDisabled ? undefined : attributes.tabIndex,
        "aria-roledescription": attributes["aria-roledescription"],
        "aria-describedby": attributes["aria-describedby"],
        ...(isDisabled ? {} : listeners),
      }
    : {}

  const context: ItemContextValue = {
    attributes,
    listeners: isDisabled ? undefined : listeners,
    setActivatorNodeRef,
    isDragging,
    disabled: isDisabled,
    name,
  }

  const Comp = asChild ? Slot.Root : "li"

  return (
    <ItemContext.Provider value={context}>
      <Comp
        ref={setNodeRef}
        style={style}
        data-slot="sortable-item"
        data-dragging={isDragging ? "" : undefined}
        data-disabled={isDisabled ? "" : undefined}
        aria-disabled={isDisabled ? true : undefined}
        {...rowActivator}
        className={cn(
          "flex items-center gap-2 rounded-md",
          // Lifted: above its siblings, on the card surface, with the lift shadow, so it reads as picked up.
          "data-dragging:relative data-dragging:z-raised data-dragging:bg-card data-dragging:shadow-lift",
          "data-disabled:opacity-disabled",
          onRow && !isDisabled && "cursor-grab focus-ring active:cursor-grabbing data-dragging:cursor-grabbing",
          className
        )}
        {...props}
      >
        {drawsHandle ? (
          <>
            <SortableHandle />
            <div data-slot="sortable-content" className="min-w-0 flex-1">{children}</div>
          </>
        ) : (
          children
        )}
      </Comp>
    </ItemContext.Provider>
  )
}

type SortableHandleProps = Omit<IconButtonProps, "icon" | "variant" | "size" | "asChild" | "type" | "aria-label"> & {
  /** The handle's name. Defaults to "Drag {item} to reorder" with the list's `itemLabel`, else "Drag to reorder"; set it when the item's name isn't the list's. */
  "aria-label"?: string
}

/** The drag handle: an icon button that picks its item up with the pointer (drag) or the keyboard (Space, arrows, Space). SortableItem draws one; place your own when the list's `handle` is "custom". */
function SortableHandle({ className, "aria-label": label, ...props }: SortableHandleProps) {
  const item = useContext(ItemContext)
  if (!item) throw new Error("SortableHandle belongs inside a SortableItem.")
  const name = label ?? (item.name ? COPY.handleFor(item.name) : COPY.handle)
  return (
    <IconButton
      {...item.attributes}
      {...item.listeners}
      {...props}
      ref={item.setActivatorNodeRef}
      type="button"
      variant="ghost"
      icon={<GripVerticalIcon aria-hidden />}
      aria-label={name}
      disabled={item.disabled}
      data-slot="sortable-handle"
      data-dragging={item.isDragging ? "" : undefined}
      className={cn(
        // Pointer-first: grab, grabbing, and no touch scrolling that would cancel a drag begun here.
        "shrink-0 cursor-grab touch-none active:cursor-grabbing data-dragging:cursor-grabbing",
        // The item is dimmed whole when disabled; the button's own dimming would be a second layer.
        "disabled:opacity-100 aria-disabled:opacity-100",
        className
      )}
    />
  )
}

export { Sortable, SortableHandle, SortableItem, SORTABLE_COPY, sortableAnnouncements, useSortableSensors }
export type { SortableHandleMode, SortableHandleProps, SortableItemProps, SortableOrientation, SortableProps }
