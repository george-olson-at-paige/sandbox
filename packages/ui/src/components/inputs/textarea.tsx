"use client"

import type { ComponentProps } from "react"

import { cn } from "../../lib/utils"
import { Textarea as UiTextarea } from "../../base/textarea"
import { useFieldControl } from "../internal/field-context"
import { controlBox, controlFocus, controlInvalid, controlValue } from "../internal/control"
import { RichTextarea, type RichTextareaProps } from "../internal/rich-textarea"

/* @archetype Control (ARCHETYPES.md).
   Paige Textarea over upstream Textarea: grows with its content (field-sizing), 72px minimum.
   `format="rich"` (R1-27) makes it a rich text field with the same frame, focus, error and
   disabled looks, a small formatting toolbar, and a RichTextValue (JSON document) value instead
   of a string. The editor (Tiptap) is loaded only in the browser and only when a rich field
   mounts (rich-textarea.tsx), so plain textareas pay nothing. Show a stored value with
   RichText, and use richTextToPlainText for previews (rich-text.tsx). */
type PlainTextareaProps = Omit<ComponentProps<"textarea">, "style"> & { format?: "plain" }

/** Multi-line text that grows with its content; format="rich" for rich text. */
function Textarea(own: PlainTextareaProps | RichTextareaProps) {
  // Inside a Field: its id, description ids and error state (R7-03).
  const props = useFieldControl(own)
  if (props.format === "rich") return <RichTextarea {...props} />
  const { className, format: _format, ...rest } = props
  return (
    <UiTextarea
      className={cn(controlBox, "min-h-textarea py-2", controlValue, controlFocus, controlInvalid, className)}
      {...rest}
    />
  )
}

export { Textarea }
export type { PlainTextareaProps, RichTextareaProps }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type TextareaProps = ComponentProps<typeof Textarea>
