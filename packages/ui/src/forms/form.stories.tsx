import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Input } from "../components/inputs/input"
import { Field, FieldDescription, FieldError, FieldLabel } from "./field"
import { FieldGroup } from "./field-group"
import { PhoneField } from "./fields/phone-field"
import { formResultFromApi } from "./api-errors"
import { Form, type FieldErrors, type FormResult } from "./form"
import { formMessages } from "./messages"
import { FormFooter } from "./form-footer"
import { FormSection } from "./form-section"
import { leave, typeKeys } from "../stories/typing"

/* Form owns the submit (R7-03): pending, no double submit, field errors from three sources
   (the field's own, validate, the server's) and an ErrorSummary that takes focus on failure. */
const meta = {
  component: Form,
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  tags: ["r7-03", "r8-01", "gaps-102", "r9-02", "gaps-107", "r10-13", "gaps-114", "r8-02", "gaps-103"],
} satisfies Meta

export default meta
type Story = StoryObj

type Details = { legalName: string; mobile: string; email: string }
const empty: Details = { legalName: "", mobile: "", email: "" }
const required = (v: Details): FieldErrors => ({ legalName: v.legalName.trim() ? undefined : "Enter your legal name." })

function DetailsForm({
  onSubmit,
  initial = empty,
  warnUnsaved,
  leaveLink,
}: {
  onSubmit: (v: Details) => FormResult | Promise<FormResult>
  initial?: Details
  warnUnsaved?: boolean
  leaveLink?: boolean
}) {
  const [v, setV] = useState(initial)
  const [saved, setSaved] = useState(false)
  return (
    <Form
      values={v}
      validate={required}
      warnUnsaved={warnUnsaved}
      onSubmit={async (values) => {
        const r = await onSubmit(values)
        if (!r) setSaved(true)
        return r
      }}
    >
      <FieldGroup>
        <Field name="legalName">
          <FieldLabel>Legal name</FieldLabel>
          <Input value={v.legalName} onChange={(e) => setV({ ...v, legalName: e.target.value })} />
          <FieldDescription>This is the name on your ID.</FieldDescription>
          <FieldError />
        </Field>
        <Field name="mobile" span={6}>
          <FieldLabel>Mobile number</FieldLabel>
          <PhoneField value={v.mobile} onValueChange={(mobile) => setV({ ...v, mobile })} />
          <FieldError />
        </Field>
      </FieldGroup>
      <FormSection title="How we reach you">
        <Field name="email">
          <FieldLabel>Email</FieldLabel>
          <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          <FieldError />
        </Field>
      </FormSection>
      <FormFooter submitLabel="Save my details" />
      {saved && <p className="mt-4 text-sm font-medium" role="status">Saved.</p>}
      {leaveLink && <a href="/elsewhere" className="mt-4 text-sm font-medium underline">Go to the Vault home</a>}
    </Form>
  )
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
/** The ErrorSummary once it shows (its Callout is role="alert"; FieldErrors are alerts too). */
const findSummary = (el: HTMLElement) =>
  waitFor(() => {
    const s = el.querySelector<HTMLElement>('[data-slot="error-summary"]')
    if (!s) throw new Error("no ErrorSummary yet")
    return s
  })

export const Default: Story = {
  render: () => <DetailsForm onSubmit={() => wait(600)} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const name = c.getByRole("textbox", { name: "Legal name" })
    // Field wires the control: label → id, description → aria-describedby.
    await waitFor(() => {
      const ids = (name.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean)
      expect(ids.map((id) => canvasElement.ownerDocument.getElementById(id)?.textContent)).toContain("This is the name on your ID.")
    })
  },
}

export const ErrorSummaryFocus: Story = {
  name: "Failed submit: ErrorSummary",
  render: () => <DetailsForm onSubmit={() => {}} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const mobile = c.getByRole("textbox", { name: "Mobile number" })
    await typeKeys(mobile, "555")
    await leave(mobile)
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    const summary = await findSummary(canvasElement)
    await expect(within(summary).getByRole("alert")).toHaveTextContent("Check these and try again")
    await waitFor(() => expect(summary).toHaveFocus())
    // Both problems are listed; each link focuses its field.
    await userEvent.click(within(summary).getByRole("link", { name: "Enter your legal name." }))
    await expect(c.getByRole("textbox", { name: "Legal name" })).toHaveFocus()
    await expect(c.getByRole("textbox", { name: "Legal name" })).toHaveAttribute("aria-invalid", "true")
    await userEvent.click(within(summary).getAllByRole("link")[1])
    await expect(mobile).toHaveFocus()
  },
}

export const Pending: Story = {
  name: "Pending (saving)",
  render: () => <DetailsForm initial={{ ...empty, legalName: "Maya Elena Reyes" }} onSubmit={() => new Promise(() => {})} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    const button = await c.findByRole("button", { name: /saving/i })
    await expect(button).toBeDisabled()
  },
}

export const ServerErrors: Story = {
  name: "Server field errors",
  render: () => (
    <DetailsForm
      initial={{ legalName: "Maya Elena Reyes", mobile: "", email: "maya@example" }}
      onSubmit={async () => {
        await wait(300)
        return { errors: { email: "That email address doesn’t have a domain we can deliver to." } }
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    await findSummary(canvasElement)
    const email = c.getByRole("textbox", { name: "Email" })
    await expect(email).toHaveAttribute("aria-invalid", "true")
    await expect(email).toHaveValue("maya@example")
  },
}

export const Failure: Story = {
  name: "Save failed (retry)",
  render: () => (
    <DetailsForm
      initial={{ legalName: "Maya Elena Reyes", mobile: "", email: "" }}
      onSubmit={async () => {
        await wait(300)
        throw new Error("503 from upstream")
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    const summary = await findSummary(canvasElement)
    await expect(summary).toHaveTextContent("Your answers are still here")
    await expect(summary).not.toHaveTextContent("503")
    await expect(c.getByRole("button", { name: "Save my details" })).toBeEnabled()
  },
}

/** Stubs window.confirm for one play; returns the messages it was asked and a restore. */
function stubConfirm(answer: boolean) {
  const asked: string[] = []
  const original = window.confirm
  window.confirm = (m?: string) => {
    asked.push(String(m))
    return answer
  }
  return { asked, restore: () => (window.confirm = original) }
}
const beforeUnloadBlocked = () => {
  const e = new Event("beforeunload", { cancelable: true })
  window.dispatchEvent(e)
  return e.defaultPrevented
}

export const UnsavedChanges: Story = {
  name: "Unsaved changes warn on leave",
  render: () => <DetailsForm initial={{ ...empty, legalName: "Maya Elena Reyes" }} onSubmit={() => wait(200)} leaveLink />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    // Untouched: nothing to warn about.
    await expect(beforeUnloadBlocked()).toBe(false)
    const name = c.getByRole("textbox", { name: "Legal name" })
    await typeKeys(name, " Jr")
    // Dirty: a tab close or reload asks (the browser's own prompt).
    await waitFor(() => expect(beforeUnloadBlocked()).toBe(true))
    // A link to another page asks our words, and staying keeps the page and the input.
    const confirm = stubConfirm(false)
    try {
      const link = c.getByRole("link", { name: "Go to the Vault home" })
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })
      link.dispatchEvent(click)
      await expect(confirm.asked).toEqual([formMessages.unsaved])
      await expect(click.defaultPrevented).toBe(true)
      await expect(name).toHaveValue("Maya Elena Reyes Jr")
    } finally {
      confirm.restore()
    }
    // Typing it back to where it started is not a change.
    await userEvent.clear(name)
    await typeKeys(name, "Maya Elena Reyes")
    await waitFor(() => expect(beforeUnloadBlocked()).toBe(false))
    // After a successful save the saved values are the new start.
    await typeKeys(name, " Jr")
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    await c.findByRole("status")
    await expect(beforeUnloadBlocked()).toBe(false)
  },
}

/** Waits for the next popstate (a real history move). */
const nextPopState = () => new Promise<void>((resolve) => window.addEventListener("popstate", () => resolve(), { once: true }))
const onGuardEntry = () => Boolean((window.history.state as Record<string, unknown> | null)?.__paigeUnsavedGuard)

export const BackAndForward: Story = {
  name: "Unsaved changes: Back asks",
  render: () => <DetailsForm initial={{ ...empty, legalName: "Maya Elena Reyes" }} onSubmit={() => {}} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const url = window.location.href
    const name = c.getByRole("textbox", { name: "Legal name" })
    await expect(onGuardEntry()).toBe(false)
    await typeKeys(name, " Jr")
    // Dirty: a guard entry for this same page sits on top of the history.
    await waitFor(() => expect(onGuardEntry()).toBe(true))
    const stay = stubConfirm(false)
    try {
      // Back takes us off the guard onto this same page, then asks; staying puts the guard back.
      const moved = nextPopState()
      window.history.back()
      await moved
      await expect(stay.asked).toEqual([formMessages.unsaved])
      await waitFor(() => expect(onGuardEntry()).toBe(true))
      await expect(window.location.href).toBe(url)
      await expect(name).toHaveValue("Maya Elena Reyes Jr")
    } finally {
      stay.restore()
    }
    // Leaving goes back once more, for real (stubbed here, so the story stays put).
    const leave = stubConfirm(true)
    const realBack = window.history.back.bind(window.history)
    let wentBack = 0
    try {
      const moved = nextPopState()
      window.history.back = () => void (wentBack += 1)
      realBack()
      await moved
      await expect(leave.asked).toEqual([formMessages.unsaved])
      await expect(wentBack).toBe(1)
    } finally {
      window.history.back = realBack
      leave.restore()
    }
  },
}

/** Unsaved changes: a save takes the guard entry off. */
export const SaveDropsTheGuard: Story = {
  name: "Unsaved · a save drops the guard",
  render: () => <DetailsForm initial={{ ...empty, legalName: "Maya Elena Reyes" }} onSubmit={() => wait(100)} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    const name = c.getByRole("textbox", { name: "Legal name" })
    await typeKeys(name, " Jr")
    await waitFor(() => expect(onGuardEntry()).toBe(true))
    // Submit: the guard entry comes off before onSubmit runs (a navigating onSubmit then pushes
    // over this page's own entry), and no "unsaved" question is asked on the way.
    const confirm = stubConfirm(false)
    try {
      await userEvent.click(c.getByRole("button", { name: "Save my details" }))
      await c.findByRole("status")
      await expect(onGuardEntry()).toBe(false)
      await expect(confirm.asked).toEqual([])
    } finally {
      confirm.restore()
    }
  },
}

export const Autosave: Story = {
  name: "Unsaved warning off (autosave)",
  render: () => <DetailsForm onSubmit={() => {}} warnUnsaved={false} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await typeKeys(c.getByRole("textbox", { name: "Legal name" }), "Maya")
    await expect(beforeUnloadBlocked()).toBe(false)
  },
}

/* R8-02: an onSubmit that posts to the API and maps its error body with formResultFromApi. The
   bodies are what the API's error boundary writes (ErrorResponse: status, correlationId, errors[]
   of { code, message, type }). */
const apiResponses = {
  input: {
    status: 400,
    body: {
      status: 400,
      correlationId: "4bf92f3577b34da6a3ce929d0e0e4736",
      errors: [
        { code: "legalName.notNullOrWhiteSpace", message: "Legal name is required.", type: "input", rule: "" },
        { code: "email.emailAddress", message: "Email must be a valid email address.", type: "input", rule: "" },
      ],
    },
  },
  business: {
    status: 409,
    body: {
      status: 409,
      correlationId: "0af7651916cd43dd8448eb211c80319c",
      errors: [{ code: "email_in_use", message: "That email is already used by another account.", type: "business", rule: "EmailInUse" }],
    },
  },
} as const

export const ApiFieldErrors: Story = {
  name: "API errors (400 input, mapped)",
  render: () => (
    <DetailsForm
      initial={{ legalName: "Maya", mobile: "", email: "maya@example" }}
      onSubmit={async () => {
        await wait(200)
        const { status, body } = apiResponses.input
        return formResultFromApi(status, body)
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    const summary = await findSummary(canvasElement)
    await expect(summary).toHaveTextContent("Legal name is required.")
    await expect(summary).toHaveTextContent("Email must be a valid email address.")
    await expect(c.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true")
  },
}

/** API errors (409 business, owned by a field) */
export const ApiBusinessError: Story = {
  name: "API errors · 409 on a field",
  render: () => (
    <DetailsForm
      initial={{ legalName: "Maya Elena Reyes", mobile: "", email: "maya@example.com" }}
      onSubmit={async () => {
        await wait(200)
        const { status, body } = apiResponses.business
        return formResultFromApi(status, body, { fields: { email_in_use: "email" } })
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole("button", { name: "Save my details" }))
    await findSummary(canvasElement)
    const email = c.getByRole("textbox", { name: "Email" })
    await expect(email).toHaveAttribute("aria-invalid", "true")
    await expect(email).toHaveAccessibleDescription(/already used by another account/)
  },
}
