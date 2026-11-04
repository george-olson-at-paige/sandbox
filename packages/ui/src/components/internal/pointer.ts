"use client"

import { useSyncExternalStore } from "react"

/* The R3-16 rule's switch: a touch-first device gets the browser's own control (Select's native
   picker, DateField's native date input). Shared by Select and the fields (R4-12). */
const COARSE = "(pointer: coarse)"
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(COARSE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** True on a touch-first device. False on the server, so the first paint is the fine-pointer form. */
export function useCoarsePointer() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(COARSE).matches, () => false)
}
