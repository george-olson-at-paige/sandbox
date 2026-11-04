import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { FilterCardRow, type FilterCard } from "./filter-card-row"

/* FilterCardRow (R12-10): a list's segments as KPI-styled cards with counts, one chosen at a time
   (a radio group: one tab stop, arrow keys move and choose; the Paige ToggleGroup underneath,
   U-04). Counts are what each segment would show under the current search and filters. */
const cards: FilterCard[] = [
  { id: "all", label: "All people", count: 150 },
  { id: "paying", label: "Paying", count: 54 },
  { id: "sponsored", label: "Sponsored", count: 28 },
  { id: "trial", label: "Trial", count: 20 },
  { id: "attention", label: "Needs attention", count: 31, description: "Past due, locked out or unverified" },
]

function Controlled({ initial = "all", ...rest }: { initial?: string; loading?: boolean; cards?: FilterCard[] }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="flex flex-col gap-3">
      <FilterCardRow label="Segments" cards={rest.cards ?? cards} value={value} onValueChange={setValue} loading={rest.loading} />
      <span role="status" className="text-sm">
        Showing {value}
      </span>
    </div>
  )
}

const meta = {
  component: FilterCardRow,
  args: { cards, value: "all", onValueChange: fn(), label: "Segments" },
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <div data-surface="page" className="bg-surface-page p-6"><S /></div>],
  tags: ["r12-10", "r15-13", "r15-17"],
} satisfies Meta<typeof FilterCardRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const group = c.getByRole("radiogroup", { name: "Segments" })
    const all = within(group).getByRole("radio", { name: /All people/ })
    await expect(all).toHaveAttribute("aria-checked", "true")
    // One tab stop: Tab lands on the chosen card (the base's group forwards it there), and no
    // other card is tabbable.
    await userEvent.tab()
    await expect(all).toHaveFocus()
    await expect(within(group).getAllByRole("radio").filter((r) => r !== all && r.tabIndex === 0)).toHaveLength(0)
    await userEvent.click(within(group).getByRole("radio", { name: /Trial/ }))
    await expect(c.getByRole("status")).toHaveTextContent("Showing trial")
    // Arrow keys move and choose; End jumps to the last.
    await userEvent.keyboard("{ArrowRight}")
    await expect(c.getByRole("status")).toHaveTextContent("Showing attention")
    await expect(within(group).getByRole("radio", { name: /Needs attention/ })).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(c.getByRole("status")).toHaveTextContent("Showing all")
    await userEvent.keyboard("{End}")
    await expect(c.getByRole("status")).toHaveTextContent("Showing attention")
    // The chosen card has a check mark, not colour alone.
    await expect(within(group).getByRole("radio", { name: /Needs attention/ }).querySelector("[data-slot='filter-card-check']")).not.toBeNull()
  },
}

/* R15-13 (option C): rest, hover (card 2), pressed (card 3) and chosen + focus (card 1), drawn
   through the pseudo-states addon. Every card is white and flat; only the chosen one is blue, by its
   border and inner ring (R21-01: no shadow), with the halo 2px outside it for focus. */
export const States: Story = {
  parameters: {
    pseudo: {
      hover: ['[data-slot="filter-card"]:nth-of-type(2)'],
      active: ['[data-slot="filter-card"]:nth-of-type(3)'],
      focusVisible: ['[data-slot="filter-card"][data-state="on"]'],
    },
  },
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const chosen = within(canvasElement).getByRole("radio", { name: /All people/ })
    const style = getComputedStyle(chosen)
    // White (no tint, no grey overlay), the 1px inner brand ring, no drop shadow, and a check mark.
    await expect(style.backgroundImage).toBe("none")
    await expect(style.backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(style.boxShadow).toContain("inset")
    await expect(style.boxShadow).not.toContain("24px")
    await expect(style.outlineStyle).toBe("none")
    await expect(chosen.querySelector("[data-slot='filter-card-check']")).not.toBeNull()
    for (const other of within(canvasElement).getAllByRole("radio").filter((r) => r !== chosen)) {
      await expect(getComputedStyle(other).boxShadow).not.toContain("inset")
    }
  },
}

export const ChosenWithDescription: Story = { name: "Chosen, with a description", render: () => <Controlled initial="attention" /> }

/** Description: one line, the full text in a tooltip. */
export const DescriptionEllipsis: Story = {
  name: "Description · one line",
  tags: ["r13-07"],
  render: () => (
    <div className="w-240">
      <Controlled initial="all" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const card = c.getByRole("radio", { name: /Needs attention/ })
    const text = card.querySelector<HTMLElement>("[data-slot='filter-card-description']")!
    // One line: no taller than a line of 12px text, cut with an ellipsis.
    await expect(getComputedStyle(text).textOverflow).toBe("ellipsis")
    await expect(text.getBoundingClientRect().height).toBeLessThan(20)
    await expect(card).toHaveAccessibleDescription(/Past due, locked out or unverified/)
    await userEvent.hover(card)
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip")).toHaveTextContent("Past due, locked out or unverified")
    await userEvent.unhover(card)
  },
}

export const CountsFollowTheSearch: Story = {
  name: "Counts under a search (“smith”)",
  render: () => (
    <Controlled
      cards={[
        { id: "all", label: "All people", count: 9 },
        { id: "paying", label: "Paying", count: 4 },
        { id: "sponsored", label: "Sponsored", count: 2 },
        { id: "trial", label: "Trial", count: 0 },
        { id: "attention", label: "Needs attention", count: 1, description: "Past due, locked out or unverified" },
      ]}
    />
  ),
}

export const Loading: Story = { render: () => <Controlled loading /> }

export const Unknown: Story = {
  name: "Counts unknown (the list failed to load)",
  render: () => <Controlled cards={cards.map((c) => ({ ...c, count: null }))} />,
}

export const Three: Story = { name: "Three segments", render: () => <Controlled cards={cards.slice(0, 3)} /> }

export const At1280: Story = { tags: ["!autodocs"], globals: { viewport: { value: "w1280" } }, render: () => <Controlled /> }
