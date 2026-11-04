import type { Meta, StoryObj } from "@storybook/react-vite"

import { Calendar } from "./calendar"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/DateField. */
const meta = {
  component: Calendar,
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { mode: "single", defaultMonth: new Date(2026, 2, 1) } }
export const Dropdowns: Story = {
  name: "Month and year dropdowns",
  args: { mode: "single", captionLayout: "dropdown", defaultMonth: new Date(2026, 2, 1), startMonth: new Date(1920, 0), endMonth: new Date(2036, 11) },
}
