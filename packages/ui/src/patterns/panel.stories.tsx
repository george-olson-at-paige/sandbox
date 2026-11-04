import type { Meta, StoryObj } from "@storybook/react-vite"

import { StubLink } from "../stories/fixtures"
import { Button } from "../components/actions/button"
import { Panel } from "./panel"
import { FactItem } from "../vault/fact-item"

const rows = (
  <div>
    <FactItem kind="person" name="Daniel Reyes" detail="Spouse" href="#daniel" linkAs={StubLink} />
    <FactItem kind="person" name="Elena Reyes" detail="Child · 9" href="#elena" linkAs={StubLink} />
    <FactItem kind="pet" name="Biscuit" detail="Dog" href="#biscuit" linkAs={StubLink} />
  </div>
)

const meta = {
  tags: ["r2-13", "gaps-38"],
  component: Panel,
  args: { title: "People", count: "3", children: rows },
  argTypes: { variant: { control: "select", options: ["default", "muted", "quiet"] } },
  decorators: [(S) => <div className="max-w-md" data-area="family"><S /></div>],
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Muted: Story = { args: { variant: "muted" } }
export const Quiet: Story = {
  name: "Quiet (More that belongs here)",
  args: {
    variant: "quiet",
    title: "More that belongs here",
    count: undefined,
    description: "What else your family would look for here. None of it is waiting on you.",
  },
}
export const WithMore: Story = {
  name: "With more link",
  args: { more: <Button asChild variant="link" size="inline"><StubLink href="#all">See all</StubLink></Button> },
}
export const DescriptionOnly: Story = {
  name: "Description only (provenance)",
  args: { title: "Where this came from", count: undefined, children: undefined, description: "Read from your passport and will, uploaded 3 October." },
}
export const DescriptionAndContent: Story = {
  name: "Description + content",
  args: { description: "Everyone who appears in this Area." },
}
export const Empty: Story = {
  name: "Empty (renders nothing)",
  args: { children: undefined, description: undefined },
  render: (args) => (
    <div>
      <Panel {...args} />
      <p className="text-sm text-muted-foreground">Panel returns nothing without children or a description.</p>
    </div>
  ),
}
