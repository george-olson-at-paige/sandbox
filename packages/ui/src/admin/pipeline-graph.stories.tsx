import { useEffect, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { pipelineNow, pipelineRun } from "../fixtures/admin"
import { PipelineGraph, type PipelineRun } from "./pipeline-graph"

/* PipelineGraph (R9-07): a jobs pipeline run on DagFrame. The fixture is a run still going:
   one step failed after three attempts (its downstream won't run), two are running, two wait. */
const meta = {
  component: PipelineGraph,
  args: { run: pipelineRun, now: pipelineNow, logsHref: (s) => (s.jobId ? `#logs/${s.jobId}` : undefined) },
  decorators: [(S) => <div className="max-w-4xl"><S /></div>],
  tags: ["r9-07", "r10-11", "gaps-112"],
} satisfies Meta<typeof PipelineGraph>

export default meta
type Story = StoryObj<typeof meta>

export const Run: Story = {
  name: "A run in progress",
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await waitFor(() => expect(canvasElement.querySelectorAll(".react-flow__node")).toHaveLength(11))
    await expect(c.getByRole("status")).toHaveTextContent("11 steps: 4 succeeded, 1 failed, 2 running, 2 queued, 2 skipped")
    // A running step shows its elapsed time and the usual time left.
    await expect(c.getByRole("button", { name: /^Journeys rebuild: Running, 10m 00s · ~4m 00s left/ })).toBeInTheDocument()
  },
}

export const FailedStepOpen: Story = {
  name: "The failed step's details",
  render: function Render(args) {
    const [step, setStep] = useState<string | null>("sendgrid-contacts")
    return <PipelineGraph {...args} selectedStep={step} onSelectStep={setStep} />
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const panel = await c.findByRole("complementary", { name: "SendGrid contacts" })
    await expect(panel).toHaveTextContent("HttpClient.Timeout of 100 seconds")
    await expect(panel).toHaveTextContent("3")
    await expect(within(panel).getByRole("link", { name: "Open the logs" })).toHaveAttribute("href", "#logs/job-sendgrid-contacts")
    // Its downstream won't run, and says why.
    await userEvent.click(c.getByRole("button", { name: /^SendGrid lists: Won't run/ }))
    await expect(c.getByRole("complementary", { name: "SendGrid lists" })).toHaveTextContent("Won't run: SendGrid contacts failed")
  },
}

/** R10-11: a step's inputs and outputs, when the run detail carries them (not in the contract yet). Without them the panel has no such sections. */
export const InputsAndOutputs: Story = {
  name: "Step inputs and outputs (when present)",
  render: function Render(args) {
    const [step, setStep] = useState<string | null>("user-usage")
    const run: PipelineRun = {
      ...pipelineRun,
      steps: pipelineRun.steps.map((s) =>
        s.name === "user-usage"
          ? {
              ...s,
              inputs: [{ name: "Window", value: "Last 30 days" }, { name: "Accounts", value: 2333 }],
              outputs: [{ name: "Rows written", value: 12840 }, { name: "Emailed", value: true }],
            }
          : s
      ),
    }
    return <PipelineGraph {...args} run={run} selectedStep={step} onSelectStep={setStep} />
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const panel = await c.findByRole("complementary")
    await expect(within(panel).getByRole("heading", { name: "Inputs" })).toBeInTheDocument()
    await expect(panel).toHaveTextContent("12,840")
    // A step without them shows no empty section.
    await userEvent.click(c.getByRole("button", { name: /^SendGrid contacts:/ }))
    const other = await c.findByRole("complementary", { name: "SendGrid contacts" })
    await expect(within(other).queryByRole("heading", { name: "Inputs" })).toBeNull()
  },
}

/** R10-02: the same run top to bottom, ranks alternating left and right of a centre line. */
export const DownAlternating: Story = {
  name: "Down, alternating",
  tags: ["r10-02"],
  args: { layout: "down-alternating", height: "lg" },
}

/** The clock ticks and the run moves on: statuses change in place, nothing re-lays out. */
export const Live: Story = {
  name: "Live (simulated clock)",
  render: function Render(args) {
    const [now, setNow] = useState(pipelineNow)
    useEffect(() => {
      const t = window.setInterval(() => setNow((n) => n + 60_000), 1000)
      return () => window.clearInterval(t)
    }, [])
    const minutes = (now - pipelineNow) / 60_000
    const run: PipelineRun = {
      ...pipelineRun,
      steps: pipelineRun.steps.map((s) => {
        if (s.name === "partner-scorecards" && minutes >= 4) return { ...s, status: "Succeeded", completedAt: new Date(now).toISOString(), durationSeconds: 420 + minutes * 10 }
        if (s.name === "journeys-rebuild" && minutes >= 8) return { ...s, status: "Succeeded", completedAt: new Date(now).toISOString(), durationSeconds: 900 }
        if (s.name === "pulse-snapshot" && minutes >= 8) return { ...s, status: minutes >= 10 ? "Succeeded" : "Running", startedAt: new Date(pipelineNow + 8 * 60_000).toISOString(), durationSeconds: minutes >= 10 ? 14 : null }
        return s
      }),
    }
    return <PipelineGraph {...args} run={run} now={now} />
  },
}

export const Loading: Story = { args: { loading: true, run: { ...pipelineRun, steps: [] } } }
export const LoadError: Story = { name: "Error", args: { error: { message: "We couldn't load this run.", onRetry: () => {} }, run: { ...pipelineRun, steps: [] } } }
