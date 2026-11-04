import type { ReactNode } from "react"

import { cn } from "../../lib/utils"

/* @archetype Control (ARCHETYPES.md).
   Rich text values and their read-only display (R1-27). Server-safe: types, pure functions
   and a hook-free component; no Tiptap import, so displaying rich text costs nothing.

   The value is a ProseMirror JSON document (what Tiptap's getJSON() returns), never HTML, so
   the web never parses or injects stored markup and needs no HTML sanitizer. The allowed
   schema is small and the same everywhere: the editor can only produce it (rich-text-editor.tsx),
   this renderer only draws it (anything else is dropped, text kept), and the API validates
   stored values against it and produces HTML itself where it needs HTML (emails, PDFs).
   The schema as JSON Schema, for the API to validate with (R2-37):
   `@paige/ui/schemas/rich-text-value.schema.json` (src/schemas/). Change the types here and
   the schema together. */

export type RichTextMark = { type: "bold" } | { type: "italic" } | { type: "link"; attrs: { href: string } }

export type RichTextInline =
  | { type: "text"; text: string; marks?: RichTextMark[] }
  | { type: "hardBreak" }

export type RichTextParagraph = { type: "paragraph"; content?: RichTextInline[] }
export type RichTextListItem = { type: "listItem"; content: RichTextBlock[] }
export type RichTextList = { type: "bulletList" | "orderedList"; attrs?: { start?: number }; content: RichTextListItem[] }
export type RichTextBlock = RichTextParagraph | RichTextList

/** A rich text value: the editor's JSON document. */
export type RichTextValue = { type: "doc"; content?: RichTextBlock[] }

/* Values arrive from storage and the network, so every reader walks them defensively. */
type Loose = { type?: unknown; text?: unknown; content?: unknown; marks?: unknown; attrs?: unknown }
const children = (n: Loose): Loose[] => (Array.isArray(n.content) ? (n.content as Loose[]) : [])

/** The value as plain text: blocks on their own lines, list items prefixed. For previews,
    notifications and anywhere formatting can't show. */
export function richTextToPlainText(value: RichTextValue | null | undefined): string {
  if (!value) return ""
  const inline = (n: Loose): string =>
    n.type === "text" && typeof n.text === "string" ? n.text : n.type === "hardBreak" ? "\n" : children(n).map(inline).join("")
  const block = (n: Loose, prefix = ""): string[] => {
    if (n.type === "paragraph") return [prefix + children(n).map(inline).join("")]
    if (n.type === "bulletList" || n.type === "orderedList") {
      return children(n).flatMap((item, i) => {
        const marker = n.type === "bulletList" ? "• " : `${i + 1}. `
        return children(item).flatMap((b, j) => block(b, j === 0 ? prefix + marker : prefix + "   "))
      })
    }
    return children(n).flatMap((c) => block(c, prefix))
  }
  return children(value as Loose).flatMap((b) => block(b)).join("\n").trim()
}

/** True when the value has no text (an empty editor still holds one empty paragraph). */
export function isRichTextEmpty(value: RichTextValue | null | undefined): boolean {
  return richTextToPlainText(value).trim() === ""
}

/** A plain string as a rich text value (one paragraph per line). */
export function richTextFromPlainText(text: string): RichTextValue {
  return {
    type: "doc",
    content: text.split("\n").map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" })),
  }
}

const SAFE_SCHEMES = /^(https?:|mailto:|tel:)/i

/** The href to render for a stored link, or null to render its text only. Scheme-less
    addresses (as autolinked from "example.com") are treated as https. */
export function safeRichTextHref(href: unknown): string | null {
  if (typeof href !== "string") return null
  const h = href.trim()
  if (!h) return null
  if (SAFE_SCHEMES.test(h)) return h
  if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return null // javascript:, data:, vbscript:, anything else
  return `https://${h.replace(/^\/+/, "")}`
}

function renderInline(n: Loose, key: number): ReactNode {
  if (n.type === "hardBreak") return <br key={key} />
  if (n.type !== "text" || typeof n.text !== "string") return null
  let node: ReactNode = n.text
  const marks = Array.isArray(n.marks) ? (n.marks as Loose[]) : []
  for (const m of marks) {
    if (m.type === "bold") node = <strong>{node}</strong>
    else if (m.type === "italic") node = <em>{node}</em>
    else if (m.type === "link") {
      const href = safeRichTextHref((m.attrs as { href?: unknown } | undefined)?.href)
      if (href) node = <a href={href} target="_blank" rel="noopener noreferrer nofollow">{node}</a>
    }
  }
  return <span key={key}>{node}</span>
}

function renderBlock(n: Loose, key: number): ReactNode {
  switch (n.type) {
    case "paragraph":
      return <p key={key}>{children(n).map(renderInline)}</p>
    case "bulletList":
      return <ul key={key}>{children(n).map(renderItem)}</ul>
    case "orderedList": {
      const start = (n.attrs as { start?: unknown } | undefined)?.start
      return (
        <ol key={key} start={typeof start === "number" && start !== 1 ? start : undefined}>
          {children(n).map(renderItem)}
        </ol>
      )
    }
    default:
      // Unknown block: keep its text, drop its structure.
      return children(n).length ? <div key={key}>{children(n).map(renderBlock)}</div> : null
  }
}

function renderItem(n: Loose, key: number): ReactNode {
  return n.type === "listItem" ? <li key={key}>{children(n).map(renderBlock)}</li> : null
}

/** Read-only display of a rich text value, in the same text styles as the editor. */
export function RichText({ value, className }: { value: RichTextValue | null | undefined; className?: string }) {
  if (!value || value.type !== "doc") return null
  return <div className={cn("rich-text text-sm text-card-foreground", className)}>{children(value as Loose).map(renderBlock)}</div>
}
