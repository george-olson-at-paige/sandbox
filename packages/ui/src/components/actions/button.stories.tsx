import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, SearchIcon } from "lucide-react"

import { StubLink } from "../../stories/fixtures"
import { Button } from "./button"
import { Spinner } from "../feedback/spinner"

const meta = {
  tags: ["r2-14", "gaps-34", "r2-25", "gaps-32", "r3-06", "r4-01", "r4-02"],
  component: Button,
  args: { children: "Save and continue" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "link", "quiet", "destructive", "muted"] },
    size: { control: "select", options: ["sm", "md", "lg", "icon", "inline"] },
    iconPosition: { control: "inline-radio", options: ["start", "end"] },
    icon: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: "primary" } }
export const Secondary: Story = { args: { variant: "secondary", children: "Skip for now" } }
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } }
export const Link: Story = { args: { variant: "link", icon: <PlusIcon />, children: "Name a guardian" } }
export const Quiet: Story = {
  name: "Quiet (spike addition)",
  tags: ["gaps-31"],
  args: { variant: "quiet", icon: <ArrowLeftIcon />, children: "Back to Vault" },
}
export const QuietUnderline: Story = {
  name: "Quiet + underline (decline)",
  args: { variant: "quiet", size: "inline", underline: true, children: "Not applicable" },
}
/** Destructive (irreversible only, behind a confirm) */
export const Destructive: Story = {
  tags: ["r2-03"],
  args: { variant: "destructive", children: "Remove" },
}

/** Sizes (36 · 44 · 48, padding from the prototype) */
export const Sizes: Story = {
  name: "Sizes · 36 · 44 · 48",
  render: (args) => (
    <div className="flex flex-col gap-4">
      {[undefined, <ArrowRightIcon key="i" />].map((icon, i) => (
        <div key={i} className="flex flex-wrap items-center gap-4">
          <Button {...args} size="sm" icon={icon} iconPosition="end">Small · 36</Button>
          <Button {...args} size="md" icon={icon} iconPosition="end">Medium · 44</Button>
          <Button {...args} size="lg" icon={icon} iconPosition="end">Large · 48</Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <Button size="icon" icon={<SearchIcon />} aria-label="Search" variant="ghost" />
        <Button variant="link" size="inline">Inline (GAPS #32)</Button>
      </div>
    </div>
  ),
}

export const InlineInherits: Story = {
  name: "Size inline takes the line's text size",
  render: () => (
    <div className="flex flex-col gap-3 text-muted-foreground">
      <p className="text-xs">
        From your driver’s licence · <Button variant="link" size="inline">Confirm</Button> ·{" "}
        <Button variant="link" size="inline">Edit</Button> (12px line)
      </p>
      <p className="text-sm">
        Elena has no guardian yet. <Button variant="link" size="inline">Name a guardian</Button> (14px line)
      </p>
      <p className="text-base">
        Nothing here yet. <Button variant="quiet" size="inline" underline>Not applicable</Button> (16px line)
      </p>
    </div>
  ),
}

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="quiet">Quiet</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="muted">Muted</Button>
    </div>
  ),
}

/* On a toned surface: the white button, and muted (the outline, no fill). */
const TONED = [
  ["neutral", "bg-muted text-foreground"],
  ["info", "bg-info-subtle text-info-foreground"],
  ["success", "bg-success-subtle text-success-foreground"],
  ["warning", "bg-warning-subtle text-warning-foreground"],
  ["attention", "bg-attention-subtle text-attention-foreground"],
  ["white", "bg-card text-card-foreground border"],
] as const

export const OnATone: Story = {
  name: "White and outline · on each tone",
  render: () => (
    <div className="flex flex-col gap-3">
      {TONED.map(([tone, surface]) => (
        <div key={tone} className={`flex items-center gap-4 rounded-lg p-4 ${surface}`}>
          <span className="w-24 text-sm font-semibold">{tone}</span>
          <Button variant="secondary" size="sm">White</Button>
          <Button variant="muted" size="sm">Outline</Button>
        </div>
      ))}
    </div>
  ),
}

export const OnAnAreaWash: Story = {
  name: "White and outline · on an Area wash",
  render: () => (
    <div className="flex flex-col gap-3">
      {(["family", "household", "money", "estate"] as const).map((area) => (
        <div key={area} data-area={area} className="flex items-center gap-4 rounded-lg bg-area-wash p-4 text-area-ink">
          <span className="w-24 text-sm font-semibold">{area}</span>
          <Button variant="secondary" size="sm">White</Button>
          <Button variant="muted" size="sm">Outline</Button>
        </div>
      ))}
    </div>
  ),
}

export const IconProp: Story = {
  name: "icon + iconPosition",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button icon={<ArrowRightIcon />} iconPosition="end">Save and continue</Button>
      <Button variant="secondary" icon={<PlusIcon />}>Add a person</Button>
      <Button variant="ghost" icon={<ArrowLeftIcon />}>Back</Button>
      <Button asChild variant="secondary" icon={<ArrowRightIcon />} iconPosition="end">
        <StubLink href="#documents">As a link (asChild)</StubLink>
      </Button>
    </div>
  ),
}

export const Hover: Story = {
  parameters: { pseudo: { hover: true } },
  render: AllVariants.render,
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="link" disabled>Link</Button>
      <Button variant="quiet" disabled>Quiet</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
}

export const Pending: Story = {
  name: "Pending (loading)",
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled icon={<Spinner label="Saving" />}>Saving…</Button>
      <Button variant="secondary" disabled icon={<Spinner label="Saving" />}>Saving…</Button>
    </div>
  ),
}

/* Relative hover (R4-01): the overlay laid over whatever the button is, so hover is darker
   than the surface on every surface. Columns: at rest · hover · pressed (forced with the
   pseudo-states addon on the marked cells). Secondary gives its white up to the surface on
   hover, so it too ends darker than the card it sits on. */
const SURFACES = [
  ["default", "bg-background"],
  ["muted", "bg-muted"],
  ["card", "bg-card border shadow-card"],
  ["area wash", "bg-area-wash text-area-ink"],
] as const
const RELATIVE_VARIANTS = ["secondary", "ghost", "muted"] as const

export const RelativeHover: Story = {
  name: "Relative hover · on every surface",
  parameters: {
    pseudo: { hover: ['[data-demo="hover"]'], active: ['[data-demo="pressed"]'] },
  },
  render: () => (
    <div className="flex flex-col gap-3">
      {SURFACES.map(([name, surface]) => (
        <div key={name} data-area="family" className={`flex flex-col gap-3 rounded-lg p-4 ${surface}`}>
          <span className="eyebrow">{name}</span>
          {RELATIVE_VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-20 text-sm font-semibold">{variant}</span>
              {(["rest", "hover", "pressed"] as const).map((state) => (
                <Button key={state} variant={variant} size="sm" data-demo={state}>{state}</Button>
              ))}
              {(["rest", "hover", "pressed"] as const).map((state) => (
                <Button key={`i-${state}`} variant={variant} size="icon" icon={<SearchIcon />} aria-label={`Search (${state})`} data-demo={state} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}
