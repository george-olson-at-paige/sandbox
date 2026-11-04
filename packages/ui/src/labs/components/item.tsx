/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). Replaces: components/display/item (STACK-REVIEW S-27).
   Item, one of the most basic components: media, a title and a description, actions. It stands
   on its own (a card's content, a line in a panel) or in a group; a list is one use of it, not
   what it is. A caller gives it regions as parameters and Item places them.
   Region names are shadcn's Item parts (our base, src/base/item.tsx) wherever shadcn has one:
   media, title, description, actions, footer; so is `size` (default · sm). `details` is ours:
   shadcn has nothing under the description. shadcn also has a header (a full line above); we add
   it when something needs it.

   Two exports, one layout (ORGANIZATION.md §11, one frame filled twice):
   - ItemFrame: the layout, every region a plain slot. The docs page's drawing fills it with
     placeholders. Screens don't use it.
   - Item: the frame filled from typed parameters. Actions are one of four kinds (S-34, S-40): a
     button (a pill, or blue text for an action an icon wouldn't say clearly enough), a link (the
     open chevron), one or two icon actions, or a menu. Never two of them together: two primary actions on
     one Item make a person stop and work out which does what. The footer is a decline (ink,
     underlined, under the title) or other content (S-38). `context` is why it is here, shown
     only where the place has a purpose for it (a role is contextual: never every role someone
     holds); plain text after the description for now, its own slot for a later treatment (S-39).
     A menu is the fourth kind of actions, not a companion: a chevron or a ⋯, never both (S-40,
     George). It is useActionMenu, shared with the table's RowActions, so Items and table rows
     act alike; on an Item the same menu also opens on right-click (S-41).

   Item knows nothing about what it shows: no avatar, area icon or file kinds. A caller (FactItem)
   builds its own media and passes it in; Item gives it a fixed 40px column. Expanded content is
   not a region: whatever expands an Item puts it around the Item, not inside it.

   Layout rules (the docs page draws them):
   - The main line is media · title and description · actions. Actions centre on it; media
     centres too, and moves to the top when there is a description (shadcn).
   - Details are a line of their own under the main line, indented to the text column, so they
     never move the actions or the media. (In one flex line the actions would centre on the whole
     text column, and every extra line would push them down.)
   - The footer is a full line under everything, part of the Item (shadcn's ItemFooter).
   - An absent region takes no space and leaves no gap: spacing is on the regions present.
   - Item has its own padding: 12px at the sides, and its size's top and bottom.
   Hooks are one nested parameter, not handlers on the root: `hooks.onActivate` makes the title
   the Item's control, with the whole Item its target (actions, details and footer stay their own). */
import type { ElementType, ReactElement, ReactNode } from "react"
import { ChevronRightIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { assertNever } from "../facts/kinds"
import { ACTION_ICONS, type ActionIcon } from "../icons/action-icons"
import { Button } from "../../components/actions/button"
import { useActionMenu, type ListAction } from "../../components/actions/action-menu"
import { Item as ItemRoot, ItemActions, ItemContent, ItemDescription, ItemTitle } from "../../components/display/item"

// ── Actions ─────────────────────────────────────────────────────────────────────────────────────

/** One icon action: an action from the action icons (Item draws its icon), named for screen readers. */
export type ItemIconAction = {
  /** The action; its icon comes from ACTION_ICONS, never from the caller. */
  readonly action: ActionIcon
  /** What it does, said to screen readers ("Remove David Reyes"). */
  readonly label: string
  readonly onClick: () => void
}

/* Icon actions are Button's `quiet` variant (muted ink, its own hover turns the icon blue, no
   background), and quiet until the person reaches the Item: 75% at rest, full while the Item is
   hovered or has focus inside it. Only with a fine pointer (a mouse): touch has no hover, so on
   touch they stay full. The floor is `opacity-quiet` (--opacity-quiet, 75%; T-07): muted ink at
   75% keeps 3.2:1 or more on white, the muted surface and the blue wash (WCAG 1.4.11 asks 3:1
   for an icon button; scripts/theme-contrast.test.mjs holds the three). No colour token fits
   between muted ink (5.8:1) and the next lighter ink (2.2:1, too faint), and muted to full ink
   was too small a step to see. */
const QUIET_UNTIL_REACHED =
  "transition-opacity motion-reduce:transition-none pointer-fine:opacity-quiet pointer-fine:group-hover/item:opacity-100 pointer-fine:group-focus-within/item:opacity-100"

/** An Item's actions: exactly one of three kinds. */
export type ItemActionsKind =
  /** One button with a label. `secondary` (default): the pill ("Invite"). `text`: a blue text
      button, for an action an icon wouldn't say clearly enough ("Add a number"). */
  | {
      readonly kind: "button"
      readonly label: string
      readonly onClick: () => void
      readonly emphasis?: "secondary" | "text"
    }
  /** A link to the thing's own page: the open chevron. */
  | {
      readonly kind: "link"
      readonly href: string
      /** Said to screen readers ("Open David Reyes"). */
      readonly label: string
      /** The router's link component (Next's `Link`). Default a plain `a`. */
      readonly as?: ElementType
    }
  /** One or two icon buttons, each an action from the action icons (edit, remove…). Quiet until
      the Item is reached. Two at most: more pushes the text left, so more goes in a menu. */
  | { readonly kind: "icons"; readonly items: readonly [ItemIconAction] | readonly [ItemIconAction, ItemIconAction] }
  /** More actions behind a ⋯, and the same menu on right-click of the Item (useActionMenu, the
      table row's rules too: typed ListActions; destructive last and confirmed, red only if
      irreversible; an action that can't apply shows its reason). Quiet until the Item is reached. */
  | {
      readonly kind: "menu"
      /** Names the ⋯ for screen readers: whose actions ("Actions for David Reyes"). */
      readonly label: string
      readonly actions: readonly ListAction[]
      /** The router's link component for `link` actions. */
      readonly linkAs?: ElementType
    }

/** The menu kind, which needs a hook: rendered by ItemWithMenu, not here. */
type ItemMenuActions = Extract<ItemActionsKind, { kind: "menu" }>

function renderActions(actions: Exclude<ItemActionsKind, ItemMenuActions>): ReactNode {
  switch (actions.kind) {
    case "button":
      return actions.emphasis === "text" ? (
        // Inline, so the words end at the Item's edge; min-h-control-sm keeps a 36px target.
        <Button size="inline" variant="link" className="min-h-control-sm" onClick={actions.onClick}>
          {actions.label}
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={actions.onClick}>
          {actions.label}
        </Button>
      )
    case "link": {
      const Link = actions.as ?? "a"
      return (
        <Link href={actions.href} aria-label={actions.label} className="flex rounded-sm text-muted-foreground focus-ring hover:text-primary">
          <ChevronRightIcon className="size-icon" />
        </Link>
      )
    }
    case "icons":
      return actions.items.map((a) => {
        const Icon = ACTION_ICONS[a.action]
        return <Button key={a.label} variant="quiet" size="icon" icon={<Icon />} aria-label={a.label} onClick={a.onClick} className={QUIET_UNTIL_REACHED} />
      })
    default:
      return assertNever(actions)
  }
}

/** An Item's footer: a decline, or other content. */
export type ItemFooterKind =
  /** The decline (skip, ignore, not this one): ink and underlined, never blue (Button quiet +
      underline, R2-14), lined up with the title. The way out, so it never sits beside the actions. */
  | { readonly kind: "decline"; readonly label: string; readonly onClick: () => void }
  /** Anything else on a full line under the Item. */
  | { readonly kind: "content"; readonly content: ReactNode }

function renderFooter(footer: ItemFooterKind, indented: boolean): ReactNode {
  switch (footer.kind) {
    case "decline":
      return (
        <div className={cn(indented && "pl-13")}>
          <Button size="inline" variant="quiet" underline className="text-foreground hover:text-foreground" onClick={footer.onClick}>
            {footer.label}
          </Button>
        </div>
      )
    case "content":
      return footer.content
    default:
      return assertNever(footer)
  }
}

// ── The frame (the layout) ──────────────────────────────────────────────────────────────────────

/** Item's layout with every region a plain slot: what the docs page's drawing fills. */
export type ItemFrameSlots = {
  readonly media?: ReactNode
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly details?: ReactNode
  readonly actions?: ReactNode
  readonly footer?: ReactNode
  readonly size?: "default" | "sm"
  /** Positions the Item for a whole-Item target (the title's button stretches over it). */
  readonly activatable?: boolean
}

/** Item's layout: the regions placed, each a plain slot. Screens use Item; the docs page draws this. */
export function ItemFrame({ media, title, description, details, actions, footer, size = "default", activatable }: ItemFrameSlots) {
  return (
    <ItemRoot
      density={size === "sm" ? "compact" : "row"}
      data-labs-item=""
      className={cn("flex-col flex-nowrap items-stretch gap-0 px-3", activatable && "relative")}
    >
      {/* The main line: media, title and description, actions. Actions centre on it. */}
      <div data-slot="item-main" className="flex items-center gap-3">
        {media && (
          <div data-slot="item-media" className={cn("flex w-10 shrink-0 items-center justify-center", description && "translate-y-0.5 self-start")}>
            {media}
          </div>
        )}
        <ItemContent className="wrap-anywhere">
          <ItemTitle>{title}</ItemTitle>
          {description && <ItemDescription>{description}</ItemDescription>}
        </ItemContent>
        {actions && <ItemActions className="relative shrink-0 flex-wrap justify-end">{actions}</ItemActions>}
      </div>
      {/* Details: their own line under the main line, indented to the text column (40px media + 12px gap). */}
      {details && (
        <div data-slot="item-details" className={cn("relative mt-1.5 text-sm", media && "pl-13")}>
          {details}
        </div>
      )}
      {footer && (
        <div data-slot="item-footer" className="relative mt-3">
          {footer}
        </div>
      )}
    </ItemRoot>
  )
}

// ── Item ────────────────────────────────────────────────────────────────────────────────────────

/** What the Item does when a person interacts with it. */
export type ItemHooks = {
  /** The Item was pressed. Makes the title a button whose target is the whole Item. */
  readonly onActivate?: () => void
}

/** The regions of an Item, and its settings. Only `title` is required. */
export type ItemRegions = {
  /** Leading, in a fixed 40px column: the caller's content (an avatar, an icon), centred in it. */
  readonly media?: ReactNode
  /** What it is. Wraps; never truncates. */
  readonly title: ReactNode
  /** Under the title: a short line about it. */
  readonly description?: ReactNode
  /** Why it is here, when the place has a purpose for saying so (a person's role on this list:
      "Emergency contact"). Plain text after the description for now ("Spouse · Emergency
      contact"); its own slot, so a later treatment changes in one place (S-39). */
  readonly context?: string
  /** More lines under the description, in the text column. They don't move the actions. */
  readonly details?: ReactNode
  /** Trailing, centred on the main line: a button, a link, icon actions, or a menu. One kind only. */
  readonly actions?: ItemActionsKind
  /** A full line under everything, part of the Item: a decline, or other content. */
  readonly footer?: ItemFooterKind
  /** default · sm (tighter top and bottom). shadcn's sizes. */
  readonly size?: "default" | "sm"
  /** What the Item does when pressed. */
  readonly hooks?: ItemHooks
}

/** An Item whose actions are a menu: the ⋯ in the actions, the same menu on right-click of the
    whole Item (a wrapper, since the Item's root passes on only data attributes), one confirm. */
function ItemWithMenu({ menu, frame }: { menu: ItemMenuActions; frame: (actions: ReactNode) => ReactElement }) {
  const { trigger, withContextMenu, dialog } = useActionMenu({ actions: menu.actions, label: menu.label, linkAs: menu.linkAs, variant: "quiet" })
  return (
    <>
      {withContextMenu(<div data-slot="item-context-target">{frame(<span className={cn("flex", QUIET_UNTIL_REACHED)}>{trigger}</span>)}</div>)}
      {dialog}
    </>
  )
}

/** One of the most basic components: media, title, description, details, actions and footer, placed from its regions. */
export function Item({ actions, ...rest }: ItemRegions) {
  if (actions?.kind === "menu") return <ItemWithMenu menu={actions} frame={(a) => <PlacedItem {...rest} actionsNode={a} />} />
  return <PlacedItem {...rest} actionsNode={actions && renderActions(actions)} />
}

/** Item with its actions already drawn. */
function PlacedItem({ title, description, context, actionsNode, footer, hooks, ...regions }: Omit<ItemRegions, "actions"> & { actionsNode: ReactNode }) {
  const activate = hooks?.onActivate
  const contextText = context && <span data-slot="item-context">{context}</span>
  return (
    <ItemFrame
      {...regions}
      description={
        description && contextText ? (
          <>
            {description}
            <span aria-hidden> · </span>
            <span className="sr-only">, </span>
            {contextText}
          </>
        ) : (
          (description ?? contextText)
        )
      }
      activatable={Boolean(activate)}
      title={
        activate ? (
          <button type="button" onClick={activate} className="cursor-pointer rounded-sm text-left focus-ring after:absolute after:inset-0">
            {title}
          </button>
        ) : (
          title
        )
      }
      actions={actionsNode}
      footer={footer && renderFooter(footer, Boolean(regions.media))}
    />
  )
}
