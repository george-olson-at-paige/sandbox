import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { SearchIcon, XIcon } from "lucide-react"

import { pressable } from "../internal/control"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"

/* The Paige InputGroup (U-02): a field with a glyph or an action beside its text, drawn as one
   control. PasswordField, SsnField, DateField and ListToolbar's search sit on it; this shows it
   bare. The trailing button here stands in for FieldAction (Forms › Fields), which Components
   can't import. */
function Clear() {
  return (
    <button type="button" aria-label="Clear" className={`${pressable} inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-card-foreground [&_svg]:size-icon`}>
      <XIcon />
    </button>
  )
}

const meta = {
  component: InputGroup,
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["u-02"],
  render: (args) => (
    <InputGroup {...args}>
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search" placeholder="Search people" defaultValue="smith" />
      <InputGroupAddon align="inline-end">
        <Clear />
      </InputGroupAddon>
    </InputGroup>
  ),
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!
    const input = within(canvasElement).getByRole("textbox", { name: "Search" })
    // One control: the box is the group's (44 tall), the input inside has none.
    await expect(group.getBoundingClientRect().height).toBe(44)
    await expect(getComputedStyle(input).borderTopWidth).toBe("0px")
    await expect(getComputedStyle(input).boxShadow).not.toMatch(/[1-9]\d*px/) // no shadow of its own (Tailwind's shadow-none is all zeros)
    // The glyph sits 12px in (13 with the border), and the text starts 8px clear of it.
    const glyph = group.querySelector("svg")!
    await expect(Math.round(glyph.getBoundingClientRect().left - group.getBoundingClientRect().left)).toBe(13)
    await expect(input.getBoundingClientRect().left).toBeGreaterThanOrEqual(glyph.getBoundingClientRect().right)
    await expect(getComputedStyle(input).paddingLeft).toBe("8px")
    // A click on the glyph's addon focuses the input (the base's).
    await userEvent.click(group.querySelector<HTMLElement>('[data-slot="input-group-addon"]')!)
    await expect(input).toHaveFocus()
  },
}

export const Small: Story = {
  name: "sm (a toolbar's search)",
  args: { size: "sm" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!.getBoundingClientRect().height).toBe(36)
  },
}

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    // Focus reads from the control inside (a keyboard focus: the pseudo-states addon doesn't reach
    // into `has-[]`, and only a key press is :focus-visible everywhere): the group draws the 3px
    // halo, the input no ring of its own.
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!
    const input = within(canvasElement).getByRole("textbox", { name: "Search" })
    await userEvent.tab()
    await expect(input).toHaveFocus()
    // The base transitions box-shadow, so the halo arrives a frame or two after focus.
    await waitFor(() => expect(getComputedStyle(group).boxShadow).toContain("3px"))
    await expect(getComputedStyle(input).boxShadow).not.toMatch(/[1-9]\d*px/)
  },
}

export const Invalid: Story = {
  name: "Error (aria-invalid on the control)",
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Email" defaultValue="ada@" aria-invalid />
      <InputGroupAddon align="inline-end">
        <Clear />
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!
    const plain = document.createElement("div")
    plain.className = "border-input"
    canvasElement.append(plain)
    await expect(getComputedStyle(group).borderTopColor).not.toBe(getComputedStyle(plain).borderTopColor)
    plain.remove()
  },
}

export const Disabled: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search" placeholder="Search people" disabled />
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!
    await expect(getComputedStyle(group).cursor).toBe("not-allowed")
    await expect(Number(getComputedStyle(group).opacity)).toBeLessThan(1)
  },
}
