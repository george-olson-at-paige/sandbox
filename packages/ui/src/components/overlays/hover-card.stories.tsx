import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { activeSubscribers, MONTH_LABELS } from "../../fixtures/admin"
import { formatMetric } from "../../lib/metrics"
import { KpiCard } from "../../patterns/kpi-card"
import { StubLink } from "../../stories/fixtures"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"

/* HoverCard (R20-16): a small read-only panel beside its trigger, opened by hover or by focus.
   Supplementary only: what it says must also be on a page, because it does not open on touch
   and closes when the pointer leaves. Every story's trigger is a link or a button, so the
   keyboard reaches it. */
const meta = {
  component: HoverCard,
  tags: ["r20-16"],
  decorators: [(S) => <div className="min-h-64 max-w-md p-4"><S /></div>],
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

const TERM = "underline decoration-dotted underline-offset-4 rounded-xs focus-ring"
const MEANING = "The person you name to carry out your will: they pay the bills, close accounts and hand out what you leave."

/** A term in a sentence. The trigger is a link to the full explanation, so the hover card is a preview of a page that exists; a phone, where it never opens, follows the link. */
export const OnATerm: Story = {
  name: "On a term",
  tags: ["play-fn"],
  render: () => (
    <p className="text-base text-card-foreground">
      Choose an{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <StubLink href="/help/executor" className={TERM}>executor</StubLink>
        </HoverCardTrigger>
        <HoverCardContent aria-label="What an executor is">
          <p className="text-sm text-card-foreground">{MEANING}</p>
        </HoverCardContent>
      </HoverCard>{" "}
      you trust before you share your will.
    </p>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const term = canvas.getByRole("link", { name: "executor" })
    await expect(term).toHaveAttribute("href", "/help/executor")
    // Closed until asked: nothing in the page says the meaning yet.
    await expect(body.queryByText(MEANING)).toBeNull()
    await userEvent.hover(term)
    await waitFor(() => expect(body.getByText(MEANING)).toBeVisible())
    await userEvent.unhover(term)
    await waitFor(() => expect(body.queryByText(MEANING)).toBeNull())
  },
}

/** A KPI card's detail slot is a hover card (R20-16): the info button opens it. The number, delta and sparkline are the whole card; the rest is behind the button. */
export const OnAKpi: Story = {
  name: "On a KPI",
  tags: ["play-fn"],
  decorators: [(S) => <div className="min-h-80 max-w-xs p-4"><S /></div>],
  render: () => {
    const now = activeSubscribers.at(-1)!
    return (
      <KpiCard
        label="Active subscribers"
        window="Last 12 months"
        value={now}
        format={{ kind: "count" }}
        delta={{ previous: activeSubscribers[0], kind: "percent", basis: "level" }}
        trend={{ values: activeSubscribers }}
        detail={
          <p className="text-sm text-card-foreground">
            {formatMetric(now, { kind: "count" }, { compact: false })} on {MONTH_LABELS.at(-1)}, against {formatMetric(activeSubscribers[0], { kind: "count" }, { compact: false })} a year earlier.
          </p>
        }
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const info = canvas.getByRole("button", { name: "Details for Active subscribers" })
    await userEvent.hover(info)
    await waitFor(() => expect(body.getByText(/a year earlier/)).toBeVisible())
  },
}

/** Tab to the trigger and the card opens, with no pointer; Escape closes it and focus stays put. This is what makes it supplementary rather than hover-only. */
export const Keyboard: Story = {
  name: "Keyboard · opens on focus",
  tags: ["play-fn"],
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <StubLink href="/help/executor" className={TERM}>Who is an executor?</StubLink>
      </HoverCardTrigger>
      <HoverCardContent aria-label="Executor">
        <p className="text-sm text-card-foreground">{MEANING}</p>
      </HoverCardContent>
    </HoverCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await expect(body.queryByText(MEANING)).toBeNull()
    await userEvent.tab()
    const trigger = canvas.getByRole("link", { name: "Who is an executor?" })
    await expect(trigger).toHaveFocus()
    await waitFor(() => expect(body.getByText(MEANING)).toBeVisible())
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByText(MEANING)).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

/** Open for review, on the right and wider (`side`, `align`, `className`). It stays out of the docs page (an open overlay there fights the page's own scroll). */
export const OpenForReview: Story = {
  name: "Open · side right",
  tags: ["!autodocs"],
  render: () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger asChild>
        <StubLink href="/help/executor" className={TERM}>executor</StubLink>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-popover-wide">
        <p className="text-sm text-card-foreground">{MEANING}</p>
      </HoverCardContent>
    </HoverCard>
  ),
}
