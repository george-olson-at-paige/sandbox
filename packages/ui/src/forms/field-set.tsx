import type { ComponentProps, ReactNode } from "react"

import { cn } from "../lib/utils"
import { FieldLegend as UiFieldLegend, FieldSet as UiFieldSet } from "../base/field"
import { Separator } from "../components/display/separator"

/* @archetype Frame (ARCHETYPES.md).
   FieldSet is a fieldset: related fields under one legend. The legend is that name, and
   disabling the set disables every control in it. The legend sits on a row with a rule
   centered on the type, then step 8 before the fields, so it is not read as the first
   field's label. A label beside a radio or checkbox is a Field, not a FieldSet.
   No "use client": no hooks. */

/** Groups related fields under one legend. */
function FieldSet({ disabled = false, className, children }: { disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <UiFieldSet disabled={disabled} className={cn("gap-6", className)}>
      {children}
    </UiFieldSet>
  )
}

/** The fieldset's name, with a rule centered on its row. */
function FieldLegend({
  appearance = "eyebrow",
  className,
  children,
}: {
  appearance?: "eyebrow" | "title"
  className?: string
  children: ReactNode
}) {
  return (
    <UiFieldLegend
      variant={appearance === "title" ? "legend" : "label"}
      className={cn(
        /* A legend sits outside the fieldset's flex gap, so the space before the fields is its own margin. */
        "mb-8 w-full",
        className
      )}
    >
      <span className="flex w-full items-center gap-3">
        <span
          className={cn(
            "shrink-0",
            appearance === "eyebrow" ? "eyebrow font-semibold" : "text-base font-semibold text-card-foreground"
          )}
        >
          {children}
        </span>
        <Separator level="group" className="flex-1" />
      </span>
    </UiFieldLegend>
  )
}

export { FieldLegend, FieldSet }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FieldLegendProps = ComponentProps<typeof FieldLegend>
export type FieldSetProps = ComponentProps<typeof FieldSet>
