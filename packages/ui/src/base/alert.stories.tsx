import type { Meta, StoryObj } from "@storybook/react-vite"
import { CircleAlertIcon, InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./alert"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Alert. */
const meta = {
  component: Alert,
  decorators: [(S) => <div className="max-w-lg"><S /></div>],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert>
      <InfoIcon />
      <AlertTitle>Three details need a look</AlertTitle>
      <AlertDescription>We found them in your uploaded documents.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>We couldn’t read that file</AlertTitle>
      <AlertDescription>Try a clearer photo, or upload a PDF.</AlertDescription>
    </Alert>
  ),
}
