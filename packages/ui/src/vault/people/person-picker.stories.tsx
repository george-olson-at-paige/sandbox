import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { PersonPicker, type PersonPickerPerson } from "./person-picker"
import { typeKeys } from "../../stories/typing"

/* PersonPicker (R2-49, R6-05): the person step of a capture. Fixture people follow the display
   rule: the role the owner stated, never an inferred kinship term. */
const PEOPLE: PersonPickerPerson[] = [
  { id: "david", name: "David Reyes", detail: "Spouse" },
  { id: "elena", name: "Elena Reyes", detail: "Child" },
  { id: "tomas", name: "Tomás Reyes", detail: "Child" },
  { id: "ana", name: "Ana Ortiz", detail: "Friend", src: "assets/avatar-female-glasses.png" },
]

const meta = {
  component: PersonPicker,
  args: { people: PEOPLE, onPick: fn(), onAddNew: fn() },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["r2-49", "r6-05"],
  parameters: {
    docs: {
      description: {
        component:
          "Someone already named, as pills: one tap picks them (`onPick(id)`; the caller saves). \"Add someone new\" opens the caller's new contact form. A pick is an action, not a selection, so the pills are buttons, not a toggle group. Pass only the candidates (who may hold the role). While a pick saves, `pendingId` shows a spinner on that pill and disables every pill, so a double pick can't happen.",
      },
    },
  },
} satisfies Meta<typeof PersonPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithPet: Story = {
  name: "With a pet (paw)",
  args: { people: [...PEOPLE.slice(0, 2), { id: "pepper", name: "Pepper", detail: "Pet", variant: "pet" }] },
}
export const Pending: Story = { name: "Pending (a pick is saving)", args: { pendingId: "elena" } }
export const Disabled: Story = { args: { disabled: true } }
export const NoCandidates: Story = { name: "No candidates: only Add someone new", args: { people: [] } }
export const NoAdd: Story = { name: "Without Add someone new", args: { onAddNew: undefined } }
export const CustomLabel: Story = { name: "Label for a role", args: { label: "Who it pays out to", addLabel: "Someone new" } }
export const Narrow: Story = { name: "Narrow (pills wrap)", decorators: [(S) => <div className="max-w-xs"><S /></div>] }

/* A pick: pending on that pill, then the caller confirms. Here the save takes a second. */
function Picking() {
  const [pending, setPending] = useState<string | undefined>()
  const [picked, setPicked] = useState<string[]>([])
  const left = PEOPLE.filter((p) => !picked.includes(p.id))
  return (
    <div className="flex flex-col gap-3">
      {picked.length > 0 && (
        <p className="text-sm font-semibold text-success-foreground" role="status">
          {picked.map((id) => PEOPLE.find((p) => p.id === id)!.name).join(" and ")} {picked.length === 1 ? "is" : "are"} in Family now.
        </p>
      )}
      <PersonPicker
        people={left}
        pendingId={pending}
        onPick={(id) => {
          setPending(id)
          setTimeout(() => {
            setPicked((x) => [...x, id])
            setPending(undefined)
          }, 1000)
        }}
        onAddNew={() => {}}
      />
    </div>
  )
}

export const Interactive: Story = {
  name: "Interactive: pick, pending, picked",
  render: () => <Picking />,
}

/** A pick calls onPick once. */
export const Picks: Story = {
  name: "A pick calls onPick once",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("group", { name: "Someone you’ve named" })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: /^Elena Reyes\s*,\s*Child$/ }))
    await expect(args.onPick).toHaveBeenCalledOnce()
    await expect(args.onPick).toHaveBeenCalledWith("elena")
    await userEvent.click(canvas.getByRole("button", { name: "Add someone new" }))
    await expect(args.onAddNew).toHaveBeenCalledOnce()
  },
}

/* Six or more candidates: search instead of pills (ADR 0076 amendment rule 3). */
const BOOK: PersonPickerPerson[] = [
  ...PEOPLE,
  { id: "marta", name: "Marta Ortiz", detail: "Parent" },
  { id: "luis", name: "Luis Ortiz", detail: "Parent" },
  { id: "sam", name: "Sam Lee", detail: "Friend" },
  { id: "pepper", name: "Pepper", detail: "Pet", variant: "pet" },
]

/** From six candidates the picker is a search field; nothing lists until something is typed. */
export const Search: Story = { name: "Search · six or more", args: { people: BOOK, onAddNew: undefined } }

/** Typing filters by name or stated role; Down moves, Enter picks the active match. */
export const SearchPicks: Story = {
  name: "Search · keys pick",
  args: { people: BOOK, onAddNew: undefined },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole("combobox", { name: "Someone you’ve named" })
    await expect(canvas.queryAllByRole("option")).toHaveLength(0)
    await typeKeys(field, "ortiz")
    const expected = BOOK.filter((p) => p.name.toLowerCase().includes("ortiz"))
    await expect(canvas.getAllByRole("option")).toHaveLength(expected.length)
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(args.onPick).toHaveBeenCalledOnce()
    await expect(args.onPick).toHaveBeenCalledWith(expected[1]!.id)
  },
}

/** No match says so; Escape clears the text. */
export const SearchNoMatch: Story = {
  name: "Search · no match",
  args: { people: BOOK, onAddNew: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole("combobox", { name: "Someone you’ve named" })
    await typeKeys(field, "zz")
    await expect(canvas.getByRole("status")).toHaveTextContent("Nobody you’ve named matches “zz”.")
    await userEvent.keyboard("{Escape}")
    await expect(field).toHaveValue("")
  },
}
