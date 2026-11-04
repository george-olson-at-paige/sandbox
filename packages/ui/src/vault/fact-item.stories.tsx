import type { ComponentProps } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { AREA_ORDER } from "../icons/area-glyphs"
import { StubLink } from "../stories/fixtures"
import { Badge } from "../components/display/badge"
import { Button } from "../components/actions/button"
import { ItemGroup } from "../components/display/item"
import { Placeholder } from "../stories/placeholder"
import { FactItem } from "./fact-item"

/* Storybook can't type args over a union of props (it collapses to never): the args are the link
   variant, which every args story uses; the expand stories render. */
type Args = Extract<ComponentProps<typeof FactItem>, { expand?: undefined }>

const person: Args = {
  kind: "person",
  name: "Daniel Reyes",
  detail: "Spouse",
  tags: <Badge tone="neutral" appearance="outline">Executor</Badge>,
  href: "#daniel",
  linkAs: StubLink,
}
const pet: Args = { kind: "pet", name: "Biscuit", detail: "Dog · lives with you", href: "#biscuit", linkAs: StubLink }
const entity: Args = { kind: "entity", area: "household", name: "12 Alder Street", detail: "Home · owned with Daniel", href: "#home", linkAs: StubLink }
const document: Args = {
  kind: "document",
  name: "Last will and testament",
  detail: "Signed 2024 · 6 pages",
  tags: <><Badge tone="info">Will</Badge><Badge tone="success">Read</Badge></>,
  href: "#will",
  linkAs: StubLink,
}

const meta = {
  tags: ["gaps-41", "r2-27"],
  component: FactItem,
  args: person,
  argTypes: {
    kind: { control: "select", options: ["person", "pet", "entity", "document"] },
    density: { control: "select", options: ["row", "compact"] },
    area: { control: "select", options: AREA_ORDER },
  },
  decorators: [(S) => <div className="max-w-xl" data-area="family"><S /></div>],
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

export const Person: Story = { args: person }
export const Pet: Story = { args: pet }
export const Entity: Story = { args: entity }
export const Document: Story = { args: document }
export const WithActions: Story = {
  name: "Person · actions + inline children",
  args: {
    kind: "person",
    name: "Ana Torres",
    detail: "Sibling",
    href: undefined,
    tags: undefined,
    actions: <Button size="sm" variant="secondary">Invite</Button>,
    children: <><Button variant="link" size="inline">Confirm</Button><Button variant="quiet" size="inline">Not this person</Button></>,
  },
}
export const Compact: Story = { args: { ...person, tags: undefined, density: "compact" } }
export const TwoLineDetail: Story = {
  name: "Rail person: secondary note",
  args: {
    kind: "person",
    name: "Dr. Priya Shah",
    detail: "Family doctor",
    secondary: { kind: "note", text: "No number yet" },
    density: "compact",
    tags: undefined,
    href: undefined,
  },
}
export const SecondaryLink: Story = {
  name: "Rail person: secondary tap-to-call link",
  args: {
    kind: "person",
    name: "David Reyes",
    detail: "The people who depend on you · Emergency contact",
    secondary: { kind: "link", label: "(206) 555-0192", href: "tel:+12065550192" },
    density: "compact",
    tags: undefined,
    href: undefined,
  },
}
export const LongName: Story = {
  name: "Long content (wraps)",
  args: {
    kind: "document",
    name: "Homeowners insurance policy, Pacific Mutual Assurance Company of Northern California",
    detail: "Policy 0042-7781-AB · renewed every March · paper copy in the hallway fire safe",
    tags: <Badge tone="info">Policy</Badge>,
    href: "#policy",
  },
}

export const AllKinds: Story = {
  name: "Every kind in a list",
  render: () => (
    <div>
      <FactItem {...person} />
      <FactItem {...pet} />
      <FactItem {...entity} />
      <FactItem {...document} />
    </div>
  ),
}

export const EntityEveryArea: Story = {
  name: "Entity · every Life Area",
  render: () => (
    <div>
      {AREA_ORDER.map((a) => (
        <FactItem key={a} kind="entity" area={a} name={a[0].toUpperCase() + a.slice(1)} detail="Entity in this area" density="compact" />
      ))}
    </div>
  ),
}

/* On a list (S-09): the states and the expand. Static: what each state looks like. The list
   that moves between them (one open thing, Undo) is FactList's (Labs › Vault › FactList). */

const elena = { kind: "person", name: "Elena Reyes", detail: "Child" } as const
const details = <Placeholder size="md" label="The open fact's details" />
const toggled = fn()
const opens = { onToggle: toggled, body: details }
const undone = fn()
const struckNote = "Elena Reyes will come off the people who depend on you when you leave this page."

/** A fact that opens, at rest: the row is one toggle (closed) that asks the list to open it; the list decides. */
export const Expandable: Story = {
  name: "Expandable · asks to open",
  render: () => <FactItem {...elena} expand={opens} />,
  play: async ({ canvasElement }) => {
    toggled.mockClear()
    const toggle = within(canvasElement).getByRole("button", { name: /^Elena Reyes/ })
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(toggle)
    await expect(toggled).toHaveBeenCalledTimes(1)
  },
}

/** The list's one open thing: the only blue, its details below. */
export const Open: Story = { name: "Open · details", render: () => <FactItem {...elena} expand={opens} state={{ kind: "open" }} /> }

/** Just added: marked New, not active. */
export const New: Story = { render: () => <FactItem {...elena} expand={opens} state={{ kind: "new" }} /> }

/** Taken off: struck through with Undo until the person leaves the page; no toggle, no actions; Undo puts it back. */
export const Struck: Story = {
  name: "Struck · undo",
  render: () => <FactItem {...elena} expand={opens} actions={<Button size="sm" variant="secondary">Invite</Button>} state={{ kind: "struck", onUndo: undone, note: struckNote }} />,
  play: async ({ canvasElement }) => {
    undone.mockClear()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole("button", { expanded: false })).toBeNull()
    await expect(canvas.queryByRole("button", { name: "Invite" })).toBeNull()
    await expect(canvas.getByRole("status")).toHaveTextContent(struckNote)
    await userEvent.click(canvas.getByRole("button", { name: "Undo, keep Elena Reyes" }))
    await expect(undone).toHaveBeenCalledTimes(1)
  },
}

/** Every state on one list: only the open one is blue. */
export const States: Story = {
  name: "States on a list",
  render: () => (
    <ItemGroup label="The people who depend on you">
      <FactItem kind="person" name="David Reyes" detail="Spouse" expand={opens} />
      <FactItem {...elena} expand={opens} state={{ kind: "open" }} />
      <FactItem kind="person" name="Tomás Reyes" detail="Child" expand={opens} state={{ kind: "new" }} />
      <FactItem kind="pet" name="Biscuit" detail="Dog" expand={opens} state={{ kind: "struck", onUndo: fn(), note: "Biscuit will come off the people who depend on you when you leave this page." }} />
    </ItemGroup>
  ),
}
