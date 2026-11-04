import type { ComponentProps } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { clearText, typeKeys } from "../stories/typing"
import { FactField, FactFieldGrid } from "./fact-field"

type Args = ComponentProps<typeof FactField>

const ordinary: Args = { label: "Full legal name", state: { kind: "ordinary", value: "Maya Elena Reyes", source: "From your passport" } }
const autofilled: Args = {
  label: "Date of birth",
  state: { kind: "autofilled", value: "12 March 1984", source: "Read from your passport", confirmedSource: "Confirmed by you" },
}
const notFound: Args = {
  label: "Social Security number",
  state: { kind: "notFound", expected: true, reason: "We looked in your uploads and didn’t find it.", addLabel: "Add it", declineLabel: "I’d rather not" },
}
const conflict: Args = {
  label: "Date of birth",
  state: {
    kind: "conflict",
    preselected: "a",
    options: [
      { id: "a", value: "12 March 1984", source: "From your passport" },
      { id: "b", value: "21 March 1984", source: "From your will" },
    ],
  },
}
const answered: Args = { label: "Military service", state: { kind: "answered", value: "Never served", source: "You told us this on 3 October." } }

const meta = {
  tags: ["r12-06", "gaps-125"],
  component: FactField,
  args: ordinary,
  /* parameters.wide: grids and groups get room; single cards stay at their natural width */
  decorators: [(S, c) => <div className={c.parameters.wide ? "max-w-3xl" : "max-w-xl"}><S /></div>],
} satisfies Meta<typeof FactField>

export default meta
type Story = StoryObj<typeof meta>

/* R12-06: one read state for one value: the value is InlineEdit's read button; FactField adds the source line. */
export const Ordinary: Story = {
  args: ordinary,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    // No Edit link of its own: the value is the way in.
    await expect(c.queryByRole("button", { name: "Edit" })).toBeNull()
    await userEvent.click(c.getByRole("button", { name: /^Maya Elena Reyes\s*, Edit Full legal name/ }))
    const input = c.getByRole("textbox", { name: "Full legal name" })
    await clearText(input)
    await typeKeys(input, "Maya E. Reyes")
    await userEvent.keyboard("{Enter}")
    const value = await c.findByRole("button", { name: /^Maya E\. Reyes\s*, Edit Full legal name/ })
    await waitFor(() => expect(value).toHaveFocus())
    await expect(c.getByText("Edited by you")).toBeInTheDocument()
  },
}
export const OrdinarySourceBadge: Story = {
  name: "Ordinary · source badge",
  args: { label: "Phone", state: { kind: "ordinary", value: "(415) 555-0142", sourceBadge: "From Contacts" } },
}
export const Autofilled: Story = { args: autofilled }
export const NotFoundExpected: Story = { name: "Not found · expected", args: notFound }
export const NotFoundOptional: Story = {
  name: "Not found · not expected",
  args: { label: "Middle name", state: { kind: "notFound", expected: false, reason: "Only if you have one.", addLabel: "Add a middle name" } },
}
export const Conflict: Story = { args: conflict }
/* R12-06: the answer is the read state's empty text, so a click starts an empty editor. */
export const Answered: Story = {
  args: answered,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: /^Never served\s*, Edit Military service/ }))
    await expect(c.getByRole("textbox", { name: "Military service" })).toHaveValue("")
    await userEvent.keyboard("{Escape}")
    await c.findByRole("button", { name: /^Never served/ })
  },
}
/** Ordinary · select control (click the value) */
export const Select: Story = {
  name: "Ordinary · select",
  args: {
    label: "Marital status",
    control: "select",
    options: [["married", "Married"], ["single", "Single"]],
    state: { kind: "ordinary", value: "married", source: "From your will" },
  },
}
/** Ordinary · textarea control (click the value) */
export const Textarea: Story = {
  name: "Ordinary · textarea",
  args: {
    label: "Distinguishing features",
    control: "textarea",
    wide: true,
    state: { kind: "ordinary", value: "Small scar above the left eyebrow.", source: "Added by you" },
  },
}

export const Grid: Story = {
  name: "FactFieldGrid · every state",
  parameters: { wide: true },
  render: () => (
    <FactFieldGrid>
      <FactField {...ordinary} />
      <FactField {...autofilled} />
      <FactField {...notFound} />
      <FactField {...answered} />
      <FactField {...conflict} />
    </FactFieldGrid>
  ),
}
