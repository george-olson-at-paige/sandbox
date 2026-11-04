import type { ComponentType, ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import { formatDateLong } from "../lib/dates"
import { formatMoney, PHONE_US, renderMask } from "../lib/mask"
import { CurrencyField } from "./fields/currency-field"
import { DateField } from "./fields/date-field"
import { PhoneField } from "./fields/phone-field"
import { InlineEdit, type InlineEditControlProps, type InlineEditResult } from "./inline-edit"
import { enter, typeKeys } from "../stories/typing"

/* InlineEdit (R11-04, R20-06): read state → edit state, Save then Cancel (sm) at the control's right
   for an input or select and under it for a textarea, Enter saves (Ctrl/⌘+Enter in a textarea), Escape
   cancels, focus back on the read button; pending, error and "Saved" in place; a switch saves
   on the flip with no Save. The rationale is REVIEW-11 R11-04 and the component's header. */
/** InlineEdit's props flattened for Storybook's args (its real props are a union on `control`). */
type Args = {
  label: string
  hideLabel?: boolean
  control?: "input" | "select" | "textarea" | "field" | "switch"
  defaultValue?: string | boolean
  defaultEditing?: boolean
  options?: Array<[string, string]>
  placeholder?: string
  actions?: "inline" | "below"
  formatValue?: (value: string) => ReactNode
  renderControl?: (c: InlineEditControlProps) => ReactNode
  onSave: (value: never) => InlineEditResult | Promise<InlineEditResult>
  onCancel?: () => void
}

const meta = {
  component: InlineEdit as unknown as ComponentType<Args>,
  args: { label: "Full legal name", defaultValue: "Maya Elena Reyes", onSave: fn() },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
  tags: ["r11-04", "r20-06", "r12-04", "gaps-123", "r4-17", "gaps-91"],
  parameters: {
    docs: {
      description: {
        component: [
          "Edit one value where it's shown. **Read**: the label, then the value as a button (a pencil at its end). **Edit**: the control in the same box, so the value doesn't move; Save then Cancel (`sm`) sit at the control's right on one row (`actions=\"inline\"`, the default for an input and a select); a textarea, whose box is tall, keeps them under it (`below`).",
          "",
          "- **Keys**: Enter saves (Textarea: Enter is a new line, Ctrl/⌘+Enter saves); Escape cancels and restores the saved value; focus returns to the read button after either. Blur never saves.",
          "- **Pending**: onSave returns a promise; Save says “Saving…”, the actions are aria-disabled and a second save does nothing.",
          "- **Error**: onSave returns `{ error }` or rejects; the message shows under the control, the typed value stays, focus goes back to it, Save is ready to retry.",
          "- **Success**: the read state with the new value and “Saved” in place for a moment (announced). No banner.",
          "- **Switch**: saves on the flip (a switch means “now”), so no Save or Cancel; a failure flips it back and says why.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const STATUS: Array<[string, string]> = [["married", "Married"], ["single", "Single"], ["widowed", "Widowed"]]
const phoneText = (v: string) => renderMask(PHONE_US, v.replace(/^\+1/, "")).text

/** Every control InlineEdit hosts, as a settings list would show them. */
export const EveryControl: Story = {
  name: "Every control it hosts",
  render: () => (
    <div className="flex flex-col gap-4">
      <InlineEdit label="Full legal name" defaultValue="Maya Elena Reyes" onSave={() => {}} />
      <InlineEdit label="Marital status" control="select" defaultValue="married" options={STATUS} onSave={() => {}} />
      <InlineEdit label="Funeral wishes" control="textarea" defaultValue={"A small service by the ocean.\nNo lilies."} onSave={() => {}} />
      <InlineEdit label="Date signed" control="field" defaultValue="2026-03-04" formatValue={formatDateLong} renderControl={(c) => <DateField presentation="typed" {...c} />} onSave={() => {}} />
      <InlineEdit label="Mobile number" control="field" defaultValue="+15551234567" formatValue={phoneText} renderControl={(c) => <PhoneField {...c} />} onSave={() => {}} />
      <InlineEdit
        label="Monthly payment"
        control="field"
        defaultValue="123450"
        formatValue={(v) => formatMoney(Number(v))}
        renderControl={({ value, onValueChange, onValidate: _v, ...c }) => (
          <CurrencyField {...c} value={value === "" ? null : Number(value)} onValueChange={(m) => onValueChange(m === null ? "" : String(m))} />
        )}
        onSave={() => {}}
      />
      <InlineEdit label="Share with my executor" control="switch" defaultValue onSave={() => {}} />
    </div>
  ),
}

export const ReadFilled: Story = { name: "Read · filled" }
/** R12-04: the value lines up with the label, and the typed text starts exactly where the value was. */
export const AlignedWithLabel: Story = {
  name: "Read · value aligned with the label",
  decorators: [(S) => <div className="px-4"><S /></div>],
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const label = canvasElement.querySelector('[data-slot="inline-edit"] [data-slot="eyebrow"]')!
    /** Where an element's first text starts on screen. */
    const textLeft = (el: Element) => {
      const text = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())!
      const range = el.ownerDocument.createRange()
      range.selectNodeContents(text)
      return Math.round(range.getBoundingClientRect().left)
    }
    const read = c.getByRole("button", { name: /^Maya Elena Reyes/ })
    const valueLeft = textLeft(read.querySelector("span")!)
    // Within the control's 1px border: the pull is the 12px padding (the step grid has no 13).
    await expect(Math.abs(valueLeft - textLeft(label))).toBeLessThanOrEqual(1)
    await userEvent.click(read)
    const input = c.getByRole("textbox", { name: "Full legal name" })
    const cs = getComputedStyle(input)
    const typedLeft = Math.round(input.getBoundingClientRect().left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft))
    await expect(typedLeft).toBe(valueLeft)
  },
}
export const ReadEmpty: Story = { name: "Read · empty", args: { defaultValue: "" } }
export const Editing: Story = { name: "Editing · input", args: { defaultEditing: true } }

/** R20-06: the default for an input: Save and Cancel on the control's row, at its right, centred on it. */
export const InlineActions: Story = {
  name: "Actions · inline (the default)",
  args: { defaultEditing: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const input = c.getByRole("textbox", { name: "Full legal name" })
    const save = c.getByRole("button", { name: "Save" })
    const cancel = c.getByRole("button", { name: "Cancel" })
    const box = input.getBoundingClientRect()
    const s = save.getBoundingClientRect()
    const x = cancel.getBoundingClientRect()
    // Same row: the buttons' centre lines are the control's, give or take a pixel.
    await expect(Math.abs(s.top + s.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(2)
    // To its right, Save before Cancel, and the control is shorter than the column.
    await expect(s.left).toBeGreaterThanOrEqual(box.right)
    await expect(x.left).toBeGreaterThan(s.right)
    await expect(box.width).toBeLessThan(canvasElement.querySelector("[data-slot=\"inline-edit\"]")!.getBoundingClientRect().width)
  },
}

/** R20-06: a select takes the same row. */
export const InlineActionsSelect: Story = {
  name: "Actions · inline (select)",
  args: { label: "Marital status", control: "select", defaultValue: "married", options: STATUS, defaultEditing: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const trigger = c.getByRole("combobox", { name: "Marital status" })
    const save = c.getByRole("button", { name: "Save" })
    await expect(save.getBoundingClientRect().left).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().right)
  },
}

/** R20-06: `actions="below"` puts them under the control, left-aligned, as before. */
export const BelowActions: Story = {
  name: "Actions · below",
  args: { defaultEditing: true, actions: "below" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const input = c.getByRole("textbox", { name: "Full legal name" })
    await expect(c.getByRole("button", { name: "Save" }).getBoundingClientRect().top).toBeGreaterThanOrEqual(input.getBoundingClientRect().bottom)
  },
}
export const SelectEditing: Story = {
  name: "Editing · select",
  args: { label: "Marital status", control: "select", defaultValue: "married", options: STATUS, defaultEditing: true },
}
export const TextareaEditing: Story = {
  name: "Editing · textarea (actions below)",
  args: { label: "Funeral wishes", control: "textarea", defaultValue: "A small service by the ocean.", defaultEditing: true },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const box = c.getByRole("textbox", { name: "Funeral wishes" })
    // A textarea is always below, even when asked for inline.
    await expect(c.getByRole("button", { name: "Save" }).getBoundingClientRect().top).toBeGreaterThanOrEqual(box.getBoundingClientRect().bottom)
  },
}
export const FieldEditing: Story = {
  name: "Editing · typed field (DateField)",
  tags: ["r4-12"],
  args: { label: "Date signed", control: "field", defaultValue: "2026-03-04", formatValue: formatDateLong, renderControl: (c) => <DateField presentation="typed" {...c} />, defaultEditing: true },
}

/** Read → edit → Enter saves → read with "Saved", focus back on the read button. */
export const EnterSaves: Story = {
  name: "Enter saves",
  args: { onSave: fn() },
  play: async ({ args, canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: /Maya Elena Reyes\s*, Edit Full legal name/ }))
    const input = c.getByRole("textbox", { name: "Full legal name" })
    await expect(input).toHaveFocus()
    await typeKeys(input, " Jr")
    await userEvent.keyboard("{Enter}")
    await expect(args.onSave).toHaveBeenCalledWith("Maya Elena Reyes Jr")
    const read = await c.findByRole("button", { name: /Maya Elena Reyes Jr\s*, Edit/ })
    await waitFor(() => expect(read).toHaveFocus())
    await expect(c.getByRole("status")).toHaveTextContent("Saved")
  },
}

/** Escape puts the saved value back and returns focus. */
export const EscapeCancels: Story = {
  name: "Escape cancels",
  args: { onSave: fn(), onCancel: fn() },
  play: async ({ args, canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: /Edit Full legal name/ }))
    const input = c.getByRole("textbox", { name: "Full legal name" })
    await typeKeys(input, "xyz")
    await userEvent.keyboard("{Escape}")
    await expect(args.onCancel).toHaveBeenCalled()
    await expect(args.onSave).not.toHaveBeenCalled()
    const read = c.getByRole("button", { name: /^Maya Elena Reyes\s*, Edit/ })
    await waitFor(() => expect(read).toHaveFocus())
  },
}

/** onSave returns a promise that doesn't settle: the pending state stays on screen. */
export const Pending: Story = {
  name: "Pending (saving)",
  args: { defaultEditing: true, onSave: fn(() => new Promise<InlineEditResult>(() => {})) },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save" }))
    const saving = await c.findByRole("button", { name: "Saving…" })
    await expect(saving).toHaveAttribute("aria-disabled", "true")
    await expect(c.getByRole("button", { name: "Cancel" })).toHaveAttribute("aria-disabled", "true")
    await expect(c.getByRole("textbox", { name: "Full legal name" })).toHaveAttribute("readonly")
  },
}

/** The save fails: the message under the control, the typed value kept, Save ready again. */
export const SaveError: Story = {
  name: "Error (the value is kept)",
  args: {
    defaultEditing: true,
    onSave: fn(async (): Promise<InlineEditResult> => {
      await wait(300)
      return { error: "That name is longer than the will allows (80 characters)." }
    }),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const input = c.getByRole("textbox", { name: "Full legal name" })
    await typeKeys(input, " Reyes-Okafor")
    await userEvent.click(c.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"))
    await expect(input).toHaveAccessibleDescription("That name is longer than the will allows (80 characters).")
    await expect(input).toHaveValue("Maya Elena Reyes Reyes-Okafor")
    await waitFor(() => expect(input).toHaveFocus())
    await expect(c.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-disabled")
  },
}

const LONG =
  "Maya Elena Reyes de la Cruz Okafor-Lindqvist, also known as Maya Reyes, as written on her passport and the deed to the house on Alder Street"

export const LongValue: Story = { name: "Long value (read wraps)", args: { label: "Full legal name", defaultValue: LONG } }
export const LongValueEditing: Story = { name: "Long value · editing", args: { label: "Full legal name", defaultValue: LONG, defaultEditing: true } }

/** A phone's width: the value wraps; an input's Save and Cancel stay on its row while it keeps 12rem, a textarea's stay under it. */
export const Narrow: Story = {
  name: "Narrow (320px)",
  decorators: [(S) => <div className="w-80"><S /></div>],
  render: () => (
    <div className="flex flex-col gap-4">
      <InlineEdit label="Full legal name" defaultValue={LONG} onSave={() => {}} />
      <InlineEdit label="Funeral wishes" control="textarea" defaultValue="A small service by the ocean." defaultEditing onSave={() => {}} />
      <InlineEdit label="Share with my executor" control="switch" onSave={() => {}} />
    </div>
  ),
}

/** Select keys (R4-17): with a value chosen and the list closed, Enter saves; Escape cancels. */
export const SelectKeys: Story = {
  name: "Select · Enter saves, Escape cancels",
  args: { label: "Marital status", control: "select", defaultValue: "married", options: STATUS, defaultEditing: true, onSave: fn(), onCancel: fn() },
  play: async ({ args, canvasElement }) => {
    const c = within(canvasElement)
    const trigger = c.getByRole("combobox", { name: "Marital status" })
    await enter(trigger)
    await userEvent.keyboard("{Enter}")
    await expect(args.onSave).toHaveBeenCalledWith("married")
    // Saved: back to the read state showing the option's label.
    await c.findByRole("button", { name: /^Married\s*, Edit Marital status/ })
  },
}

/** Textarea: Enter adds a line; Ctrl+Enter saves. */
export const TextareaKeys: Story = {
  name: "Textarea · Ctrl+Enter saves",
  args: { label: "Funeral wishes", control: "textarea", defaultValue: "A small service.", defaultEditing: true, onSave: fn() },
  play: async ({ args, canvasElement }) => {
    const box = within(canvasElement).getByRole("textbox", { name: "Funeral wishes" })
    await enter(box)
    await userEvent.keyboard("{Enter}")
    await expect(args.onSave).not.toHaveBeenCalled()
    await userEvent.keyboard("{Control>}{Enter}{/Control}")
    await expect(args.onSave).toHaveBeenCalled()
  },
}

/* The switch: saves on the flip; no Save, no Cancel. */
export const SwitchSaves: Story = {
  name: "Switch · saves on the flip",
  args: { label: "Share with my executor", control: "switch", defaultValue: false, onSave: fn() },
  play: async ({ args, canvasElement }) => {
    const c = within(canvasElement)
    const sw = c.getByRole("switch", { name: "Share with my executor" })
    await userEvent.click(sw)
    await expect(args.onSave).toHaveBeenCalledWith(true)
    await expect(sw).toHaveAttribute("aria-checked", "true")
    await expect(c.queryByRole("button", { name: "Save" })).toBeNull()
    await expect(c.getByRole("status")).toHaveTextContent("Saved")
  },
}

export const SwitchPending: Story = {
  name: "Switch · pending",
  args: { label: "Share with my executor", control: "switch", defaultValue: false, onSave: fn(() => new Promise<InlineEditResult>(() => {})) },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("switch", { name: "Share with my executor" }))
    await expect(c.getByRole("switch", { name: "Share with my executor" })).toHaveAttribute("aria-busy", "true")
  },
}

export const SwitchError: Story = {
  name: "Switch · error flips it back",
  args: {
    label: "Share with my executor",
    control: "switch",
    defaultValue: false,
    onSave: fn(async (): Promise<InlineEditResult> => {
      await wait(300)
      return { error: "Add an executor first, then share with them." }
    }),
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const sw = c.getByRole("switch", { name: "Share with my executor" })
    await userEvent.click(sw)
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"))
    await expect(sw).toHaveAccessibleDescription("Add an executor first, then share with them.")
  },
}

/** R20-06 at 375: the inline row (an input, a select) and the textarea's below row on a phone. */
export const Phone: Story = {
  name: "Phone (375px)",
  tags: ["!autodocs"],
  globals: { viewport: { value: "w375", isRotated: false } },
  render: () => (
    <div className="flex flex-col gap-4">
      <InlineEdit label="Full legal name" defaultValue="Maya Elena Reyes" defaultEditing onSave={() => {}} />
      <InlineEdit label="Marital status" control="select" defaultValue="married" options={STATUS} defaultEditing onSave={() => {}} />
      <InlineEdit label="Funeral wishes" control="textarea" defaultValue="A small service by the ocean." defaultEditing onSave={() => {}} />
    </div>
  ),
}
