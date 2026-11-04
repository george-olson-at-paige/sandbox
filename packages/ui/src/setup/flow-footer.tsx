"use client"

import type { ComponentProps } from "react"
import type { ElementType } from "react"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { Button } from "../components/actions/button"
import { Split } from "../primitives/split"
import { useFormContext } from "../forms/internal/form-context"
import { SubmitButton } from "../forms/internal/submit-button"

/** The primary action in submit mode (R2-38): a form's submit button with pending and failure
    states. The form owns the input and the save; FlowFooter shows where it stands. */
export type FlowFooterSubmit = {
  /** The form's id, when the footer sits outside the <form>. */
  form?: string
  /** Saving: the button is disabled and its label says so. */
  pending?: boolean
  /** The pending label. Default "Saving…". */
  pendingLabel?: string
  /** The save failed: this message shows beside Back (announced), and the button is ready to try again. */
  error?: string
  /** Disables the button before the form can be sent (a required answer is missing). */
  disabled?: boolean
}

type Common = {
  /** Adds a quiet Back link at the start. */
  backHref?: string
  /** Short status line beside Back (announced politely when it changes). */
  note?: string
  /** Secondary (skip) action label. Shown only with skipHref. */
  skipLabel?: string
  /** Where skip goes. */
  skipHref?: string
  /** Primary action label. Default "Save and continue". */
  ctaLabel?: string
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
}

type LinkMode = Common & {
  /** Link mode: where the primary action goes. */
  ctaHref: string
  /** Disables the primary action (renders a button, not a link). */
  ctaDisabled?: boolean
  submit?: never
}

type SubmitMode = Common & {
  /** Submit mode: the primary action submits a form (beats that save before moving on). */
  submit: FlowFooterSubmit
  ctaHref?: never
  ctaDisabled?: never
}

/* @archetype Composite (ARCHETYPES.md).
   FlowFooter: back · note, then skip · primary CTA. A Split: on a narrow screen the
   buttons move below the back link and note instead of squeezing them.
   Two modes for the primary action. Link mode (`ctaHref`) moves on. Submit mode (`submit`,
   R2-38) is a form's submit button: pending (disabled, "Saving…", a spinner), failure (the
   message replaces the note, role="alert", the button ready to retry), success (the form's
   handler navigates). The beats stay in link mode until their save endpoints exist.
   Inside a Form (R7-03), submit mode takes pending and disabled from it; outside one (SetupBeat
   puts the footer outside the <form>), pass `useForm(...).submitProps`. Shares FormFooter's
   submit button. */
/** The footer of a setup step: back and a note, then skip and the primary action (a link, or a form's submit button). */
function FlowFooter(props: LinkMode | SubmitMode) {
  const { backHref, note, skipLabel, skipHref, ctaLabel = "Save and continue", linkAs: Link = "a" } = props
  const form = useFormContext()
  const submit = props.submit && {
    ...props.submit,
    pending: props.submit.pending ?? form?.status === "pending",
    disabled: props.submit.disabled ?? form?.disabled,
  }
  const status = submit?.error ?? note
  return (
    <Split
      gap={4}
      contentMin="sm"
      className="mt-8 border-t pt-6"
      aside={
        <>
          {skipLabel && skipHref && (
            <Button asChild variant="secondary" size="md">
              <Link href={skipHref}>{skipLabel}</Link>
            </Button>
          )}
          {submit ? (
            <SubmitButton
              label={ctaLabel}
              form={submit.form}
              size="lg"
              pending={submit.pending}
              pendingLabel={submit.pendingLabel}
              disabled={submit.disabled}
              icon={<ArrowRightIcon />}
            />
          ) : props.ctaDisabled ? (
            <Button size="lg" disabled icon={<ArrowRightIcon />} iconPosition="end">{ctaLabel}</Button>
          ) : (
            <Button asChild size="lg" icon={<ArrowRightIcon />} iconPosition="end">
              <Link href={props.ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </>
      }
    >
      <div data-slot="flow-footer" className="flex flex-wrap items-center gap-4 text-sm">
        {backHref && (
          <Button asChild variant="quiet" size="inline" icon={<ArrowLeftIcon />}>
            <Link href={backHref}>Back</Link>
          </Button>
        )}
        {submit?.error ? (
          <p className="max-w-sm font-medium text-error" role="alert">{submit.error}</p>
        ) : (
          status && <p className="max-w-sm font-medium text-muted-foreground" aria-live="polite">{status}</p>
        )}
      </div>
    </Split>
  )
}

export { FlowFooter }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FlowFooterProps = ComponentProps<typeof FlowFooter>
