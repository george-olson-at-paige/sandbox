import type { ReactNode } from "react"

import { AppHeader } from "../shell/app-header"
import { PageIntro, type PageIntroProps } from "../patterns/page-intro"
import { StepRail } from "../setup/step-rail"
import { Page } from "./page"

/* @archetype Frame (ARCHETYPES.md).
   SetupBeat: top bar · Page with one centred column (focused 768 / wide 960) and the roomy
   top (48; R2-04) · PageIntro · body · FlowFooter. No modals.
   The top bar includes the StepRail by default (R4-06, George 2026-10-19): pass `logo`, `step`,
   `total` and the `exit` link, and SetupBeat draws the Essential Setup bar, SetupBar (AppHeader:
   logo, then StepRail and the exit at the right, in text-sm). SetupBar is exported so an
   Essential Setup page that isn't a beat (Welcome: no step, no question) draws the same bar. The name StepRail stays: the glossary calls it the
   step rail and says "rail" is always qualified (GLOSSARY.md:81,118). `topBar` replaces the
   whole bar for a beat that needs another one.
   Phone widths (R6-04, GAPS #88): logo, rail and exit don't fit one 375px row (407px), so below
   sm the StepRail moves to its own full-width row under the bar, label kept, and logo and exit
   stay on the 64px bar: the same move R2-22 made for the Vault nav. From sm it's one row, as the
   prototype. The rail renders twice, once per width; the other is display:none, so only one is
   ever in the accessibility tree.
   Eyebrow (George 2026-10-28, from the prototype): on a numbered step it carries the count
   before the step's name, "Step 1 of 6 · About you"; the count comes from `step`/`total`
   (or `stepLabel`), so the caller passes only the name.
   density="roomy" (George 2026-10-28): the intro heads the first block of fields, so the body
   starts as far below it as a roomy FormSection's fields below their heading: 32px (Page's 24
   plus 8). */
type TopBarProps =
  | {
      /** The product mark (usually a link home), at the left of the default bar. */
      logo: ReactNode
      /** Current step, 1-based: the StepRail in the default bar. */
      step: number
      /** Number of steps in Essential Setup. */
      total: number
      /** The StepRail's text and accessible name. Default "Step {step} of {total}". */
      stepLabel?: string
      /** The way out at the right edge ("Save and finish later"; a link, no confirm modal). */
      exit?: ReactNode
      topBar?: never
    }
  | {
      /** Replaces the default bar entirely (the default is AppHeader with logo, StepRail and exit). */
      topBar: ReactNode
      logo?: never
      step?: never
      total?: never
      stepLabel?: never
      exit?: never
    }

type SetupBeatProps = TopBarProps & {
  /** focused (768, default; forms) · wide (960; choice grids). */
  width?: "focused" | "wide"
  /** default · roomy (the body starts 32px below the intro; pair with FieldGroup's and FormSection's roomy). */
  density?: "default" | "roomy"
  /** The step's name ("About you"). On a numbered step the eyebrow reads "Step 1 of 6 · About you". */
  eyebrow?: ReactNode
  /** The eyebrow's colour: muted (default) · area · primary. */
  eyebrowTone?: PageIntroProps["eyebrowTone"]
  /** The beat's question. */
  title: ReactNode
  /** One or two sentences under the question. */
  lede?: ReactNode
  /** The beat's body: a form or a choice grid. */
  children: ReactNode
  /** A FlowFooter. */
  footer: ReactNode
}

type SetupBarProps = {
  /** The product mark (usually a link home), at the left. */
  logo: ReactNode
  /** The way out at the right edge ("Save and finish later"; a link, no confirm modal). */
  exit?: ReactNode
  /** Current step, 1-based. Leave out (with `total`) on an unnumbered page such as Welcome: no StepRail. */
  step?: number
  /** Number of steps in Essential Setup. */
  total?: number
  /** The StepRail's text and accessible name. Default "Step {step} of {total}". */
  stepLabel?: string
}

/** The Essential Setup bar: logo, then the StepRail (on a numbered step) and the exit at the right. */
function SetupBar({ logo, exit, step, total, stepLabel }: SetupBarProps) {
  const numbered = step !== undefined && total !== undefined
  return (
    <AppHeader
      logo={logo}
      nav={
        numbered ? (
          <div className="flex sm:hidden">
            <StepRail step={step} total={total} label={stepLabel} />
          </div>
        ) : undefined
      }
      actions={
        <div className="flex items-center gap-6 text-sm">
          {numbered && <StepRail step={step} total={total} label={stepLabel} className="hidden sm:flex" />}
          {exit}
        </div>
      }
    />
  )
}

/** One Essential Setup step: top bar with the step rail, one centred column, the question, body and footer. */
function SetupBeat({
  width = "focused",
  density = "default",
  eyebrow,
  eyebrowTone,
  title,
  lede,
  children,
  footer,
  ...bar
}: SetupBeatProps) {
  const topBar =
    bar.topBar !== undefined || bar.step === undefined ? (
      bar.topBar
    ) : (
      <SetupBar logo={bar.logo} step={bar.step} total={bar.total} stepLabel={bar.stepLabel} exit={bar.exit} />
    )
  const stepText = bar.step !== undefined && (bar.stepLabel ?? `Step ${bar.step} of ${bar.total}`)
  return (
    <div data-slot="setup-beat" className="flex min-h-screen flex-col bg-background">
      {topBar}
      <Page width={width} top="roomy">
        <PageIntro
          eyebrow={
            stepText && eyebrow ? (
              <>
                {stepText} <span aria-hidden="true">·</span> {eyebrow}
              </>
            ) : (
              stepText || eyebrow
            )
          }
          eyebrowTone={eyebrowTone}
          title={title}
          lede={lede}
        />
        <div className={density === "roomy" ? "mt-2" : undefined}>
          {children}
          {footer}
        </div>
      </Page>
    </div>
  )
}

export { SetupBar, SetupBeat }
export type { SetupBarProps, SetupBeatProps }
