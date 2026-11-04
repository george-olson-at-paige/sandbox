import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { SecretValue } from "./secret-value"

/* Level 0 (COLLECTIONS-PLAN.md §3): a secret on an account's page. Given the value, or asking
   for it on Show or Copy (how the API should give secrets: one at a time, when asked). */
const meta = {
  component: SecretValue,
  tags: ["level-0", "collections-plan"],
  decorators: [(S) => <div className="max-w-sm rounded-lg border bg-card p-5"><S /></div>],
  args: { name: "the password for Chase", value: "c0rrect-H0rse-9" },
} satisfies Meta<typeof SecretValue>

export default meta
type Story = StoryObj<typeof meta>

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Given the value: eight dots until Show. */
export const Given: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.queryByText("c0rrect-H0rse-9")).not.toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: "Show the password for Chase" }))
    await expect(c.getByText("c0rrect-H0rse-9")).toBeInTheDocument()
    await userEvent.click(c.getByRole("button", { name: "Hide the password for Chase" }))
    await expect(c.queryByText("c0rrect-H0rse-9")).not.toBeInTheDocument()
  },
}

/** Asked for: Show fetches it once (pending in place), then it's kept for Copy. */
export const AskedFor: Story = {
  args: {
    value: undefined,
    onReveal: async () => {
      await wait(700)
      return "4417-PIN"
    },
  },
}

/** Asked for and refused: the reason under it, nothing shown. */
export const Refused: Story = {
  args: {
    value: undefined,
    onReveal: async () => {
      await wait(500)
      return { error: "We couldn’t get that just now. Try again." }
    },
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Show the password for Chase" }))
    await expect(await c.findByRole("alert")).toHaveTextContent("couldn’t get that")
  },
}

/** A long secret wraps; it never pushes the buttons off. */
export const Long: Story = { args: { value: "recovery: 8f2c-41aa-90de-77b1-5c3e-e0f2-a913-4d7c-2b6f-11e0" } }
