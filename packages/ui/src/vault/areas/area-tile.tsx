import type { ComponentProps } from "react"
import { useId, type ElementType } from "react"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import type { AreaId } from "../../icons/area-glyphs"
import { cardVariants } from "../../components/display/card"
import { Progress } from "../../components/feedback/progress"
import { AreaIcon } from "./area-icon"

export type TileState = "not-started" | "in-progress" | "set-up"

/* @archetype Surface (ARCHETYPES.md).
   AreaTile: Card (interactive) + AreaIcon + Progress. Three states; the progress
   ratio is a shape, never text.
   Accessible name (R2-31, GAPS #63): the visible name and line name the link (no aria-label,
   so speech input can say what it sees); the footer is its description (aria-describedby),
   hidden from the name so it isn't read twice. useId works in server components too. */
/** A Life Area on the Vault home: icon, name, one line and progress, linking to the Area. */
function AreaTile({
  area,
  name,
  line,
  state,
  firstStep,
  meta,
  ratio,
  href,
  linkAs: Link = "a",
  className,
}: {
  /** Which Life Area: icon, colour and the hover border. */
  area: AreaId
  /** The Area's name, the tile heading. */
  name: string
  /** One line on what the Area holds. */
  line: string
  /** not-started (soft icon, first step) · in-progress (bar + meta) · set-up (tick, success meta). */
  state: TileState
  /** not-started footer: the first concrete thing to add */
  firstStep: string
  /** in-progress / set-up footer: e.g. { strong: "4 saved", rest: "next: a guardian for Elena" } */
  meta?: { strong: string; rest: string }
  /** Progress 0–1 for the bar (in-progress and set-up). Drawn, never printed. */
  ratio: number
  /** Where the tile goes: the Area page. */
  href: string
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
  className?: string
}) {
  const setUp = state === "set-up"
  const footerId = useId()
  return (
    <Link
      href={href}
      data-area={area}
      data-state={state}
      aria-describedby={footerId}
      className={cn(
        cardVariants({ interactive: true }),
        "min-h-52 gap-0 bg-card bg-wash-corner p-5 text-left hover:border-area",
        className
      )}
    >
      <AreaIcon area={area} size="lg" tone={state === "not-started" ? "soft" : "solid"} tick={setUp} className="mb-4" />
      <h3 className="mb-1.5 font-display text-lg leading-display font-bold tracking-display text-foreground-strong">{name}</h3>
      <p className="mb-auto text-sm font-medium text-pretty text-body-muted">{line}</p>
      <div id={footerId} aria-hidden className="mt-4">
        {state === "not-started" ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-area-ink">
            {firstStep}
            <ArrowRightIcon className="size-icon shrink-0" strokeWidth={2.4} />
          </span>
        ) : (
          <>
            <Progress value={Math.round(ratio * 100)} className="mb-2" aria-hidden />
            <p className={cn("text-xs font-semibold", setUp ? "text-success-foreground" : "text-muted-foreground")}>
              <b className={cn("font-bold", setUp ? "text-success-foreground" : "text-foreground")}>{meta?.strong}</b>
              {" · "}
              {meta?.rest}
            </p>
          </>
        )}
      </div>
    </Link>
  )
}

export { AreaTile }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type AreaTileProps = ComponentProps<typeof AreaTile>
