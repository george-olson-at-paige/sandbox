import type { ComponentProps, ReactNode } from "react"

import { cn } from "../lib/utils"
import { FieldGroup as UiFieldGroup } from "../base/field"

/* @archetype Frame (ARCHETYPES.md).
   FieldGroup places fields on a 12-column grid from the md breakpoint, and in one column
   below it. A Field's span says how many columns it takes (default 12, the whole row).
   6 and 6 share a row. 7 and 5 is the 60/40 split. density="roomy" (George 2026-10-28):
   for a page that is one form, as a setup step; closer, the rows run together. By default
   columns are step 4 apart and rows are step 6. Roomy is one full step looser: step 6
   between columns and step 8 between rows.
   No "use client": no hooks. */
const GAP = {
  default: "gap-x-4 gap-y-6",
  roomy: "gap-x-6 gap-y-8",
} as const

/** Places fields on a 12-column grid. */
function FieldGroup({
  density = "default",
  className,
  children,
}: {
  /** default · roomy (step 6 between columns and step 8 between rows, for a page that is one form). */
  density?: keyof typeof GAP
  className?: string
  children: ReactNode
}) {
  return (
    <UiFieldGroup
      className={cn("grid grid-cols-1 md:grid-cols-12 [&>*]:min-w-0", GAP[density], className)}
    >
      {children}
    </UiFieldGroup>
  )
}

export { FieldGroup }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FieldGroupProps = ComponentProps<typeof FieldGroup>
