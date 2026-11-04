import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Card. */
const meta = {
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Guardians for Elena</CardTitle>
        <CardDescription>Who would raise your children if you could not.</CardDescription>
        <CardAction><Button size="sm" variant="outline">Edit</Button></CardAction>
      </CardHeader>
      <CardContent className="text-sm">Daniel Reyes, then Ana Torres.</CardContent>
      <CardFooter><Button size="sm">Save</Button></CardFooter>
    </Card>
  ),
}
