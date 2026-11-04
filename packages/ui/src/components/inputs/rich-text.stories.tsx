import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { RichText, type RichTextValue } from "./rich-text"

/* RichText (R1-27, R2-37): a rich text value (the editor's JSON document, never HTML) shown
   read-only, in the editor's own text styles. The editor itself is Textarea with format="rich"
   (Components › Inputs › Textarea). Links keep only http(s), mailto and tel (safeRichTextHref). */
const text = (t: string, marks?: { type: "bold" | "italic" }[]) => ({ type: "text" as const, text: t, ...(marks ? { marks } : {}) })

const memory: RichTextValue = {
  type: "doc",
  content: [
    { type: "paragraph", content: [text("Dad's garden was "), text("everything", [{ type: "bold" }]), text(" to him. He planted the roses the year we moved in.")] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [text("Water the tomatoes early")] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [text("Cut the roses back in "), text("March", [{ type: "italic" }])] }] },
      ],
    },
    { type: "paragraph", content: [text("His notes are in "), { type: "text", text: "the shared folder", marks: [{ type: "link", attrs: { href: "https://example.com/garden" } }] }, text(".")] },
  ],
}

const meta = {
  component: RichText,
  args: { value: memory },
} satisfies Meta<typeof RichText>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await expect(c.getByText("everything").tagName).toBe("STRONG")
    await expect(c.getAllByRole("listitem")).toHaveLength(2)
    await expect(c.getByRole("link", { name: "the shared folder" })).toHaveAttribute("href", "https://example.com/garden")
  },
}

/** A link that isn't http(s), mailto or tel shows as text. */
export const UnsafeLink: Story = {
  name: "Unsafe link · shown as text",
  args: { value: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Click here", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("link")).toBeNull()
    await expect(within(canvasElement).getByText("Click here")).toBeInTheDocument()
  },
}

export const Empty: Story = { name: "Empty (renders nothing)", args: { value: null } }
