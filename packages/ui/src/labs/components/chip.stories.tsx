import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Avatar } from "../../components/display/avatar"
import { Dot } from "../../components/display/dot"
import { AREA_ORDER } from "../../icons/area-glyphs"
import { area } from "../vault/views/fixtures"
import { Chip, ChipGroup } from "./chip"

/* Level 0 (D-V4, George 2026-11-04): the Chip archetype tried in several jobs before it is
   specialized to the Areas. Each story is one job; if one needs a part the others don't, that
   is the finding. */
const meta = {
  component: Chip,
  tags: ["level-0", "views-plan"],
  args: { value: "x", children: "Chip" },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

/** One at a time: a status filter, as Documents' "Needs you · Ready" would be. */
export const Status: Story = {
  name: "Job · a status filter (single)",
  render: () => {
    const [value, setValue] = useState("all")
    return (
      <ChipGroup type="single" label="Show" value={value} onValueChange={(v) => setValue(v || "all")}>
        <Chip value="all" count={5}>
          All
        </Chip>
        <Chip value="needs" count={3} mark={<Dot tone="attention" />}>
          Needs you
        </Chip>
        <Chip value="ready" count={2} mark={<Dot tone="success" />}>
          Ready
        </Chip>
      </ChipGroup>
    )
  },
}

/** Several at once, no mark: what still needs doing. */
export const Needs: Story = {
  name: "Job · needs (multiple, no mark)",
  render: () => {
    const [value, setValue] = useState<string[]>(["reach"])
    return (
      <ChipGroup type="multiple" label="Needs" value={value} onValueChange={setValue}>
        <Chip value="reach" count={1}>
          No phone or email
        </Chip>
        <Chip value="invite" count={1}>
          Delegate invite waiting
        </Chip>
        <Chip value="unnamed" count={1}>
          Not on anything
        </Chip>
      </ChipGroup>
    )
  },
}

/** Several at once, each with its Area's dot (the dot reads the nearest data-area) and a count. */
export const Areas: Story = {
  name: "Job · Areas (multiple, dot and count)",
  render: () => {
    const [value, setValue] = useState<string[]>(["family"])
    const counts: Record<string, number> = {
      personal: 2,
      family: 3,
      household: 2,
      health: 1,
      estate: 1,
      final: 3,
    }
    return (
      <ChipGroup type="multiple" label="Filter by Area" value={value} onValueChange={setValue}>
        {AREA_ORDER.filter((id) => counts[id]).map((id) => (
          <Chip
            key={id}
            value={id}
            count={counts[id]}
            mark={
              <span data-area={id} className="inline-flex">
                <Dot tone="area" />
              </span>
            }
          >
            {area(id).label}
          </Chip>
        ))}
      </ChipGroup>
    )
  },
}

/** A person as the mark: choosing whose documents to show. */
export const People: Story = {
  name: "Job · people (avatar mark)",
  render: () => {
    const [value, setValue] = useState<string[]>([])
    return (
      <ChipGroup type="multiple" label="Named in it" value={value} onValueChange={setValue}>
        <Chip value="david" mark={<Avatar name="David Reyes" size="sm" />}>
          David
        </Chip>
        <Chip value="elena" mark={<Avatar name="Elena Reyes" size="sm" />}>
          Elena
        </Chip>
      </ChipGroup>
    )
  },
}

/** A chip that can't be chosen right now stays in place, dimmed. */
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([])
    return (
      <ChipGroup type="multiple" label="Show" value={value} onValueChange={setValue}>
        <Chip value="shared" count={1}>
          Shared
        </Chip>
        <Chip value="generated" count={0} disabled>
          Made by Paige
        </Chip>
      </ChipGroup>
    )
  },
}

/** Nine Areas in a 300px column: the group wraps, it never scrolls sideways. */
export const Wraps: Story = {
  name: "Wraps in a narrow column",
  render: () => {
    const [value, setValue] = useState<string[]>([])
    return (
      <div className="w-workspace-list-md">
        <ChipGroup type="multiple" label="Filter by Area" value={value} onValueChange={setValue}>
          {AREA_ORDER.map((id, i) => (
            <Chip
              key={id}
              value={id}
              count={i + 1}
              mark={
                <span data-area={id} className="inline-flex">
                  <Dot tone="area" />
                </span>
              }
            >
              {area(id).label}
            </Chip>
          ))}
        </ChipGroup>
      </div>
    )
  },
}
