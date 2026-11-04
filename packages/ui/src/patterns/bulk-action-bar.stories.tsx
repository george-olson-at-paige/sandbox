import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { Mail, PowerOff } from "lucide-react"

import type { ListAction } from "../components/actions/row-actions"
import { enter, typeKeys } from "../stories/typing"
import { BulkActionBar } from "./bulk-action-bar"

/* BulkActionBar (R12-10): the toolbar row while rows are selected: the count, select all matching
   (once the whole page is), the bulk actions (destructive last, confirmed), Clear (and Escape). */
const noun = { one: "person", other: "people" }

function actions(onDone: (s: string) => void, { noneUnverified = false } = {}): ListAction[] {
  return [
    {
      kind: "destructive",
      id: "disable",
      label: "Disable accounts",
      icon: <PowerOff aria-hidden />,
      confirm: { title: "Disable 25 accounts?", confirmLabel: "Disable 25 accounts", reason: "required" },
      run: () => onDone("25 accounts disabled."),
    },
    {
      kind: "action",
      id: "verify",
      label: "Resend verification email",
      icon: <Mail aria-hidden />,
      disabledReason: noneUnverified ? "No one selected is unverified" : undefined,
      confirm: { title: "Resend the verification email to 3 people?", description: "22 already verified are skipped.", confirmLabel: "Send emails", reason: "required" },
      run: () => onDone("Verification email sent to 3 people."),
    },
  ]
}

function Bar({ count: initial = 25, noneUnverified = false }: { count?: number; noneUnverified?: boolean }) {
  const [count, setCount] = useState(initial)
  const [result, setResult] = useState("")
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      {count > 0 ? (
        <BulkActionBar
          count={count}
          noun={noun}
          matching={143}
          pageAllSelected={count === 25}
          onSelectAllMatching={() => setCount(143)}
          onClear={() => setCount(0)}
          actions={actions(setResult, { noneUnverified })}
          onDone={() => setCount(0)}
        />
      ) : (
        <span className="text-sm text-muted-foreground">No selection (the toolbar is back)</span>
      )}
      <span role="status" className="text-sm font-medium text-success-foreground">
        {result}
      </span>
    </div>
  )
}

const meta = {
  component: BulkActionBar,
  args: { count: 3, noun, matching: 143, pageAllSelected: false, onSelectAllMatching: fn(), onClear: fn(), actions: [] },
  tags: ["r12-10"],
} satisfies Meta<typeof BulkActionBar>

export default meta
type Story = StoryObj<typeof meta>

/** A whole page selected: select all matching. */
export const Default: Story = {
  name: "Page selected · select all",
  render: () => <Bar />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText("25 people selected")).toBeInTheDocument()
    // Destructive last.
    const buttons = within(c.getByRole("group", { name: "Bulk actions" })).getAllByRole("button")
    await expect(buttons.at(-2)).toHaveTextContent("Disable accounts")
    await userEvent.click(c.getByRole("button", { name: "Select all 143 matching" }))
    await expect(c.getByText("143 people selected")).toBeInTheDocument()
    await expect(c.getByText("All 143 matching")).toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: "Clear selection" }))
    await expect(c.getByText(/No selection/)).toBeInTheDocument()
  },
}

/** An action confirms, then the selection ends. */
export const RunsAndClears: Story = {
  name: "Action · selection ends",
  render: () => <Bar count={3} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(c.getByRole("button", { name: "Resend verification email" }))
    const dialog = await body.findByRole("alertdialog", { name: "Resend the verification email to 3 people?" })
    await typeKeys(within(dialog).getByRole("textbox", { name: /Reason/ }), "Support ticket 4411")
    await userEvent.click(within(dialog).getByRole("button", { name: "Send emails" }))
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
    await expect(c.getByRole("status")).toHaveTextContent("Verification email sent to 3 people.")
    await expect(c.getByText(/No selection/)).toBeInTheDocument()
  },
}

export const Escape: Story = {
  name: "Escape clears",
  render: () => <Bar count={3} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await enter(c.getByRole("button", { name: "Clear selection" }))
    await userEvent.keyboard("{Escape}")
    await expect(c.getByText(/No selection/)).toBeInTheDocument()
  },
}

/** An action that can't apply: off, with why. */
export const ActionOff: Story = {
  name: "Off with a reason",
  render: () => <Bar count={3} noneUnverified />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Resend verification email" })
    await expect(button).toHaveAttribute("aria-disabled", "true")
    await expect(button).toHaveAccessibleDescription("No one selected is unverified")
  },
}
