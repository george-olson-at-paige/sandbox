import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { StackAdd } from "./stack-add"
import type { PersonPickerPerson } from "./person-picker"
import type { QuickAddOption } from "../stack-rules"
import { Placeholder } from "../../stories/placeholder"

/* StackAdd (ADR 0076 amendment rules 1-3): one quiet "+ Add someone" at rest; open, the one blue
   thing, pick → quick add → someone new. */
const BOOK: PersonPickerPerson[] = [
  { id: "david", name: "David Reyes", detail: "Spouse" },
  { id: "marta", name: "Marta Ortiz", detail: "Parent" },
  { id: "sam", name: "Sam Lee", detail: "Friend" },
]
const MANY: PersonPickerPerson[] = [
  ...BOOK,
  { id: "elena", name: "Elena Reyes", detail: "Child" },
  { id: "luis", name: "Luis Ortiz", detail: "Parent" },
  { id: "ana", name: "Ana Ortiz", detail: "Friend" },
]
const QUICK: QuickAddOption[] = [
  { kinship: "child", label: "Child" },
  { kinship: "parent", label: "Parent" },
  { kinship: "pet", label: "Pet" },
]

const meta = {
  component: StackAdd,
  args: {
    state: { step: "rest" },
    pickMode: "pills",
    candidates: BOOK,
    quick: QUICK,
    onOpen: fn(),
    onClose: fn(),
    onPick: fn(),
    onQuickAdd: fn(),
    onSomeoneNew: fn(),
    renderForm: () => <Placeholder label="PersonAddForm" />,
  },
  decorators: [(S) => <div className="max-w-xl overflow-hidden rounded-lg border bg-card"><S /></div>],
  tags: ["adr-0076"],
} satisfies Meta<typeof StackAdd>

export default meta
type Story = StoryObj<typeof meta>

/** At rest: one quiet, neutral "+ Add someone", the quick-add pills beside it as shortcuts. Nothing blue. */
export const Rest: Story = {}

/** At rest without the shortcuts (the open question for George). */
export const RestWithShortcuts: Story = { name: "Rest · quick add as shortcuts", args: { quickAtRest: true } }

/** Open, choosing: the one blue thing, pick (pills) → quick add → someone new. */
export const OpenPills: Story = { name: "Open · pills", args: { state: { step: "choose" } } }

/** Six or more in the book: pick is a search field. */
export const OpenSearch: Story = { name: "Open · search", args: { state: { step: "choose" }, pickMode: "search", candidates: MANY } }

/** A pick is saving: that pill spins, the rest wait. */
export const PickPending: Story = { name: "Open · pick saving", args: { state: { step: "choose" }, pendingPickId: "marta" } }

/** A pick failed: the message in the region, the pills ready again. */
export const PickFailed: Story = { name: "Open · pick failed", args: { state: { step: "choose" }, pickError: "That didn't go through. Try again in a moment." } }

/** The form step (here a stand-in for PersonAddForm). */
export const Form: Story = { name: "Open · form", args: { state: { step: "form", kinship: "child" } } }

/** The stack can take no more: no Add at all. */
export const Full: Story = { args: { pickMode: "full" } }

/** At rest there is exactly one Add control and nothing in the active colour. */
export const RestIsQuiet: Story = {
  name: "Rest · one Add, nothing blue",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole("button", { name: "Add someone" })).toHaveLength(1)
    await expect(canvasElement.querySelector(".bg-accent")).toBeNull()
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await expect(args.onOpen).toHaveBeenCalledOnce()
  },
}

/** Open: the region is named, focus is on the first pick, Escape closes. */
export const OpenKeys: Story = {
  name: "Open · focus and Escape",
  args: { state: { step: "choose" } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const region = canvas.getByRole("region", { name: "Add someone" })
    await expect(region).toHaveAttribute("data-state", "choose")
    await expect(canvas.getByRole("button", { name: new RegExp(`^${BOOK[0]!.name}`) })).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
