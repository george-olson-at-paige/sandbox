"use client"

import type { ComponentProps, ElementType } from "react"
import { useState } from "react"
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { Input } from "../../../components/inputs/input"
import type { SaidValue } from "../views/data"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md "Checking the read" (George 2026-11-04): values
   read off a document, one line each, in the document's order. A line is its name, the value, and what is next for it by its state (data.ts SaidState):
   - read      not checked yet: Looks right, and Fix.
   - proposed  checked, and the Vault holds something else or nothing: why ("You have …",
               "Not in your Vault yet", the attention ink) under the value; Use this, and Keep
               mine when the Vault holds something.
   - used      in the Vault: the way to its Area ("Open in Personal").
   - kept      the owner kept theirs: "You kept yours".
   - unused    no Vault fact for it: "Not in your Vault".
   The record shows the waiting ones (read, proposed) in Needs you and the settled ones in What
   we read, which has no acts. Fix is only on a value not checked yet: the value turns into an input with Save and Cancel
   (Escape cancels). One line acts at a time (`busy`): its buttons off, its own says so ("Saving…").
   A failed act stays on its line with the reason; the input keeps what was typed. Below sm a line
   stacks: name, value, then what's next. */

type Result = void | { error: string }

export type SaidListCopy = {
  looksRight: string
  fix: string
  save: string
  cancel: string
  useThis: string
  keepMine: string
  saving: string
  youHave: (current: string) => string
  notYet: string
  kept: string
  unused: string
  /** The input's name while fixing ("Fix Date of birth"). */
  fixLabel: (label: string) => string
}

/** Every value a document says, each with what is next for it: Looks right, Use this / Keep mine, or Fix. */
export function SaidList({
  values,
  copy,
  busy,
  onBusy,
  onConfirm,
  onFix,
  onUse,
  onKeep,
  linkAs: Link = "a",
}: {
  values: SaidValue[]
  copy: SaidListCopy
  /** The key of the line acting now ("*" while every line is confirmed at once); every line's buttons are off. */
  busy: string | null
  onBusy: (key: string | null) => void
  /** Looks right. Without it, no Looks right. */
  onConfirm?: (key: string) => Promise<Result>
  /** Save a fixed value. Without it, no Fix. */
  onFix?: (key: string, value: string) => Promise<Result>
  onUse: (key: string) => Promise<Result>
  onKeep: (key: string) => Promise<Result>
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fixing, setFixing] = useState<{ key: string; value: string } | null>(null)
  async function run(key: string, act: () => Promise<Result>, done?: () => void) {
    onBusy(key)
    setErrors((e) => ({ ...e, [key]: "" }))
    const result = await act()
    onBusy(null)
    if (result && "error" in result) setErrors((e) => ({ ...e, [key]: result.error }))
    else done?.()
  }
  const off = busy !== null
  return (
    <ul data-slot="said-list" className="flex flex-col divide-y divide-divider">
      {values.map((v) => {
        const editing = fixing?.key === v.key
        const saving = busy === v.key || (busy === "*" && v.state === "read")
        const fixButton = onFix && v.state === "read" && (
          <Button variant="link" size="inline" className="text-xs" disabled={off} onClick={() => setFixing({ key: v.key, value: v.value })}>
            {copy.fix}
          </Button>
        )
        return (
          <li
            key={v.key}
            data-slot="said-line"
            data-state={v.state}
            className="flex flex-col gap-x-3 gap-y-1 py-2 text-sm sm:grid sm:grid-cols-record-said sm:items-center"
          >
            <span className="font-medium text-muted-foreground">{v.label}</span>
            {editing ? (
              <form
                id={`fix-${v.key}`}
                onSubmit={(e) => {
                  e.preventDefault()
                  run(
                    v.key,
                    () => onFix!(v.key, fixing.value),
                    () => setFixing(null),
                  )
                }}
              >
                <Input
                  autoFocus
                  aria-label={copy.fixLabel(v.label)}
                  value={fixing.value}
                  onChange={(e) => setFixing({ key: v.key, value: e.target.value })}
                  onKeyDown={(e) => e.key === "Escape" && setFixing(null)}
                />
              </form>
            ) : (
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold wrap-anywhere">{v.value}</span>
                {v.state === "proposed" && (
                  <span className="text-xs font-semibold text-attention">{v.current ? copy.youHave(v.current) : copy.notYet}</span>
                )}
              </span>
            )}
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
              {editing ? (
                <>
                  <Button type="submit" form={`fix-${v.key}`} size="sm" shape="rect" disabled={off}>
                    {busy === v.key ? copy.saving : copy.save}
                  </Button>
                  <Button variant="link" size="inline" className="text-xs" disabled={off} onClick={() => setFixing(null)}>
                    {copy.cancel}
                  </Button>
                </>
              ) : v.state === "read" ? (
                <>
                  {onConfirm && (
                    <Button variant="secondary" size="sm" shape="rect" disabled={off} onClick={() => run(v.key, () => onConfirm(v.key))}>
                      {saving ? copy.saving : copy.looksRight}
                    </Button>
                  )}
                  {fixButton}
                </>
              ) : v.state === "proposed" ? (
                <>
                  <Button size="sm" shape="rect" disabled={off} onClick={() => run(v.key, () => onUse(v.key))}>
                    {saving ? copy.saving : copy.useThis}
                  </Button>
                  {v.current && (
                    <Button variant="secondary" size="sm" shape="rect" disabled={off} onClick={() => run(v.key, () => onKeep(v.key))}>
                      {copy.keepMine}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {v.state === "used" && v.open ? (
                    <Link
                      href={v.open.href}
                      className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-muted-foreground focus-ring hover:text-primary [&_svg]:size-icon-xs"
                    >
                      {v.open.label}
                      <ArrowUpRightIcon aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">{v.state === "kept" ? copy.kept : copy.unused}</span>
                  )}
                  {fixButton}
                </>
              )}
            </span>
            {errors[v.key] && (
              <span role="alert" className="text-xs font-semibold text-destructive sm:col-span-3">
                {errors[v.key]}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export type SaidListProps = ComponentProps<typeof SaidList>
