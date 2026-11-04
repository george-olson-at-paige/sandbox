import type { Meta, StoryObj } from "@storybook/react-vite"

import { Grid } from "../primitives/grid"
import { Stack } from "../primitives/stack"
import { Guides, type GuidesProps } from "../stories/guides"
import { Placeholder, PlaceholderImage } from "../stories/placeholder"

/* How layout stories are drawn (ORGANIZATION.md §11, "one frame, two fillings"): a Wireframe
   fills a frame's slots with Placeholders, the content stories fill the same frame with the real
   parts. The helpers live in src/stories (story scaffolding, never exported): Placeholder and
   PlaceholderImage (R1-07) for the slots, drawn as plan cells with Guides (REVIEW-18 § Guides) —
   the standard since George 2026-10-30. This is the one page a story helper has (G-03, George
   2026-10-30): it documents how Wireframes are drawn, not the helpers as components, so they stay
   out of the catalog. */
const meta = {
  parameters: { layout: "padded" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Placeholder's heights, xs to xl, and PlaceholderImage's two shapes, as plan cells; xs draws the lines without marks. `measure` adds the rendered size. */
export const Placeholders: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2 }} gap="column">
      <Stack gap={6}>
        <Placeholder size="xs" label="xs · 24" />
        <Placeholder size="sm" label="sm · 40" />
        <Placeholder label="md · 80 (default)" detail="A detail line under the label" measure />
        <Placeholder size="lg" label="lg · 160" measure />
      </Stack>
      <Stack gap={6}>
        <PlaceholderImage label="video · 16:9" measure />
        <PlaceholderImage aspect="square" label="square · 1:1" className="max-w-48" />
      </Stack>
    </Grid>
  ),
}

/** The dashed box `plan={false}` keeps, for the odd story where plan lines would collide. */
export const Plain: Story = {
  render: () => (
    <Stack gap={6} className="max-w-md">
      <Placeholder size="lg" label="Intro" measure plan={false} />
      <Placeholder label="Actions" measure plan={false} />
    </Stack>
  ),
}

/* The box's padding clears the widest inset (lg, 48px from sm), so the text never sits in a gutter. */
const Box = ({ children, ...guides }: GuidesProps) => (
  <div className="relative px-14 py-5">
    <Guides {...guides} />
    <p className="text-sm text-body-muted">{children}</p>
  </div>
)

/** Guides' options, each on a box with `relative`: extend, inner lines and gutters, marks, dashed lines, a stack's spine. */
export const GuidesOptions: Story = {
  name: "Guides",
  render: () => (
    <Stack gap={12} className="mx-14 my-12">
      <Box>Default: the sides and both rules, nothing past the corners.</Box>
      <Box extend="md" marks="corners">extend md, marks corners: lines 16px past the corners, a plus on each crossing.</Box>
      <Box inner="dashed" gutter="hatch" inset="lg" marks="top">inner dashed, gutter hatch, inset lg: a second pair of lines with hatching between.</Box>
      <Box inner="solid" gutter="dots" markShape="square" marks="corners" lineStyle="dashed">gutter dots, markShape square, lineStyle dashed.</Box>
      <Box rules="top" marks="top">rules top, marks top: what one section in a stack draws, so boundaries are never doubled.</Box>
      <Box extend="lg" fade="both">extend lg, fade both: the sides run 56px past the corners and fade in from nothing at each end.</Box>
    </Stack>
  ),
}
