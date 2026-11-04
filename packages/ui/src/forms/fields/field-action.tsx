import type { ComponentProps, ReactNode } from "react"

import { cn } from "../../lib/utils"
import { pressable } from "../../components/internal/control"

/* @archetype Action (ARCHETYPES.md).
   FieldAction (R5-03, George 2026-10-19): the one way an icon acts inside a field: PasswordField's
   and SsnField's show/hide, DateField's calendar, HeaderSearch's clear. Every in-field icon looks
   and behaves the same.
   - A real <button type="button"> with a required aria-label ("Show password", "Choose date"),
     reachable by Tab. No button chrome: no background, border, pill or hover fill.
   - A 16px icon in a 24px hit area. Pointer cursor; the icon goes from muted to the field's text
     colour on hover (Tailwind's `hover:` is pointer-only, @media (hover: hover)), so there's
     feedback where there's no cursor change to see.
   - `pressed` sets aria-pressed for a toggle (show/hide); the caller swaps the icon but keeps
     the label ("Show password" pressed or not: R6-01, GAPS #98, WAI-ARIA's toggle-button
     pattern; a label that changes with the state goes without aria-pressed, never with it).
   - Disabled: not-allowed cursor, half opacity, no hover.
   - Focus is the gapped ring buttons get (R15-17), through `pressable` (U-07); it was the
     browser's default while R1-01 waited.
   Placement (U-02): it sits in an InputGroup's trailing addon (`InputGroupAddon align="inline-end"`),
   which puts it 10px from the field's edge and keeps the text clear of it; it no longer positions
   itself, and the input needs no padding for it. */

type FieldActionProps = Omit<ComponentProps<"button">, "type" | "style" | "children" | "aria-label" | "aria-pressed"> & {
  /** What the action does, read by screen readers: "Show password", "Choose date". Required: the icon is the only content. */
  "aria-label": string
  /** The 16px icon (lucide). */
  icon: ReactNode
  /** For a toggle: whether it's on (aria-pressed). Keep the aria-label the same in both states (R6-01). Leave undefined for a plain action. */
  pressed?: boolean
}

/** An icon action inside a field (show/hide, calendar): a real button, 24px target, no chrome; muted until hovered. */
function FieldAction({ icon, pressed, className, ...props }: FieldActionProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        pressable,
        "inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-card-foreground disabled:hover:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-icon [&_svg]:shrink-0",
        className
      )}
      {...props}
      data-slot="field-action"
    >
      {icon}
    </button>
  )
}

export { FieldAction }
export type { FieldActionProps }
