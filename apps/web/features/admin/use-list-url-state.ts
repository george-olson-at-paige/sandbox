"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { parseListState, serializeListState, type ListConfig, type ListState } from "@paige/ui/lib/list-query"

/* A list page's state in the URL (R12-10): segment, filters, sort and page in the query string
   (parse/serialize from @paige/ui/lib/list-query, tested there), written with replace so Back
   leaves the list rather than undoing each filter, and coming back from a row's page restores it.
   The search is not in the URL: a typed email is PII and PII stays out of URLs, which ingress and
   analytics log (product-engineering.md rule 7). It's kept for this tab in sessionStorage, so
   Back and refresh restore it and a shared link doesn't carry it. The last query string is kept
   there too, for the row page's way back (`listHref`). Storage can be missing or throw (private
   windows, blocked site data): the list then simply starts unsearched. */

const searchKey = (key: string) => `paige:list-search:${key}`
const urlKey = (key: string) => `paige:list-query:${key}`

function readStorage(k: string): string | null {
  try {
    return window.sessionStorage.getItem(k)
  } catch {
    return null
  }
}
function writeStorage(k: string, v: string) {
  try {
    if (v) window.sessionStorage.setItem(k, v)
    else window.sessionStorage.removeItem(k)
  } catch {
    // Storage unavailable: the state still works for this page view.
  }
}

/** The list's state and its setter: the URL's part from the query string, the search from this tab's storage. */
export function useListUrlState<Row>(config: ListConfig<Row>, key: string): [ListState, (next: ListState) => void] {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState("")
  // After hydration (the server can't see this tab's storage), so both renders start the same.
  useEffect(() => setQ(readStorage(searchKey(key)) ?? ""), [key])
  const base = useMemo(() => parseListState(params, config), [params, config])
  const state = useMemo<ListState>(() => ({ ...base, q }), [base, q])
  useEffect(() => writeStorage(urlKey(key), serializeListState(state, config)), [state, config, key])

  const setState = useCallback(
    (next: ListState) => {
      if (next.q !== q) {
        setQ(next.q)
        writeStorage(searchKey(key), next.q)
      }
      const qs = serializeListState(next, config)
      if (qs !== serializeListState(state, config)) router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [q, key, config, state, router, pathname]
  )
  return [state, setState]
}

/** The list's URL as it was last left in this tab (the row page's way back). */
export function listHref(path: string, key: string): string {
  const qs = readStorage(urlKey(key))
  return qs ? `${path}?${qs}` : path
}
