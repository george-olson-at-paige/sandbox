import type { ElementType } from "react"

import type { Tone } from "../lib/vocabulary"
import { cn } from "../lib/utils"
import { cardVariants } from "../components/display/card"
import { cardFocus } from "../components/internal/control"

/* @archetype Surface (ARCHETYPES.md).
   InsightCard (R21-06): one finding that sits in a row of KpiCards and takes you to it — the
   Journeys page's "Biggest drop · After Getting in · 30 of 44 stopped · Look at it". The model is
   the mock's third summary card. Where the KpiCard says how many, the InsightCard says where to
   look, so it is not a metric (the metric rule doesn't apply) and the whole card is the control.
   - Anatomy: an eyebrow in the tone's ink (12/600: what kind of finding), a title (18/700, the
     finding itself, the strong ink), one line (12, the body ink) ending in an action phrase in the
     link ink (600) that says what pressing does ("Look at it"). Phrasing only, so it fits in a
     button.
   - Tone: `attention` (a problem: the attention tint, `bg-attention-subtle`, with the light warm
     border `--warning-border`, the nearest tokens to the mock's peach fill and sand border), `info` (the blue tint and its
     border) or `neutral` (a white card on the surface edge). The fill is always the soft one, so
     there is no `fill` prop until a second fill is asked for.
   - The whole card is the button (`onSelect`) or the link (`href`, with the app's `linkAs`); its
     name is everything it says. It is the compact Card (10px corner, 18 × 16), the same size as a
     KpiCard beside it. Hover and press are relative (`layer-hover`, `layer-press`, R4-01), so
     they read on any tint; focus is the card halo outside the border (`cardFocus`, R15-17).
   - Server-safe: no state. */

type InsightTone = Extract<Tone, "attention" | "info" | "neutral">

const TONE: Record<InsightTone, { card: string; eyebrow: string }> = {
  attention: { card: "border-warning-border bg-attention-subtle", eyebrow: "text-attention-foreground" },
  info: { card: "border-info-border bg-info-subtle", eyebrow: "text-info-foreground" },
  neutral: { card: "bg-card", eyebrow: "text-muted-foreground" },
}

type InsightCardBase = {
  /** What kind of finding, in a few words ("Biggest drop"); in the tone's ink. */
  eyebrow: string
  /** The finding itself ("After Getting in"). */
  title: string
  /** One short line of evidence ("30 of 44 stopped"). */
  description?: string
  /** What pressing the card does, at the end of the line ("Look at it"). */
  action: string
  /** attention (a problem; default) · info · neutral. */
  tone?: InsightTone
  /** Placement, not restyling. */
  className?: string
}

type InsightCardProps = InsightCardBase &
  (
    | {
        /** Called when the card is pressed (it is a button). */
        onSelect: () => void
        href?: never
        linkAs?: never
      }
    | {
        /** Where the card goes (it is a link). */
        href: string
        /** The app's router link (default `a`). */
        linkAs?: ElementType
        onSelect?: never
      }
  )

/** One finding that takes you to it (an eyebrow, a title, a line and an action phrase); the whole card is the button or link. */
function InsightCard({ eyebrow, title, description, action, tone = "attention", className, ...target }: InsightCardProps) {
  const classes = cn(
    cardVariants({ density: "compact" }),
    TONE[tone].card,
    "w-full cursor-pointer text-left text-card-foreground hover:layer-hover active:layer-press",
    cardFocus,
    className
  )
  const body = (
    <>
      <span data-slot="insight-card-eyebrow" className={cn("text-xs font-semibold", TONE[tone].eyebrow)}>
        {eyebrow}
      </span>
      <span data-slot="insight-card-title" className="text-lg font-bold text-foreground-strong">
        {title}
      </span>
      <span className="text-xs text-foreground">
        {description && <>{description} · </>}
        <span data-slot="insight-card-action" className="font-semibold text-info-foreground">
          {action}
        </span>
      </span>
    </>
  )
  if ("href" in target && target.href !== undefined) {
    const Link = target.linkAs ?? "a"
    return (
      <Link href={target.href} data-slot="insight-card" data-tone={tone} className={classes}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={target.onSelect} data-slot="insight-card" data-tone={tone} className={classes}>
      {body}
    </button>
  )
}

export { InsightCard }
export type { InsightCardProps, InsightTone }
