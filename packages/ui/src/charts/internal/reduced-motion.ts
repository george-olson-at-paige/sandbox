import { useSyncExternalStore } from "react"

/* prefers-reduced-motion as a hook, for the charts (Recharts' entry animation, the graph frame's
   viewport moves). The server and the first client render assume reduced motion (no animation
   until we know), so nothing animates on hydration. */
const REDUCE = "(prefers-reduced-motion: reduce)"
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(REDUCE)
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}

/** True when the person asked for reduced motion (and on the server). */
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(REDUCE).matches, () => true)

export { useReducedMotion }
