import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"
import type { Orientation } from "../../lib/vocabulary"
import {
  ButtonGroup as UiButtonGroup,
  ButtonGroupSeparator as UiButtonGroupSeparator,
  ButtonGroupText as UiButtonGroupText,
} from "../../base/button-group"

/* @archetype Action (ARCHETYPES.md).
   Paige ButtonGroup over upstream ButtonGroup (R20-10, George 2026-10-31): Buttons side by side
   in one joined shape. Both of George's screenshots are this one part: a horizontal group (an
   action and a count, an action and its menu) and a vertical one of icon Buttons (a zoom column).
   Decided:
   - It holds actions and nothing in it holds a state. A set of choices where one or several
     stay pressed is ToggleGroup's job (R20-11), not this one.
   - `label` is required and becomes the group's aria-label: an unnamed group is the recurring
     a11y miss, so the type refuses it.
   - The children are our Buttons, any variant, `size="icon"` for a toolbar. The base joins them
     through `[&>*]` selectors (square the inner corners, drop the inner border); those out-rank
     our `rounded-full`, so the outer ends stay pills and the inner edges go flat.
   - A joined press does not shrink: `active:scale-98` on one child would pull its edge off its
     neighbour, so the group holds it at 100 (the override below).
   - The group never draws a ring. Each child keeps its own `focus-ring`; the base lifts a
     focused child over its neighbours      (relative, with a stacking order above its siblings), so the outline shows whole, not
     clipped by the next button.
   - Separator and Text take our colours: the divider at `row` level (the same line as items in a
     list) and a card-filled count cell in the Button's weight and the Button's pill ends. */

/** The group's own override: a pressed child keeps its size so the joined edges stay flush. */
const JOINED = "[&>*]:active:scale-100"

/** A set of Buttons joined side by side (horizontal) or stacked (vertical), named for assistive tech. */
function ButtonGroup({
  orientation = "horizontal",
  label,
  children,
  className,
}: {
  /** Which way the Buttons run: side by side (default) or stacked. */
  orientation?: Orientation
  /** The group's accessible name ("Zoom", "Text formatting"). Required: a group without one is announced as nothing. */
  label: string
  /** Our Buttons (any variant; `size="icon"` for an icon toolbar), a ButtonGroupText, a ButtonGroupSeparator. */
  children: ReactNode
  className?: string
}) {
  return (
    <UiButtonGroup orientation={orientation} aria-label={label} className={cn(JOINED, className)}>
      {children}
    </UiButtonGroup>
  )
}

/** The thin line between two joined Buttons that have no border of their own (filled ones). */
function ButtonGroupSeparator({ orientation, className }: Pick<ComponentProps<typeof UiButtonGroupSeparator>, "orientation" | "className">) {
  return <UiButtonGroupSeparator orientation={orientation} className={cn("bg-divider", className)} />
}

/** A read-only cell in a group, such as the "1.2K" beside a Like button. */
function ButtonGroupText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <UiButtonGroupText className={cn("rounded-full bg-card text-sm font-medium text-muted-foreground tabular-nums shadow-none", className)}>
      {children}
    </UiButtonGroupText>
  )
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ButtonGroupProps = ComponentProps<typeof ButtonGroup>
export type ButtonGroupSeparatorProps = ComponentProps<typeof ButtonGroupSeparator>
export type ButtonGroupTextProps = ComponentProps<typeof ButtonGroupText>
