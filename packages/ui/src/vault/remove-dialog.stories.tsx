import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { RemoveDialog } from "./remove-dialog"

/* RemoveDialog (ADR 0076 amendment rule 6): × asks, Cancel is the default. Open states stay off
   docs pages (R3-17). */
const meta = {
  component: RemoveDialog,
  args: { open: true, onOpenChange: fn(), onChoose: fn(), name: "Ana Ortiz", listLabel: "your emergency contacts" },
  tags: ["adr-0076", "!autodocs"],
} satisfies Meta<typeof RemoveDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** A stack that never deletes contacts offers Take off only. */
export const TakeOffOnly: Story = { name: "Take off only", args: { allowDelete: false } }

/** Cancel has focus when it opens, so Enter never removes by reflex. */
export const CancelIsDefault: Story = {
  name: "Cancel has focus",
  play: async ({ args, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const cancel = await body.findByRole("button", { name: "Cancel" })
    await expect(cancel).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onOpenChange).toHaveBeenCalledWith(false)
    await expect(args.onChoose).not.toHaveBeenCalled()
  },
}

/** Each way off hands up its kind. */
export const Chooses: Story = {
  name: "A choice hands up its kind",
  play: async ({ args, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByRole("button", { name: `Delete ${args.name} from People` }))
    await expect(args.onChoose).toHaveBeenCalledWith("delete")
  },
}
