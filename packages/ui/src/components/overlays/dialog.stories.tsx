import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Button } from "../actions/button"
import { Dialog } from "./dialog"

/* Dialog (R15-15): a modal panel for work that isn't a single confirm (managing a list, an
   editor with a preview). Escape and the close button close it; a click outside doesn't;
   `onCloseRequest` can keep it open over unsaved work. ConfirmDialog stays the confirm. */
function Demo({ size = "lg", guarded = false, startOpen = true }: { size?: "md" | "lg" | "xl"; guarded?: boolean; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen)
  const [asked, setAsked] = useState(0)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <span role="status" className="ml-3 text-sm">
        {asked ? `Asked to close ${asked} time${asked === 1 ? "" : "s"}` : ""}
      </span>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size={size}
        title="Manage Cedar Trust's offers"
        description="The ads in the app's ad strip for this partner's people."
        onCloseRequest={
          guarded
            ? () => {
                setAsked((n) => n + 1)
                return false
              }
            : undefined
        }
      >
        <p className="text-sm font-medium text-body-muted">The panel's body. It scrolls inside the panel when it's taller than the window.</p>
      </Dialog>
    </>
  )
}

const meta = {
  component: Demo,
  tags: ["r15-15"],
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

/** The trigger, closed: the docs page's story (an open dialog would take over the page, R3-17). */
export const Closed: Story = {
  args: { startOpen: false },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open dialog" }))
    const body = within(canvasElement.ownerDocument.body)
    await expect(await body.findByRole("dialog", { name: "Manage Cedar Trust's offers" })).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull())
  },
}

export const Default: Story = {
  tags: ["!autodocs"],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole("dialog", { name: "Manage Cedar Trust's offers" })
    await expect(dialog).toHaveAccessibleDescription("The ads in the app's ad strip for this partner's people.")
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull())
  },
}

/** OnCloseRequest keeps it open (unsaved work) */
export const KeptOpen: Story = {
  tags: ["!autodocs"],
  name: "Kept open · unsaved work",
  args: { guarded: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole("dialog")
    await userEvent.keyboard("{Escape}")
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    await expect(body.getByRole("dialog")).toBeInTheDocument()
    // The page behind a modal is hidden from the accessibility tree, so the status is read directly.
    await expect(canvasElement.querySelector("[role='status']")).toHaveTextContent("Asked to close 2 times")
  },
}

export const Medium: Story = { tags: ["!autodocs"], args: { size: "md" } }
export const ExtraLarge: Story = { tags: ["!autodocs"], name: "Extra large (a list beside an editor)", args: { size: "xl" } }
