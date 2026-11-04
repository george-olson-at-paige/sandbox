/* Structural equality for form values (R8-01): Form compares the caller's current values with
   the values it started from to know whether there are unsaved changes. Values are plain data
   (strings, numbers, booleans, null, arrays, plain objects: the value shapes in values.ts), so a
   structural compare is enough; key order doesn't matter, and `undefined` and a missing key are
   the same. Internal: Form uses it. Server-safe, no React. */

/** True when two plain-data values are structurally the same. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => sameValue(x, b[i]))
  const ra = a as Record<string, unknown>
  const rb = b as Record<string, unknown>
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)])
  for (const k of keys) if (!sameValue(ra[k], rb[k])) return false
  return true
}
