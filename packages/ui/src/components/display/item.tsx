import { Children, type ComponentProps } from "react"
import type { ReactNode } from "react"

import { cn } from "../../lib/utils"
import {
  Item as UiItem,
  ItemActions as UiItemActions,
  ItemContent as UiItemContent,
  ItemDescription as UiItemDescription,
  ItemGroup as UiItemGroup,
  ItemMedia as UiItemMedia,
  ItemTitle as UiItemTitle,
} from "../../base/item"

/* @archetype Item (ARCHETYPES.md).
   Paige Item over upstream Item: only the list row Paige uses (no chrome, a divider between
   rows, prototype .vt-rec; GAPS #39), density row · compact, four media looks (area-icon,
   avatar, file; GAPS #40; icon, George 2026-10-28) and ItemGroup, the list around them.
   Upstream's outline/muted cards and header/footer are not exposed. */
const DENSITY = { row: "gap-3 py-3", compact: "gap-3 py-2" } as const
/* The media column is a fixed 40px and its contents centre in it (R3-05), so a list that mixes
   area icons (40 square), avatars (36) and file pages (32 wide) lines its media up on one
   vertical axis and its titles on one edge. */
const MEDIA = {
  "area-icon": "size-10 rounded-md bg-area-tint text-area-ink [&_svg:not([class*='size-'])]:size-icon-lg",
  avatar: "w-10",
  file: "mx-1 h-10 w-8 rounded-sm border bg-card text-muted-foreground shadow-card [&_svg:not([class*='size-'])]:size-icon",
  icon: "mx-1 size-8 rounded-full bg-area-tint text-area-ink [&_svg:not([class*='size-'])]:size-icon",
} as const

type Common = { className?: string; children?: ReactNode }

/** A row in a list: media, title, description and actions, with a divider between rows. */
function Item({
  density = "row",
  className,
  children,
  ...data
}: Common & { density?: keyof typeof DENSITY } & { [key: `data-${string}`]: string | undefined }) {
  return (
    <UiItem
      className={cn(
        "rounded-none border-0 border-t border-divider px-0 first:border-t-0 in-data-[slot=item-group-entry]:border-t-0 [a]:focus-ring",
        DENSITY[density],
        className
      )}
      {...data}
    >
      {children}
    </UiItem>
  )
}

/** The row's leading media: one 40px column, its look set by the kind of media in it. */
function ItemMedia({
  variant,
  className,
  children,
  ...data
}: Common & {
  /** The kind of media, not a size; it sets the box's shape and colours inside the 40px column.
      area-icon: a Life Area glyph on its tinted square · avatar: an Avatar (no box) · file: a document glyph on a small page ·
      icon: any lucide icon on a small tinted circle. */
  variant: keyof typeof MEDIA
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <UiItemMedia className={cn(MEDIA[variant], className)} {...data}>
      {children}
    </UiItemMedia>
  )
}

function ItemContent({ className, children }: Common) {
  return <UiItemContent className={cn("min-w-0 gap-0.5", className)}>{children}</UiItemContent>
}

function ItemTitle({ className, children }: Common) {
  return <UiItemTitle className={cn("font-semibold text-card-foreground", className)}>{children}</UiItemTitle>
}

/** Description; never clamps (a row grows with its content). */
function ItemDescription({ className, children }: Common) {
  return <UiItemDescription className={cn("line-clamp-none font-medium", className)}>{children}</UiItemDescription>
}

function ItemActions({ className, children }: Common) {
  return <UiItemActions className={className}>{children}</UiItemActions>
}

/* ItemGroup over upstream ItemGroup (role="list"). Upstream's Item has no listitem role, so a
   group of them is an empty list to assistive tech; each child is wrapped in a listitem here.
   The group owns the dividers between its entries (the rows' own top border is off inside it).
   Pass Items, or components that render one Item, as direct children: a Fragment is one entry. */
/** A list of Items: real list semantics, with or without dividers between them. */
function ItemGroup({
  dividers = true,
  label,
  className,
  children,
}: Common & {
  /** Draw a divider between entries. Default true; false for a short list of one-line items. */
  dividers?: boolean
  /** The list's accessible name, when nothing on the page labels it. */
  label?: string
}) {
  return (
    <UiItemGroup aria-label={label} className={className}>
      {Children.toArray(children).map((child, i) => (
        <div
          key={i}
          role="listitem"
          data-slot="item-group-entry"
          className={cn(dividers && "border-t border-divider first:border-t-0")}
        >
          {child}
        </div>
      ))}
    </UiItemGroup>
  )
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ItemProps = ComponentProps<typeof Item>
export type ItemActionsProps = ComponentProps<typeof ItemActions>
export type ItemContentProps = ComponentProps<typeof ItemContent>
export type ItemDescriptionProps = ComponentProps<typeof ItemDescription>
export type ItemGroupProps = ComponentProps<typeof ItemGroup>
export type ItemMediaProps = ComponentProps<typeof ItemMedia>
export type ItemTitleProps = ComponentProps<typeof ItemTitle>
