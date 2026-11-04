import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { FIXTURE_ADDRESSES } from "../../fixtures/addresses"
import { emptyPostalAddress, formatPostalAddress } from "../../lib/postal-address"
import { leave, typeKeys } from "../../stories/typing"
import { Field, FieldLabel } from "../field"
import { AddressField, type AddressFieldValue } from "./address-field"

/* The address book is the fixture list (type "Willow", "Ashcroft" or "Portland"); the app passes Photon. */
const meta = {
  component: AddressField,
  args: { source: FIXTURE_ADDRESSES, "aria-label": "Home address" },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  parameters: {
    docs: {
      description: {
        component:
          "One US address as a text box with suggestions. **By default** (setup) the text is the answer: a full address, part of one, or just a city; nothing is invalid. A pick puts the whole address in the box and keeps its parts; typing over it drops them. **`validate`** (after sign-in) asks for the parts: the box is the street with the apt beside it, a pick fills the rest, and when the street doesn't resolve (nothing found, the lookup failed, or the person left without a pick) city, state and ZIP show to fill by hand. Up/Down move through the suggestions, Enter picks, Escape closes the list. **Source:** a list (filtered here) or a lookup function; the package makes no requests. **Value:** `{ text, address }`: the box's text, and the `PostalAddress` parts (by default the pick's or `null`; with `validate`, always the street and parts).",
      },
    },
  },
} satisfies Meta<typeof AddressField>

export default meta
type Story = StoryObj<typeof meta>

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
/* The suggestions are a popover (U-01), portalled outside the canvas. */
const body = (el: HTMLElement) => within(el.ownerDocument.body)
const pickedValue = (i: number): AddressFieldValue => ({ text: formatPostalAddress(FIXTURE_ADDRESSES[i]!), address: FIXTURE_ADDRESSES[i]! })

export const Empty: Story = {}

/** A pick: the whole address in the box. */
export const Picked: Story = { args: { defaultValue: pickedValue(2) } }

/** Typed with no pick (here, only a city): the text is the answer. */
export const Typed: Story = { name: "Typed, no pick", args: { defaultValue: { text: "Boise", address: null } } }

export const Disabled: Story = { args: { defaultValue: pickedValue(0), disabled: true } }

export const InField: Story = {
  name: "In a Field (label, value)",
  render: (args) => {
    const [value, setValue] = useState<AddressFieldValue>({ text: "", address: null })
    return (
      <div className="flex flex-col gap-3">
        <Field>
          <FieldLabel>Your home address</FieldLabel>
          <AddressField {...args} aria-label={undefined} value={value} onValueChange={setValue} />
        </Field>
        <p className="text-xs text-muted-foreground" data-testid="value">
          Value: <code>{JSON.stringify(value)}</code>
        </p>
      </div>
    )
  },
}

/** A pick puts the whole address in the box and keeps its parts; the list stays closed until the person types again. */
export const PickFillsTheBox: Story = {
  name: "Pick fills the box",
  args: { onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Home address" })
    await typeKeys(input, "Willow")
    const options = await body(canvasElement).findAllByRole("option")
    await expect(options).toHaveLength(2)
    await expect(input).toHaveAttribute("aria-expanded", "true")
    await userEvent.click(options[1]!)
    await expect(input).toHaveValue("418 Willow Creek Dr, Apt 2, Round Rock, Texas 78664")
    await expect(args.onValueChange).toHaveBeenLastCalledWith(pickedValue(2))
    await wait(450)
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
    await expect(input).toHaveAttribute("aria-expanded", "false")
  },
}

/** A city alone is an answer, and the lookup can suggest one. */
export const CityAlone: Story = {
  name: "A city alone",
  args: { onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Home address" })
    await typeKeys(input, "Portland")
    const options = await body(canvasElement).findAllByRole("option")
    await expect(options).toHaveLength(2)
    await userEvent.click(options[1]!)
    await expect(input).toHaveValue("Portland, Oregon")
    await expect(args.onValueChange).toHaveBeenLastCalledWith(pickedValue(5))
  },
}

/** The first suggestion is highlighted as soon as there are any; Down moves, Enter picks the highlighted one. */
export const KeyboardPick: Story = {
  name: "Keyboard pick",
  args: { onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Home address" })
    await typeKeys(input, "Willow")
    const options = await body(canvasElement).findAllByRole("option")
    await expect(options).toHaveLength(2)
    await waitFor(() => expect(options[0]).toHaveAttribute("aria-selected", "true"))
    await expect(input).toHaveAttribute("aria-activedescendant", options[0]!.id)
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[1]!.id))
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant", options[0]!.id))
    await userEvent.keyboard("{Enter}")
    await expect(input).toHaveValue(formatPostalAddress(FIXTURE_ADDRESSES[1]!))
    await expect(args.onValueChange).toHaveBeenLastCalledWith(pickedValue(1))
    await waitFor(() => expect(body(canvasElement).queryByRole("listbox")).toBeNull())
    await expect(input).toHaveFocus()
  },
}

/** Text the lookup doesn't know is still the answer: no list, no other fields. Typing over a pick drops its parts. */
export const AnyTextIsTheAnswer: Story = {
  name: "Any text is the answer",
  args: { onValueChange: fn(), defaultValue: pickedValue(0) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Home address" })
    await typeKeys(input, " (the back house)")
    await expect(args.onValueChange).toHaveBeenLastCalledWith({ text: "1408 Ashcroft Lane, Portland, Oregon 97216 (the back house)", address: null })
    await wait(450)
    await leave(input)
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
    await expect(canvas.queryByRole("textbox", { name: "City" })).toBeNull()
  },
}

/** The lookup fails (offline, rate-limited): no suggestions, and the text is still the answer. */
export const LookupUnavailable: Story = {
  name: "Lookup unavailable",
  args: {
    onValueChange: fn(),
    source: async () => {
      throw new Error("offline")
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Home address" })
    await typeKeys(input, "1408 Ashcroft")
    await wait(450)
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
    await expect(canvas.queryByRole("textbox", { name: "City" })).toBeNull()
    await expect(args.onValueChange).toHaveBeenLastCalledWith({ text: "1408 Ashcroft", address: null })
  },
}

/* validate as a page uses it: in a Field whose label is the street's; the apt's label sits on its line. */
const inAField: Story["render"] = (args) => (
  <Field>
    <FieldLabel>Your home address</FieldLabel>
    <AddressField {...args} aria-label={undefined} />
  </Field>
)

/** validate: a picked street with its apt beside it, the rest on the line under the row. */
export const ValidatePicked: Story = {
  name: "Validate · picked",
  render: inAField,
  args: { validate: true, defaultValue: { text: FIXTURE_ADDRESSES[2]!.street, address: FIXTURE_ADDRESSES[2]! } },
}

/** validate: a street with no pick, and the parts to fill. */
export const ValidateTyped: Story = {
  name: "Validate · typed, no pick",
  render: inAField,
  args: { validate: true, defaultValue: { text: "22 Elm St", address: emptyPostalAddress({ street: "22 Elm St" }) } },
}

/** validate with no Field around it (aria-label only): the apt's label stays over its box, and the street box sits at the bottom of the row. */
export const ValidateNoField: Story = {
  name: "Validate · no Field (aria-label)",
  args: { validate: true, defaultValue: { text: "22 Elm St", address: emptyPostalAddress({ street: "22 Elm St" }) } },
}

/** validate: a pick fills every part and settles; the apt shows from the start, the other parts stay hidden. */
export const ValidatePickSettlesClosed: Story = {
  name: "Validate · pick fills and settles",
  render: inAField,
  args: { validate: true, onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Your home address" })
    const apt = canvas.getByRole("textbox", { name: /^Apt/ })
    await expect(apt).toHaveValue("")
    await typeKeys(input, "Willow")
    const options = await body(canvasElement).findAllByRole("option")
    await expect(options).toHaveLength(2)
    await expect(canvas.queryByRole("textbox", { name: "City" })).toBeNull()
    await userEvent.click(options[1]!)
    await expect(input).toHaveValue("418 Willow Creek Dr")
    await expect(apt).toHaveValue("Apt 2")
    await expect(args.onValueChange).toHaveBeenLastCalledWith({ text: "418 Willow Creek Dr", address: FIXTURE_ADDRESSES[2] })
    await expect(canvas.getByText("Round Rock, Texas 78664")).toBeVisible()
    await expect(canvas.queryByRole("textbox", { name: "City" })).toBeNull()
    await wait(450)
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
  },
}

/** validate: a street the book doesn't know shows the parts once the lookup comes back empty; filling them reports one address. */
export const ValidateNoMatchShowsParts: Story = {
  name: "Validate · no match shows the parts",
  render: inAField,
  args: { validate: true, onValueChange: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Your home address" })
    await typeKeys(input, "22 Elm St")
    await expect(canvas.queryByRole("textbox", { name: "City" })).toBeNull()
    const city = await canvas.findByRole("textbox", { name: "City" })
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
    await typeKeys(city, "Boise")
    await typeKeys(canvas.getByRole("textbox", { name: "ZIP code" }), "83702")
    await expect(args.onValueChange).toHaveBeenLastCalledWith({
      text: "22 Elm St",
      address: emptyPostalAddress({ street: "22 Elm St", city: "Boise", postalCode: "83702" }),
    })
  },
}

/** validate: suggestions were offered but the person left the street without one, so the parts show. */
export const ValidateLeaveWithoutPick: Story = {
  name: "Validate · leaving without a pick shows the parts",
  render: inAField,
  args: { validate: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("combobox", { name: "Your home address" })
    await typeKeys(input, "Willow")
    await body(canvasElement).findAllByRole("option")
    await leave(input)
    await waitFor(() => expect(body(canvasElement).queryByRole("listbox")).toBeNull())
    await expect(canvas.getByRole("textbox", { name: "City" })).toBeVisible()
  },
}

/** validate: the lookup fails, so the parts show. */
export const ValidateLookupUnavailable: Story = {
  name: "Validate · lookup unavailable",
  render: inAField,
  args: {
    validate: true,
    source: async () => {
      throw new Error("offline")
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await typeKeys(canvas.getByRole("combobox", { name: "Your home address" }), "1408 Ashcroft")
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "City" })).toBeVisible())
    await expect(body(canvasElement).queryByRole("listbox")).toBeNull()
  },
}
