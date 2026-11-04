"use client"

import type { ComponentProps } from "react"
import { useState } from "react"

import { Button } from "../../../components/actions/button"
import type { WaitingValue } from "../views/data"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4 (D-V5: lands in labs, for vault/documents/).
   The values Paige read off a document that wait for the owner's yes, in View (the to-do where the
   value shows, George 2026-11-02): the field's name, the value read, then why it waits — "You have
   …" when the Vault holds something else, "Not in your Vault yet" when it holds nothing. Use this
   takes the read value (the action's emphasis: it fills the Vault); Keep mine (only when they
   differ) leaves the Vault as it is. A line is busy while its write is in flight: both buttons
   off, Use this says so. A write that fails says why on the line and keeps it. Built on its own
   for now; FactField's conflict state is the nearest relative (VIEWS-PLAN §2). */

/** A document's waiting values: each with Use this, and Keep mine when the Vault holds something else. */
export function ValuesToCheck({
  values,
  onUse,
  onKeep,
  copy,
}: {
  values: WaitingValue[]
  /** Take the read value. A thrown error or `{ error }` stays on the line. */
  onUse: (key: string) => Promise<void | { error: string }>
  /** Keep what the Vault holds. */
  onKeep: (key: string) => Promise<void | { error: string }>
  /** The words: the buttons, "You have {current}", "Not in your Vault yet", the pending label. */
  copy: { useThis: string; keepMine: string; saving: string; youHave: (current: string) => string; notYet: string }
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  async function run(key: string, act: (key: string) => Promise<void | { error: string }>) {
    setBusy(key)
    setErrors((e) => ({ ...e, [key]: "" }))
    const result = await act(key)
    if (result && "error" in result) setErrors((e) => ({ ...e, [key]: result.error }))
    setBusy(null)
  }
  return (
    <ul data-slot="values-to-check" className="flex flex-col divide-y divide-divider rounded-lg border border-divider">
      {values.map((v) => (
        <li key={v.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="flex min-w-0 flex-col">
            <span className="eyebrow text-muted-foreground">{v.label}</span>
            <span className="text-sm font-semibold">{v.value}</span>
            <span className="text-xs font-semibold text-attention">{v.current ? copy.youHave(v.current) : copy.notYet}</span>
            {errors[v.key] && (
              <span role="alert" className="text-xs font-semibold text-destructive">
                {errors[v.key]}
              </span>
            )}
          </span>
          <span className="flex shrink-0 gap-2">
            <Button size="sm" disabled={busy !== null} onClick={() => run(v.key, onUse)}>
              {busy === v.key ? copy.saving : copy.useThis}
            </Button>
            {v.current && (
              <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => run(v.key, onKeep)}>
                {copy.keepMine}
              </Button>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

export type ValuesToCheckProps = ComponentProps<typeof ValuesToCheck>
