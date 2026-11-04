import type { ComponentProps } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { AREA_ORDER, type AreaId } from "../../icons/area-glyphs"
import { StubLink } from "../../stories/fixtures"
import { AreaTile } from "./area-tile"

type TileProps = ComponentProps<typeof AreaTile>

/* Fixture copy loosely after Maya Reyes's Home (apps/web/fixtures). */
const AREAS: Record<AreaId, { name: string; line: string; firstStep: string }> = {
  personal: { name: "Personal", line: "Who you are, on paper.", firstStep: "Add your ID" },
  family: { name: "Family", line: "The people who depend on you.", firstStep: "Add your partner" },
  household: { name: "Household", line: "Home, bills and the things that keep it running.", firstStep: "Add your home" },
  money: { name: "Money", line: "Accounts, debts and where they are.", firstStep: "Add a bank account" },
  assets: { name: "Assets", line: "Property and valuables.", firstStep: "Add a property" },
  health: { name: "Health", line: "Doctors, conditions and wishes.", firstStep: "Add your doctor" },
  insurance: { name: "Insurance", line: "Policies and who they protect.", firstStep: "Add a policy" },
  estate: { name: "Estate", line: "Your will and who carries it out.", firstStep: "Start your will" },
  final: { name: "Final wishes", line: "How you want to be remembered.", firstStep: "Add a wish" },
}

const tile = (area: AreaId, state: TileProps["state"]): TileProps => ({
  area,
  ...AREAS[area],
  state,
  ratio: state === "set-up" ? 1 : state === "in-progress" ? 0.4 : 0,
  meta:
    state === "set-up"
      ? { strong: "Set up", rest: "6 saved" }
      : state === "in-progress"
        ? { strong: "4 saved", rest: "next: a guardian for Elena" }
        : undefined,
  href: `#area-${area}`,
  linkAs: StubLink,
})

const meta = {
  component: AreaTile,
  args: tile("family", "in-progress"),
  argTypes: {
    area: { control: "select", options: AREA_ORDER },
    state: { control: "select", options: ["not-started", "in-progress", "set-up"] },
    ratio: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof AreaTile>

export default meta
type Story = StoryObj<typeof meta>

const narrow: Story["decorators"] = [(S) => <div className="max-w-sm"><S /></div>]

export const NotStarted: Story = { decorators: narrow, name: "Not started", args: tile("family", "not-started") }
export const InProgress: Story = { decorators: narrow, name: "In progress", args: tile("family", "in-progress") }
export const SetUp: Story = { decorators: narrow, name: "Set up", args: tile("family", "set-up") }
export const Hover: Story = { decorators: narrow, args: tile("family", "in-progress"), parameters: { pseudo: { hover: true } } }
const grid = (state: TileProps["state"]): Story => ({
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {AREA_ORDER.map((a) => <AreaTile key={a} {...tile(a, state)} />)}
    </div>
  ),
})

export const AllAreasNotStarted: Story = { name: "Every area · not started", ...grid("not-started") }
export const AllAreasInProgress: Story = { name: "Every area · in progress", ...grid("in-progress") }
export const AllAreasSetUp: Story = { name: "Every area · set up", ...grid("set-up") }
