import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { QuickAdd } from "./quick-add"
import { quickAddFor, type QuickAddOption } from "../stack-rules"

/* QuickAdd (ADR 0076 amendment rule 3): kinship pills that open the add form with it set. */
const OPTIONS: QuickAddOption[] = [
  { kinship: "spouse_partner", label: "Spouse or partner" },
  { kinship: "child", label: "Child" },
  { kinship: "parent", label: "Parent" },
  { kinship: "friend", label: "Friend" },
  { kinship: "pet", label: "Pet" },
]

const meta = {
  component: QuickAdd,
  args: { options: OPTIONS, onSelect: fn() },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["adr-0076"],
} satisfies Meta<typeof QuickAdd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** At rest beside "Add someone": no eyebrow; the group keeps its name. */
export const NoEyebrow: Story = { name: "Without the eyebrow", args: { showLabel: false } }

/** A spouse or partner is on the stack, so that pill is gone (rule 4); it comes back when they come off. */
export const Capped: Story = {
  name: "Capped · spouse on the stack",
  args: { options: quickAddFor(OPTIONS, [{ kinship: "spouse_partner" }], { multi: true }) },
}

export const Disabled: Story = { args: { disabled: true } }

/** A pill calls onSelect with its kinship. */
export const Selects: Story = {
  name: "A pill opens with its kinship",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole("button")).toHaveLength(OPTIONS.length)
    await userEvent.click(canvas.getByRole("button", { name: OPTIONS[1]!.label }))
    await expect(args.onSelect).toHaveBeenCalledWith(OPTIONS[1]!.kinship)
  },
}
