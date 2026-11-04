import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"
import { Button as UiButton, buttonVariants as uiButtonVariants } from "../../base/button"

/* @archetype Action (ARCHETYPES.md).
   Paige Button over upstream Button. Five named variants (+ quiet, GAPS #31), three heights
   (36 · 44 · 48) plus icon and inline (GAPS #32). Padding is measured against the prototype's
   .vt-btn (vault.css:67-75): pill padding ≈ half the height, the same with or without an icon
   (upstream narrows it when an svg is present: has-[>svg]:px-*).
   Decided (George, 2026-10-18):
   - Every button is a pill (rounded-full), as every prototype button is; "pill" is dropped as
     a variant name only (R2-06). Since D-V2 (George 2026-11-04) `shape="rect"` is the one
     exception: a tool that is not the page's call to action.
   - Weight 600 at 14 · 14 · 16px on 36 · 44 · 48, the standard, not the prototype's 700 at
     smaller sizes: one weight rule, 600 for UI and 700 for slab display (R2-09).
   - One control height, 44 (md), for buttons and inputs, setup included; 44 is the touch
     target (R2-10).
   - No green button: a confirming action (the Review banner's "Confirm all") is primary;
     green stays for status marks (R2-07).
   - `destructive` is for irreversible actions only (delete), always behind a confirm (R2-03).
   - `quiet` + `underline` is the decline action ("Not applicable"), underlined as in the
     prototype (vault.css:186,260); back links are quiet without it (R2-14).
   - `inline` takes the parent's font size and line height (text-size-inherit, R2-25), so an
     action inside a 12px source line is 12px with no override.
   - `secondary` is the white button (white fill, hairline). `muted` is the outline: the same
     hairline and no fill, so the surface shows through. Both pass down to the base as `outline`
     (George 2026-10-30: the tinted fill read as pressed, and a half-white fill was a second way
     of drawing the button we already had). CalloutAction is the white one unless a variant is
     passed down. */
/* Relative hover (R4-01, R4-02): the overlay laid over whatever the button already is (a
   background-image layer, theme.css layer-hover/layer-press), so hover is one step darker than
   the surface under it on any surface, never a fixed colour that can match the surface (the
   old bg-muted hover vanished on a muted card). Hover only for real pointers: Tailwind's
   `hover:` is wrapped in @media (hover: hover), so a tap never leaves a stuck hover. Pressed is
   a step stronger, and a button whose panel is open (aria-expanded, data-state=open: a menu
   trigger, the bell) keeps the pressed look so it's clear what opened the panel. Primary keeps
   its pressed blue; quiet and link change text only; destructive keeps its red. */
const relative =
  "hover:layer-hover active:layer-press aria-expanded:layer-press data-[state=open]:layer-press"

/* The glyph is the icon scale's default (16, T-02); upstream's base writes the same value as
   size-4, which would not follow a change to --spacing-icon. */
const buttonVariants = cva(
  "cursor-pointer rounded-full font-semibold focus-ring focus-visible:border-transparent focus-visible:ring-0 active:scale-98 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-disabled [&_svg:not([class*='size-'])]:size-icon",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          /* flat, as the prototype's .vt-btn--a: upstream outline's shadow-xs is real since R2-18.
             Hover: the white gives way to the surface underneath, darkened (R4-01). */
          `border-border bg-secondary text-secondary-foreground shadow-none hover:bg-transparent hover:text-secondary-foreground active:bg-transparent aria-expanded:bg-transparent data-[state=open]:bg-transparent ${relative}`,
        ghost: `text-muted-foreground hover:bg-transparent hover:text-foreground ${relative}`,
        link: "text-primary underline-offset-4 hover:underline",
        quiet: "text-muted-foreground hover:bg-transparent hover:text-primary",
        destructive: "bg-destructive text-primary-foreground hover:bg-destructive-hover",
        muted: `border-border bg-transparent text-inherit shadow-none hover:bg-transparent hover:text-inherit active:bg-transparent aria-expanded:bg-transparent data-[state=open]:bg-transparent ${relative}`,
      },
      /* Heights are the control scale (T-01): sm 36, md 44 (the same token as Input, so a field
         and its button are level), lg 48; the icon button is a small control square. */
      size: {
        sm: "h-control-sm px-4 has-[>svg]:px-4",
        md: "h-control px-5.5 has-[>svg]:px-5.5",
        lg: "h-control-lg px-6.5 text-base has-[>svg]:px-6.5",
        icon: "size-control-sm",
        inline: "h-auto gap-1.5 rounded-sm p-0 text-size-inherit has-[>svg]:p-0 active:scale-100",
      },
      underline: { true: "", false: "" },
      /* D-V2 (George 2026-11-04): a pill is the page's call to action; a rect is a tool (Share,
         ⋯, a filter button, Expand), the radius of a control's corners (rounded-md, 10). */
      shape: { pill: "", rect: "rounded-md" },
    },
    compoundVariants: [{ variant: "quiet", underline: true, className: "underline underline-offset-4" }],
    defaultVariants: { variant: "primary", size: "md", underline: false, shape: "pill" },
  }
)

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>

/** The upstream variant/size each Paige name starts from. */
const UPSTREAM_VARIANT = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  link: "link",
  quiet: "ghost",
  destructive: "destructive",
  muted: "outline",
} as const satisfies Record<Variant, ComponentProps<typeof UiButton>["variant"]>
const UPSTREAM_SIZE = {
  sm: "sm",
  md: "default",
  lg: "lg",
  icon: "icon",
  inline: "default",
} as const satisfies Record<Size, ComponentProps<typeof UiButton>["size"]>

type ButtonProps = Omit<ComponentProps<"button">, "style"> & {
  variant?: Variant
  size?: Size
  /** An icon element (lucide). With size="icon" it is the whole content; pass aria-label. */
  icon?: ReactNode
  iconPosition?: "start" | "end"
  /** Underline the label: the decline action ("Not applicable"). Applies to variant="quiet" only. */
  underline?: boolean
  /** pill (default): the page's call to action. rect: a tool — Share, ⋯, a filter button, Expand (D-V2). */
  shape?: "pill" | "rect"
  /** Put the button styling on the child element (a router link). */
  asChild?: boolean
}

/** Any action: named variants (white, and muted for the outline), three heights, an icon slot, and asChild for links. */
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  underline = false,
  shape = "pill",
  asChild = false,
  className,
  children,
  ...props
}: ButtonProps) {
  // Slottable lets the icon sit inside the child element when asChild is set.
  const label = <Slot.Slottable>{children}</Slot.Slottable>
  return (
    <UiButton
      variant={UPSTREAM_VARIANT[variant]}
      size={UPSTREAM_SIZE[size]}
      asChild={asChild}
      className={cn(buttonVariants({ variant, size, underline, shape }), className)}
      {...props}
    >
      {iconPosition === "start" && icon}
      {label}
      {iconPosition === "end" && icon}
    </UiButton>
  )
}

/** The classes a `<Button variant size>` renders, for a button element something else draws
    (sonner's string-form `action`, R19-05); the look stays this file's. */
function buttonClassName(variant: Variant = "primary", size: Size = "md") {
  return cn(
    uiButtonVariants({ variant: UPSTREAM_VARIANT[variant], size: UPSTREAM_SIZE[size] }),
    buttonVariants({ variant, size })
  )
}

export { Button, buttonClassName }
export type { ButtonProps }
