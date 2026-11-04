import type { Meta, StoryObj } from "@storybook/react-vite"

import { AREA_ORDER } from "../../icons/area-glyphs"
import { Progress } from "./progress"

const meta = {
  component: Progress,
  args: { value: 40, indeterminate: false, "aria-label": "Family progress" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
  /* In a Family context (R3-15: without one, area tone is neutral). */
  decorators: [(S) => <div className="max-w-xs" data-area="family"><S /></div>],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { value: 0 } }
export const Partial: Story = { args: { value: 40 } }
export const Complete: Story = { name: "Complete (switches to success)", args: { value: 100 } }
/** Indeterminate (still pulses under reduced motion) */
export const Indeterminate: Story = {
  tags: ["r1-13"],
  args: { indeterminate: true, "aria-label": "Reading your document" },
}

export const AreaTones: Story = {
  name: "Area tone (each Life Area)",
  render: () => (
    <div className="flex flex-col gap-3">
      {AREA_ORDER.map((a, i) => (
        <div key={a} data-area={a} className="flex items-center gap-3">
          <span className="w-20 text-xs font-semibold text-area-ink capitalize">{a}</span>
          <Progress value={(i + 1) * 10} aria-label={`${a} progress`} />
        </div>
      ))}
    </div>
  ),
}
