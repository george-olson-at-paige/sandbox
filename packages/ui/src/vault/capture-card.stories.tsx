import type { Meta, StoryObj } from "@storybook/react-vite"
import { PlusIcon } from "lucide-react"
import { expect, fn, userEvent, within } from "storybook/test"

import { Button } from "../components/actions/button"
import { Field, FieldLabel } from "../forms/field"
import { FieldGroup } from "../forms/field-group"
import { Input } from "../components/inputs/input"
import { PhoneField } from "../forms/fields/phone-field"
import { Placeholder } from "../stories/placeholder"
import { CaptureCard } from "./capture-card"
import { PersonPicker } from "./people/person-picker"
import { UploadRow } from "./documents/upload-row"

/* CaptureCard (R2-49, R6-05): the card an Area page opens to add something, hosting one capture
   unit. Copy is the prototype's (capture/*.tsx); people follow the display rule. */
const meta = {
  component: CaptureCard,
  args: {
    title: "Name a guardian for Elena",
    description: "Who would raise Elena if neither parent could. They don’t need to know yet.",
    onClose: fn(),
  },
  decorators: [(S) => <div data-area="family" className="max-w-2xl"><S /></div>],
  tags: ["r2-49", "r6-05"],
  parameters: {
    docs: {
      description: {
        component:
          "The card an Area page opens when the owner adds something: at the top of the main column (`placement=\"top\"`) or in place under the row that asked (`\"inline\"`). A shell: a slab title, a description, Close, the capture unit as children (a form, an UploadRow, a PersonPicker) and an actions row. It never closes itself; `onClose` is the caller's. The unit's first control takes focus.",
      },
    },
  },
} satisfies Meta<typeof CaptureCard>

export default meta
type Story = StoryObj<typeof meta>

export const Anatomy: Story = {
  name: "Anatomy: the unit and actions are slots",
  args: {
    children: <Placeholder label="Capture unit (form, UploadRow, PersonPicker)" size="md" />,
    actions: <Placeholder label="Actions" size="xs" />,
  },
}

export const WithPersonPicker: Story = {
  name: "Top · a person",
  args: {
    children: (
      <PersonPicker
        people={[
          { id: "david", name: "David Reyes", detail: "Spouse" },
          { id: "ana", name: "Ana Ortiz", detail: "Friend" },
        ]}
        onPick={fn()}
        onAddNew={fn()}
      />
    ),
  },
}

export const WithUploadRow: Story = {
  name: "Top · a document",
  args: {
    title: "Upload your will",
    description: "A photo or a PDF. We’ll keep it safe, filed under Estate & Will.",
    children: <UploadRow promise="We’ll keep it safe, filed in this area" upload={{ label: "Upload a document", onFile: fn() }} />,
    actions: (
      <>
        <Button variant="quiet" size="inline" icon={<PlusIcon />}>Type it instead</Button>
        <Button variant="quiet" size="inline" underline>I don’t have one</Button>
      </>
    ),
  },
}

export const WithForm: Story = {
  name: "Top · a small form",
  args: {
    title: "Add someone new",
    description: "Name, who they are to you, a way to reach them. Only the name is needed now.",
    children: (
      <div className="rounded-lg border bg-card p-4">
        <FieldGroup>
          <Field id="cc-name" span={6}>
            <FieldLabel>Name</FieldLabel>
            <Input placeholder="Their name" />
          </Field>
          <Field id="cc-phone" span={6}>
            <FieldLabel>Mobile</FieldLabel>
            <PhoneField placeholder="Now or later" />
          </Field>
        </FieldGroup>
      </div>
    ),
    actions: (
      <>
        <Button size="sm">Add person</Button>
        <Button variant="secondary" size="sm">Never mind</Button>
      </>
    ),
  },
}

export const Inline: Story = {
  name: "Inline · opened under a row",
  args: {
    placement: "inline",
    title: "Who looks after Pepper",
    description: undefined,
    children: <PersonPicker people={[{ id: "david", name: "David Reyes", detail: "Spouse" }]} onPick={fn()} onAddNew={fn()} />,
  },
}

export const NoClose: Story = { name: "Without Close", args: { onClose: undefined, children: <Placeholder label="Capture unit" size="sm" /> } }
export const Narrow: Story = {
  name: "Narrow (375)",
  args: { children: <PersonPicker people={[{ id: "david", name: "David Reyes", detail: "Spouse" }, { id: "ana", name: "Ana Ortiz", detail: "Friend" }]} onPick={fn()} onAddNew={fn()} /> },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
}

/** Named by its title; Close calls onClose. */
export const Closes: Story = {
  name: "Named · Close calls onClose",
  args: { children: <Placeholder label="Capture unit" size="sm" /> },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("region", { name: "Name a guardian for Elena" })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Close" }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
