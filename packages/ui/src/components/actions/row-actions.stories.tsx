import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { Eye, KeyRound, LockOpen, Mail, PowerOff, Trash2 } from "lucide-react"

import { StubLink } from "../../stories/fixtures"
import { enter, typeKeys } from "../../stories/typing"
import { RowActions, type ListAction } from "./row-actions"

/* RowActions (R12-10): a row's overflow menu. Grouped as the person page will be (View, Sign-in,
   Billing), destructive last after a rule and confirmed, an action that can't apply shown off with
   its reason. The fixture is one person's support actions. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function actions(onDone: (what: string) => void): ListAction[] {
  return [
    // Given out of order on purpose: the destructive entry still lands last.
    {
      kind: "destructive",
      id: "disable",
      label: "Disable account",
      icon: <PowerOff aria-hidden />,
      confirm: { title: "Disable Ada Park's account?", description: "They're signed out everywhere until it's enabled again.", confirmLabel: "Disable account", reason: "required" },
      run: async () => {
        await wait(300)
        onDone("Ada Park's account is disabled.")
      },
    },
    { kind: "link", id: "view", label: "View person", icon: <Eye aria-hidden />, href: "/admin/people/p-1001" },
    {
      kind: "action",
      id: "verify",
      group: "Sign-in",
      label: "Resend verification email",
      icon: <Mail aria-hidden />,
      disabledReason: "Email already verified",
      confirm: { title: "Resend?", confirmLabel: "Send email" },
      run: () => undefined,
    },
    { kind: "action", id: "unlock", group: "Sign-in", label: "Unlock sign-in", icon: <LockOpen aria-hidden />, disabledReason: "Not locked out", run: () => undefined },
    {
      kind: "action",
      id: "mfa",
      group: "Sign-in",
      label: "Reset MFA phone",
      icon: <KeyRound aria-hidden />,
      confirm: { title: "Reset Ada Park's MFA phone?", confirmLabel: "Reset MFA phone", reason: "required" },
      run: () => onDone("Ada Park's MFA phone was removed."),
    },
  ]
}

function Row({ extra = [] }: { extra?: ListAction[] }) {
  const [status, setStatus] = useState("")
  return (
    <div className="flex w-120 items-center justify-between rounded-lg border bg-card px-4 py-2">
      <span className="flex flex-col">
        <span className="font-medium">Ada Park</span>
        <span role="status" className="text-xs font-medium text-success-foreground">
          {status}
        </span>
      </span>
      <RowActions label="Actions for Ada Park" linkAs={StubLink} actions={[...actions(setStatus), ...extra]} />
    </div>
  )
}

const meta = {
  component: RowActions,
  args: { actions: [], label: "Actions for Ada Park", onDone: fn() },
  tags: ["r12-10", "r13-21", "gaps-136"],
} satisfies Meta<typeof RowActions>

export default meta
type Story = StoryObj<typeof meta>

/** Grouped, destructive last, off with a reason. */
export const Default: Story = {
  name: "Grouped · destructive last",
  render: () => <Row />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Actions for Ada Park" }))
    const menu = await body.findByRole("menu", { name: "Actions for Ada Park" })
    const items = within(menu).getAllByRole("menuitem")
    await expect(items[0]).toHaveTextContent("View person")
    await expect(items.at(-1)).toHaveTextContent("Disable account")
    await expect(within(menu).getByText("Sign-in")).toBeInTheDocument()
    // Items under a group heading are indented (R13-05).
    await expect(items[1].className).toMatch(/pl-5/)
    const verify = within(menu).getByRole("menuitem", { name: /Resend verification email/ })
    // Off, but reachable (R13-21): aria-disabled, the reason is its description, not Radix's data-disabled.
    await expect(verify).toHaveAttribute("aria-disabled", "true")
    await expect(verify).not.toHaveAttribute("data-disabled")
    await expect(verify).toHaveAccessibleDescription("Email already verified")
    await userEvent.keyboard("{Escape}")
  },
}

/** Off items: reached with the arrow keys, Enter does nothing. */
export const OffItemByKeyboard: Story = {
  name: "Off items · keyboard",
  render: () => <Row />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = within(canvasElement).getByRole("button", { name: "Actions for Ada Park" })
    await enter(trigger)
    await userEvent.keyboard("{Enter}")
    const menu = await body.findByRole("menu", { name: "Actions for Ada Park" })
    const verify = within(menu).getByRole("menuitem", { name: /Resend verification email/ })
    // From the first item (View person), one ArrowDown lands on the off item (Radix would skip it).
    await waitFor(() => expect(within(menu).getAllByRole("menuitem")[0]).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(verify).toHaveFocus())
    await userEvent.keyboard("{Enter}")
    // Still open, no confirm.
    await expect(body.queryByRole("alertdialog")).toBeNull()
    await expect(menu).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
  },
}

/** Destructive: confirmed, focus back on the button. */
export const ConfirmDestructive: Story = {
  name: "Destructive · confirmed",
  render: () => <Row />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = within(canvasElement).getByRole("button", { name: "Actions for Ada Park" })
    await userEvent.click(trigger)
    await userEvent.click(await body.findByRole("menuitem", { name: /Disable account/ }))
    const dialog = await body.findByRole("alertdialog", { name: "Disable Ada Park's account?" })
    await typeKeys(within(dialog).getByRole("textbox", { name: /Reason/ }), "Owner asked")
    await userEvent.click(within(dialog).getByRole("button", { name: "Disable account" }))
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull())
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Ada Park's account is disabled.")
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

export const Irreversible: Story = {
  name: "Irreversible: red in the menu",
  render: () => (
    <Row
      extra={[
        {
          kind: "destructive",
          id: "delete",
          irreversible: true,
          label: "Delete draft",
          icon: <Trash2 aria-hidden />,
          confirm: { title: "Delete this draft?", confirmLabel: "Delete draft" },
          run: () => undefined,
        },
      ]}
    />
  ),
}
