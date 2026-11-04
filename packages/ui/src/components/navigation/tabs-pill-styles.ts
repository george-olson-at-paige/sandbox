import { cva } from "class-variance-authority"

/* Paige Mode switch. Lives outside tabs-pill.tsx because that file is "use client":
   a server component cannot call a cva function exported from a client module (GAPS #19).
   The Mode switch is navigation (route links with aria-current), not Radix panels, which is
   why there is no base/tabs: it was added and never imported, and went in U-06.
   The sliding active background is TabsPillList (tabs-pill-list.tsx, R1-26): a client
   component that wears these classes and adds the thumb. Until it has measured (server render,
   before hydration) the current pill paints its own background, so there is no flash and no
   layout shift; once the thumb is placed (`data-thumb="ready"` on the list) the pill's own
   background is switched off and the thumb shows instead. */
export const tabsPillListClass = "group/pill relative h-auto gap-1 rounded-full bg-accent p-1"

/* `size` (R13-10): md (default) for page navigation; sm for a control inside a 32px row (the
   DAG's Graph/List): 12px text, 4px by 12px pills, 2px of list padding, 28px tall in all. */
export const tabsPillListVariants = cva("inline-flex w-fit items-center justify-center text-muted-foreground " + tabsPillListClass, {
  variants: { size: { md: "", sm: "gap-0.5 p-0.5" } },
  defaultVariants: { size: "md" },
})

export const tabsPillTriggerVariants = cva(
  "relative z-raised inline-flex cursor-pointer items-center justify-center rounded-full font-semibold text-muted-foreground transition-colors ease-out focus-ring hover:text-card-foreground motion-reduce:transition-none aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:shadow-card data-[state=active]:bg-primary data-[state=active]:text-primary-foreground group-data-[thumb=ready]/pill:aria-[current=page]:bg-transparent group-data-[thumb=ready]/pill:aria-[current=page]:shadow-none group-data-[thumb=ready]/pill:data-[state=active]:bg-transparent group-data-[thumb=ready]/pill:data-[state=active]:shadow-none",
  {
    variants: { size: { md: "px-5 py-2 text-sm", sm: "px-3 py-1 text-xs" } },
    defaultVariants: { size: "md" },
  }
)

/** The thumb: one active background, placed by TabsPillList through CSS variables, sliding
    200ms ease-out once placed (`data-thumb-animate`); it jumps under reduced motion. */
export const tabsPillThumbClass =
  "pointer-events-none absolute top-0 left-0 h-(--thumb-h) w-(--thumb-w) translate-x-(--thumb-x) translate-y-(--thumb-y) rounded-full bg-primary opacity-0 shadow-card group-data-[thumb=ready]/pill:opacity-100 motion-safe:group-data-[thumb-animate]/pill:transition-all motion-safe:group-data-[thumb-animate]/pill:ease-out"
