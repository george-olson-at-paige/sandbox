import type { Meta, StoryObj } from "@storybook/react-vite"

import { Spinner } from "./spinner"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Spinner. */
const meta = {
  component: Spinner,
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
