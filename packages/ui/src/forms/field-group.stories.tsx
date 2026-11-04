import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "../components/inputs/input"
import { Select } from "../components/inputs/select"
import { Textarea } from "../components/inputs/textarea"
import { Field, FieldDescription, FieldError, FieldLabel } from "./field"
import { FieldGroup } from "./field-group"

/* FieldGroup places fields on a 12-column grid from the md breakpoint. */
const meta = {
  component: FieldGroup,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  args: { density: "default" },
  argTypes: {
    density: { control: "inline-radio", options: ["default", "roomy"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "Places the fields of a form on a 12-column grid from the md breakpoint. Below that, every field is the full width.",
          "",
          "A Field's `span` is how many columns it takes. 12, the default, is the whole row. 6 and 6 share a row. 7 and 5 is about 60/40. Columns are step 4 apart and rows are step 6. `density=\"roomy\"` is for a page that is one form: step 6 between columns, step 8 between rows.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof FieldGroup>

export default meta
type Story = StoryObj<typeof meta>

/** One column, at step 6. A caption under one field, an error under the next. */
export const Default: Story = {
  render: ({ density }) => (
    <FieldGroup density={density}>
      <Field>
        <FieldLabel>Full legal name</FieldLabel>
        <Input defaultValue="Maya Elena Reyes" />
        <FieldDescription>As it appears on your passport or driver’s licence.</FieldDescription>
      </Field>
      <Field invalid>
        <FieldLabel>Preferred name</FieldLabel>
        <Input defaultValue="M" />
        <FieldError>Use the name you go by, or leave this blank.</FieldError>
      </Field>
    </FieldGroup>
  ),
}

/** 6 and 6, then a full row, then 7 and 5. An error on one field of a row sits inside that field. */
export const TwoColumns: Story = {
  name: "12 columns",
  tags: ["gaps-29"],
  render: ({ density }) => (
    <FieldGroup density={density}>
      <Field id="g-first" span={6}>
        <FieldLabel>First name</FieldLabel>
        <Input defaultValue="Maya" />
      </Field>
      <Field id="g-last" span={6} invalid>
        <FieldLabel>Last name</FieldLabel>
        <Input defaultValue="" />
        <FieldError>Enter your last name.</FieldError>
      </Field>
      <Field id="g-street">
        <FieldLabel>Street address</FieldLabel>
        <Input placeholder="Street and number" />
        <FieldDescription>The address on your licence.</FieldDescription>
      </Field>
      <Field id="g-state" span={7}>
        <FieldLabel>State</FieldLabel>
        <Select presentation="native" defaultValue="CA" options={[{ value: "CA", label: "California" }, { value: "OR", label: "Oregon" }]} />
      </Field>
      <Field id="g-own" span={5} invalid>
        <FieldLabel>Own or rent</FieldLabel>
        <Select placeholder="Choose one" options={[{ value: "own", label: "Own" }, { value: "rent", label: "Rent" }]} />
        <FieldError>Choose one.</FieldError>
      </Field>
      <Field id="g-notes">
        <FieldLabel>Anything else</FieldLabel>
        <Textarea />
      </Field>
    </FieldGroup>
  ),
}

/** For a page that is one form: step 8 between rows, step 6 between columns, with a caption and an error in the row. */
export const Roomy: Story = {
  args: { density: "roomy" },
  render: ({ density }) => (
    <FieldGroup density={density}>
      <Field span={6}>
        <FieldLabel>First name</FieldLabel>
        <Input defaultValue="Maya" />
        <FieldDescription>As it appears on your passport or driver’s licence.</FieldDescription>
      </Field>
      <Field span={6} invalid>
        <FieldLabel>Last name</FieldLabel>
        <Input defaultValue="" />
        <FieldError>Enter your last name.</FieldError>
      </Field>
      <Field>
        <FieldLabel>Street address</FieldLabel>
        <Input placeholder="Street and number" />
      </Field>
    </FieldGroup>
  ),
}
