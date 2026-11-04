import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, userEvent, within } from "storybook/test"

import { Field } from "../../forms/field"
import { PasswordField } from "../../forms/fields/password-field"
import { Input } from "../../components/inputs/input"
import { RepeatField } from "./repeat-field"

/* Level 0 (COLLECTIONS-PLAN.md §3): rows the person adds to and takes from. The job here is an
   account's credentials: each a label (PIN, recovery code) and a secret. */
const meta = {
  tags: ["level-0", "collections-plan"],
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type Credential = { id: string; label: string; secret: string }
let next = 10

function Credentials({ start, max }: { start: Credential[]; max?: number }) {
  const [items, setItems] = useState(start)
  return (
    <RepeatField
      items={items}
      onChange={setItems}
      create={() => ({ id: String(next++), label: "", secret: "" })}
      keyOf={(c) => c.id}
      rowLabel={(i) => `Credential ${i + 1}`}
      addLabel="Add a credential"
      max={max}
      maxLine={max ? `Up to ${max} credentials.` : undefined}
      row={(c, update) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What it is">
            <Input value={c.label} placeholder="Password, PIN, recovery code" onChange={(e) => update({ ...c, label: e.target.value })} />
          </Field>
          <Field label="Secret">
            <PasswordField value={c.secret} autoComplete="new-password" onValueChange={(v) => update({ ...c, secret: v })} />
          </Field>
        </div>
      )}
    />
  )
}

/** Two credentials; × on each, Add under them. */
export const Some: Story = {
  render: () => (
    <Credentials
      start={[
        { id: "1", label: "Password", secret: "c0rrect-H0rse-9" },
        { id: "2", label: "PIN", secret: "4417" },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Add a credential" }))
    const third = c.getByRole("group", { name: "Credential 3" })
    await expect(within(third).getAllByRole("textbox")[0]).toHaveFocus()
    await userEvent.click(c.getByRole("button", { name: "Remove credential 3" }))
    await expect(c.queryByRole("group", { name: "Credential 3" })).not.toBeInTheDocument()
  },
}

/** None yet: only Add. */
export const None: Story = { render: () => <Credentials start={[]} /> }

/** At the limit: Add goes, the line says why. */
export const Full: Story = {
  render: () => (
    <Credentials
      max={2}
      start={[
        { id: "1", label: "Password", secret: "c0rrect-H0rse-9" },
        { id: "2", label: "PIN", secret: "4417" },
      ]}
    />
  ),
}
