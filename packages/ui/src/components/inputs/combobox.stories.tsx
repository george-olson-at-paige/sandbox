import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import { SearchIcon } from "lucide-react"

import { typeKeys } from "../../stories/typing"
import { InputGroup, InputGroupAddon } from "./input-group"
import { Combobox, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox"

/* Combobox (U-01): the Paige field with cmdk's list and keys, in a popover or inline. The
   filtering here is the story's (the Combobox lists what it's given), as a site's lookup would. */
const FRUIT = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Cranberry", "Date", "Fig", "Grape"]
const GROUPS = [
  { id: "people", label: "People", items: ["Daniel Reyes", "Elena Reyes", "Rosa Martinez"] },
  { id: "documents", label: "Documents", items: ["Last will and testament", "Deed to the house"] },
]

function Demo({
  inline = false,
  grouped = false,
  disabledItem,
  onPick = () => {},
  onSubmit,
}: {
  inline?: boolean
  grouped?: boolean
  disabledItem?: string
  onPick?: (value: string) => void
  onSubmit?: () => void
}) {
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)
  const q = text.trim().toLowerCase()
  const matches = (items: string[]) => (q ? items.filter((i) => i.toLowerCase().includes(q)) : [])
  const flat = grouped ? GROUPS.flatMap((g) => matches(g.items)) : matches(FRUIT)
  const pick = (value: string) => {
    setText(value)
    setOpen(false)
    onPick(value)
  }
  return (
    <form
      className="max-w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <Combobox inline={inline} open={open && q !== ""} onOpenChange={(o) => setOpen(o)}>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <ComboboxInput
            aria-label="Fruit"
            placeholder="Type to search…"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
        </InputGroup>
        <ComboboxList label="Suggestions" empty={<>Nothing matches “{text.trim()}”.</>}>
          {grouped
            ? GROUPS.filter((g) => matches(g.items).length).map((g) => (
                <ComboboxGroup key={g.id} heading={g.label}>
                  {matches(g.items).map((i) => (
                    <ComboboxItem key={i} value={i} onSelect={pick}>
                      {i}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              ))
            : flat.map((i) => (
                <ComboboxItem key={i} value={i} disabled={i === disabledItem} onSelect={pick}>
                  {i}
                </ComboboxItem>
              ))}
        </ComboboxList>
      </Combobox>
    </form>
  )
}

// Untyped Meta: the Combobox's required `open` and `children` are the demo's, not args.
const meta: Meta = {
  component: Combobox,
  tags: ["u-01"],
  decorators: [(S) => <div className="min-h-80"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          "A text field with things to pick from as you type: the Paige InputGroup field, cmdk's list and keys (Up/Down with wrap, the first highlighted, pointer highlight, option ids, `aria-activedescendant`, groups, an empty state), in a popover under the field (the field's width) or `inline` in the flow. Filtering is the caller's: what is passed is what lists. Enter clicks the highlighted option (so a link opens); with the list closed, Enter is the form's. Home/End stay the caret's. `open` is the caller's state; the Combobox asks for changes through `onOpenChange`.",
      },
    },
  },
}

export default meta
type Story = StoryObj

const body = (el: HTMLElement) => within(el.ownerDocument.body)

/** Typing opens the list with the first match highlighted; arrows move and wrap; Enter picks; the field keeps focus throughout. */
export const Default: Story = {
  name: "Popover (keys)",
  render: () => <Demo onPick={fn()} />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Fruit" })
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(input).not.toHaveAttribute("aria-controls")
    await typeKeys(input, "ap")
    const list = await body(canvasElement).findByRole("listbox", { name: "Suggestions" })
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await expect(input).toHaveAttribute("aria-controls", list.id)
    const options = within(list).getAllByRole("option")
    await expect(options.map((o) => o.textContent)).toEqual(["Apple", "Apricot", "Grape"])
    await waitFor(() => expect(options[0]).toHaveAttribute("aria-selected", "true"))
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[0]!.id))
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[2]!.id))
    // Wraps.
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[0]!.id))
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[2]!.id))
    await expect(input).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(input).toHaveValue("Grape")
    await waitFor(() => expect(body(canvasElement).queryByRole("listbox")).toBeNull())
    await expect(input).toHaveAttribute("aria-expanded", "false")
    await expect(input).toHaveFocus()
  },
}

/** A click on an option picks it and leaves focus in the field. */
export const Click: Story = {
  name: "Popover (click picks)",
  tags: ["!autodocs"],
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Fruit" })
    await typeKeys(input, "berry")
    const options = await body(canvasElement).findAllByRole("option")
    await expect(options.map((o) => o.textContent)).toEqual(["Blueberry", "Cranberry"])
    await userEvent.click(options[1]!)
    await expect(input).toHaveValue("Cranberry")
    await expect(input).toHaveFocus()
    await waitFor(() => expect(body(canvasElement).queryByRole("listbox")).toBeNull())
  },
}

/** Grouped results: a heading per group; arrows cross the groups. */
export const Grouped: Story = {
  render: () => <Demo grouped />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Fruit" })
    await typeKeys(input, "e")
    const list = await body(canvasElement).findByRole("listbox")
    await expect(within(list).getByRole("group", { name: "People" })).toBeInTheDocument()
    await expect(within(list).getByRole("group", { name: "Documents" })).toBeInTheDocument()
    const options = within(list).getAllByRole("option")
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[3]!.id))
    await expect(options[3]).toHaveTextContent("Last will and testament")
  },
}

/** Nothing matches: `empty` says so, outside the listbox (never an empty listbox on screen). */
export const Empty: Story = {
  name: "Empty (nothing matches)",
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Fruit" })
    await typeKeys(input, "zz")
    await body(canvasElement).findByText("Nothing matches “zz”.")
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await expect(input).not.toHaveAttribute("aria-activedescendant")
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
  },
}

/** A disabled option is listed but skipped by the keys and ignores a click. */
export const DisabledOption: Story = {
  name: "Disabled option",
  tags: ["!autodocs"],
  render: () => <Demo disabledItem="Apricot" onPick={fn()} />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Fruit" })
    await typeKeys(input, "ap")
    const options = await body(canvasElement).findAllByRole("option")
    await expect(options[1]).toHaveAttribute("aria-disabled", "true")
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[2]!.id))
    await userEvent.click(options[1]!)
    await expect(input).toHaveValue("ap")
  },
}

/** Enter with the list closed is the form's (it submits); with an option highlighted it picks instead. Home and End move the caret. */
export const EnterAndTheForm: Story = {
  name: "Enter: the form's when closed",
  tags: ["!autodocs"],
  render: (_, { parameters }) => <Demo onSubmit={parameters.onSubmit} />,
  parameters: { onSubmit: fn() },
  play: async ({ canvasElement, parameters }) => {
    const input = within(canvasElement).getByRole("combobox", { name: "Fruit" }) as HTMLInputElement
    await typeKeys(input, "zz")
    await body(canvasElement).findByText("Nothing matches “zz”.")
    // Open with nothing to pick: Enter submits.
    await userEvent.keyboard("{Enter}")
    await expect(parameters.onSubmit).toHaveBeenCalledTimes(1)
    await typeKeys(input, "{Backspace}{Backspace}fig")
    const fig = await body(canvasElement).findByRole("option", { name: "Fig" })
    await waitFor(() => expect(fig).toHaveAttribute("aria-selected", "true"))
    // Home and End are left to the caret (cmdk would take them for the list and prevent them).
    for (const key of ["Home", "End"]) {
      const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
      input.dispatchEvent(ev)
      await expect(ev.defaultPrevented).toBe(false)
    }
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", fig.id))
    // Highlighted: Enter picks, not submits.
    await userEvent.keyboard("{Enter}")
    await expect(input).toHaveValue("Fig")
    await expect(parameters.onSubmit).toHaveBeenCalledTimes(1)
    // Closed again: Enter submits.
    await userEvent.keyboard("{Enter}")
    await expect(parameters.onSubmit).toHaveBeenCalledTimes(2)
  },
}

/** Inline: the list in the flow under the field, for a region that may not open a popover (R14-04). */
export const Inline: Story = {
  render: () => <Demo inline />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Fruit" })
    await expect(canvas.queryByRole("listbox")).toBeNull()
    await typeKeys(input, "an")
    const list = canvas.getByRole("listbox", { name: "Suggestions" })
    await expect(input).toHaveAttribute("aria-controls", list.id)
    const options = within(list).getAllByRole("option")
    await expect(options.map((o) => o.textContent)).toEqual(["Banana", "Cranberry"])
    await waitFor(() => expect(options[0]).toHaveAttribute("aria-selected", "true"))
    await userEvent.click(options[1]!)
    await expect(input).toHaveValue("Cranberry")
    await expect(input).toHaveFocus()
    await expect(canvas.queryByRole("listbox")).toBeNull()
  },
}
