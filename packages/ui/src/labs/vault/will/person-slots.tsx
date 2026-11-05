"use client"

import type { ComponentProps } from "react"
import { useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, UserPlusIcon, XIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { IconButton } from "../../../components/actions/icon-button"
import { Avatar } from "../../../components/display/avatar"
import { Badge } from "../../../components/display/badge"
import { Input } from "../../../components/inputs/input"
import { Field } from "../../../forms/field"
import { FieldGroup } from "../../../forms/field-group"
import { PersonPicker, type PersonPickerPerson } from "../../../vault/people/person-picker"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). WILL-PLAN.md §2–3 (George 2026-11-04): the people a will names in
   order — executors, a child's guardians, anyone left out. People come from the Vault: "From
   your people" offers the owner's people as PersonPicker's pills (a search past five), and a
   pick is a row with their avatar, name and what they are to you; nobody types a name twice.
   "Someone new" opens a row of fields (name, what they are to you, email when the caller asks
   for it); the API adds them to People when the will saves.
   - In order: the first is marked "First choice" (`ordered`), ↑ ↓ move a row, × takes it out.
   - People already in the list aren't offered again.
   - `max` hides the ways to add once reached. */

export type Slot = { id: string; personId?: string; name: string; relationship: string; email?: string }

/** People a will names, in order: pick from your people or add someone new; ↑ ↓ ×; the first marked. */
export function PersonSlots({
  slots,
  onChange,
  people,
  ordered = true,
  askEmail = false,
  max,
  newId,
  copy,
}: {
  slots: Slot[]
  onChange: (slots: Slot[]) => void
  /** The owner's people, to pick from. */
  people: PersonPickerPerson[]
  /** Order matters (executors, guardians): "First choice" on the first, ↑ ↓ on each. */
  ordered?: boolean
  /** A new person's fields include email (executors). */
  askEmail?: boolean
  max?: number
  newId: () => string
  copy: {
    pick: string
    someoneNew: string
    first: string
    name: string
    relationship: string
    email: string
    up: (name: string) => string
    down: (name: string) => string
    remove: (name: string) => string
  }
}) {
  const [picking, setPicking] = useState(slots.length === 0)
  const full = max !== undefined && slots.length >= max
  const offered = people.filter((p) => !slots.some((s) => s.personId === p.id))
  const update = (i: number, patch: Partial<Slot>) => onChange(slots.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, by: -1 | 1) => {
    const next = [...slots]
    const [s] = next.splice(i, 1)
    next.splice(i + by, 0, s!)
    onChange(next)
  }
  return (
    <div data-slot="person-slots" className="flex flex-col gap-3">
      {slots.length > 0 && (
        <ol className="flex flex-col gap-2">
          {slots.map((s, i) => {
            const label = s.name || copy.someoneNew
            return (
              <li key={s.id} role="group" aria-label={label} className="flex items-start gap-3 rounded-lg border border-border-medium p-3">
                {s.personId ? (
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{s.name}</span>
                        {ordered && i === 0 && (
                          <Badge tone="info" size="sm" className="inline-flex h-6 shrink-0 items-center py-0 text-xs">
                            {copy.first}
                          </Badge>
                        )}
                      </span>
                      <span className="truncate text-sm font-medium text-muted-foreground">{s.relationship}</span>
                    </span>
                  </span>
                ) : (
                  <div className="min-w-0 flex-1">
                    {ordered && i === 0 && (
                      <Badge tone="info" size="sm" className="mb-2 inline-flex h-6 items-center py-0 text-xs">
                        {copy.first}
                      </Badge>
                    )}
                    <FieldGroup>
                      <Field label={copy.name} span={askEmail ? 4 : 6}>
                        <Input value={s.name} autoComplete="off" onChange={(e) => update(i, { name: e.target.value })} />
                      </Field>
                      <Field label={copy.relationship} span={askEmail ? 4 : 6}>
                        <Input value={s.relationship} onChange={(e) => update(i, { relationship: e.target.value })} />
                      </Field>
                      {askEmail && (
                        <Field label={copy.email} span={4}>
                          <Input type="email" value={s.email ?? ""} onChange={(e) => update(i, { email: e.target.value })} />
                        </Field>
                      )}
                    </FieldGroup>
                  </div>
                )}
                <span className="flex shrink-0 items-center gap-1">
                  {ordered && slots.length > 1 && (
                    <>
                      <IconButton
                        type="button"
                        variant="ghost"
                        shape="rect"
                        icon={<ArrowUpIcon />}
                        aria-label={copy.up(label)}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      />
                      <IconButton
                        type="button"
                        variant="ghost"
                        shape="rect"
                        icon={<ArrowDownIcon />}
                        aria-label={copy.down(label)}
                        disabled={i === slots.length - 1}
                        onClick={() => move(i, 1)}
                      />
                    </>
                  )}
                  <IconButton
                    type="button"
                    variant="ghost"
                    shape="rect"
                    icon={<XIcon />}
                    aria-label={copy.remove(label)}
                    onClick={() => onChange(slots.filter((_, j) => j !== i))}
                  />
                </span>
              </li>
            )
          })}
        </ol>
      )}
      {!full &&
        (picking && offered.length > 0 ? (
          <PersonPicker
            label={copy.pick}
            people={offered}
            addLabel={copy.someoneNew}
            onPick={(id) => {
              const p = people.find((x) => x.id === id)!
              onChange([...slots, { id: newId(), personId: p.id, name: p.name, relationship: p.detail ?? "" }])
              setPicking(false)
            }}
            onAddNew={() => {
              onChange([...slots, { id: newId(), name: "", relationship: "" }])
              setPicking(false)
            }}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {offered.length > 0 && (
              <Button type="button" variant="secondary" size="sm" shape="rect" icon={<UserPlusIcon />} onClick={() => setPicking(true)}>
                {copy.pick}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              shape="rect"
              onClick={() => onChange([...slots, { id: newId(), name: "", relationship: "" }])}
            >
              {copy.someoneNew}
            </Button>
          </div>
        ))}
    </div>
  )
}

export type PersonSlotsProps = ComponentProps<typeof PersonSlots>
