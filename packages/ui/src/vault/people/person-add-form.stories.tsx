import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { PersonAddForm, type KinshipChoice } from "./person-add-form"
import { contactFieldsFor } from "../stack-rules"
import { typeKeys } from "../../stories/typing"

/* PersonAddForm (ADR 0076 amendment rules 5 and 7): fields by kinship and role, four save states. */
const KINSHIPS: KinshipChoice[] = [
  { value: "spouse_partner", label: "Spouse or partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "friend", label: "Friend" },
  { value: "pet", label: "Pet" },
]

const meta = {
  component: PersonAddForm,
  args: { kinships: KINSHIPS, onSave: fn(), onCancel: fn() },
  decorators: [(S) => <div className="max-w-xl rounded-lg border bg-card p-4"><S /></div>],
  tags: ["adr-0076"],
} satisfies Meta<typeof PersonAddForm>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing set: they choose who the person is to them. */
export const Default: Story = {}

/** A quick add set the kinship: a child asks a date of birth. */
export const Child: Story = { name: "Quick add · child", args: { kinship: "child" } }

/** A pet asks a name and a note, never a date of birth or a phone. */
export const Pet: Story = { name: "Quick add · pet", args: { kinship: "pet" } }

/** For a guardian the add asks no date of birth (a rule keyed by role). */
export const Guardian: Story = { name: "Role · guardian", args: { kinship: "parent", role: "guardian" } }

/** The fields follow the kinship: choosing Pet swaps the date of birth and phone for a note. */
export const FieldsFollowKinship: Story = {
  name: "Fields follow the kinship",
  args: { kinship: "child" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Date of birth")).toBeInTheDocument()
    await expect(canvas.queryByText("Note")).toBeNull()
    await expect(contactFieldsFor("pet", "create")).toContain("note")
  },
}

/** Saving: the submit is off and says "Adding…", so a second press can't send it twice. */
export const Saving: Story = {
  args: { kinship: "friend", onSave: fn(() => new Promise<undefined>(() => {})) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await typeKeys(canvas.getByRole("textbox", { name: "Name" }), "Sam Lee")
    await userEvent.click(canvas.getByRole("button", { name: "Add" }))
    const pending = await canvas.findByRole("button", { name: /Adding…/ })
    await expect(pending).toBeDisabled()
    await expect(args.onSave).toHaveBeenCalledOnce()
  },
}

/** Failed: the message shows, the input is kept, the submit is ready again. */
export const Failed: Story = {
  name: "Failed · input kept",
  args: { kinship: "friend", onSave: fn(async () => ({ error: "That didn't go through. Try again in a moment." })) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByRole("textbox", { name: "Name" })
    await typeKeys(name, "Sam Lee")
    await userEvent.click(canvas.getByRole("button", { name: "Add" }))
    await expect(await canvas.findByText("That didn't go through. Try again in a moment.")).toBeInTheDocument()
    await expect(name).toHaveValue("Sam Lee")
    await expect(canvas.getByRole("button", { name: "Add" })).toBeEnabled()
  },
}

/** Enter saves with only the fields asked for; an empty name is refused first. */
export const Saves: Story = {
  name: "Enter saves",
  args: { kinship: "pet" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByRole("textbox", { name: "Name" })
    await userEvent.click(canvas.getByRole("button", { name: "Add" }))
    await expect(args.onSave).not.toHaveBeenCalled()
    await typeKeys(name, "Pepper")
    await userEvent.type(name, "{Enter}")
    await waitFor(() => expect(args.onSave).toHaveBeenCalledWith({ name: "Pepper", kinship: "pet" }))
  },
}

/** Escape cancels. */
export const EscapeCancels: Story = {
  name: "Escape cancels",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("textbox", { name: "Name" }))
    await userEvent.keyboard("{Escape}")
    await expect(args.onCancel).toHaveBeenCalledOnce()
  },
}
