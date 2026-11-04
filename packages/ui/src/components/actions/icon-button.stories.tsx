import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { PencilIcon, SearchIcon, Trash2Icon } from "lucide-react"

import { Tooltip } from "../overlays/tooltip"
import { IconButton } from "./icon-button"

/* IconButton (R20-14): a Button that is only an icon, with the name required by its type. It is
   `Button size="icon"` underneath, which stays valid; new code spells it this way so an unnamed
   icon button fails `tsc` instead of reaching a screen reader as "button". */
const meta = {
  tags: ["r20-14"],
  component: IconButton,
  args: { icon: <SearchIcon />, "aria-label": "Search" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "link", "quiet", "destructive", "muted"] },
    icon: { control: false },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: "ghost" },
  /** The accessible name is exactly the aria-label: there is no text to read instead. */
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: args["aria-label"] })
    await expect(button).toBeInTheDocument()
    await expect(button.textContent).toBe("")
  },
}

/** The four emphasis levels an icon-only action takes. Destructive is for irreversible actions behind a confirm (R2-03). */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <IconButton variant="ghost" icon={<SearchIcon />} aria-label="Search" />
      <IconButton variant="secondary" icon={<PencilIcon />} aria-label="Edit" />
      <IconButton variant="primary" icon={<SearchIcon />} aria-label="Search all documents" />
      <IconButton variant="destructive" icon={<Trash2Icon />} aria-label="Delete" />
    </div>
  ),
}

/** A Tooltip repeats the name for sighted pointer and keyboard users; it never replaces it. */
export const WithATooltip: Story = {
  name: "With a tooltip",
  render: () => (
    <Tooltip content="Edit this contact">
      <IconButton variant="ghost" icon={<PencilIcon />} aria-label="Edit contact" />
    </Tooltip>
  ),
}
