import type { Meta, StoryObj } from "@storybook/react-vite"

import { Skeleton } from "./skeleton"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Feedback/Skeleton. */
const meta = { component: Skeleton } satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <Skeleton className="h-4 w-48" /> }
