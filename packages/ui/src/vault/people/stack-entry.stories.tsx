import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { StackEntry, type StackPerson } from "./stack-entry"

/* StackEntry (ADR 0076 amendment rules 1, 2, 6): one person on a stack. Only `open` takes the
   active colour; `new` is a badge; `struck` waits for the person to leave the page. */
const ANA: StackPerson = { id: "ana", name: "Ana Ortiz", kinship: "friend", detail: "Friend", src: "assets/avatar-female-glasses.png" }
const PEPPER: StackPerson = { id: "pepper", name: "Pepper", kinship: "pet", detail: "Pet" }

const meta = {
  component: StackEntry,
  args: { person: ANA, state: { kind: "rest" }, onToggle: fn(), onRemove: fn(), onUndo: fn(), listLabel: "your emergency contacts" },
  decorators: [(S) => <ul className="max-w-xl overflow-hidden rounded-lg border bg-card"><S /></ul>],
  tags: ["adr-0076"],
} satisfies Meta<typeof StackEntry>

export default meta
type Story = StoryObj<typeof meta>

export const Rest: Story = {}

/** The stack's open thing: the only entry in the active colour, its expand below. */
export const Open: Story = {
  args: { state: { kind: "open" }, children: <p className="text-sm font-medium text-muted-foreground">(555) 555-0100 · ana@example.com</p> },
}

/** Just added: marked New, not active. */
export const New: Story = { args: { state: { kind: "new" } } }

/** Taken off: struck through with Undo until the person leaves the page. */
export const StruckTakeOff: Story = { name: "Struck · take off", args: { state: { kind: "struck", removal: "take-off" } } }

/** Deleted from People: the same, and the screen-reader line says it will be deleted. */
export const StruckDelete: Story = { name: "Struck · delete", args: { state: { kind: "struck", removal: "delete" } } }

export const Pet: Story = { args: { person: PEPPER } }

/** Without an expand the row doesn't toggle; × still asks. */
export const NoExpand: Story = { name: "No expand", args: { onToggle: undefined } }

/** The row toggles, × asks, a struck entry offers Undo. */
export const Actions: Story = {
  name: "Toggle, remove, undo",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: new RegExp(`^${args.person.name}`) }))
    await expect(args.onToggle).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole("button", { name: `Remove ${args.person.name}` }))
    await expect(args.onRemove).toHaveBeenCalledOnce()
  },
}

/** Undo puts a struck entry back. */
export const Undo: Story = {
  name: "Struck · undo",
  args: { state: { kind: "struck", removal: "take-off" } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("status")).toHaveTextContent(`${args.person.name} will come off ${args.listLabel} when you leave this page.`)
    await userEvent.click(canvas.getByRole("button", { name: `Undo, keep ${args.person.name}` }))
    await expect(args.onUndo).toHaveBeenCalledOnce()
  },
}
