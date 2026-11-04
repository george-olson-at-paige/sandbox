"use client"

import type { ComponentProps } from "react"
import type { ElementType } from "react"

import { cn } from "../lib/utils"
import { Inline } from "../primitives/inline"
import { Button } from "../components/actions/button"
import { SubmitButton } from "./internal/submit-button"
import { useFormContext } from "./internal/form-context"
import { formMessages } from "./messages"

/* @archetype Composite (ARCHETYPES.md).
   FormFooter (R7-03): a plain form's actions, inside its Form: an optional cancel (quiet,
   underlined: a decline, R2-14) and the submit, which takes pending and disabled from the Form
   (no props to wire). Decided against replacing FlowFooter: a setup step's footer also carries
   Back, a status note and Skip, and its template can put it outside the <form>; both share the
   one submit button (forms/internal/submit-button.tsx), so pending looks and reads the same.
   `fill` (R18-08, the auth card): the submit is the card's one action and fills its width, with
   no rule and no margin above — the form's own gap sets the distance from the last field. */

/** A form's actions: cancel and the submit, which shows the Form's pending state on its own. */
function FormFooter({
  submitLabel = formMessages.submit,
  pendingLabel,
  cancel,
  fill = false,
  className,
}: {
  /** The submit label. Default "Save" (forms/messages.ts). */
  submitLabel?: string
  /** The label while saving. Default "Saving…". */
  pendingLabel?: string
  /** A cancel action: a link (`href`, with `linkAs` for Next's Link) or a handler. */
  cancel?: { label: string; href?: string; onClick?: () => void; linkAs?: ElementType }
  /** The actions fill the width (a card's form), with no rule above. Default: a right-aligned row under a rule. */
  fill?: boolean
  className?: string
}) {
  const form = useFormContext()
  const Link = cancel?.linkAs ?? "a"
  return (
    <Inline gap={4} justify="end" className={cn(fill ? "*:flex-1" : "mt-8 border-t pt-6", className)} data-fill={fill || undefined} data-slot="form-footer">
      {cancel &&
        (cancel.href ? (
          <Button asChild variant="quiet" underline>
            <Link href={cancel.href}>{cancel.label}</Link>
          </Button>
        ) : (
          <Button type="button" variant="quiet" underline onClick={cancel.onClick}>
            {cancel.label}
          </Button>
        ))}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} pending={form?.status === "pending"} disabled={form?.disabled} />
    </Inline>
  )
}

export { FormFooter }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FormFooterProps = ComponentProps<typeof FormFooter>
