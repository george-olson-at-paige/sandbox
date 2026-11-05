"use client"

import type { ComponentProps, ReactNode } from "react"
import { CircleAlertIcon, CircleCheckIcon, XIcon } from "lucide-react"

import { Button } from "../../components/actions/button"
import { IconButton } from "../../components/actions/icon-button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../components/inputs/input-group"
import { cn } from "../../lib/utils"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). WILL-PLAN.md §3 (George 2026-11-04): who gets what share of
   something — a will's residuary, its backups. One row per person: their name and what they are
   to you, then their share as a whole-number percent, then ×. Under the rows:
   - the running total, in the success ink at exactly 100 ("Total 100%"), otherwise in the
     attention ink with what's left or over ("Total 80% · 20% left"), announced politely;
   - "Split evenly" (shares as equal as whole numbers allow, the remainder to the first rows);
   - the caller's way to add a person (`add`: a PersonPicker, say).
   The total is the field's rule; the caller refuses to save unless it's 100 (`totalOf`). */

export type ShareRow = { id: string; name: string; detail?: string; share: number | "" }

/** The rows' total, blanks as 0. */
export function totalOf(rows: ShareRow[]) {
  return rows.reduce((sum, r) => sum + (r.share === "" ? 0 : r.share), 0)
}

/** Equal whole-number shares, the remainder to the first rows. */
export function splitEvenly(rows: ShareRow[]): ShareRow[] {
  const n = rows.length
  if (!n) return rows
  const base = Math.floor(100 / n)
  const extra = 100 - base * n
  return rows.map((r, i) => ({ ...r, share: base + (i < extra ? 1 : 0) }))
}

/** Who gets what share: a percent per person, the running total (100 to save), Split evenly, and the caller's add. */
export function ShareField({
  rows,
  onChange,
  add,
  copy,
}: {
  rows: ShareRow[]
  onChange: (rows: ShareRow[]) => void
  /** The way to add a person, under the rows. */
  add?: ReactNode
  /** The words: the share input's name, ×'s name, the total line, Split evenly. */
  copy: {
    shareOf: (name: string) => string
    remove: (name: string) => string
    total: (total: number) => string
    left: (n: number) => string
    over: (n: number) => string
    split: string
  }
}) {
  const total = totalOf(rows)
  const ok = total === 100
  return (
    <div data-slot="share-field" className="flex flex-col gap-3">
      {rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-divider rounded-lg border border-border-medium">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{r.name}</span>
                {r.detail && <span className="truncate text-sm font-medium text-muted-foreground">{r.detail}</span>}
              </span>
              <InputGroup className="w-28 shrink-0">
                <InputGroupInput
                  inputMode="numeric"
                  aria-label={copy.shareOf(r.name)}
                  value={r.share}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 3)
                    onChange(rows.map((x, j) => (j === i ? { ...x, share: digits === "" ? "" : Math.min(100, Number(digits)) } : x)))
                  }}
                  className="text-right tabular-nums"
                />
                <InputGroupAddon align="inline-end">%</InputGroupAddon>
              </InputGroup>
              <IconButton
                type="button"
                variant="ghost"
                shape="rect"
                icon={<XIcon />}
                aria-label={copy.remove(r.name)}
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            aria-live="polite"
            data-ok={ok || undefined}
            className={cn("flex items-center gap-1.5 text-sm font-semibold [&_svg]:size-icon", ok ? "text-success" : "text-attention")}
          >
            {ok ? <CircleCheckIcon aria-hidden /> : <CircleAlertIcon aria-hidden />}
            {copy.total(total)}
            {!ok && <span className="font-medium">· {total < 100 ? copy.left(100 - total) : copy.over(total - 100)}</span>}
          </p>
          {rows.length > 1 && (
            <Button type="button" variant="secondary" size="sm" shape="rect" onClick={() => onChange(splitEvenly(rows))}>
              {copy.split}
            </Button>
          )}
        </div>
      )}
      {add}
    </div>
  )
}

export type ShareFieldProps = ComponentProps<typeof ShareField>
