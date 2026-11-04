"use client"

import { useCallback, useLayoutEffect, useRef, type ComponentProps, type Ref } from "react"

import { cn } from "../../lib/utils"
import { tabsPillListVariants, tabsPillThumbClass } from "./tabs-pill-styles"

/* @archetype Frame (ARCHETYPES.md).
   TabsPillList (R1-26): the pill list with one active background (the "thumb") that slides to
   the current pill. Children are the pills, wearing `tabsPillTriggerVariants()`: route links
   with aria-current="page" (the Mode switch) or Radix Tabs triggers (data-state="active"; pass
   this list as TabsList's asChild child).

   How the thumb is placed: by measuring, not CSS anchor positioning. Anchor positioning would
   be pure CSS but Firefox doesn't ship it yet, so it would need this JS anyway as the fallback;
   one path is simpler. The current pill's offset and size are written to CSS variables on the
   thumb (no inline style attribute; GAPS #9), and re-measured when:
   - the current pill changes (a MutationObserver on aria-current / data-state, so it follows
     clicks, router navigation and Radix's arrow-key selection alike), and
   - any pill or the list changes size (a ResizeObserver: label changes, font load, zoom).
   The first placement doesn't animate; later ones slide 200ms ease-out, and jump under
   prefers-reduced-motion. Before hydration the current pill paints its own background (see
   tabs-pill-styles.ts), so the switch-over causes no flash and no layout shift: the thumb is absolute
   and takes no space. */
const ACTIVE = ':scope > [aria-current="page"], :scope > [data-state="active"]'

/** Pill tabs or a pill nav, with an active background that slides to the current pill. */
function TabsPillList({
  as: Comp = "nav",
  size = "md",
  className,
  children,
  ref,
  ...props
}: Omit<ComponentProps<"nav">, "style"> & {
  /** `nav` for route links (default); `div` under Radix TabsList (asChild). */
  as?: "nav" | "div"
  /** md (default); sm in a 32px row (R13-10). Give the pills `tabsPillTriggerVariants({ size })` to match. */
  size?: "md" | "sm"
  ref?: Ref<HTMLElement>
}) {
  const listRef = useRef<HTMLElement | null>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      listRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  useLayoutEffect(() => {
    const list = listRef.current
    const thumb = thumbRef.current
    if (!list || !thumb) return

    const place = () => {
      const active = list.querySelector<HTMLElement>(ACTIVE)
      if (!active) {
        delete list.dataset.thumb
        return
      }
      // Rects, not offset*: offsetWidth rounds to whole pixels and labels are fractional.
      const box = list.getBoundingClientRect()
      const pill = active.getBoundingClientRect()
      thumb.style.setProperty("--thumb-x", `${pill.left - box.left - list.clientLeft}px`)
      thumb.style.setProperty("--thumb-y", `${pill.top - box.top - list.clientTop}px`)
      thumb.style.setProperty("--thumb-w", `${pill.width}px`)
      thumb.style.setProperty("--thumb-h", `${pill.height}px`)
      if (list.dataset.thumb !== "ready") {
        list.dataset.thumb = "ready"
        // Commit the first placement (a forced style flush), then turn the slide on, so the
        // thumb appears in place instead of sliding in from the corner.
        void thumb.getBoundingClientRect()
        list.dataset.thumbAnimate = ""
      }
    }

    const resize = new ResizeObserver(place)
    const observePills = () => {
      resize.observe(list)
      for (const child of Array.from(list.children)) if (child !== thumb) resize.observe(child)
    }
    const mutation = new MutationObserver((records) => {
      if (records.some((r) => r.type === "childList")) observePills()
      place()
    })

    place()
    observePills()
    mutation.observe(list, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-current", "data-state"],
    })
    return () => {
      resize.disconnect()
      mutation.disconnect()
      delete list.dataset.thumb
      delete list.dataset.thumbAnimate
    }
  }, [])

  return (
    <Comp ref={setRef} data-size={size} className={cn(tabsPillListVariants({ size }), className)} {...props}>
      <span ref={thumbRef} aria-hidden data-slot="tabs-pill-thumb" className={tabsPillThumbClass} />
      {children}
    </Comp>
  )
}

export { TabsPillList }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type TabsPillListProps = ComponentProps<typeof TabsPillList>
