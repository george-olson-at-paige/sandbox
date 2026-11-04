"use client"

import type { ComponentProps, ReactNode } from "react"
import { cva } from "class-variance-authority"
import { CheckIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { RadioGroup, RadioGroupItem } from "../components/inputs/radio-group"
import { cardFocus } from "../components/internal/control"

/* @archetype Surface (ARCHETYPES.md).
   ChoiceCard (absorbs SelectableCard; Vault since R11-05: area chips, Setup's roles and
   motivations): mode single (radio) · multi (toggle);
   layout row · tile; one selected style (blue border + accent fill + tick).
   Hover is shadow only, card → lift (R2-29, GAPS #51): only selection changes the border and
   fill, so a card under the pointer never reads as selected.
   Focus (R15-17): a card that chooses has no outline; the multi (button) card takes the halo
   outside its border (`cardFocus`). In single mode the radio inside is what takes focus, and it
   keeps the gapped ring, like Checkbox.
   The multi card stays a raw button with `aria-pressed` (U-04, decided against the base Toggle and
   ToggleGroup): each card is an independent choice, so each is its own tab stop, as checkboxes
   are; a ToggleGroup would hide them behind one tab stop, and the lone Toggle would add nothing
   the button doesn't already say.
   The cva helper is private: this file is "use client", and a server component can't call a
   function exported from a client module (R2-33; check:layers enforces it). */
const choiceCardVariants = cva(
  `${cardFocus} group/choice relative flex cursor-pointer rounded-lg border bg-card text-left shadow-card transition hover:shadow-lift data-[selected=true]:border-primary data-[selected=true]:bg-accent`,
  {
    variants: {
      layout: {
        row: "items-start gap-3 px-3 py-3",
        tile: "flex-col gap-2 p-4",
      },
    },
    defaultVariants: { layout: "row" },
  }
)

type Common = {
  /** The choice, in the person's words. */
  title: ReactNode
  /** One line under the title. */
  description?: ReactNode
  /** Lucide icon in a square, tile layout only. */
  icon?: ReactNode
  /** Badges or a note under the text. */
  footer?: ReactNode
  /** row: control beside the text (radio lists) · tile: icon above the text, tick in the corner (choice grids). */
  layout?: "row" | "tile"
  className?: string
}

function Body({ title, description, icon, footer, layout }: Common) {
  return (
    <>
      {icon && layout === "tile" && (
        <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground group-data-[selected=true]/choice:bg-primary group-data-[selected=true]/choice:text-primary-foreground [&>svg]:size-icon-lg">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("font-semibold text-card-foreground", layout === "tile" ? "text-base" : "text-sm")}>{title}</span>
        {description && <span className="text-sm font-medium text-pretty text-muted-foreground">{description}</span>}
      </span>
      {footer && <span className="mt-0.5 flex flex-wrap gap-1.5">{footer}</span>}
    </>
  )
}

function Tick() {
  return (
    <span className="absolute top-3 right-3 hidden size-5 items-center justify-center rounded-full bg-primary text-primary-foreground group-data-[selected=true]/choice:flex">
      <CheckIcon className="size-icon-xs" strokeWidth={3} />
    </span>
  )
}

/** A large selectable card for picking several options (toggle). For one of many, ChoiceCardOption inside ChoiceCardGroup. */
function ChoiceCard({
  selected,
  onSelectedChange,
  layout = "tile",
  className,
  ...body
}: Common & {
  /** Whether this card is on. The caller owns the selection. */
  selected: boolean
  /** Called with the new value when the card is pressed. */
  onSelectedChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      data-slot="choice-card"
      data-selected={selected}
      aria-pressed={selected}
      onClick={() => onSelectedChange(!selected)}
      className={cn(choiceCardVariants({ layout }), className)}
    >
      {layout === "tile" && <Tick />}
      <Body layout={layout} {...body} />
    </button>
  )
}

/** Single-select group (radio). */
function ChoiceCardGroup({ className, ...props }: ComponentProps<typeof RadioGroup>) {
  return <RadioGroup {...props} className={cn("gap-2", className)} />
}

function ChoiceCardOption({
  value,
  selected,
  layout = "row",
  className,
  ...body
}: Common & {
  /** The radio value, unique within the ChoiceCardGroup. */
  value: string
  /** Whether this option is the group's value (drives the selected style). */
  selected: boolean
}) {
  return (
    <label data-slot="choice-card" data-selected={selected} className={cn(choiceCardVariants({ layout }), className)}>
      <RadioGroupItem value={value} className="mt-0.5" />
      <Body layout={layout} {...body} />
    </label>
  )
}

export { ChoiceCard, ChoiceCardGroup, ChoiceCardOption }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type ChoiceCardProps = ComponentProps<typeof ChoiceCard>
export type ChoiceCardGroupProps = ComponentProps<typeof ChoiceCardGroup>
export type ChoiceCardOptionProps = ComponentProps<typeof ChoiceCardOption>
