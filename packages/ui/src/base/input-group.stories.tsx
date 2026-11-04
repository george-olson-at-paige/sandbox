import type { Meta, StoryObj } from "@storybook/react-vite"
import { SearchIcon, XIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from "./input-group"

/* Upstream InputGroup as the registry ships it (U-02); the Paige InputGroup (Components › Inputs) sits on it. */
const meta = {
  component: InputGroup,
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupInput placeholder="Search…" />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Clear" size="icon-xs">
          <XIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Text: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
}
export const Textarea: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupTextarea placeholder="A note…" />
      <InputGroupAddon align="block-end">
        <InputGroupText>0 / 200</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}
