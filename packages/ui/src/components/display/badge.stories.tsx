import type { Meta, StoryObj } from "@storybook/react-vite"
import { CheckIcon } from "lucide-react"

import { AREA_ORDER } from "../../icons/area-glyphs"
import { Badge } from "./badge"
import { Eyebrow } from "./eyebrow"

const TONES = ["neutral", "info", "success", "warning", "attention", "area"] as const

const meta = {
  component: Badge,
  args: { children: "Auto-filled", tone: "neutral", appearance: "soft", size: "sm" },
  argTypes: {
    tone: { control: "select", options: TONES },
    appearance: { control: "select", options: ["soft", "outline"] },
    size: { control: "select", options: ["sm", "xs"] },
    icon: { control: false },
  },
  tags: ["r4-13", "r2-26", "gaps-35"],
  parameters: {
    docs: {
      description: {
        component:
          "A short status or category label. **Also called a lozenge elsewhere** (Atlassian, Orbit). We keep Badge (R4-13): it is shadcn's name for the same thing, so the base and the Paige layer share one word, and it's the more widely known term. Revisit only if Badge starts doing two jobs (counts and statuses).",
      },
    },
  },
  /* Area-toned stories sit in a Family context (R3-15: without one, area tone is neutral). */
  decorators: [(S) => <div data-area="family"><S /></div>],
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Matrix: Story = {
  name: "Tone × appearance",
  render: () => (
    <div className="grid w-fit grid-cols-3 items-center gap-x-8 gap-y-3">
      <Eyebrow>tone</Eyebrow>
      <Eyebrow>soft</Eyebrow>
      <Eyebrow>outline</Eyebrow>
      {TONES.map((t) => (
        <div key={t} className="contents">
          <span className="text-sm font-semibold text-card-foreground">{t}</span>
          <span><Badge tone={t} appearance="soft">{t}</Badge></span>
          <span><Badge tone={t} appearance="outline">{t}</Badge></span>
        </div>
      ))}
    </div>
  ),
}

/** Size xs (field adornment, no layout shift) */
export const Sizes: Story = {
  name: "Size xs · adornment",
  tags: ["r1-10"],
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Badge size="sm" tone="success" icon={<CheckIcon />}>sm · 20</Badge>
        <Badge size="xs" tone="success" icon={<CheckIcon />}>xs · 16</Badge>
      </div>
      <div className="flex max-w-md flex-col gap-3">
        <p className="text-sm text-muted-foreground">The label row is 16px tall with or without its badge:</p>
        <div className="flex items-center gap-2 border-y border-dashed border-border">
          <Eyebrow>Date of birth</Eyebrow>
        </div>
        <div className="flex items-center gap-2 border-y border-dashed border-border">
          <Eyebrow>Date of birth</Eyebrow>
          <Badge size="xs" tone="success" icon={<CheckIcon />}>Auto-filled</Badge>
        </div>
      </div>
    </div>
  ),
}

export const Mapping: Story = {
  name: "Collapse mapping",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="success" icon={<CheckIcon />}>Auto-filled</Badge>
      <Badge tone="warning">Not found</Badge>
      <Badge tone="warning">Unread</Badge>
      <Badge tone="attention">Doesn’t match</Badge>
      <Badge tone="neutral" appearance="outline">Answered</Badge>
      <Badge tone="neutral" appearance="outline">Guardian</Badge>
      <Badge tone="info">Will</Badge>
      <Badge tone="neutral">From Contacts</Badge>
      <Badge tone="info" appearance="outline">Delegate</Badge>
    </div>
  ),
}

/** Area tone (each Life Area, via the area prop) */
export const AreaTone: Story = {
  name: "Area tone · each Life Area",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {AREA_ORDER.map((a) => (
        <Badge key={a} tone="area" area={a} className="capitalize">{a}</Badge>
      ))}
    </div>
  ),
}
