import type { ReactNode } from "react"

import { Button } from "../../components/actions/button"
import { Spinner } from "../../components/feedback/spinner"
import { formMessages } from "../messages"

/* The submit button FormFooter and FlowFooter share (R7-03): pending is disabled and says so
   in its label, with a spinner. Internal. */
export function SubmitButton({
  label,
  pending,
  pendingLabel = formMessages.pending,
  disabled,
  form,
  icon,
  size = "md",
}: {
  label: string
  pending?: boolean
  pendingLabel?: string
  disabled?: boolean
  /** The form's id, when the button sits outside the <form>. */
  form?: string
  /** Shown at the end when not pending (FlowFooter's arrow). */
  icon?: ReactNode
  size?: "md" | "lg"
}) {
  return (
    <Button
      type="submit"
      form={form}
      size={size}
      disabled={pending || disabled}
      aria-disabled={pending || undefined}
      icon={pending ? <Spinner label={pendingLabel} /> : icon}
      iconPosition={pending ? "start" : "end"}
    >
      {pending ? pendingLabel : label}
    </Button>
  )
}
