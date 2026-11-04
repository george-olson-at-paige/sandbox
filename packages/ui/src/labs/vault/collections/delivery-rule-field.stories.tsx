import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, userEvent, within } from "storybook/test"

import { DeliveryRuleField, draftOf, ruleOf } from "./delivery-rule-field"
import { MESSAGES_COPY } from "./messages-fixtures"
import type { DeliveryRule } from "./messages"

/* Level 0 (COLLECTIONS-PLAN.md §3): when a message goes. Only the chosen choice's inputs show;
   the rule it makes (or that it isn't one yet) is printed under it. */
const meta = {
  tags: ["level-0", "collections-plan"],
  decorators: [
    (S) => (
      <div className="max-w-xl">
        <S />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Demo({ start }: { start?: DeliveryRule }) {
  const [draft, setDraft] = useState(draftOf(start))
  const rule = ruleOf(draft)
  return (
    <div className="flex flex-col gap-3">
      <DeliveryRuleField draft={draft} onChange={setDraft} copy={MESSAGES_COPY.form.rule} />
      <output data-testid="rule" className="text-sm font-medium text-muted-foreground">
        {rule ? MESSAGES_COPY.rule(rule) : "Not a rule yet"}
      </output>
    </div>
  )
}

/** Nothing chosen: five choices, no inputs. */
export const Empty: Story = { render: () => <Demo /> }

/** Every year: a month and a day; the rule once both are in. */
export const Yearly: Story = {
  render: () => <Demo start={{ kind: "yearly", month: 9, day: 12 }} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByTestId("rule")).toHaveTextContent("every year on September 12")
    await userEvent.click(c.getByRole("radio", { name: /After I’m gone/ }))
    await expect(c.queryByRole("textbox", { name: "Day" })).not.toBeInTheDocument()
    await expect(c.getByTestId("rule")).toHaveTextContent("after I’m gone")
    await userEvent.click(c.getByRole("radio", { name: /Every year/ }))
    // What was typed for a choice is kept while trying the others.
    await expect(c.getByRole("textbox", { name: "Day" })).toHaveValue("12")
  },
}

/** On a date. */
export const OnADate: Story = { render: () => <Demo start={{ kind: "date", date: "2027-06-14" }} /> }
