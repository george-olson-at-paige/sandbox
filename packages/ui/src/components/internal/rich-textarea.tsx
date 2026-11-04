"use client"

import { lazy, Suspense, useEffect, useState } from "react"

import { cn } from "../../lib/utils"
import { richTextArea, richTextShell, richTextToolbar } from "./control"
import { useFieldContext } from "./field-context"
import { RichText, type RichTextValue } from "../inputs/rich-text"

/* The rich Textarea's loader (R1-27). Tiptap lives in rich-text-editor.tsx and is fetched with
   a dynamic import the first time a rich Textarea mounts in the browser, so plain textareas and
   pages without one never download it, and the server never runs it. Until it arrives the
   field shows the same frame, an empty toolbar row and the current value drawn by RichText,
   so nothing moves when the editor takes over. */
const RichTextEditor = lazy(() => import("./rich-text-editor"))

export type RichTextareaProps = {
  format: "rich"
  /** Controlled value (the editor's JSON document). */
  value?: RichTextValue
  /** Uncontrolled starting value. */
  defaultValue?: RichTextValue
  onChange?: (value: RichTextValue) => void
  placeholder?: string
  disabled?: boolean
  /** Given to the editable area. Inside a Field the FieldLabel names it automatically
      (aria-labelledby from the Field's context) and a click on the label focuses it (R2-32);
      outside a Field, pass aria-label or aria-labelledby. */
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  className?: string
}

function RichTextareaFallback({ value, placeholder, disabled, className, ...aria }: RichTextareaProps) {
  return (
    <div
      data-slot="textarea"
      data-format="rich"
      data-invalid={aria["aria-invalid"] ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      aria-busy
      className={cn(richTextShell, className)}
    >
      <div className={richTextToolbar} />
      <div className={richTextArea}>
        {value ? <RichText value={value} className="text-base md:text-sm" /> : <p className="font-normal text-placeholder">{placeholder}</p>}
      </div>
    </div>
  )
}

function RichTextarea(rest: RichTextareaProps) {
  const field = useFieldContext()
  // The Field's label names the editor unless the caller named it (R2-32).
  const props: RichTextareaProps = {
    ...rest,
    "aria-labelledby": rest["aria-labelledby"] ?? (rest["aria-label"] ? undefined : field?.labelId),
  }
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const fallback = <RichTextareaFallback {...props} value={props.value ?? props.defaultValue} />
  if (!mounted) return fallback
  return (
    <Suspense fallback={fallback}>
      <RichTextEditor {...props} />
    </Suspense>
  )
}

export { RichTextarea }
