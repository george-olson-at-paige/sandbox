import type { ComponentProps } from "react"
import type { ElementType, ReactNode } from "react"
import { ChevronDownIcon, ChevronRightIcon, FileTextIcon } from "lucide-react"

import { cn } from "../lib/utils"
import type { AreaId } from "../icons/area-glyphs"
import { AreaGlyph } from "../icons/area-glyphs"
import { Avatar } from "../components/display/avatar"
import { Badge } from "../components/display/badge"
import { Button } from "../components/actions/button"
import { Inline } from "../primitives/inline"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../components/display/item"

export type FactItemKind = "person" | "pet" | "entity" | "document"

/** The second line under the detail (R2-27): a link (tap to call, an email, a page) or a muted
    note when there's nothing to link ("No number yet"). */
export type FactItemSecondary = { kind: "link"; label: string; href: string } | { kind: "note"; text: string }

/** A fact's state on a list (S-09): `rest` · `open` the list's one open thing (the only blue,
    ADR 0076 amendment rule 2) · `new` just added, marked, not active · `struck` taken off or
    deleted, struck through with Undo until the person leaves the page (rule 6). */
export type FactItemState =
  | { readonly kind: "rest" }
  | { readonly kind: "open" }
  | { readonly kind: "new" }
  | {
      readonly kind: "struck"
      /** Put it back. */
      readonly onUndo: () => void
      /** What happens when they leave the page, said to screen readers ("Elena Reyes will come off the people who depend on you when you leave this page."). */
      readonly note: string
    }

/** A fact that opens: the row becomes a toggle, and the body shows while the state is `open`. */
export type FactItemExpand = {
  /** The row was pressed: the list opens or closes it (one open thing, rule 1). */
  readonly onToggle: () => void
  /** What the open fact shows. */
  readonly body: ReactNode
}

const REST: FactItemState = { kind: "rest" }

/* @archetype Item (ARCHETYPES.md).
   FactItem (was RecordRow; R1-16): one fact in a list. The row is a layout container: media,
   title, detail, badges, inline actions, trailing actions and a chevron link.
   On a list (S-09, ADR 0076 amendment rules 1, 2, 6), it also takes a state and an expand, for
   every kind, so the look of those states lives here once:
   - `expand` makes the media and text one button (`aria-expanded`, a down chevron) that asks the
     list to toggle it; the body shows while `open`. A fact that opens has no chevron link: the
     two are one or the other, in the types.
   - `open` is the only state in the active colour (`bg-accent`, the CaptureCard wash). An
     expandable row's wash runs past the text (`-mx-3 px-3`) so its text stays on the list's edge.
   - `new` adds a "New" badge in the success tone, never blue. It is a tag: on a row that opens,
     the tags sit inside the toggle before its chevron, and the actions after it.
   - `struck` mutes and strikes the text, closes the expand, and replaces the actions, tags and
     link with Undo ("Undo, keep {name}") and a note for screen readers.
   - Focus by kind of control (R15-17): the toggle is a row (the wash), Undo a button (the ring).
     Hover is relative (R4-01).
   Without a state or an expand the markup is what it was. */
/** One person, pet, entity or document in a list, with badges, actions and a link; on a list, a state (open, new, struck) and an expand. */
function FactItem({
  kind,
  name,
  detail,
  secondary,
  tags,
  actions,
  href,
  hrefLabel,
  expand,
  state = REST,
  area,
  density = "row",
  linkAs: Link = "a",
  children,
  className,
}: {
  /** person · pet (avatar) · entity (area glyph) · document (file icon; badges under the title). */
  kind: FactItemKind
  /** The title line. */
  name: ReactNode
  /** One line under the title: relationship, date, source. */
  detail?: ReactNode
  /** A second line under the detail: a link (tel:, mailto:, a page) or a muted note. */
  secondary?: FactItemSecondary
  /** Badges: under the title for documents, on the right for people */
  tags?: ReactNode
  /** Trailing buttons, before the chevron. */
  actions?: ReactNode
  /** rest (default) · open · new · struck: the fact's state on its list. */
  state?: FactItemState
  /** Area for the entity glyph and colour (kind entity). */
  area?: AreaId
  /** row (default) · compact (tighter padding, for dense lists). */
  density?: "row" | "compact"
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
  /** inline actions under the description */
  children?: ReactNode
  /** Extra classes on the row (spacing in a list), not restyling. */
  className?: string
} & (
  | {
      /** Adds a chevron link at the end of the row. */
      href?: string
      /** Accessible name for the chevron link. Default "Open {name}". */
      hrefLabel?: string
      expand?: undefined
    }
  | {
      /** The fact opens in place: the row toggles, the body shows while open. */
      expand: FactItemExpand
      href?: undefined
      hrefLabel?: undefined
    }
)) {
  const isDoc = kind === "document"
  const label = typeof name === "string" ? name : ""
  const struck = state.kind === "struck"
  const open = state.kind === "open"
  const toggle = expand && !struck ? expand.onToggle : undefined

  const lead = (
    <>
      {kind === "person" || kind === "pet" ? (
        <ItemMedia variant="avatar" className={cn(struck && "opacity-disabled")}>
          {/* Decorative: the name is the title, so the initials would only repeat it ("ER Elena Reyes"). */}
          <span aria-hidden className="flex">
            <Avatar name={label} size="md" variant={kind} />
          </span>
        </ItemMedia>
      ) : kind === "entity" ? (
        <ItemMedia variant="area-icon" data-area={area} className={cn(struck && "opacity-disabled")}>
          <AreaGlyph area={area ?? "personal"} />
        </ItemMedia>
      ) : (
        <ItemMedia variant="file" className={cn(struck && "opacity-disabled")}>
          <FileTextIcon />
        </ItemMedia>
      )}
      <ItemContent className="wrap-anywhere">
        <ItemTitle className={cn(struck && "text-muted-foreground line-through")}>{name}</ItemTitle>
        {detail && <ItemDescription className={cn(struck && "line-through")}>{detail}</ItemDescription>}
        {!struck && secondary?.kind === "link" &&
          (() => {
            // In-app paths use the router link; tel:, mailto: and the web are plain anchors.
            const Anchor = secondary.href.startsWith("/") ? Link : "a"
            return (
              <Anchor href={secondary.href} className="w-fit rounded-sm text-sm font-semibold text-primary focus-ring hover:underline">
                {secondary.label}
              </Anchor>
            )
          })()}
        {!struck && secondary?.kind === "note" && <span className="text-sm font-medium text-placeholder italic">{secondary.text}</span>}
        {!struck && isDoc && tags && <Inline gap={2} className="mt-1.5">{tags}</Inline>}
        {!struck && children && <Inline gap={4} className="mt-1.5 text-sm">{children}</Inline>}
      </ItemContent>
    </>
  )

  // New is a tag; a person's tags sit on the right, before the row's own chevron (the toggle's,
  // inside it, or the link's, after the actions).
  const rowTags = !struck && (state.kind === "new" || (!isDoc && tags)) && (
    <>
      {state.kind === "new" && <Badge tone="success" size="xs">New</Badge>}
      {!isDoc && tags}
    </>
  )

  const trailing = struck ? (
    <>
      <span role="status" className="sr-only">{state.note}</span>
      <Button variant="quiet" size="sm" underline onClick={state.onUndo} aria-label={`Undo, keep ${label}`}>
        Undo
      </Button>
    </>
  ) : (
    (actions || (!toggle && rowTags) || href) && (
      <>
        {!toggle && rowTags}
        {actions}
        {href && (
          <Link href={href} aria-label={hrefLabel ?? `Open ${label}`} className="rounded-sm text-muted-foreground focus-ring hover:text-primary">
            <ChevronRightIcon className="size-icon" />
          </Link>
        )}
      </>
    )
  )

  const row = (
    <Item density={density} data-kind={kind} className={cn("flex-nowrap", isDoc && "items-start", className)}>
      {toggle ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className={cn("flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-sm text-left outline-none", isDoc && "items-start")}
        >
          {lead}
          {rowTags && <span className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">{rowTags}</span>}
          <ChevronDownIcon aria-hidden className={cn(!rowTags && "ml-auto", "size-icon shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-180")} />
        </button>
      ) : (
        lead
      )}
      {trailing && <ItemActions className="shrink-0 flex-wrap justify-end">{trailing}</ItemActions>}
    </Item>
  )

  if (!expand && state.kind === "rest") return row
  return (
    <div
      data-slot="fact-item"
      data-state={state.kind}
      className={cn(
        expand && "-mx-3 rounded-md px-3",
        toggle && !open && "has-[button[aria-expanded]:hover]:layer-hover has-[button[aria-expanded]:focus-visible]:layer-hover",
        open && "bg-accent"
      )}
    >
      {row}
      {open && expand && (
        <div data-slot="fact-item-body" className="pb-3">
          {expand.body}
        </div>
      )}
    </div>
  )
}

export { FactItem }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type FactItemProps = ComponentProps<typeof FactItem>
