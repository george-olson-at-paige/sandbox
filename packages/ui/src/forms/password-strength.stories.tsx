import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, within } from "storybook/test"

import { Field, FieldDescription, FieldLabel } from "./field"
import { PasswordField } from "./fields/password-field"
import { PasswordStrength } from "./password-strength"
import { typeKeys } from "../stories/typing"

/* Story values are obviously fake. The rules shown are the spike's guess at the API's policy
   (8 characters, a digit, a symbol) until the API serves it. */
const meta = {
  component: PasswordStrength,
  args: { value: "" },
  argTypes: { display: { control: "inline-radio", options: ["both", "bar", "rules"] } },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
  tags: ["r20-20"],
  parameters: {
    docs: {
      description: {
        component:
          "The password rules and a four-step strength bar for a new password, under its Field. `display` is `both` (default), `bar` or `rules`. The rules are the API's password policy (ASP.NET Identity: a minimum length, a digit, a symbol; no upper or lower case); the API doesn't serve it yet, so the default `policy` is the spike's guess, 8 · digit · symbol. The verdict (Weak · Fair · Good · Strong) is one `aria-live=\"polite\"` region, and a ladder, not a sum: under the minimum is Weak, a rule unmet is Fair, every rule met is Good, four characters past the minimum is Strong, so it never calls Good a password the API will refuse. Empty shows the rules unmet in muted ink and no verdict. **Never logs the value.**",
      },
    },
  },
} satisfies Meta<typeof PasswordStrength>

export default meta
type Story = StoryObj<typeof meta>

const verdict = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-slot="password-strength-verdict"]')!

/** Nothing typed: the rules wait, muted, with no alarm and no verdict. */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const live = verdict(canvasElement)
    await expect(live).toHaveAttribute("aria-live", "polite")
    await expect(live).toHaveTextContent("")
    await expect(canvasElement.querySelectorAll("[data-rule]:not([data-met])")).toHaveLength(3)
  },
}

/** Too short: one step, Weak. */
export const Weak: Story = { args: { value: "abc" } }

/** Long enough but a rule is unmet: two steps, Fair. */
export const Fair: Story = { args: { value: "abcdefgh1" } }

/** Every rule met: three steps, Good. */
export const Good: Story = { args: { value: "abcdefg1!" } }

/** Every rule met and four past the minimum: all four steps, Strong. */
export const Strong: Story = { args: { value: "correct-horse-7!" } }

/** Only the rules, for a screen that has no room for a bar; the verdict is still announced. */
export const RulesOnly: Story = { name: "Rules only", args: { value: "abcdefg1", display: "rules" } }

/** Only the bar and its verdict, for a screen that states the rules elsewhere. */
export const BarOnly: Story = { name: "Bar only", args: { value: "abcdefg1!", display: "bar" } }

/** The API's real numbers can differ: `policy` takes them (here 12 characters and no symbol). */
export const OwnPolicy: Story = { name: "Own policy", args: { value: "correct horse", policy: { minLength: 12, symbol: false } } }

function InRegister() {
  const [password, setPassword] = useState("")
  const [touched, setTouched] = useState(false)
  const empty = password.length === 0
  return (
    <div
      onBlur={(e) => {
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return
        setTouched(true)
      }}
    >
      <Field name="password" invalid={touched && empty}>
        <FieldLabel>Password</FieldLabel>
        <PasswordField required autoComplete="new-password" value={password} onValueChange={setPassword} />
        <FieldDescription>Pick one you don’t use anywhere else.</FieldDescription>
        <PasswordStrength value={password} />
      </Field>
    </div>
  )
}

/** Under the password Field, as Register and Set a new password use it; typing lights the rules and moves the verdict. */
export const InRegisterField: Story = {
  name: "In Register",
  render: () => <InRegister />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText("Password") as HTMLInputElement
    const live = verdict(canvasElement)
    const rule = (id: string) => canvasElement.querySelector(`[data-rule="${id}"]`)!
    await expect(live).toHaveAttribute("aria-live", "polite")
    await expect(live).toHaveTextContent("")

    await typeKeys(input, "abc")
    await expect(live).toHaveTextContent("Weak")
    await expect(rule("length")).not.toHaveAttribute("data-met")

    await typeKeys(input, "defgh")
    await expect(rule("length")).toHaveAttribute("data-met")
    await expect(rule("digit")).not.toHaveAttribute("data-met")
    await expect(live).toHaveTextContent("Fair")

    await typeKeys(input, "1")
    await expect(rule("digit")).toHaveAttribute("data-met")
    await expect(rule("symbol")).not.toHaveAttribute("data-met")

    await typeKeys(input, "!")
    await expect(rule("symbol")).toHaveAttribute("data-met")
    await expect(live).toHaveTextContent("Good")

    await typeKeys(input, "xyz")
    await expect(live).toHaveTextContent("Strong")
    await expect(canvasElement.querySelectorAll("[data-lit]")).toHaveLength(4)

    // Deleting back to nothing: no verdict, the rules unmet again.
    await typeKeys(input, "{Backspace}".repeat(input.value.length))
    await expect(live).toHaveTextContent("")
    await expect(canvasElement.querySelectorAll("[data-met]")).toHaveLength(0)
  },
}

/** At 375px wide the bar and verdict stay on one line and the rules stack. */
export const Phone: Story = {
  args: { value: "abcdefg1" },
  tags: ["!autodocs"],
  globals: { viewport: { value: "w375", isRotated: false } },
}
