import { useState, type FormEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { StubLink } from "../stories/fixtures"
import { Field, FieldLabel } from "../forms/field"
import { Input } from "../components/inputs/input"
import { FlowFooter } from "./flow-footer"

// Typed from the component, not `satisfies`: the props are a union (link mode | submit mode).
const meta: Meta<typeof FlowFooter> = {
  component: FlowFooter,
  args: { ctaHref: "#next", linkAs: StubLink },
  decorators: [(S) => <div className="max-w-3xl"><S /></div>],
}

export default meta
type Story = StoryObj<typeof FlowFooter>

export const CtaOnly: Story = { name: "CTA only (first beat)" }
export const BackAndCta: Story = { name: "Back + CTA", args: { backHref: "#back" } }
export const Full: Story = {
  name: "Back + note + skip + CTA",
  args: { backHref: "#back", note: "You can change any of this later.", skipLabel: "Skip for now", skipHref: "#skip" },
}
export const Disabled: Story = {
  name: "CTA disabled",
  args: { backHref: "#back", note: "Pick at least one to continue.", ctaDisabled: true },
}
export const CustomLabel: Story = { name: "Custom CTA label", args: { backHref: "#back", ctaLabel: "Finish setup" } }

/* Submit mode (R2-38): the beat's form saves before it moves on. This story's save fails the
   first time and works the second, so every state can be seen: idle, pending, failure (input
   kept, retry), success. */
function SubmitBeat() {
  const [name, setName] = useState("Maya Elena Reyes")
  const [state, setState] = useState<"idle" | "pending" | "failed" | "saved">("idle")
  const [tries, setTries] = useState(0)
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setState("pending")
    setTimeout(() => {
      setTries((t) => t + 1)
      setState(tries === 0 ? "failed" : "saved")
    }, 1200)
  }
  return (
    <form id="about-you" onSubmit={onSubmit}>
      <Field id="ff-name">
        <FieldLabel>Legal name</FieldLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {state === "saved" && <p className="mt-4 text-sm font-medium text-success-foreground">Saved. The next beat would open now.</p>}
      <FlowFooter
        linkAs={StubLink}
        backHref="#back"
        ctaLabel="Save my details"
        note="Your legal name is the one thing here we can’t skip."
        submit={{
          pending: state === "pending",
          error: state === "failed" ? "We couldn’t save that. Check your connection and try again." : undefined,
          disabled: !name.trim(),
        }}
      />
    </form>
  )
}

export const SubmitMode: Story = {
  name: "Submit mode: pending, failure, retry",
  tags: ["r2-38", "gaps-52"],
  render: () => <SubmitBeat />,
}
export const SubmitPending: Story = {
  name: "Submit mode: pending",
  tags: ["r2-38"],
  args: { ctaHref: undefined, backHref: "#back", ctaLabel: "Save my details", submit: { pending: true } },
}
export const SubmitFailed: Story = {
  name: "Submit mode: failed",
  tags: ["r2-38"],
  args: { ctaHref: undefined, backHref: "#back", ctaLabel: "Save my details", submit: { error: "We couldn’t save that. Check your connection and try again." } },
}
