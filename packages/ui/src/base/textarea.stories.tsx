import type { Meta, StoryObj } from "@storybook/react-vite"

import { Textarea } from "./textarea"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Textarea. */
const meta = {
  component: Textarea,
  args: { "aria-label": "Funeral wishes", placeholder: "Anything you want people to know" },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Invalid: Story = { args: { "aria-invalid": true } }
