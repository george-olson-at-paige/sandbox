import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChevronRightIcon, FileTextIcon, KeyRoundIcon, UsersIcon } from "lucide-react"

import { AreaGlyph } from "../../icons/area-glyphs"
import { Stack } from "../../primitives/stack"
import { Avatar } from "./avatar"
import { Eyebrow } from "./eyebrow"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "./item"

/* The Paige Item is only the list row (GAPS #39). FactItem (Composites) is built on it. */
const meta = {
  component: Item,
  // Being redefined in Labs as a layout that takes regions (STACK-REVIEW S-27): the label on this page.
  tags: ["in-labs"],
  parameters: {
    docs: {
      description: {
        component:
          "**Being redefined in Labs:** [Labs › Components › Item](?path=/docs/labs-components-item--docs) is the sketch of Item as a layout that takes its regions as parameters (STACK-REVIEW S-27). This page stays the reference until it is approved.",
      },
    },
  },
  argTypes: { density: { control: "select", options: ["row", "compact"] } },
  args: { density: "row" },
  decorators: [(S) => <div className="max-w-lg"><S /></div>],
  render: (args) => (
    <div>
      {["Daniel Reyes", "Ana Torres", "Biscuit"].map((n) => (
        <Item key={n} {...args}>
          <ItemContent><ItemTitle>{n}</ItemTitle></ItemContent>
          <ItemActions><ChevronRightIcon className="size-4 text-muted-foreground" /></ItemActions>
        </Item>
      ))}
    </div>
  ),
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

export const Row: Story = {}
export const Compact: Story = { args: { density: "compact" } }

/** `ItemMedia variant` is the kind of media, not a size: area-icon (a Life Area glyph on its tinted square),
    avatar (an Avatar, no box), file (a document glyph on a small page) or icon (any lucide icon on a small
    tinted circle). Every kind sits centred in the same 40px column, so mixed rows line up their media and titles. */
export const Media: Story = {
  name: "Media variants",
  tags: ["r3-05"],
  render: () => (
    <div>
      <Item data-area="household">
        <ItemMedia variant="area-icon"><AreaGlyph area="household" /></ItemMedia>
        <ItemContent><ItemTitle>area-icon</ItemTitle><ItemDescription>Takes the nearest data-area</ItemDescription></ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="avatar"><Avatar name="Daniel Reyes" /></ItemMedia>
        <ItemContent><ItemTitle>avatar</ItemTitle></ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="file"><FileTextIcon /></ItemMedia>
        <ItemContent><ItemTitle>file</ItemTitle><ItemDescription>Portrait page</ItemDescription></ItemContent>
      </Item>
      <Item>
        <ItemMedia variant="icon"><UsersIcon /></ItemMedia>
        <ItemContent><ItemTitle>icon</ItemTitle><ItemDescription>Any lucide icon on a small circle</ItemDescription></ItemContent>
      </Item>
    </div>
  ),
}

const steps = [
  { icon: <UsersIcon />, title: "Tell us who counts on you." },
  { icon: <FileTextIcon />, title: "Add what they’d need to find." },
  { icon: <KeyRoundIcon />, title: "Choose who can open it when the time comes." },
]

/** ItemGroup is the list: each Item is announced as a list item. It owns the dividers; `dividers={false}`
    suits a short list of one-line items. */
export const Group: Story = {
  name: "ItemGroup · with and without dividers",
  render: () => (
    <Stack gap={8}>
      {[true, false].map((dividers) => (
        <Stack key={String(dividers)} gap={2}>
          <Eyebrow>dividers {String(dividers)}</Eyebrow>
          <ItemGroup dividers={dividers} label="What we’ll do together">
            {steps.map((s) => (
              <Item key={s.title} density="compact">
                <ItemMedia variant="icon">{s.icon}</ItemMedia>
                <ItemContent><ItemTitle>{s.title}</ItemTitle></ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </Stack>
      ))}
    </Stack>
  ),
}

export const LongContent: Story = {
  name: "Long content (never clamps)",
  render: () => (
    <Item>
      <ItemContent>
        <Eyebrow>Policy</Eyebrow>
        <ItemTitle>Life insurance policy with a very long provider name that keeps going</ItemTitle>
        <ItemDescription>
          Policy 0042-7781 · Beneficiaries Daniel Reyes and Elena Reyes · Renewed every March · Paper copy in the fire safe in the
          hallway closet, digital copy uploaded from email.
        </ItemDescription>
      </ItemContent>
    </Item>
  ),
}
