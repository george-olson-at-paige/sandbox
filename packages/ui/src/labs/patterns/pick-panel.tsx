import type { ComponentProps, ElementType, ReactNode } from "react"
import { ChevronRightIcon, CircleAlertIcon } from "lucide-react"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Pick panel: get the owner to a first record"
   (D-V5: lands in labs, for patterns/). What WorkspacePage's stage shows with nothing open:
   - the View's glyph in a ring, "Pick someone" / "Pick a document" and what opening one shows;
   - "Start with these": up to five records that need something, each with the first thing it
     needs, as links that open it. A summary, not a second list: it never filters, and it isn't
     drawn when nothing needs anything.
   - with nothing in the View at all, one line about what the stage will show, and no title.
   The words are the caller's (docs/views.md); nothing in it knows people or documents.
   v0 copy (George, 2026-11-02), an exception to the prototype's word-for-word rule: the
   prototype always opens the first record, so it has no such state. */

export type PickItem = { id: string; title: string; need: string; href: string }

/** The stage with nothing open: what to choose, and the records that need something first. */
function PickPanel({
  icon,
  title,
  lead,
  start,
  items = [],
  empty,
  linkAs: Link = "a",
}: {
  /** The View's glyph (lucide), drawn in a ring. */
  icon: ReactNode
  /** "Pick someone". */
  title: string
  /** What opening one shows. */
  lead: string
  /** The heading over the records that need something ("Start with these"). */
  start: string
  /** Up to five are shown. */
  items?: PickItem[]
  /** The View has nothing in it: this line alone, under the glyph. */
  empty?: string
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
}) {
  const shown = items.slice(0, 5)
  return (
    <div data-slot="pick-panel" className="flex w-full max-w-sm flex-col items-center self-center pt-12 text-center">
      <span aria-hidden className="mb-4 inline-flex size-12 items-center justify-center rounded-full border border-divider bg-card text-muted-foreground [&_svg]:size-icon-lg">
        {icon}
      </span>
      {empty ? (
        <p className="font-medium text-muted-foreground">{empty}</p>
      ) : (
        <>
          <h2 className="mb-2 font-display text-lg font-bold">{title}</h2>
          <p className="text-sm font-medium text-muted-foreground">{lead}</p>
          {shown.length > 0 && (
            <section aria-label={start} className="mt-8 w-full text-left">
              <h3 className="mb-2 eyebrow text-muted-foreground">{start}</h3>
              <ul className="overflow-hidden rounded-lg border border-divider bg-card">
                {shown.map((item) => (
                  <li key={item.id} className="border-t border-divider first:border-t-0">
                    <Link href={item.href} className="flex items-center gap-3 px-3.5 py-2.5 focus-ring hover:layer-hover">
                      <CircleAlertIcon aria-hidden className="size-icon shrink-0 text-attention" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold">{item.title}</span>
                        <span className="truncate text-xs font-medium text-muted-foreground">{item.need}</span>
                      </span>
                      <ChevronRightIcon aria-hidden className="size-icon shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export { PickPanel }

export type PickPanelProps = ComponentProps<typeof PickPanel>
