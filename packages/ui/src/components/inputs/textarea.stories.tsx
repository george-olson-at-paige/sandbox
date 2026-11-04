import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Field, FieldLabel } from "../../forms/field"
import { RichText, richTextToPlainText, type RichTextValue } from "./rich-text"
import { Textarea, type PlainTextareaProps } from "./textarea"

/* Textarea: plain (default) or rich (`format="rich"`, R1-27). Rich fields hold a RichTextValue
   (the editor's JSON document, never HTML); RichText draws one read-only and
   richTextToPlainText gives a preview string. The editor loads only when a rich field mounts.
   Which to use (ADR 0038): plain for facts that must read back exactly (wishes, medical,
   account notes); rich for writing meant to carry voice for someone else (messages, memories). */
const meta: Meta<PlainTextareaProps> = {
  component: Textarea as (props: PlainTextareaProps) => ReturnType<typeof Textarea>,
  args: { "aria-label": "Funeral wishes", placeholder: "Anything you want people to know" },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
}

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { name: "Empty (placeholder)" }
export const Filled: Story = { args: { defaultValue: "A small service by the ocean. Play the Buena Vista Social Club." } }
export const LongContent: Story = {
  name: "Long content (grows with field-sizing)",
  args: {
    defaultValue:
      "A small service by the ocean, close family and friends only.\n\nPlease no lilies. Sunflowers if you can find them.\n\nI'd like Daniel to read something, but only if he wants to. Elena should not feel she has to speak.\n\nDonations to the animal shelter on 5th Street instead of flowers.",
  },
}
export const Error: Story = { name: "Error (aria-invalid)", args: { "aria-invalid": true } }
export const Disabled: Story = { args: { disabled: true, defaultValue: "Locked while your delegate reviews it." } }

const WISHES: RichTextValue = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "A " },
        { type: "text", text: "small", marks: [{ type: "bold" }] },
        { type: "text", text: " service by the ocean, " },
        { type: "text", text: "close family and friends only", marks: [{ type: "italic" }] },
        { type: "text", text: "." },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "No lilies. Sunflowers if you can find them." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Daniel reads, only if he wants to." }] }] },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Donations to the " },
        { type: "text", text: "animal shelter", marks: [{ type: "link", attrs: { href: "https://example.org/shelter" } }] },
        { type: "text", text: " instead of flowers." },
      ],
    },
  ],
}

function RichField(props: { value?: RichTextValue; invalid?: boolean; disabled?: boolean; inField?: boolean }) {
  const [value, setValue] = useState<RichTextValue | undefined>(props.value)
  return (
    <Textarea
      format="rich"
      // Inside a Field the FieldLabel names it (R2-32); standalone it needs its own name.
      aria-label={props.inField ? undefined : "Message"}
      placeholder="Write something for them to read later"
      value={value}
      onChange={setValue}
      aria-invalid={props.invalid}
      disabled={props.disabled}
    />
  )
}

export const PlainVsRich: Story = {
  name: "Plain and rich side by side",
  decorators: [(S) => <div className="max-w-3xl"><S /></div>],
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="t-plain">
        <FieldLabel>Plain</FieldLabel>
        <Textarea placeholder="Anything you want people to know" defaultValue={richTextToPlainText(WISHES)} />
      </Field>
      <Field>
        <FieldLabel>Rich</FieldLabel>
        <RichField value={WISHES} inField />
      </Field>
    </div>
  ),
}

/** Rich in a Field: the label names it, a click on it focuses it. */
export const RichInField: Story = {
  name: "Rich · in a Field",
  tags: ["r2-32", "gaps-81"],
  decorators: [(S) => <div className="max-w-md"><S /></div>],
  render: () => (
    <Field>
      <FieldLabel>Funeral wishes</FieldLabel>
      <RichField inField />
    </Field>
  ),
}

export const RichEmpty: Story = { name: "Rich · empty (placeholder)", render: () => <RichField /> }
export const RichFilled: Story = { name: "Rich · filled", render: () => <RichField value={WISHES} /> }
export const RichError: Story = { name: "Rich · error (aria-invalid)", render: () => <RichField invalid /> }
export const RichDisabled: Story = { name: "Rich · disabled", render: () => <RichField value={WISHES} disabled /> }

/* Edit on the left; the read-only renderer, the plain-text preview and the stored JSON follow. */
function LiveValue() {
  const [value, setValue] = useState<RichTextValue>(WISHES)
  return (
    <div className="flex flex-col gap-4">
      <Textarea format="rich" aria-label="Message" value={value} onChange={setValue} />
      <div className="flex flex-col gap-1">
        <span className="eyebrow">RichText (read-only)</span>
        <RichText value={value} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="eyebrow">richTextToPlainText</span>
        <p className="text-sm whitespace-pre-line text-card-foreground">{richTextToPlainText(value)}</p>
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Stored value (JSON)</summary>
        <pre className="mt-2 overflow-auto">{JSON.stringify(value, null, 2)}</pre>
      </details>
    </div>
  )
}

/** Read-only renderer (RichText) and plain-text preview. */
export const ReadOnlyRenderer: Story = {
  name: "Renderer · and plain text",
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
  render: () => <LiveValue />,
}

/* The renderer draws only the allowed schema: unknown nodes keep their text, unsafe links
   render as text. */
export const RendererDropsUnknown: Story = {
  name: "Renderer · unsafe content",
  render: () => (
    <RichText
      value={
        {
          type: "doc",
          content: [
            { type: "heading", content: [{ type: "paragraph", content: [{ type: "text", text: "A heading arrives as plain text." }] }] },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "This link is dropped", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
                { type: "text", text: "; this one is kept: " },
                { type: "text", text: "example.org", marks: [{ type: "link", attrs: { href: "example.org" } }] },
              ],
            },
          ],
        } as unknown as RichTextValue
      }
    />
  ),
}
