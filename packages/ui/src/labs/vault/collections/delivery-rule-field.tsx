"use client"

import type { ComponentProps } from "react"
import { useId } from "react"

import { Input } from "../../../components/inputs/input"
import { RadioGroup, RadioGroupItem } from "../../../components/inputs/radio-group"
import { Select } from "../../../components/inputs/select"
import { Field } from "../../../forms/field"
import { FieldGroup } from "../../../forms/field-group"
import { DateField } from "../../../forms/fields/date-field"
import { cn } from "../../../lib/utils"
import type { DeliveryKind, DeliveryRule } from "./messages"

/* @archetype Control (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §3 (George 2026-11-04): when a message goes.
   The five choices as radios, each with its line ("Once, on the day you pick"); under the chosen
   one only the inputs it needs — a date, or a month and a day, or nothing. The Vue form showed
   every input whatever the choice (COLLECTIONS-PLAN §1). Changing the choice keeps what was typed
   for the others until Save, so trying one and coming back loses nothing (`draft`). The value is
   the rule (`DeliveryRule`); a choice with its inputs not filled isn't a rule yet, so the caller
   validates (`value` is undefined for it). */

export type DeliveryDraft = { kind?: DeliveryKind; date: string; month: string; day: string }

/** The draft a rule starts from. */
export function draftOf(rule?: DeliveryRule): DeliveryDraft {
  return {
    kind: rule?.kind,
    date: rule?.kind === "date" ? rule.date : "",
    month: rule?.kind === "yearly" ? String(rule.month) : "",
    day: rule?.kind === "yearly" ? String(rule.day) : "",
  }
}

/** The rule a draft makes, when it makes one. */
export function ruleOf(d: DeliveryDraft): DeliveryRule | undefined {
  switch (d.kind) {
    case "now":
    case "delegate":
    case "after":
      return { kind: d.kind }
    case "date":
      return d.date ? { kind: "date", date: d.date } : undefined
    case "yearly": {
      const month = Number(d.month)
      const day = Number(d.day)
      return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { kind: "yearly", month, day } : undefined
    }
    default:
      return undefined
  }
}

/** When a message goes: the five choices as radios, and under the chosen one only its inputs. */
export function DeliveryRuleField({
  draft,
  onChange,
  copy,
}: {
  draft: DeliveryDraft
  onChange: (draft: DeliveryDraft) => void
  copy: {
    label: string
    kinds: Array<{ kind: DeliveryKind; label: string; hint: string }>
    date: string
    month: string
    day: string
    months: string[]
  }
}) {
  const id = useId()
  return (
    <RadioGroup
      data-slot="delivery-rule-field"
      aria-label={copy.label}
      value={draft.kind ?? ""}
      onValueChange={(kind) => onChange({ ...draft, kind: kind as DeliveryKind })}
      className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border-medium"
    >
      {copy.kinds.map((k) => {
        const on = draft.kind === k.kind
        const itemId = `${id}-${k.kind}`
        return (
          <div
            key={k.kind}
            data-on={on || undefined}
            className={cn("flex flex-col gap-3 border-t border-divider px-4 py-3 first:border-t-0", on ? "bg-accent" : "")}
          >
            <label htmlFor={itemId} className="flex cursor-pointer items-start gap-3">
              <RadioGroupItem id={itemId} value={k.kind} className="mt-0.5" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{k.label}</span>
                <span className="text-sm font-medium text-muted-foreground">{k.hint}</span>
              </span>
            </label>
            {on && k.kind === "date" && (
              <div className="pl-7">
                <Field label={copy.date}>
                  <DateField value={draft.date} onValueChange={(date) => onChange({ ...draft, date })} />
                </Field>
              </div>
            )}
            {on && k.kind === "yearly" && (
              <div className="pl-7">
                <FieldGroup>
                  <Field label={copy.month} span={8}>
                    <Select
                      value={draft.month}
                      onValueChange={(month) => onChange({ ...draft, month })}
                      options={copy.months.map((m, i) => ({ value: String(i + 1), label: m }))}
                    />
                  </Field>
                  <Field label={copy.day} span={4}>
                    <Input
                      inputMode="numeric"
                      value={draft.day}
                      onChange={(e) => onChange({ ...draft, day: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    />
                  </Field>
                </FieldGroup>
              </div>
            )}
          </div>
        )
      })}
    </RadioGroup>
  )
}

export type DeliveryRuleFieldProps = ComponentProps<typeof DeliveryRuleField>
