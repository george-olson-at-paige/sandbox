import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { BriefcaseBusinessIcon, HeartHandshakeIcon, HouseIcon } from "lucide-react"

import { AreaIcon } from "./areas/area-icon"
import { Badge } from "../components/display/badge"
import { ChoiceCard, ChoiceCardGroup, ChoiceCardOption } from "./choice-card"

const meta = {
  component: ChoiceCard,
  args: {
    title: "I care for someone",
    description: "A child, a parent, or anyone who relies on you.",
    selected: false,
    onSelectedChange: () => {},
    layout: "tile",
  },
  argTypes: { layout: { control: "select", options: ["row", "tile"] } },
  /* parameters.wide: grids and groups get room; single cards stay at their natural width */
  decorators: [(S, c) => <div className={c.parameters.wide ? "max-w-3xl" : "max-w-sm"}><S /></div>],
} satisfies Meta<typeof ChoiceCard>

export default meta
type Story = StoryObj<typeof meta>

/* Area chips belong to different areas in one card: each Badge names its area (R2-26). */
const chips = (
  <>
    <Badge tone="area" area="family" icon={<AreaIcon area="family" size="sm" tone="plain" />}>Family</Badge>
    <Badge tone="area" area="health" icon={<AreaIcon area="health" size="sm" tone="plain" />}>Health</Badge>
  </>
)

export const MultiTile: Story = { name: "Multi · tile", args: { icon: <HeartHandshakeIcon />, footer: chips } }
export const MultiTileSelected: Story = { name: "Multi · tile · selected", args: { icon: <HeartHandshakeIcon />, footer: chips, selected: true } }
export const MultiRow: Story = { name: "Multi · row", args: { layout: "row" } }
export const MultiRowSelected: Story = { name: "Multi · row · selected", args: { layout: "row", selected: true } }
export const Hover: Story = { tags: ["gaps-51"], args: { icon: <HeartHandshakeIcon /> }, parameters: { pseudo: { hover: true } } }
export const MultiInteractive: Story = {
  name: "Multi · interactive grid",
  parameters: { wide: true },
  render: function Render() {
    const [sel, setSel] = useState<Record<string, boolean>>({ care: true })
    const items = [
      ["care", "I care for someone", "A child, a parent, or anyone who relies on you.", <HeartHandshakeIcon key="i" />],
      ["home", "I own a home", "Or I’m paying a mortgage on one.", <HouseIcon key="i" />],
      ["work", "I run a business", "Sole trader, partnership or company.", <BriefcaseBusinessIcon key="i" />],
    ] as const
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(([id, title, description, icon]) => (
          <ChoiceCard
            key={id}
            title={title}
            description={description}
            icon={icon}
            selected={!!sel[id]}
            onSelectedChange={(v) => setSel((s) => ({ ...s, [id]: v }))}
          />
        ))}
      </div>
    )
  },
}

const SingleGroup = ({ layout, initial }: { layout: "row" | "tile"; initial: string }) => {
  const [value, setValue] = useState(initial)
  return (
    <ChoiceCardGroup value={value} onValueChange={setValue} aria-label="Date of birth">
      <ChoiceCardOption layout={layout} value="a" selected={value === "a"} title="12 March 1984" description="From your passport" />
      <ChoiceCardOption layout={layout} value="b" selected={value === "b"} title="21 March 1984" description="From your will" />
    </ChoiceCardGroup>
  )
}

export const SingleRow: Story = { name: "Single · row", render: () => <SingleGroup layout="row" initial="" /> }
export const SingleRowSelected: Story = { name: "Single · row · selected", render: () => <SingleGroup layout="row" initial="a" /> }
export const SingleTileSelected: Story = { name: "Single · tile · selected", render: () => <SingleGroup layout="tile" initial="b" /> }
