"use client"

import type { ComponentProps } from "react"
import { useEffect, useRef, useState, type ElementType, type KeyboardEvent, type ReactNode } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../components/actions/button"
import { Spinner } from "../components/feedback/spinner"
import { Combobox, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList } from "../components/inputs/combobox"
import { InputGroup, InputGroupAddon } from "../components/inputs/input-group"
import { FieldAction } from "../forms/fields/field-action"
import { usePopoverGroup } from "../components/internal/popover-group"

/* @archetype Composite (ARCHETYPES.md).
   HeaderSearch (R11-11): the header's search, after the old site's expanding search
   (src/web/Paige.Webapp …/SearchField.vue, SearchPopper.vue, SearchResultRow.vue: intent only).
   - At rest it's an icon button. A click, or `/` anywhere outside a text field, expands it into
     a search field in the header (the width animates 200ms; no animation under reduced motion)
     and focuses it.
   - The field and its results are a Combobox (U-01): the field a pill InputGroup (glyph before,
     clear after); the results in its popover (R11-10: a click outside or Escape closes it; one
     header popover at a time). Empty query: a short invitation. Typing: `loading` shows a
     spinner line. Results: grouped (a heading per group), each a link with an optional icon and
     a detail line. No results: "Nothing matches …".
   - Keys (the ARIA combobox pattern, focus stays in the field): Down/Up move through the
     results across groups and wrap, with the first highlighted as soon as there are results;
     Enter opens the highlighted one; Escape closes the results and, when the field is empty,
     collapses it and returns focus to the icon button (a second Escape clears typed text first,
     as the old site did). Home/End stay the field's.
   - A click outside or Tab away closes the results and collapses the field when it's empty; a
     typed query keeps it open so it isn't lost.
   - The results are the caller's (`groups` for the current `query`); search doesn't exist yet
     (D17/D18), so stories pass stand-in results and the app leaves HeaderSearch out (R2-30).
   Words are the spike's own (GAPS #94 covers Product's copy). */

/** One search hit: a link. */
type HeaderSearchResult = {
  id: string
  /** The name, as the person would recognise it. */
  label: string
  /** A second line: where it lives or what it is ("Family · Will"). */
  detail?: string
  href: string
  /** A 16px icon or a small avatar. */
  icon?: ReactNode
}

/** A group of hits under one heading ("People", "Documents"). */
type HeaderSearchGroup = { id: string; label: string; results: HeaderSearchResult[] }

const COPY = {
  label: "Search",
  placeholder: "Search your Vault",
  invite: "Type a name you’d recognise: a person, a document, a will.",
  loading: "Looking through your Vault…",
  none: (q: string) => `Nothing matches “${q}”`,
  noneHint: "Try a person’s name or the title of a document.",
  clear: "Clear search",
  results: "Search results",
  count: (n: number) => (n === 1 ? "1 result" : `${n} results`),
} as const

/** The header's search: an icon that expands into a field, with grouped results in a popover; `/` focuses it. */
function HeaderSearch({
  groups = [],
  query: queryProp,
  onQueryChange,
  loading = false,
  onSelect,
  linkAs: Link = "a",
  label = COPY.label,
  placeholder = COPY.placeholder,
  defaultExpanded = false,
}: {
  /** The results for the current query, grouped. The caller searches; HeaderSearch shows them. */
  groups?: HeaderSearchGroup[]
  /** The query (controlled). Leave undefined to let HeaderSearch keep it. */
  query?: string
  /** Told on every keystroke and on clear. */
  onQueryChange?: (query: string) => void
  /** The caller is still searching: a spinner line instead of "Nothing matches". */
  loading?: boolean
  /** Told when a result is opened (click or Enter), before the link navigates. */
  onSelect?: (result: HeaderSearchResult) => void
  /** Link component for in-app links (Next's `Link`). Default a plain `a`. */
  linkAs?: ElementType
  /** The field's accessible name and the icon button's. Default "Search". */
  label?: string
  /** The field's placeholder. */
  placeholder?: string
  /** Start expanded (a story). */
  defaultExpanded?: boolean
}) {
  const [ownQuery, setOwnQuery] = useState("")
  const query = queryProp ?? ownQuery
  const setQuery = (q: string) => {
    if (queryProp === undefined) setOwnQuery(q)
    onQueryChange?.(q)
  }
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [open, setOpen] = usePopoverGroup("search")
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  /** Focus to move once the field or the button has rendered. */
  const pendingFocus = useRef<"input" | "button" | null>(null)

  const total = groups.reduce((n, g) => n + g.results.length, 0)
  const trimmed = query.trim()

  useEffect(() => {
    if (pendingFocus.current === "input" && expanded) inputRef.current?.focus()
    if (pendingFocus.current === "button" && !expanded) buttonRef.current?.focus()
    pendingFocus.current = null
  }, [expanded])

  const expand = () => {
    pendingFocus.current = "input"
    if (expanded) inputRef.current?.focus()
    setExpanded(true)
    setOpen(true)
  }
  const collapse = (focusButton: boolean) => {
    setOpen(false)
    setExpanded(false)
    if (focusButton) pendingFocus.current = "button"
  }
  /* The results closed by anything (click away, another header popover, Tab): an empty field
     goes back to the icon. */
  const dismiss = () => {
    setOpen(false)
    if (query === "") setExpanded(false)
  }

  /* `/` focuses search from anywhere that isn't a text field (GitHub's and Slack's key). */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      e.preventDefault()
      pendingFocus.current = "input"
      setExpanded(true)
      setOpen(true)
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [setOpen])

  /* Another header popover opened (the shared state closed ours) while the field is empty and
     not focused: back to the icon. Only on the close itself, not while it was never open. */
  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current && !open && query === "" && document.activeElement !== inputRef.current) setExpanded(false)
    wasOpen.current = open
  }, [open, query])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return
    e.preventDefault()
    if (open) setOpen(false)
    else if (query !== "") setQuery("")
    if (query === "") collapse(true)
  }

  const showResults = trimmed !== "" && total > 0

  return (
    <div
      ref={rootRef}
      data-slot="header-search"
      data-expanded={expanded || undefined}
      className={cn(
        // R11-11: the width animates from the icon button to the field; reduced motion jumps.
        "relative flex h-control-sm shrink-0 items-center transition-all ease-out motion-reduce:transition-none",
        expanded ? "w-40 sm:w-72" : "w-9"
      )}
    >
      {expanded ? (
        <Combobox open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())} className="h-full">
          <InputGroup size="sm" className="rounded-full">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <ComboboxInput
              ref={inputRef}
              inputMode="search"
              aria-label={label}
              aria-keyshortcuts="/"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              // A click on the field (focused already, or after Escape closed the results) opens them again.
              onClick={() => setOpen(true)}
              onBlur={(e) => {
                const next = e.relatedTarget as Node | null
                if (next && rootRef.current?.contains(next)) return
                dismiss()
              }}
              onKeyDown={onKeyDown}
            />
            {query !== "" && (
              <InputGroupAddon align="inline-end">
                <FieldAction
                  aria-label={COPY.clear}
                  icon={<XIcon />}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery("")
                    inputRef.current?.focus()
                  }}
                />
              </InputGroupAddon>
            )}
          </InputGroup>
          <span role="status" className="sr-only">
            {trimmed === "" || loading ? "" : total ? COPY.count(total) : COPY.none(trimmed)}
          </span>
          <ComboboxList
            label={COPY.results}
            align="end"
            className="max-h-96 w-popover sm:w-popover-wide"
            empty={
              trimmed === "" ? (
                COPY.invite
              ) : loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" label={COPY.loading} />
                  {COPY.loading}
                </span>
              ) : (
                <>
                  <span className="block font-semibold text-card-foreground">{COPY.none(trimmed)}</span>
                  <span className="mt-0.5 block text-xs">{COPY.noneHint}</span>
                </>
              )
            }
          >
            {showResults &&
              groups
                .filter((g) => g.results.length > 0)
                .map((g) => (
                  <ComboboxGroup key={g.id} heading={g.label}>
                    {g.results.map((r) => (
                      <ComboboxItem
                        key={r.id}
                        asChild
                        value={`${g.id}/${r.id}`}
                        // The link's own click navigates (Enter clicks it too: Combobox); this tells the caller and closes.
                        onSelect={() => {
                          onSelect?.(r)
                          setOpen(false)
                        }}
                        className="[&_svg]:text-muted-foreground"
                      >
                        <Link href={r.href} tabIndex={-1}>
                          {r.icon}
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{r.label}</span>
                            {r.detail && <span className="truncate text-xs font-medium text-muted-foreground">{r.detail}</span>}
                          </span>
                        </Link>
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                ))}
          </ComboboxList>
        </Combobox>
      ) : (
        <Button ref={buttonRef} variant="ghost" size="icon" icon={<SearchIcon />} aria-label={label} aria-keyshortcuts="/" onClick={expand} />
      )}
    </div>
  )
}

export { HeaderSearch }
export type { HeaderSearchGroup, HeaderSearchResult }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type HeaderSearchProps = ComponentProps<typeof HeaderSearch>
