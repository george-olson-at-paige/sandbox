import type { ReactNode } from "react"

import { Button, type ButtonProps } from "./button"

/* @archetype Action (ARCHETYPES.md).
   IconButton over Button (R20-14, George 2026-10-31, D-05: yes): a thin alias that tightens
   the type. An icon-only button without a name is the recurring a11y bug, so here the icon and
   the accessible name are both required and the label text is not accepted. `Button size="icon"`
   with an `aria-label` stays valid and unchanged; this is the spelling for new code. It renders
   exactly `<Button size="icon">`: every Button variant, `asChild` and the rest pass through. */

/** A button that is only an icon: the name is required, so it never ships unnamed. */
function IconButton({
  icon,
  "aria-label": label,
  ...rest
}: Omit<ButtonProps, "children" | "size" | "icon" | "aria-label"> & {
  /** The glyph (a lucide icon). Decorative: the name comes from `aria-label`. */
  icon: ReactNode
  /** The button's accessible name ("Remove Elena"). Required. */
  "aria-label": string
  /** Always the control scale's icon square; accepted so a caller can pass what Button takes. */
  size?: "icon"
}) {
  return <Button {...rest} size="icon" icon={icon} aria-label={label} />
}

export { IconButton }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type IconButtonProps = Parameters<typeof IconButton>[0]
