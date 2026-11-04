import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { typeKeys } from "../../stories/typing"
import { Button } from "../actions/button"
import { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog"

/* ConfirmDialog (R12-10): a modal confirm for an action on someone's account. The title says what
   will happen, the confirm names the action; a reason for the audit trail; pending ("Working…"),
   failure in place (input kept, try again), success closes it (the result shows in the page).
   Red only for irreversible actions (R2-03). */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function Harness(props: Omit<ConfirmDialogProps, "open" | "onOpenChange"> & { trigger: string }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState("")
  const { trigger, onConfirm, ...rest } = props
  return (
    <div className="flex items-center gap-4">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <span role="status" className="text-sm font-medium text-success-foreground">
        {done}
      </span>
      <ConfirmDialog
        {...rest}
        open={open}
        onOpenChange={setOpen}
        onConfirm={async (ctx) => {
          const r = await onConfirm(ctx)
          if (!r) setDone(`Done${ctx.reason ? ` (${ctx.reason})` : ""}`)
          return r
        }}
      />
    </div>
  )
}

const meta = {
  component: ConfirmDialog,
  args: { open: false, onOpenChange: fn(), title: "Disable Ada Park's account?", confirmLabel: "Disable account", onConfirm: fn() },
  tags: ["r12-10"],
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const WithReason: Story = {
  name: "A reason for the audit trail",
  render: () => (
    <Harness
      trigger="Disable account"
      title="Disable Ada Park's account?"
      description="They're signed out everywhere and can't sign in until it's enabled again. Nothing in their vault is removed."
      confirmLabel="Disable account"
      reason="required"
      onConfirm={async () => {
        await wait(400)
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Disable account" }))
    const dialog = await body.findByRole("alertdialog", { name: "Disable Ada Park's account?" })
    const reason = within(dialog).getByRole("textbox", { name: /Reason/ })
    await waitFor(() => expect(reason).toHaveFocus())
    const confirm = within(dialog).getByRole("button", { name: "Disable account" })
    // Off until there's a reason; not red (it can be undone).
    await expect(confirm).toHaveAttribute("aria-disabled", "true")
    await expect(confirm).not.toHaveClass("bg-destructive")
    await typeKeys(reason, "Asked by the account owner")
    await expect(confirm).not.toHaveAttribute("aria-disabled")
    await userEvent.click(confirm)
    await expect(within(dialog).getByRole("button", { name: "Working…" })).toBeInTheDocument()
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Done (Asked by the account owner)")
  },
}

export const Failure: Story = {
  name: "Failure keeps the input",
  render: () => (
    <Harness
      trigger="Reset MFA phone"
      title="Reset Ada Park's MFA phone?"
      description="Removes the phone and ends their sessions."
      confirmLabel="Reset MFA phone"
      reason="required"
      onConfirm={async () => {
        await wait(300)
        return { error: "This needs the Support role." }
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Reset MFA phone" }))
    const dialog = await body.findByRole("alertdialog")
    await typeKeys(within(dialog).getByRole("textbox", { name: /Reason/ }), "Lost phone")
    await userEvent.click(within(dialog).getByRole("button", { name: "Reset MFA phone" }))
    await expect(await within(dialog).findByRole("alert")).toHaveTextContent("This needs the Support role.")
    await expect(within(dialog).getByRole("textbox", { name: /Reason/ })).toHaveValue("Lost phone")
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
  },
}

/** Irreversible: the red confirm, Cancel focused. */
export const Irreversible: Story = {
  name: "Irreversible · red confirm",
  render: () => (
    <Harness
      trigger="Delete draft"
      title="Delete this draft message?"
      description="It's gone for good: there's no copy to bring back."
      confirmLabel="Delete draft"
      tone="destructive"
      onConfirm={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Delete draft" }))
    const dialog = await body.findByRole("alertdialog")
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus())
    await expect(within(dialog).getByRole("button", { name: "Delete draft" })).toHaveClass("bg-destructive")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
  },
}

export const Open: Story = {
  name: "Open (with a field)",
  tags: ["!autodocs"],
  render: () => (
    <ConfirmDialog open onOpenChange={() => {}} title="Extend Ada Park's trial" description="It ends Oct 30, 2026." confirmLabel="Extend trial" reason="optional" onConfirm={() => undefined}>
      <p className="text-sm">A field the action needs goes here (a plan, a date).</p>
    </ConfirmDialog>
  ),
}
