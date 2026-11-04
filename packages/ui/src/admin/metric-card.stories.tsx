import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  activeSubscribers,
  churnPercent,
  MONTH_LABELS,
  signups,
} from "../fixtures/admin";
import { MetricCard, type AdminMetric } from "./metric-card";

/* MetricCard (R8-08): the number and the delta come from the one series, so all three share the
   window. level: last point vs first point. flow: the window's total vs the prior window's. */
const active: AdminMetric = {
  id: "active",
  label: "Active subscribers",
  format: { kind: "count" },
  kind: "level",
  points: MONTH_LABELS.map((period, i) => ({
    period,
    value: activeSubscribers[i],
  })),
  window: "Last 12 months",
  change: "net",
  good: "up",
};
const signupsMetric: AdminMetric = {
  id: "signups",
  label: "Signups",
  format: { kind: "count" },
  kind: "flow",
  points: MONTH_LABELS.slice(1).map((period, i) => ({
    period,
    value: signups[i + 1],
  })),
  window: "Last 12 months, October so far",
  change: "percent",
  good: "up",
  previousTotal: 1890,
  partialLast: true,
};
const churn: AdminMetric = {
  id: "churn",
  label: "Monthly churn",
  format: { kind: "percent" },
  kind: "level",
  points: MONTH_LABELS.map((period, i) => ({ period, value: churnPercent[i] })),
  window: "Last 12 months",
  change: "points",
  good: "down",
};



const meta = {
  component: MetricCard,
  args: { metric: active },
  decorators: [
    (S) => (
      <div className="max-w-xs">
        <S />
      </div>
    ),
  ],
  tags: ["r8-08", "r12-05", "admin"],
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Level: Story = {
  name: "Level (last point vs first)",
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot="stat-value"]')
    ).toHaveTextContent("2,333");
    const delta = canvasElement.querySelector('[data-slot="stat-delta"]')!;
    await expect(delta).toHaveTextContent("+349");
    // R12-05: a level says when its comparison point was.
    await expect(delta.querySelector("[aria-hidden]")).toHaveTextContent(
      "vs a year ago"
    );
    await expect(delta.querySelector(".sr-only")).toHaveTextContent(
      "compared with a year ago"
    );
  },
};
export const Flow: Story = {
  name: "Flow (window total vs prior window)",
  args: { metric: signupsMetric },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot="stat-value"]')
    ).toHaveTextContent("1,852");
    const delta = canvasElement.querySelector('[data-slot="stat-delta"]')!;
    await expect(delta.querySelector("[aria-hidden]")).toHaveTextContent(
      "vs prior"
    );
    await expect(delta.querySelector(".sr-only")).toHaveTextContent(
      "compared with the previous 12 months"
    );
  },
};
export const LowerIsBetter: Story = {
  name: "Lower is better",
  args: { metric: churn },
};
export const Loading: Story = { args: { loading: true } };
/** R15-16: no points in the window: Stat's no-data state ("—", the placeholder line, the pill), never 0. */
export const NoData: Story = {
  name: "No data",
  tags: ["r15-16"],
  args: { metric: { ...active, points: [] } },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('[data-slot="stat-value"]')
    ).toHaveTextContent("—");
    await expect(
      canvasElement.querySelector('[data-slot="stat-no-data-badge"]')
    ).toHaveTextContent("No data");
  },
};
