import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import { StubLink } from "../stories/fixtures"
import { Grid } from "../primitives/grid"
import { InsightCard, type InsightTone } from "./insight-card"
import { KpiCard } from "./kpi-card"

/* The card's props are a union (a button or a link), which Storybook's arg inference can't hold,
   so the stories drive it through one flat set of args. */
type DemoProps = { eyebrow: string; title: string; description?: string; action: string; tone?: InsightTone; onSelect?: () => void; href?: string }
function Demo({ href, onSelect, ...rest }: DemoProps) {
  return href ? <InsightCard {...rest} href={href} linkAs={StubLink} /> : <InsightCard {...rest} onSelect={onSelect ?? (() => {})} />
}

/* InsightCard (R21-06): one finding that takes you to it; the whole card is the button (or the
   link). Beside KpiCards in a summary row it is the same size, so the row stays even. */
const meta = {
  component: Demo,
  args: { eyebrow: "Biggest drop", title: "After Getting in", description: "30 of 44 stopped", action: "Look at it", tone: "attention", onSelect: fn() },
  argTypes: { tone: { control: "inline-radio", options: ["attention", "info", "neutral"] } },
  // One card at a card's width; the row story asks for the page's (`parameters.wide`).
  decorators: [(S, ctx) => <div data-surface="page" className="bg-surface-page p-6"><div className={ctx.parameters.wide ? undefined : "max-w-sm"}><S /></div></div>],
  tags: ["r21-06"],
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

/** A button: a click or Enter calls `onSelect`; its name is everything it says. */
export const Attention: Story = {
  play: async ({ canvasElement, args }) => {
    const card = within(canvasElement).getByRole("button", { name: /Biggest drop.*After Getting in.*Look at it/ })
    await userEvent.click(card)
    await expect(args.onSelect).toHaveBeenCalledTimes(1)
    await userEvent.keyboard("{Enter}")
    await expect(args.onSelect).toHaveBeenCalledTimes(2)
  },
}

export const Info: Story = { args: { tone: "info", eyebrow: "New this week", title: "Check what we read", description: "Shown to 18 people", action: "See the screen" } }
export const Neutral: Story = { args: { tone: "neutral", eyebrow: "Most time", title: "Your people", description: "36s median", action: "Look at it" } }

/** As a link: `href` (and the app's `linkAs`) make the whole card the link. */
export const AsLink: Story = {
  name: "As a link",
  args: { href: "#getting-in" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link", { name: /After Getting in/ })).toHaveAttribute("href", "#getting-in")
  },
}

/** Focus is the card halo outside the border, never an outline; hover and press are the relative wash over the tint. */
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    const card = within(canvasElement).getByRole("button")
    await expect(card).toHaveFocus()
    await expect(getComputedStyle(card).outlineStyle).toBe("none")
    await expect(getComputedStyle(card).boxShadow).not.toBe("none")
  },
}

export const Hover: Story = { parameters: { pseudo: { hover: true } } }

/** The Journeys summary: two KpiCards with a caption and the InsightCard, one row of even cards. */
export const InASummaryRow: Story = {
  name: "In a summary row",
  parameters: { wide: true },
  render: (args) => (
    <Grid columns={{ base: 1, md: 3 }}>
      <KpiCard size="compact" label="Started Setup" window="Last 7 days" value={101} format={{ kind: "count" }} caption="people saw Welcome" />
      <KpiCard size="compact" label="Reached the end" window="Last 7 days" value={14} format={{ kind: "count" }} caption="14% of those who started" />
      <Demo {...args} />
    </Grid>
  ),
}
