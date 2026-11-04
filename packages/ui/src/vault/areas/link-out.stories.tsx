import type { Meta, StoryObj } from "@storybook/react-vite"

import { StubLink } from "../../stories/fixtures"
import { LinkOut } from "./link-out"

/* LinkOut (R2-24): full width at the foot of an Area page; the buttons drop under the text on
   a narrow row. */
const meta = {
  component: LinkOut,
  tags: ["r2-24", "gaps-45"],
  args: {
    title: "This is also on your existing pages.",
    description:
      "Anything you add on this page also lands in Documents or Contacts, filed under this area, on the same pages as before. Open them to see all your files and contacts.",
    links: [
      { label: "Open Documents", href: "#documents" },
      { label: "Open Contacts", href: "#contacts" },
    ],
    linkAs: StubLink,
  },
  decorators: [(S) => <div data-area="family"><S /></div>],
} satisfies Meta<typeof LinkOut>

export default meta
type Story = StoryObj<typeof meta>

export const Wide: Story = { name: "Wide: text left, buttons right" }
export const Narrow: Story = {
  name: "Narrow: buttons under the text",
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
}
export const OneLink: Story = { name: "One link, no description", args: { description: undefined, links: [{ label: "Open Documents", href: "#documents" }] } }
