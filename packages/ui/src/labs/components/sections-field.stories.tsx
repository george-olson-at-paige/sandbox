import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, userEvent, within } from "storybook/test"

import { SectionsField, type Section } from "./sections-field"

/* Level 0 (COLLECTIONS-PLAN.md §3): a memory's story in parts, with the category's prompts as
   suggestions. Inside a form: none of its buttons submits it. */
const meta = {
  tags: ["level-0", "collections-plan"],
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const COPY = {
  row: (i: number) => `Part ${i + 1}`,
  title: "Title",
  text: "What you remember",
  add: "Add a part",
  suggestions: "Start a part with",
  up: (row: string) => `Move ${row.toLowerCase()} up`,
  down: (row: string) => `Move ${row.toLowerCase()} down`,
  remove: (row: string) => `Remove ${row.toLowerCase()}`,
}
let next = 10

function Demo({ start }: { start: Section[] }) {
  const [sections, setSections] = useState(start)
  const [submitted, setSubmitted] = useState(0)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted((n) => n + 1)
      }}
    >
      <SectionsField
        sections={sections}
        onChange={setSections}
        suggestions={["Who was there", "What we did", "What I want you to remember"]}
        newId={() => String(next++)}
        copy={COPY}
      />
      <output data-testid="submits" className="sr-only">
        {submitted}
      </output>
    </form>
  )
}

/** Two parts; a suggestion left; reorder and remove. */
export const Some: Story = {
  render: () => (
    <Demo
      start={[
        { id: "1", title: "Who was there", text: "Your dad, you and Tomás, and me." },
        { id: "2", title: "What we did", text: "We patched the canoe with duct tape." },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "What I want you to remember" }))
    await expect(within(c.getByRole("group", { name: "Part 3" })).getByRole("textbox", { name: "What you remember" })).toHaveFocus()
    await userEvent.click(c.getByRole("button", { name: "Move part 3 up" }))
    await expect(c.getByRole("button", { name: "Move part 2 up" })).toHaveFocus()
    await expect(c.getByTestId("submits")).toHaveTextContent("0")
  },
}

/** Nothing yet: every suggestion, and Add. */
export const Empty: Story = { render: () => <Demo start={[]} /> }
