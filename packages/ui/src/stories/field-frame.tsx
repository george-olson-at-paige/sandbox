import { useState, type ReactNode } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"

/* Story helper for the typed fields (R4-12): a Field with its label, description and error slot,
   plus a line showing the value the field reports. The Field wires the control (id, description
   and error ids, aria-invalid) and shows the field's own error itself (R7-03), so the only wiring
   left is the value readout. */
export function FieldFrame({
  label,
  description,
  showValue = true,
  children,
}: {
  label: string
  description?: string
  /** Show the reported value under the field (off for SSN). */
  showValue?: boolean
  children: (wiring: { onValueChange: (value: string | number | null) => void }) => ReactNode
}) {
  const [value, setValue] = useState<string | number | null>("")
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Field>
        <FieldLabel>{label}</FieldLabel>
        {children({ onValueChange: setValue })}
        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError />
      </Field>
      {showValue && (
        <p className="text-xs text-muted-foreground" data-testid="value">
          Value: <code>{value === null ? "null" : JSON.stringify(value)}</code>
        </p>
      )}
    </div>
  )
}
