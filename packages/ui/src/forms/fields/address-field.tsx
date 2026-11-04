"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"

import { plural } from "../../lib/format"
import {
  emptyPostalAddress,
  formatLocality,
  formatPostalAddress,
  formatStreetLine,
  hasAddressParts,
  MIN_ADDRESS_QUERY,
  queryPostalAddresses,
  type PostalAddress,
  type PostalAddressSource,
} from "../../lib/postal-address"
import { US_STATE_OPTIONS, usStateName } from "../../lib/us-states"
import { cn } from "../../lib/utils"
import { Badge } from "../../components/display/badge"
import { Spinner } from "../../components/feedback/spinner"
import { Combobox, ComboboxInput, ComboboxItem, ComboboxList } from "../../components/inputs/combobox"
import { Input } from "../../components/inputs/input"
import { InputGroup, InputGroupAddon } from "../../components/inputs/input-group"
import { Select } from "../../components/inputs/select"
import { useFieldContext } from "../../components/internal/field-context"
import { Field, FieldError, FieldLabel } from "../field"
import { PostalCodeField } from "./postal-code-field"

/* @archetype Control (ARCHETYPES.md).
   AddressField (George 2026-10-28): one US address, as a text box with suggestions.
   - By default (setup) the text is the answer: a full address, part of one, or just a city
     (some won't give a street before they're in). Nothing is invalid; the address is checked and
     broken into its parts after they're in. A pick puts the whole address in the box on one line
     and keeps its parts; typing over it drops them.
   - `validate` (for after they're in) asks for the parts. The box is the street, with the apt
     (optional) beside it on the same row, 80/20 (George 2026-10-28: the apt is an aside to the
     street; between the street and the city it trips people up). The apt shows from the start,
     since a pick rarely knows the unit. A pick fills the rest, shown on a line under the row. Only
     when the street doesn't resolve (the lookup finds nothing or fails, or the person leaves the
     street without a pick) do city, state and ZIP show, each its own Field, the ZIP checked. Once
     shown they stay until a pick or an empty street. Suggestions without a street (a city alone)
     are left out.
     The street's label is the caller's FieldLabel, above this component, so the apt's label is
     lifted onto that line (8px over the apt's box, as every label) and the two boxes share a top.
     With no Field around it (aria-label only) the apt's label stays in place and the street box
     sits at the bottom of the row. Not settled yet (George 2026-10-28): something that reads as
     the value rather than a caption for the picked locality.
   - Suggestions come from `source`, a list or a lookup (the app passes Photon; the package makes
     no requests): 2 characters, 300ms after the last key, at most `limit`; a newer query wins
     over a slower answer. The box and its list are a Combobox (U-01): the first suggestion is
     highlighted as soon as there are any, Up/Down move, Enter picks, Escape closes the list; the
     list is a popover under the box, the box's width.
   - Spacing (validate): the parts are one answer, so they sit 16px apart, closer than the
     questions around them; a part's label sits 8px over its control, as everywhere.
   Inside a Field the box takes its label, description and error. US only (GAPS #95). */
type AddressFieldValue = {
  /** What the box says: as typed, or a pick (the whole address; with `validate`, its street). */
  text: string
  /** The address's parts. By default the pick's, while the box still says it, else null; with `validate`, the box's street and the parts, picked or filled by hand. */
  address: PostalAddress | null
}

type AddressFieldProps = {
  value?: AddressFieldValue
  defaultValue?: AddressFieldValue
  onValueChange?: (value: AddressFieldValue) => void
  /** Where suggestions come from: a list (filtered here) or a lookup (Photon in the app). */
  source: PostalAddressSource
  /** Ask for the parts: a pick fills them, and they show to fill by hand when the street doesn't resolve. Off by default (any text is the answer). */
  validate?: boolean
  /** Default "Start typing an address…" ("Start typing a street…" with `validate`). */
  placeholder?: string
  /** Most suggestions shown. Default 6. */
  limit?: number
  disabled?: boolean
  /** The box's name when no FieldLabel points at it. */
  "aria-label"?: string
  className?: string
}

const DEBOUNCE_MS = 300
const EMPTY: AddressFieldValue = { text: "", address: null }

/** One US address as a text box with suggestions; `validate` asks for its parts. */
function AddressField({
  value,
  defaultValue,
  onValueChange,
  source,
  validate = false,
  placeholder = validate ? "Start typing a street…" : "Start typing an address…",
  limit = 6,
  disabled,
  "aria-label": ariaLabel,
  className,
}: AddressFieldProps) {
  const [own, setOwn] = useState(defaultValue ?? EMPTY)
  const current = value ?? own
  const set = (next: AddressFieldValue) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  const parts = current.address ?? emptyPostalAddress()
  const picked = (v: AddressFieldValue | undefined) => Boolean(v?.address && hasAddressParts(v.address))

  // validate: the street a pick (or a value that arrived with its parts) resolved; typing over it unresolves.
  const [resolved, setResolved] = useState<string | null>(() => (picked(value ?? defaultValue) ? (value ?? defaultValue)!.text : null))
  const unresolved = validate && current.text.trim() !== "" && current.text !== resolved
  // validate: set when the street didn't resolve (nothing found, lookup failed, left without a pick).
  const [needsParts, setNeedsParts] = useState(() => {
    const initial = value ?? defaultValue
    return Boolean(initial && initial.text.trim() !== "" && !picked(initial))
  })
  const showParts = unresolved && needsParts
  const showLocality = validate && !unresolved && current.text.trim() !== "" && formatLocality(parts) !== ""

  const [focused, setFocused] = useState(false)
  // A pick (or a value that arrived picked) asks nothing until the person types again.
  const [settled, setSettled] = useState(() => picked(value ?? defaultValue))
  const [suggestions, setSuggestions] = useState<PostalAddress[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const request = useRef(0)
  const lookup = useRef({ source, limit, validate })
  useLayoutEffect(() => {
    lookup.current = { source, limit, validate }
  })
  const localityId = useId()

  const query = current.text
  useEffect(() => {
    if (!focused || settled) return
    const id = ++request.current
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const found = await queryPostalAddresses(lookup.current.source, query, lookup.current.limit)
        if (id !== request.current) return
        const rows = lookup.current.validate ? found.filter((a) => a.street !== "") : found
        setSuggestions(rows)
        setOpen(rows.length > 0)
        if (rows.length === 0 && query.trim().length >= MIN_ADDRESS_QUERY) setNeedsParts(true)
      } catch {
        // A failed lookup is no suggestions: by default the text is still the answer; with validate, the parts show.
        if (id !== request.current) return
        setSuggestions([])
        setOpen(false)
        setNeedsParts(true)
      } finally {
        if (id === request.current) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      request.current += 1
      setLoading(false)
    }
  }, [query, focused, settled])

  const close = () => setOpen(false)

  const pick = (suggestion: PostalAddress) => {
    const address = { ...emptyPostalAddress(suggestion), state: usStateName(suggestion.state) }
    setSettled(true)
    setSuggestions([])
    close()
    if (validate) {
      setResolved(address.street)
      setNeedsParts(false)
      set({ text: address.street, address })
    } else {
      set({ text: formatPostalAddress(address), address })
    }
  }

  // Arrows, Enter and the highlight are the Combobox's; Escape is here so it goes no further.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && open) {
      // Closes the list and goes no further: a surrounding dialog closes on the next press.
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }

  // The parts are Fields of their own, so they take a disabled outer Field from here.
  const outer = useFieldContext()
  const partsDisabled = disabled ?? (outer?.disabled || undefined)
  const part = (key: keyof PostalAddress) => (next: string) =>
    set({ text: current.text, address: { ...parts, street: current.text, [key]: next } })

  return (
    <div data-slot="address-field" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <div className={cn(validate && "grid grid-cols-street-unit gap-4")}>
          <Combobox open={open} onOpenChange={(o) => setOpen(o && suggestions.length > 0)} className={cn(validate && "self-end")}>
            <InputGroup>
              <ComboboxInput
                aria-describedby={showLocality ? localityId : undefined}
                aria-label={ariaLabel}
                value={current.text}
                onChange={(e) => {
                  const text = e.currentTarget.value
                  setSettled(false)
                  if (validate) {
                    if (text.trim() === "") setNeedsParts(false)
                    set({ text, address: { ...parts, street: text } })
                  } else {
                    set({ text, address: null })
                  }
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false)
                  close()
                  if (unresolved) setNeedsParts(true)
                }}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                disabled={disabled}
              />
              {loading && (
                <InputGroupAddon align="inline-end" aria-hidden>
                  <Spinner size="sm" />
                </InputGroupAddon>
              )}
            </InputGroup>
            <ComboboxList label="Suggested addresses">
              {suggestions.map((s, i) => {
                const street = formatStreetLine(s)
                return (
                  <ComboboxItem key={`${formatPostalAddress(s)}-${i}`} value={`${formatPostalAddress(s)}-${i}`} onSelect={() => pick(s)} className="flex-col items-start gap-0.5">
                    <span>{street || formatLocality(s)}</span>
                    {street && <span className="text-xs text-muted-foreground">{formatLocality(s)}</span>}
                  </ComboboxItem>
                )
              })}
            </ComboboxList>
            <span role="status" className="sr-only">
              {open ? `${plural(suggestions.length, "address", "addresses")} found` : ""}
            </span>
          </Combobox>
          {validate && (
            <Field disabled={partsDisabled} className="relative">
              <FieldLabel className={cn(outer && "absolute inset-x-0 bottom-full mb-2")}>
                Apt
                <Badge tone="neutral" size="xs" className="ml-auto normal-case">
                  Optional
                </Badge>
              </FieldLabel>
              <Input value={parts.unit} onChange={(e) => part("unit")(e.currentTarget.value)} autoComplete="address-line2" />
            </Field>
          )}
        </div>
        {showLocality && (
          <p id={localityId} data-slot="address-locality" className="text-xs font-medium text-muted-foreground">
            {formatLocality(parts)}
          </p>
        )}
      </div>
      {showParts && (
        <div data-slot="address-parts" className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field disabled={partsDisabled} className="col-span-2">
            <FieldLabel>City</FieldLabel>
            <Input value={parts.city} onChange={(e) => part("city")(e.currentTarget.value)} autoComplete="address-level2" />
          </Field>
          <Field disabled={partsDisabled}>
            <FieldLabel>State</FieldLabel>
            <Select placeholder="Choose one" options={US_STATE_OPTIONS} value={usStateName(parts.state)} onValueChange={part("state")} />
          </Field>
          <Field disabled={partsDisabled}>
            <FieldLabel>ZIP code</FieldLabel>
            <PostalCodeField value={parts.postalCode} onValueChange={part("postalCode")} />
            <FieldError />
          </Field>
        </div>
      )}
    </div>
  )
}

export { AddressField }
export type { AddressFieldProps, AddressFieldValue }
