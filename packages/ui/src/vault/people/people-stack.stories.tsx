import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { PeopleStack, type KinshipChoice, type PersonDraft, type QuickAddOption, type StackContext, type StackPerson } from "./people-stack"
import { typeKeys } from "../../stories/typing"

/* PeopleStack (ADR 0076 amendment, "How a stack behaves"): the whole behaviour on invented
   people. Writes are simulated with a short delay; nothing here reaches an API. The display rule
   holds (R3-19): the stated role, never an inferred kinship term. */
const BOOK: StackPerson[] = [
  { id: "david", name: "David Reyes", kinship: "spouse_partner", detail: "Spouse" },
  { id: "elena", name: "Elena Reyes", kinship: "child", detail: "Child" },
  { id: "marta", name: "Marta Ortiz", kinship: "parent", detail: "Parent" },
  { id: "sam", name: "Sam Lee", kinship: "friend", detail: "Friend" },
]
const BIG_BOOK: StackPerson[] = [
  ...BOOK,
  { id: "luis", name: "Luis Ortiz", kinship: "parent", detail: "Parent" },
  { id: "ana", name: "Ana Ortiz", kinship: "friend", detail: "Friend", src: "assets/avatar-female-glasses.png" },
  { id: "tomas", name: "Tomás Reyes", kinship: "child", detail: "Child" },
]
const KINSHIPS: KinshipChoice[] = [
  { value: "spouse_partner", label: "Spouse or partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "friend", label: "Friend" },
  { value: "pet", label: "Pet" },
]
const QUICK: QuickAddOption[] = KINSHIPS.filter((k) => k.value !== "friend").map((k) => ({ kinship: k.value, label: k.label }))
const DETAIL = Object.fromEntries(KINSHIPS.map((k) => [k.value, k.label]))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** A page holding a stack: the book, who is on it, simulated saves. */
function Page({
  initial = [],
  book = BOOK,
  context = { multi: true },
  listLabel = "the people who depend on you",
  failAdd = false,
  quickAtRest,
  onCommitRemoval = () => {},
}: {
  initial?: string[]
  book?: StackPerson[]
  context?: StackContext
  listLabel?: string
  failAdd?: boolean
  quickAtRest?: boolean
  onCommitRemoval?: (id: string, kind: string) => void
}) {
  const [all, setAll] = useState(book)
  const [on, setOn] = useState(initial)
  const people = on.map((id) => all.find((p) => p.id === id)!)
  return (
    <PeopleStack
      people={people}
      book={all}
      quick={QUICK}
      kinships={KINSHIPS}
      context={context}
      listLabel={listLabel}
      quickAtRest={quickAtRest}
      onPick={async (id) => {
        await wait(300)
        setOn((x) => [...x, id])
      }}
      onAdd={async (draft: PersonDraft) => {
        await wait(300)
        if (failAdd) return { error: "That didn't go through. Try again in a moment." }
        const id = `new-${all.length}`
        setAll((x) => [...x, { id, name: draft.name, kinship: draft.kinship, detail: DETAIL[draft.kinship] }])
        setOn((x) => [...x, id])
        return { id }
      }}
      onCommitRemoval={onCommitRemoval}
      renderOpen={(p) => <p className="text-sm font-medium text-muted-foreground">{p.name}’s details go here (the entry’s expand).</p>}
    />
  )
}

const meta = {
  component: PeopleStack,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["adr-0076"],
  parameters: { docs: { description: { component: "The people a Vault item holds, and how they come and go: ADR 0076 amendment (2026-10-28), rules 1–7." } } },
} satisfies Meta

export default meta
type Story = StoryObj

/** Two on the stack, two more in the book: try every rule. */
export const Playground: Story = { render: () => <Page initial={["david", "elena"]} /> }

/** Nobody on it yet: the Add is the whole stack, quiet at rest. */
export const Empty: Story = { render: () => <Page /> }

/** The variant George turned down (2026-10-28): quick-add pills at rest as shortcuts. Kept to compare; stacks default to quick add inside the opened region. */
export const QuickAtRest: Story = { name: "Rest · quick add as shortcuts", render: () => <Page initial={["david"]} quickAtRest /> }

/** An emergency contact holds one: once named, no Add. */
export const CappedRole: Story = { name: "Capped · emergency contact", render: () => <Page initial={["marta"]} context={{ role: "emergency", multi: true }} listLabel="your emergency contact" /> }

/** One open thing: opening an entry closes the Add, and opening the Add closes the entry. */
export const OneOpenThing: Story = {
  name: "One open thing",
  render: () => <Page initial={["david", "elena"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const open = () => canvasElement.querySelectorAll("[data-state=open], [data-slot=stack-add][data-state=choose], [data-slot=stack-add][data-state=form]")
    await userEvent.click(canvas.getByRole("button", { name: /^David Reyes/ }))
    await expect(open()).toHaveLength(1)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await expect(open()).toHaveLength(1)
    await expect(canvas.getByRole("region", { name: "Add someone" })).toBeInTheDocument()
    await expect(canvas.getByRole("button", { name: /^David Reyes/ })).toHaveAttribute("aria-expanded", "false")
    await expect(canvasElement.querySelectorAll(".bg-accent")).toHaveLength(1)
  },
}

/** Add starts with the book: pick first; a pick puts them on, marks them New and focuses them. */
export const PickFromBook: Story = {
  name: "Add starts with the book",
  render: () => <Page initial={["david"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    const offered = BOOK.filter((p) => p.id !== "david")
    const picker = canvas.getByRole("group", { name: "Someone you’ve named" })
    await expect(within(picker).getAllByRole("button")).toHaveLength(offered.length)
    await userEvent.click(within(picker).getByRole("button", { name: /^Sam Lee/ }))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot=stack-entry][data-state=new]")).toHaveTextContent("Sam Lee"))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot=stack-entry][data-state=new]")).toHaveFocus())
    await expect(canvas.getByRole("button", { name: "Add someone" })).toBeInTheDocument()
  },
}

/** From six in the book, pick is a search field. */
export const SearchTheBook: Story = { name: "Search · six or more", render: () => <Page book={BIG_BOOK} /> }

/** Nobody left to pick: Add opens straight to the form. */
export const StraightToForm: Story = {
  name: "Nobody to pick · the form",
  render: () => <Page book={BOOK.slice(0, 1)} initial={["david"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await expect(canvas.getByRole("region", { name: "Someone new" })).toBeInTheDocument()
    await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveFocus()
  },
}

/** Caps: with a spouse on the stack, the opened Add has no Spouse or partner quick add. */
export const Caps: Story = {
  name: "Caps · spouse used",
  render: () => <Page initial={["david"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    const quick = canvas.getByRole("group", { name: "Quick add" })
    await expect(within(quick).queryByRole("button", { name: "Spouse or partner" })).toBeNull()
    await expect(within(quick).getAllByRole("button")).toHaveLength(QUICK.length - 1)
  },
}

/** A quick add opens the form with that kinship; typing then opening an entry asks to discard. */
export const DiscardAsks: Story = {
  name: "Unsaved · discard asks",
  render: () => <Page initial={["david"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await userEvent.click(within(canvas.getByRole("group", { name: "Quick add" })).getByRole("button", { name: "Child" }))
    await typeKeys(canvas.getByRole("textbox", { name: "Name" }), "Tomás Reyes")
    await userEvent.click(canvas.getByRole("button", { name: /^David Reyes/ }))
    await userEvent.click(await body.findByRole("button", { name: "Keep editing" }))
    // While a dialog closes, Radix hides the rest of the page from the accessibility tree: wait for it.
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("Tomás Reyes"))
    await userEvent.click(canvas.getByRole("button", { name: /^David Reyes/ }))
    await userEvent.click(await body.findByRole("button", { name: "Discard" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: /^David Reyes/ })).toHaveAttribute("aria-expanded", "true"))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot=person-add-form]")).toBeNull())
  },
}

/** Someone new asks who they are to you before it saves. */
export const SomeoneNewAsks: Story = {
  name: "Someone new · asks who",
  render: () => <Page initial={["david"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await userEvent.click(canvas.getByRole("button", { name: "Someone new" }))
    await typeKeys(canvas.getByRole("textbox", { name: "Name" }), "Sam Park")
    await userEvent.click(canvas.getByRole("button", { name: "Add" }))
    await expect(canvas.getAllByText("Choose who they are to you.").length).toBeGreaterThan(0)
  },
}

/** A quick add saves: the form closes, the new entry is marked New and takes focus. */
export const QuickAddSaves: Story = {
  name: "Quick add · saves",
  render: () => <Page initial={["david"]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await userEvent.click(within(canvas.getByRole("group", { name: "Quick add" })).getByRole("button", { name: "Pet" }))
    await typeKeys(canvas.getByRole("textbox", { name: "Name" }), "Pepper")
    await userEvent.click(canvas.getByRole("button", { name: "Add" }))
    await expect(await canvas.findByRole("button", { name: /Adding…/ })).toBeDisabled()
    await waitFor(() => expect(canvasElement.querySelector("[data-slot=stack-entry][data-state=new]")).toHaveTextContent("Pepper"))
    await waitFor(() => expect(canvasElement.querySelector("[data-slot=stack-entry][data-state=new]")).toHaveFocus())
    await expect(canvas.queryByRole("textbox", { name: "Name" })).toBeNull()
  },
}

/** A failed add keeps the form and the input. */
export const AddFails: Story = {
  name: "Someone new · fails",
  render: () => <Page initial={["david"]} failAdd />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Add someone" }))
    await userEvent.click(within(canvas.getByRole("group", { name: "Quick add" })).getByRole("button", { name: "Pet" }))
    await typeKeys(canvas.getByRole("textbox", { name: "Name" }), "Pepper")
    await userEvent.click(canvas.getByRole("button", { name: "Add" }))
    await expect(await canvas.findByText("That didn't go through. Try again in a moment.")).toBeInTheDocument()
    await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("Pepper")
  },
}

const commits = fn()

/** × asks; Take off strikes the entry with Undo; Undo puts it back; nothing is written until the page is left. */
export const RemoveThenUndo: Story = {
  name: "× asks · struck · undo",
  render: () => <Page initial={["david", "elena"]} onCommitRemoval={commits} />,
  play: async ({ canvasElement }) => {
    commits.mockClear()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Remove Elena Reyes" }))
    await userEvent.click(await body.findByRole("button", { name: /^Take Elena Reyes off/ }))
    await waitFor(() => expect(canvasElement.querySelector("[data-state=struck]")).toHaveTextContent("Elena Reyes"))
    await expect(commits).not.toHaveBeenCalled()
    await userEvent.click(await canvas.findByRole("button", { name: "Undo, keep Elena Reyes" }))
    await expect(canvasElement.querySelector("[data-state=struck]")).toBeNull()
  },
}
