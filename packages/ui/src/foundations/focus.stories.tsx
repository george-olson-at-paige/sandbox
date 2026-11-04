import type { ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Button } from "../components/actions/button"
import { Card } from "../components/display/card"
import { Checkbox } from "../components/inputs/checkbox"
import { Input } from "../components/inputs/input"
import { RadioGroup, RadioGroupItem } from "../components/inputs/radio-group"
import { Switch } from "../components/inputs/switch"
import { InlineEdit } from "../forms/inline-edit"
import { FilterCardRow } from "../patterns/filter-card-row"

/* Focus by kind of control (R15-17, rule in packages/ui/CLAUDE.md § Focus). Three looks, one per
   kind, all meeting WCAG 2.4.7 (focus visible):
   1. Things you type into (Input, Textarea, Select, MultiSelect and combobox triggers, the rich
      text box): the border turns brand blue and gets a soft 2px halo (brand blue at 50%).
   2. Buttons, links, toggles, menu triggers, checkboxes, radios and switches: the gapped outline
      (`focus-ring`: 2px brand blue, 2px away).
   3. Rows and cards that open or choose something: no outline; the control's own cue, made
      stronger. Rows (the InlineEdit read row, a clickable table row while its link has focus)
      take the hover wash, and InlineEdit's pencil turns brand blue; cards (the filter cards, the
      interactive Card, ChoiceCard) take the halo outside their border.
   Each story draws the focused state through the pseudo-states addon, so it shows without a
   keyboard. Row 2 draws a RadioGroup too (R20-03): the list named radios but the story drew none,
   so there was nothing to compare against. */
const meta = { parameters: { layout: "padded" }, tags: ["r15-17", "r15-13"] } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Kind({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-divider pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground-strong">{title}</h3>
        <p className="max-w-160 text-sm font-medium text-muted-foreground">{note}</p>
      </div>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </section>
  )
}

export const ByKind: Story = {
  name: "Focus by kind of control",
  parameters: { pseudo: { focusVisible: ['[data-demo="focus"]', '[data-demo="focus"] button', '[data-demo="focus"] input'] } },
  render: () => (
    <div className="flex max-w-240 flex-col gap-6">
      <Kind title="Things you type into" note="The border turns brand blue with a soft halo, the way the open text box looks.">
        <div data-demo="focus" className="w-64">
          <Input aria-label="Name" defaultValue="Ada Park" />
        </div>
      </Kind>
      <Kind title="Buttons, links, toggles, checkboxes, radios, switches" note="The gapped outline: 2px brand blue, 2px away. Every radio of the group is drawn focused here; in use only the chosen one holds focus (Tab lands on it, arrows move it and the check).">
        <span data-demo="focus">
          <Button variant="secondary">Export</Button>
        </span>
        <span data-demo="focus">
          <Checkbox aria-label="Select row" checked={false} onCheckedChange={() => undefined} />
        </span>
        <span data-demo="focus">
          <Switch aria-label="Rev share" checked onCheckedChange={() => undefined} />
        </span>
        <span data-demo="focus">
          <RadioGroup aria-label="Filing status" defaultValue="single" className="flex items-center gap-4">
            {[["single", "Single"], ["joint", "Joint"], ["separate", "Separate"]].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-card-foreground">
                <RadioGroupItem value={value} />
                {label}
              </label>
            ))}
          </RadioGroup>
        </span>
      </Kind>
      <Kind title="Rows that open" note="No outline: the hover wash, and the pencil in brand blue. An outline here looked like the open text box.">
        <div data-demo="focus" className="w-72">
          <InlineEdit label="Preferred name" defaultValue="Ada" onSave={() => undefined} />
        </div>
      </Kind>
      <Kind title="Cards that open or choose" note="No outline: the halo outside the card's border. In the filter cards focus always sits on the chosen card.">
        <div data-demo="focus" className="w-120 rounded-xl bg-surface-page p-4">
          <FilterCardRow
            label="Segments"
            value="all"
            onValueChange={() => undefined}
            cards={[
              { id: "all", label: "All partners", count: 20 },
              { id: "live", label: "Live", count: 15 },
            ]}
          />
        </div>
        <Card interactive tabIndex={0} data-demo="focus" className="w-56 px-5 py-4">
          <span className="text-sm font-medium">An interactive Card</span>
        </Card>
      </Kind>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    // Rows and cards never draw the gapped outline.
    await expect(getComputedStyle(c.getByRole("button", { name: /Preferred name|Ada/ })).outlineStyle).toBe("none")
    await expect(getComputedStyle(c.getByRole("radio", { name: /All partners/ })).outlineStyle).toBe("none")
    // The row-2 radio is drawn, and a radio is a button, so the pseudo-state selectors reach it.
    await expect(c.getByRole("radio", { name: "Single" })).toBeChecked()
  },
}
