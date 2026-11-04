import type { ComponentProps } from "react"
import { useId, type ReactNode } from "react"

import { cn } from "../lib/utils"
import { Flex } from "../primitives/flex"
import { Eyebrow } from "../components/display/eyebrow"
import { Separator } from "../components/display/separator"

/* @archetype Frame (ARCHETYPES.md).
   FormSection (R7-03, GAPS #50): a titled group of fields inside a form. The title is an
   eyebrow-styled heading followed by a rule to the end of the row (the setup prototype's
   section line), then an optional description, then the fields. It replaces the hand-built
   eyebrow + Separator row screens wrote before. The section is named by its title. Related
   fields under one legend, which can be disabled together, are a FieldSet, not a FormSection.
   density="roomy" (George 2026-10-28), with FieldGroup's: for a page that is one form, as a
   setup step. The heading is never closer to its first field than the fields are to each other
   (step 8, FieldGroup's roomy rows), else it reads as that field's label; the section sits further
   still from what comes before (48px), so the heading stays with its own fields. The section
   keeps 16px of its own below its fields, so what follows (the footer's line, 32px out) sits
   48px away; a section right after another drops its top margin to 32 to stay 48px apart.
   An optional icon leads the title, in its colour; it is decorative.
   No "use client": useId works in server components. */
const SPACE = {
  default: { section: "mt-8", heading: "mb-3" },
  roomy: { section: "mt-12 pb-4 [[data-slot=form-section]+&]:mt-8", heading: "mb-8" },
} as const

/** A titled group of fields in a form: an eyebrow heading with a rule, a description, then the fields. */
function FormSection({
  title,
  icon,
  description,
  level = 2,
  density = "default",
  className,
  children,
}: {
  /** The section's heading (eyebrow style). */
  title: string
  /** A small icon before the title (14px, the title's colour). */
  icon?: ReactNode
  /** default · roomy (more space around the heading; pair with FieldGroup's roomy). */
  density?: keyof typeof SPACE
  /** A line under the heading, before the fields. */
  description?: ReactNode
  /** Heading level. Default 2 (under the page's h1). */
  level?: 2 | 3
  className?: string
  /** The fields: usually a FieldGroup. */
  children: ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} data-slot="form-section" className={cn(SPACE[density].section, "first:mt-0", className)}>
      <Flex direction="row" align="center" gap={3} className={SPACE[density].heading}>
        <Eyebrow as={`h${level}`} id={id} className="flex shrink-0 items-center gap-1.5 [&>svg]:size-icon-sm">
          {icon}
          {title}
        </Eyebrow>
        <Separator level="group" className="flex-1" />
      </Flex>
      {description && <p className="mb-4 text-sm font-medium text-muted-foreground">{description}</p>}
      {children}
    </section>
  )
}

export { FormSection }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FormSectionProps = ComponentProps<typeof FormSection>
