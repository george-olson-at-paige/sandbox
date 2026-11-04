"use client"

import type { ComponentProps, ReactNode } from "react"
import { useEffect, useRef } from "react"
import { PlusIcon, XIcon } from "lucide-react"

import { Button } from "../../components/actions/button"
import { IconButton } from "../../components/actions/icon-button"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §3 (George 2026-11-04): rows of the same
   fields that the person adds to and takes from — an account's credentials (a label and a
   secret), a message's recipients later, a memory's sections without their reorder. Generic:
   the caller draws a row's fields (`row`); this draws the rows, × on each, and the Add under
   them.
   - Add puts a new row at the end (`create`) and moves focus to its first field; × takes the
     row out and moves focus to the row that takes its place, or to Add when it was the last.
   - `max` hides Add once reached, and the line under the rows says why ("Up to 5").
   - `min` keeps × off the rows that must stay (a required first row).
   - No reorder here; a list that needs it is Sortable's job.
   Each row is a group named by `rowLabel` ("Credential 2"), so × reads "Remove credential 2". */

/** Rows of the same fields to add to and take from: × on each row, Add under them, focus kept. */
export function RepeatField<T>({
  items,
  onChange,
  create,
  row,
  rowLabel,
  addLabel,
  removeLabel = (label) => `Remove ${label.toLowerCase()}`,
  max,
  maxLine,
  min = 0,
  keyOf,
}: {
  items: T[]
  onChange: (items: T[]) => void
  /** A new, empty row's value. */
  create: () => T
  /** One row's fields: its value, and a setter for it. */
  row: (item: T, update: (next: T) => void, index: number) => ReactNode
  /** A row's name ("Credential 2"), for its group and its ×. */
  rowLabel: (index: number) => string
  /** The Add button's words ("Add a credential"). */
  addLabel: string
  /** ×'s name from the row's name. */
  removeLabel?: (rowLabel: string) => string
  /** The most rows; Add goes when it's reached. */
  max?: number
  /** The line shown when `max` is reached ("Up to 5 credentials"). */
  maxLine?: string
  /** Rows that can't be removed (the first `min`). */
  min?: number
  /** A row's stable key (an id); default its index. */
  keyOf?: (item: T, index: number) => string | number
}) {
  const list = useRef<HTMLDivElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const focusRow = useRef<number | "add" | null>(null)
  useEffect(() => {
    const target = focusRow.current
    focusRow.current = null
    if (target === null) return
    if (target === "add") return addRef.current?.focus()
    const rowEl = list.current?.querySelectorAll<HTMLElement>("[data-slot=repeat-field-row]")[target]
    rowEl?.querySelector<HTMLElement>("input, textarea, select, button[role=combobox]")?.focus()
  }, [items.length])
  const full = max !== undefined && items.length >= max
  return (
    <div data-slot="repeat-field" className="flex flex-col gap-3">
      {items.length > 0 && (
        <div ref={list} className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div
              key={keyOf ? keyOf(item, i) : i}
              data-slot="repeat-field-row"
              role="group"
              aria-label={rowLabel(i)}
              className="flex items-start gap-2 rounded-lg border border-divider p-3"
            >
              <div className="min-w-0 flex-1">{row(item, (next) => onChange(items.map((it, j) => (j === i ? next : it))), i)}</div>
              {i >= min && (
                <IconButton
                  type="button"
                  variant="ghost"
                  shape="rect"
                  icon={<XIcon />}
                  aria-label={removeLabel(rowLabel(i))}
                  onClick={() => {
                    focusRow.current = items.length - 1 > i ? i : i > 0 ? i - 1 : "add"
                    onChange(items.filter((_, j) => j !== i))
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
      {full ? (
        maxLine && <p className="text-sm font-medium text-muted-foreground">{maxLine}</p>
      ) : (
        <Button
          ref={addRef}
          type="button"
          variant="secondary"
          size="sm"
          shape="rect"
          icon={<PlusIcon />}
          className="self-start"
          onClick={() => {
            focusRow.current = items.length
            onChange([...items, create()])
          }}
        >
          {addLabel}
        </Button>
      )}
    </div>
  )
}

export type RepeatFieldProps<T> = ComponentProps<typeof RepeatField<T>>
