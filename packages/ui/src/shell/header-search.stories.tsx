import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { standInSearch, StubLink } from "../stories/fixtures"
import { typeKeys } from "../stories/typing"
import { HeaderSearch } from "./header-search"

/* HeaderSearch (R11-11): an icon that expands into a field, results grouped in a popover under
   it. Stand-in results (search isn't built: D17/D18). Keys: `/` focuses it; Down/Up move, Enter
   opens, Escape closes the results, then collapses an empty field. The open states are
   single-story only (R3-17). */
function Live({ defaultExpanded, initialQuery = "", onSelect }: { defaultExpanded?: boolean; initialQuery?: string; onSelect?: () => void }) {
  const [query, setQuery] = useState(initialQuery)
  return (
    <div className="flex items-center justify-end gap-4">
      <button type="button" className="mr-auto rounded-sm text-sm font-medium text-muted-foreground focus-ring">
        Somewhere else
      </button>
      <HeaderSearch query={query} onQueryChange={setQuery} groups={standInSearch(query)} linkAs={StubLink} defaultExpanded={defaultExpanded} onSelect={onSelect} />
    </div>
  )
}

const meta = {
  component: HeaderSearch,
  tags: ["r11-11"],
  decorators: [(S) => <div className="min-h-96 max-w-3xl"><S /></div>],
} satisfies Meta<typeof HeaderSearch>

export default meta
type Story = StoryObj<typeof meta>

const body = (el: HTMLElement) => within(el.ownerDocument.body)

export const Collapsed: Story = { name: "Collapsed (the icon)", render: () => <Live /> }

export const Expanded: Story = {
  name: "Expanded (empty: the invitation)",
  tags: ["!autodocs"],
  render: () => <Live defaultExpanded />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "Search" }))
    await body(canvasElement).findByText(/Type a name you’d recognise/)
  },
}

export const Typing: Story = {
  name: "Typing (still searching)",
  tags: ["!autodocs"],
  render: () => (
    <div className="flex justify-end">
      <HeaderSearch defaultExpanded query="Ros" loading groups={[]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "Search" }))
    await body(canvasElement).findByText("Looking through your Vault…", { selector: "[data-slot=combobox-empty] span" })
  },
}

export const Results: Story = {
  name: "Results (grouped; arrows move)",
  tags: ["!autodocs"],
  render: () => <Live defaultExpanded onSelect={fn()} />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Search" })
    await userEvent.click(input)
    await typeKeys(input, "re")
    const list = await body(canvasElement).findByRole("listbox", { name: "Search results" })
    await expect(within(list).getByRole("group", { name: "People" })).toBeInTheDocument()
    await expect(within(list).getByRole("group", { name: "Documents" })).toBeInTheDocument()
    await expect(input).toHaveAttribute("aria-controls", list.id)
    // The first result is highlighted as soon as there are results; Down moves to the second.
    const [first, second] = within(list).getAllByRole("option")
    await waitFor(() => expect(first).toHaveAttribute("aria-selected", "true"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", second!.id))
    await expect(second).toHaveAttribute("aria-selected", "true")
    await expect(input).toHaveFocus()
    // Enter opens the highlighted result: the link's click, and the caller is told.
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(body(canvasElement).queryByRole("listbox")).toBeNull())
  },
}

export const NoResults: Story = {
  name: "No results",
  tags: ["!autodocs"],
  render: () => <Live defaultExpanded initialQuery="zebra" />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "Search" }))
    // The visible line (the sr-only status says it too).
    await body(canvasElement).findByText("Nothing matches “zebra”", { selector: "[data-slot=combobox-empty] span" })
  },
}

/** / expands, Escape collapses, click away collapses. */
export const SlashAndEscape: Story = {
  name: "Expand and collapse",
  render: () => <Live />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    ;(canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur()
    await userEvent.keyboard("/")
    const input = await c.findByRole("combobox", { name: "Search" })
    await waitFor(() => expect(input).toHaveFocus())
    // Escape: closes the results, and the empty field collapses back to the icon, focused.
    await userEvent.keyboard("{Escape}")
    const icon = await c.findByRole("button", { name: "Search" })
    await waitFor(() => expect(icon).toHaveFocus())
    // Click away while empty collapses too.
    await userEvent.click(icon)
    await c.findByRole("combobox", { name: "Search" })
    await userEvent.click(c.getByRole("button", { name: "Somewhere else" }))
    await waitFor(() => expect(c.queryByRole("combobox", { name: "Search" })).toBeNull())
  },
}

export const Narrow: Story = {
  name: "Narrow (375)",
  tags: ["!autodocs"],
  render: () => <Live defaultExpanded />,
  globals: { viewport: { value: "w375", isRotated: false } },
}
