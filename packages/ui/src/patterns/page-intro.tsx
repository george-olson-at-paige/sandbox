import type { ComponentProps } from "react"
import type { ReactNode } from "react"

import { Split } from "../primitives/split"
import { Eyebrow, type EyebrowProps } from "../components/display/eyebrow"
import { Stack } from "../primitives/stack"

/* @archetype Frame (ARCHETYPES.md).
   PageIntro (was Intro): eyebrow, display title, lede, actions. One title size, 40px, on every
   page (George 2026-10-28): the Vault home, Welcome and each setup step match.
   The title wraps at the display measure (20ch, R2-23), the lede at the reading measure.
   The eyebrow labels the title, so it sits closer (6px, an hgroup) than the lede below it
   (12px; George 2026-10-28). Both are measured box to box; the title's line height adds ~4px
   of its own on each side.
   A Split: the actions sit at the end of the row and move below the text when it wraps. */
const TITLE = "max-w-display font-display text-4xl font-bold tracking-display leading-display text-pretty text-foreground-strong"

/** A page's opening: eyebrow, title, lede and actions. */
function PageIntro({
  eyebrow,
  eyebrowTone,
  title,
  lede,
  actions,
  as: Heading = "h1",
  className,
}: {
  /** Small label above the title. */
  eyebrow?: ReactNode
  /** The eyebrow's colour: muted (default) · area · primary. */
  eyebrowTone?: EyebrowProps["tone"]
  /** The page's question or heading. */
  title: ReactNode
  /** One or two sentences under the title, at reading width. */
  lede?: ReactNode
  /** Buttons at the end of the row; they move below the text when it wraps. */
  actions?: ReactNode
  /** Heading level. Default h1; h2 when the intro is not the page's main heading. */
  as?: "h1" | "h2"
  className?: string
}) {
  return (
    <Split gap={8} align="end" contentMin="lg" aside={actions} className={className}>
      <Stack gap={3} data-slot="page-intro">
        <hgroup className="flex flex-col gap-1.5">
          {eyebrow && <Eyebrow as="p" tone={eyebrowTone}>{eyebrow}</Eyebrow>}
          <Heading className={TITLE}>{title}</Heading>
        </hgroup>
        {lede && <p className="max-w-measure text-base font-medium text-pretty text-body-muted">{lede}</p>}
      </Stack>
    </Split>
  )
}

export { PageIntro }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type PageIntroProps = ComponentProps<typeof PageIntro>
