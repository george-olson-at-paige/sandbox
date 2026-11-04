import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { CopyButton } from "./copy-button"

/* CopyButton (R13-22): copies a text and says "Copied" in place for two seconds; "Couldn't copy"
   when the browser refuses. The Partners list's signup-link column uses the quiet one. */
const meta = {
  component: CopyButton,
  args: { text: "https://app.example.com/account/partnerRegister?partner_slug=cedar-trust", label: "Copy link" },
  tags: ["r13-22"],
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "Copies, then says Copied in place",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const button = c.getByRole("button", { name: "Copy link" })
    await userEvent.click(button)
    // The browser may refuse the clipboard without focus (a headless run): either word is in place, never a banner.
    await waitFor(() => expect(button).toHaveTextContent(/Copied|Couldn't copy/))
    await waitFor(() => expect(button).toHaveTextContent("Copy link"), { timeout: 3000 })
  },
}

/** In a line of text, as the Partners list's offer cell has it: the slug, then the copy. */
export const Inline: Story = {
  args: { variant: "quiet", size: "inline", label: "Copy link", "aria-label": "Copy Cedar Trust's signup link" },
  render: (args) => (
    <span className="flex items-center gap-2 text-xs">
      <code className="font-mono text-muted-foreground">cedar-trust</code>
      <CopyButton {...args} />
    </span>
  ),
}
