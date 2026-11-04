import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { StubLink } from "../stories/fixtures"
import { Form } from "./form"
import { FormFooter } from "./form-footer"

/* FormFooter (R7-03): a plain form's actions. The submit reads pending and disabled from its
   Form; a setup step uses FlowFooter instead (Back, note, Skip). */
const meta = {
  component: FormFooter,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["r7-03"],
} satisfies Meta<typeof FormFooter>

export default meta
type Story = StoryObj<typeof meta>

const never = () => new Promise<void>(() => {})

export const Default: Story = {
  render: (args) => (
    <Form values={{}} onSubmit={() => {}}>
      <FormFooter {...args} />
    </Form>
  ),
}

export const WithCancel: Story = {
  name: "With cancel",
  args: { submitLabel: "Save changes", cancel: { label: "Cancel", href: "#", linkAs: StubLink } },
  render: Default.render,
}

export const Disabled: Story = {
  name: "Disabled (a required answer is missing)",
  args: { submitLabel: "Save changes" },
  render: (args) => (
    <Form values={{}} onSubmit={() => {}} disabled>
      <FormFooter {...args} />
    </Form>
  ),
}

export const Pending: Story = {
  args: { submitLabel: "Save changes" },
  render: (args) => (
    <Form values={{}} onSubmit={never}>
      <FormFooter {...args} />
    </Form>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save changes" }))
    await expect(await c.findByRole("button", { name: /saving/i })).toBeDisabled()
  },
}
