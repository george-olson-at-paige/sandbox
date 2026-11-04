import { useState, type ComponentType } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { people } from "../../fixtures/people"
import { Avatar } from "../display/avatar"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../display/item"
import { Button } from "../actions/button"
import { Sortable, SortableItem } from "./sortable"

/* Sortable (R20-19) is the list, the handle and the keyboard reorder; what each row holds is the
   caller's. These stories fill it with Items (a person's row) and with chips. It is controlled: the
   story keeps the order and passes it back, and `onReorder` (an arg, so a play can watch it) gets the
   whole new order after each drop. The keyboard is the same everywhere: Space picks up, the arrows
   move, Space drops, Escape cancels; a live region says what happened. */

type Args = {
  /** Called with the whole new order after a drop. */
  onReorder: (ids: string[]) => void
  /** Called when the Edit button inside a row is clicked (proves a click in the content still works). */
  onEdit?: (id: string) => void
}

/* The first five people of the fixtures, with the role the owner stated (R3-19), as the people a
   will's beneficiaries would be. */
const ROLES = ["Spouse", "Child", "Child", "Sibling", "Friend"] as const
const BENEFICIARIES = people.slice(0, ROLES.length).map((p, i) => ({ id: p.id, name: p.name, role: ROLES[i] }))
const IDS = BENEFICIARIES.map((p) => p.id)
const byId = (id: string) => BENEFICIARIES.find((p) => p.id === id)!
const nameOf = (id: string) => byId(id).name

/** The story's own state: the order lives here, and `onReorder` is also called so a play can see it. */
function useOrder(initial: string[], onReorder: Args["onReorder"]) {
  const [order, setOrder] = useState(initial)
  return [order, (next: string[]) => (setOrder(next), onReorder(next))] as const
}

function PersonRow({ id, onEdit }: { id: string; onEdit?: Args["onEdit"] }) {
  const person = byId(id)
  return (
    <Item density="compact" className="flex-1">
      <ItemMedia variant="avatar"><Avatar name={person.name} size="lg" /></ItemMedia>
      <ItemContent>
        <ItemTitle>{person.name}</ItemTitle>
        <ItemDescription>{person.role}</ItemDescription>
      </ItemContent>
      {onEdit && <Button variant="secondary" size="sm" onClick={() => onEdit(id)}>Edit</Button>}
    </Item>
  )
}

function BeneficiaryList({ onReorder, onEdit, handle = true, disabledId }: Args & { handle?: boolean; disabledId?: string }) {
  const [order, setOrder] = useOrder(IDS, onReorder)
  return (
    <Sortable items={order} onReorder={setOrder} label="Beneficiaries" itemLabel={nameOf} handle={handle} className="gap-0">
      {order.map((id) => (
        <SortableItem key={id} id={id} disabled={id === disabledId} className="rounded-none border-t border-divider first:border-t-0">
          <PersonRow id={id} onEdit={onEdit} />
        </SortableItem>
      ))}
    </Sortable>
  )
}

function Chips({ onReorder }: Args) {
  const [order, setOrder] = useOrder(["will", "trust", "deed", "policy", "pension"], onReorder)
  return (
    <Sortable items={order} onReorder={setOrder} label="Document order" orientation="horizontal" handle={false} itemLabel={(id) => CHIPS[id]}>
      {order.map((id) => (
        <SortableItem key={id} id={id} className="rounded-full">
          <span className="inline-flex min-h-9 items-center rounded-full border bg-card px-3.5 text-sm font-semibold text-card-foreground">{CHIPS[id]}</span>
        </SortableItem>
      ))}
    </Sortable>
  )
}

function DataList({ onReorder }: Args) {
  const [order, setOrder] = useOrder(IDS, onReorder)
  return <Sortable items={order} onReorder={setOrder} label="Beneficiaries" itemLabel={nameOf} renderItem={(id) => <PersonRow id={id} />} className="gap-0" />
}

const CHIPS: Record<string, string> = {
  will: "Last will",
  trust: "Living trust",
  deed: "House deed",
  policy: "Life insurance",
  pension: "Pension statement",
}

// The stories render their own trees (the part is compositional), so the args are the story's spies;
// `component` stays for the docs page's props table, and the cast is the gap between the two.
const meta: Meta<Args> = {
  component: Sortable as unknown as ComponentType<Args>,
  parameters: { layout: "padded" },
  tags: ["r20-19"],
  args: { onReorder: fn() },
}

export default meta
type Story = StoryObj<Args>

/** Text of the rows in DOM order, by the people's names. */
const names = (list: HTMLElement) => within(list).getAllByRole("listitem").map((li) => BENEFICIARIES.find((p) => li.textContent?.includes(p.name))?.name)

/** Pick up with Space, move one step, drop with Space; waits for each step the way a person would. */
async function moveByKeyboard(activator: HTMLElement, key: string, expectAnnouncement: RegExp) {
  activator.focus()
  await userEvent.keyboard(" ")
  await waitFor(() => expect(activator.closest("[data-slot=sortable-item]")).toHaveAttribute("data-dragging"))
  await userEvent.keyboard(`{${key}}`)
  await waitFor(() => expect(within(document.body).getByText(expectAnnouncement)).toBeInTheDocument())
  await userEvent.keyboard(" ")
}

/** The people on a will, each with a handle; Space on a handle, ArrowDown, Space moves it one place down and reports the new order. */
export const Beneficiaries: Story = {
  name: "Beneficiaries · with a handle",
  render: (args) => <BeneficiaryList {...args} />,
  play: async ({ canvasElement, args }) => {
    const list = within(canvasElement).getByRole("list", { name: "Beneficiaries" })
    const handles = within(list).getAllByRole("button", { name: /^Drag .* to reorder$/ })
    await expect(handles).toHaveLength(IDS.length)
    // Each handle is the activator: it says "sortable" and is named for its person.
    for (const h of handles) await expect(h).toHaveAttribute("aria-roledescription", "sortable")
    await expect(handles[0]).toHaveAccessibleName(`Drag ${nameOf(IDS[0])} to reorder`)
    const before = names(list)
    await moveByKeyboard(handles[0], "ArrowDown", new RegExp(`${nameOf(IDS[0])} is now at position 2 of ${IDS.length}`))
    await waitFor(() => expect(args.onReorder).toHaveBeenCalledTimes(1))
    await expect(args.onReorder).toHaveBeenCalledWith([IDS[1], IDS[0], ...IDS.slice(2)])
    await waitFor(() => expect(names(list)).toEqual([before[1], before[0], ...before.slice(2)]))
    await expect(within(document.body).getByText(new RegExp(`Dropped ${nameOf(IDS[0])} at position 2 of ${IDS.length}`))).toBeInTheDocument()
  },
}

/** Escape after picking up puts the item back: nothing is reported and the order is as it was. */
export const Cancel: Story = {
  name: "Beneficiaries · Escape cancels",
  render: (args) => <BeneficiaryList {...args} />,
  play: async ({ canvasElement, args }) => {
    const list = within(canvasElement).getByRole("list", { name: "Beneficiaries" })
    const handle = within(list).getByRole("button", { name: `Drag ${nameOf(IDS[1])} to reorder` })
    const before = names(list)
    handle.focus()
    await userEvent.keyboard(" ")
    await waitFor(() => expect(handle.closest("[data-slot=sortable-item]")).toHaveAttribute("data-dragging"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(within(document.body).getByText(new RegExp(`${nameOf(IDS[1])} is now at position 3`))).toBeInTheDocument())
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(within(document.body).getByText(new RegExp(`Cancelled. ${nameOf(IDS[1])} is back at position 2`))).toBeInTheDocument())
    await expect(args.onReorder).not.toHaveBeenCalled()
    await expect(names(list)).toEqual(before)
  },
}

/** Without a handle the whole row is the thing you pick up (the row is focusable); clicking the button inside it still works. */
export const WholeRow: Story = {
  name: "Beneficiaries · whole row drags",
  args: { onEdit: fn() },
  render: (args) => <BeneficiaryList {...args} handle={false} />,
  play: async ({ canvasElement, args }) => {
    const list = within(canvasElement).getByRole("list", { name: "Beneficiaries" })
    const rows = within(list).getAllByRole("listitem")
    await expect(within(list).queryByRole("button", { name: /Drag/ })).toBeNull()
    for (const row of rows) await expect(row).toHaveAttribute("aria-roledescription", "sortable")
    // A click inside the content is a click, not a drag (the pointer has to move first).
    await userEvent.click(within(rows[2]).getByRole("button", { name: "Edit" }))
    await expect(args.onEdit).toHaveBeenCalledWith(IDS[2])
    await expect(args.onReorder).not.toHaveBeenCalled()
    const before = names(list)
    await moveByKeyboard(rows[1], "ArrowDown", new RegExp(`${nameOf(IDS[1])} is now at position 3 of ${IDS.length}`))
    await waitFor(() => expect(args.onReorder).toHaveBeenCalledWith([IDS[0], IDS[2], IDS[1], ...IDS.slice(3)]))
    await waitFor(() => expect(names(list)).toEqual([before[0], before[2], before[1], ...before.slice(3)]))
  },
}

/** A row of chips that wraps: no handle, the chip is picked up, and the arrow keys follow the row (ArrowRight moves it right). */
export const Horizontal: Story = {
  name: "Chips · horizontal",
  render: (args) => <Chips {...args} />,
  play: async ({ canvasElement, args }) => {
    const list = within(canvasElement).getByRole("list", { name: "Document order" })
    await expect(list).toHaveAttribute("data-orientation", "horizontal")
    const chips = within(list).getAllByRole("listitem")
    await expect(chips).toHaveLength(Object.keys(CHIPS).length)
    await moveByKeyboard(chips[0], "ArrowRight", /Last will is now at position 2 of 5/)
    await waitFor(() => expect(args.onReorder).toHaveBeenCalledWith(["trust", "will", "deed", "policy", "pension"]))
    await waitFor(() => expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("Living trust"))
  },
}

/** One item is kept in place: its handle is off the keys and the row is dimmed; the others still move. */
export const DisabledItem: Story = {
  name: "Beneficiaries · a disabled item",
  render: (args) => <BeneficiaryList {...args} disabledId={IDS[0]} />,
  play: async ({ canvasElement, args }) => {
    const list = within(canvasElement).getByRole("list", { name: "Beneficiaries" })
    const [first, second] = within(list).getAllByRole("listitem")
    const lockedHandle = within(first).getByRole("button", { name: /Drag/ })
    await expect(first).toHaveAttribute("data-disabled")
    await expect(lockedHandle).toBeDisabled()
    // Dimmed once: the row carries the opacity, its handle doesn't add a second layer.
    await expect(Number(getComputedStyle(first).opacity)).toBeLessThan(1)
    await expect(Number(getComputedStyle(lockedHandle).opacity)).toBe(1)
    const handle = within(second).getByRole("button", { name: /Drag/ })
    await expect(handle).toBeEnabled()
    await moveByKeyboard(handle, "ArrowDown", new RegExp(`${nameOf(IDS[1])} is now at position 3 of ${IDS.length}`))
    await waitFor(() => expect(args.onReorder).toHaveBeenCalledWith([IDS[0], IDS[2], IDS[1], ...IDS.slice(3)]))
  },
}

/** At phone width: the handle stays a 36px target at the row's start, the list fits the screen, and a reorder works. */
export const Phone: Story = {
  tags: ["!autodocs"],
  globals: { viewport: { value: "w375" } },
  render: (args) => <BeneficiaryList {...args} />,
  play: async ({ canvasElement, args }) => {
    const list = within(canvasElement).getByRole("list", { name: "Beneficiaries" })
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
    const handles = within(list).getAllByRole("button", { name: /Drag/ })
    const box = handles[0].getBoundingClientRect()
    await expect(box.width).toBeGreaterThanOrEqual(36)
    await expect(box.height).toBeGreaterThanOrEqual(36)
    // The handle sits before the person, on the row's start edge.
    await expect(box.right).toBeLessThanOrEqual(within(list).getAllByRole("listitem")[0].querySelector("[data-slot=sortable-content]")!.getBoundingClientRect().left)
    await moveByKeyboard(handles[1], "ArrowUp", new RegExp(`${nameOf(IDS[1])} is now at position 1 of ${IDS.length}`))
    await waitFor(() => expect(args.onReorder).toHaveBeenCalledWith([IDS[1], IDS[0], ...IDS.slice(2)]))
  },
}

/** The same rows by data: `renderItem` gets each id and Sortable keeps the order itself. */
export const ByData: Story = {
  name: "By data · renderItem",
  render: ({ onReorder }) => <DataList onReorder={onReorder} />,
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Beneficiaries" })
    await expect(within(list).getAllByRole("listitem")).toHaveLength(IDS.length)
  },
}
