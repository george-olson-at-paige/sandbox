import { useState, type ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { BoldIcon, ItalicIcon, LayoutGridIcon, ListIcon, MapIcon, UnderlineIcon } from "lucide-react"
import { expect, userEvent, within } from "storybook/test"

import { Inline } from "../../primitives/inline"
import { Tooltip } from "../overlays/tooltip"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

/* The Paige ToggleGroup (U-04) is what FilterCardRow sits on (Patterns); the `card` stories show
   that variant bare: one tab stop, arrow keys, Home and End from the base, the R15-13 card
   states. The `icon` stories (R20-11) are the joined bar of icon toggles: the view switch and
   a formatting bar, each item in a Tooltip for its name, as DagFrame does for its icon buttons.
   Which group? A toggle group holds a state (`aria-checked` in single mode, `aria-pressed` in
   multiple); a ButtonGroup (Components/Actions, R20-10) is actions side by side. The view switch
   is a toggle group (one of two is on), a zoom column is a button group (nothing stays pressed). */
const SEGMENTS = [["all", "All"], ["people", "People"], ["pets", "Pets"]] as const

function Single() {
  const [value, setValue] = useState("all")
  return (
    <ToggleGroup type="single" aria-label="Show" value={value} onValueChange={(v) => v && setValue(v)}>
      <Inline gap={3}>
        {SEGMENTS.map(([v, l]) => (
          <ToggleGroupItem key={v} value={v} variant="card" className="w-40">
            <span className="text-sm font-medium">{l}</span>
          </ToggleGroupItem>
        ))}
      </Inline>
    </ToggleGroup>
  )
}

// ToggleGroup's props are a union (single | multiple), which Storybook's arg inference can't
// hold, so the stories are untyped and render their own trees.
const meta: Meta = {
  component: ToggleGroup,
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <div data-surface="page" className="bg-surface-page p-6"><S /></div>],
  tags: ["u-04", "r15-13", "r20-11", "r21-04"],
  render: () => <Single />,
}

export default meta
type Story = StoryObj

export const Card: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const items = c.getAllByRole("radio")
    await expect(items[0]).toHaveAttribute("aria-checked", "true")
    // One tab stop: Tab lands on the pressed item and no other is tabbable; data-state drives the look.
    await userEvent.tab()
    await expect(items[0]).toHaveFocus()
    await expect(items.filter((r) => r !== items[0] && r.tabIndex === 0)).toHaveLength(0)
    await expect(items[0]).toHaveAttribute("data-state", "on")
    await userEvent.click(items[2])
    await expect(items[2]).toHaveAttribute("aria-checked", "true")
    // A second press would clear the base's value; the story keeps it, as FilterCardRow does.
    await userEvent.click(items[2])
    await expect(items[2]).toHaveAttribute("aria-checked", "true")
    // Arrow keys and Home come from the base.
    await userEvent.keyboard("{ArrowLeft}")
    await expect(items[1]).toHaveFocus()
    await userEvent.keyboard("{Home}")
    await expect(items[0]).toHaveFocus()
  },
}

export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple" aria-label="Show" defaultValue={["people"]}>
      <Inline gap={3}>
        {SEGMENTS.slice(1).map(([v, l]) => (
          <ToggleGroupItem key={v} value={v} variant="card" className="w-40">
            <span className="text-sm font-medium">{l}</span>
          </ToggleGroupItem>
        ))}
      </Inline>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const [people, pets] = c.getAllByRole("button")
    await expect(people).toHaveAttribute("aria-pressed", "true")
    await expect(pets).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(pets)
    await expect(pets).toHaveAttribute("aria-pressed", "true")
  },
}

/** An item in the icon bar: the glyph, its name on the item (`aria-label`) and in a Tooltip. */
function IconItem({ value, label, disabled, demo, children }: { value: string; label: string; disabled?: boolean; demo?: string; children: ReactNode }) {
  const item = (
    <ToggleGroupItem value={value} variant="icon" aria-label={label} disabled={disabled} data-demo={demo}>
      {children}
    </ToggleGroupItem>
  )
  // A disabled button gets no pointer events, so a Tooltip around it would never open; it is left off.
  return disabled ? item : <Tooltip content={label}>{item}</Tooltip>
}

function ViewSwitcher() {
  const [value, setValue] = useState("grid")
  return (
    <ToggleGroup type="single" variant="icon" aria-label="View" value={value} onValueChange={(v) => v && setValue(v)}>
      <IconItem value="grid" label="Grid"><LayoutGridIcon aria-hidden /></IconItem>
      <IconItem value="list" label="List"><ListIcon aria-hidden /></IconItem>
    </ToggleGroup>
  )
}

/** The view switcher: one of two is on, and the chosen one takes the neutral fill and the strong ink (not blue). */
export const IconSingleViewSwitcher: Story = {
  name: "Icon · single (view switcher)",
  render: () => <ViewSwitcher />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const grid = c.getByRole("radio", { name: "Grid" })
    const list = c.getByRole("radio", { name: "List" })
    await expect(grid).toHaveAttribute("aria-checked", "true")
    await userEvent.click(list)
    // The Tooltip around an item overwrites `data-state`, so the state is read from ARIA.
    await expect(list).toHaveAttribute("aria-checked", "true")
    await expect(grid).toHaveAttribute("aria-checked", "false")
    // The chosen item has the neutral fill; an item that is off has none.
    await expect(getComputedStyle(list).backgroundColor).not.toBe(getComputedStyle(grid).backgroundColor)
    await expect(getComputedStyle(grid).backgroundColor).toBe("rgba(0, 0, 0, 0)")
  },
}

/** A formatting bar: any of them can be on together (`multiple`, `aria-pressed`). */
export const IconMultipleFormatting: Story = {
  name: "Icon · multiple (formatting)",
  render: () => (
    <ToggleGroup type="multiple" variant="icon" aria-label="Text formatting">
      <IconItem value="bold" label="Bold"><BoldIcon aria-hidden /></IconItem>
      <IconItem value="italic" label="Italic"><ItalicIcon aria-hidden /></IconItem>
      <IconItem value="underline" label="Underline"><UnderlineIcon aria-hidden /></IconItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const bold = c.getByRole("button", { name: "Bold" })
    const italic = c.getByRole("button", { name: "Italic" })
    await userEvent.click(bold)
    await userEvent.click(italic)
    await expect(bold).toHaveAttribute("aria-pressed", "true")
    await expect(italic).toHaveAttribute("aria-pressed", "true")
    await expect(c.getByRole("button", { name: "Underline" })).toHaveAttribute("aria-pressed", "false")
  },
}

/** One item is off the keys and its glyph dimmed to the package's disabled opacity (the divider beside it keeps its weight); the others work as usual. */
export const IconDisabledItem: Story = {
  name: "Icon · with a disabled item",
  render: () => (
    <ToggleGroup type="multiple" variant="icon" aria-label="Text formatting" defaultValue={["bold"]}>
      <IconItem value="bold" label="Bold"><BoldIcon aria-hidden /></IconItem>
      <IconItem value="italic" label="Italic" disabled><ItalicIcon aria-hidden /></IconItem>
      <IconItem value="underline" label="Underline"><UnderlineIcon aria-hidden /></IconItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const italic = c.getByRole("button", { name: "Italic" })
    await expect(italic).toBeDisabled()
    // The glyph is dimmed, not the item, so the divider beside it keeps its weight.
    await expect(Number(getComputedStyle(italic.querySelector("svg")!).opacity)).toBeLessThan(1)
    // No pointer events reach it, so it can't be pressed.
    await expect(getComputedStyle(italic).pointerEvents).toBe("none")
    await expect(italic).toHaveAttribute("aria-pressed", "false")
  },
}

/** Focus is the gapped outline on the item, drawn here on the middle one through the pseudo-state; it is lifted above its neighbours so the joined bar never clips it. */
export const IconFocusRingWhole: Story = {
  name: "Icon · focus ring stays whole",
  parameters: { pseudo: { focusVisible: ['[data-demo="focus"]'] } },
  render: () => (
    <ToggleGroup type="single" variant="icon" aria-label="View" defaultValue="list">
      <IconItem value="grid" label="Grid"><LayoutGridIcon aria-hidden /></IconItem>
      <IconItem value="list" label="List" demo="focus"><ListIcon aria-hidden /></IconItem>
      <IconItem value="map" label="Map"><MapIcon aria-hidden /></IconItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const mid = c.getByRole("radio", { name: "List" })
    // A real Tab (keyboard focus, so :focus-visible matches) lands on the pressed item, the middle one.
    await userEvent.tab()
    await expect(mid).toHaveFocus()
    const style = getComputedStyle(mid)
    await expect(style.outlineStyle).toBe("solid")
    // Above its neighbours (a positioned item with a z-index), so they don't cover the ring.
    await expect(style.zIndex).not.toBe("auto")
    await expect(style.position).toBe("relative")
    await expect(getComputedStyle(c.getByRole("radio", { name: "Grid" })).outlineStyle).toBe("none")
  },
}

/* Segment (R21-04): the icon bar's join with text items — a segmented control. The chosen
   segment takes the muted fill, as an icon item does (George 2026-10-31), not the mock's ink. */
const ENTRIES = [["all", "Everyone"], ["signup", "Signed up · 100"], ["resumed", "Came back · 52"]] as const

function Segmented({ disabled }: { disabled?: string }) {
  const [value, setValue] = useState("all")
  return (
    <div className="flex flex-col items-start gap-3">
      <ToggleGroup type="single" variant="segment" aria-label="How they came in" value={value} onValueChange={(v) => v && setValue(v)}>
        {ENTRIES.map(([v, l]) => (
          <ToggleGroupItem key={v} value={v} variant="segment" disabled={v === disabled}>
            {l}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span role="status" className="text-sm">Showing {value}</span>
    </div>
  )
}

/** One of three, a radio group: the chosen segment is muted-filled with the strong ink; pressing it again keeps it on. */
export const SegmentSingle: Story = {
  name: "Segment · single",
  tags: ["r21-04"],
  render: () => <Segmented />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByRole("radiogroup", { name: "How they came in" })).toBeInTheDocument()
    const everyone = c.getByRole("radio", { name: "Everyone" })
    const signed = c.getByRole("radio", { name: "Signed up · 100" })
    await expect(everyone).toHaveAttribute("aria-checked", "true")
    await expect(getComputedStyle(signed).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await userEvent.click(signed)
    await expect(c.getByRole("status")).toHaveTextContent("Showing signup")
    await expect(getComputedStyle(signed).backgroundColor).not.toBe("rgba(0, 0, 0, 0)")
    // A second press would clear the base's value; the story keeps one on.
    await userEvent.click(signed)
    await expect(signed).toHaveAttribute("aria-checked", "true")
  },
}

/** One tab stop on the chosen segment; the arrow keys move along the bar and wrap, with the gapped ring on the focused segment. */
export const SegmentKeyboard: Story = {
  name: "Segment · keyboard",
  tags: ["r21-04"],
  render: () => <Segmented />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.tab()
    const everyone = c.getByRole("radio", { name: "Everyone" })
    await expect(everyone).toHaveFocus()
    await expect(getComputedStyle(everyone).outlineStyle).toBe("solid")
    await userEvent.keyboard("{ArrowLeft}")
    await expect(c.getByRole("radio", { name: "Came back · 52" })).toHaveFocus()
    await userEvent.keyboard(" ")
    await expect(c.getByRole("status")).toHaveTextContent("Showing resumed")
  },
}

/** Rest, hover (2nd) and a disabled segment (3rd): hover is the relative wash, never blue. */
export const SegmentStates: Story = {
  name: "Segment · states",
  tags: ["r21-04"],
  parameters: { pseudo: { hover: ['[data-variant="segment"][role="radio"]:nth-of-type(2)'] } },
  render: () => <Segmented disabled="resumed" />,
}
