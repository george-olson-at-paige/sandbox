/* The API's error response → Form's errors (R8-02, GAPS #103). One adapter, so no screen parses
   an error body. Server-safe (no "use client"), no React: a domain form's onSubmit calls it.

   The wire shape (the API's error boundary, `Paige.AspNetCore/Errors`: ErrorBoundaryMiddleware
   writes ErrorResponse for every failure; camelCase JSON, string enums camelCase, nulls omitted):

     { "status": 400, "correlationId": "4bf92f35…",
       "errors": [ { "code": "email.emailAddress", "message": "…", "type": "input", "rule": "…", "data": … } ] }

   Not RFC 7807 problem details and not an `errors` map: one array of coded errors. Codes come in
   two forms:
     - input attributes: `<member path>.<validator>` (`legalName.notNullOrWhiteSpace`,
       `dateOfBirth.invalid`, `address.zip.stringLength`): the member path is the request
       property in camelCase, so a Field named after the API member gets the error;
     - rules and handlers: one snake_case word (`email_in_use`, `profile_not_found`,
       `current_password_invalid`): not tied to a member unless the form says which Field owns it
       (`fields`).
   Plus `request.binding` (the body didn't bind: a client bug, never the person's) and
   `system.unhandled` / `system.dispatch` (500).
   Status: 400 input, 409 business (a missing subject is 409 `*_not_found`; 404 is only an unrouted
   path), 401, 403, 413, 429, 500.

   Mapping:
     - 400/409/413: a member-path code → that Field (first error per field wins; the API lists every
       attribute failure); a code in `fields` → the Field it names; anything else → the form-level
       error (ErrorSummary). `request.binding` → the generic failure, never its text.
     - 401/403/429 → our copy (forms/messages.ts), whatever the body says.
     - 5xx, a 404, a body that isn't the shape (an nginx HTML page, empty) → the generic failure.
   Message: `messages[code]` (Product's copy for a code) else the API's `message` (the API's only
   client-intended text) else the generic failure. The correlation id is returned for logging and
   support, never shown.

   Contract the API keeps (CONTRACTS.md): field errors are `Input` errors whose code
   starts with the request member's camelCase path; a rule that is about one field either uses
   that form (`email.inUse`) or is listed in the form's `fields`; messages are written for the
   person, never exception text. */

import { formMessages } from "./messages.ts"

/** Field errors keyed by Field `name` (the API member path). */
type FieldErrors = Partial<Record<string, string>>

/** One entry of the API's `errors` array. */
type ApiError = {
  code?: string | null
  message?: string | null
  type?: "unspecified" | "input" | "security" | "business" | "authentication" | "notFound" | "rateLimited" | "payloadTooLarge" | string
  rule?: string
  data?: unknown
}

/** The API's error body (ErrorResponse). */
type ApiErrorResponse = { status: number; correlationId: string; errors: ApiError[] }

type ApiErrorOptions = {
  /** Codes that belong to one Field although they aren't member paths: `{ email_in_use: "email" }`. */
  fields?: Record<string, string>
  /** Member paths whose Field has another name: `{ "address.zip": "zip" }`. */
  paths?: Record<string, string>
  /** Product's copy for a code, in place of the API's message: `{ email_in_use: "…" }`. */
  messages?: Record<string, string>
}

/** What the adapter returns: Form's onSubmit result, plus the correlation id for logs. */
type ApiFormResult = { errors?: FieldErrors; error?: string; correlationId?: string }

const MEMBER_CODE = /^([a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)*)\.([a-z][A-Za-z0-9]*)$/
const NOT_FIELDS = new Set(["request", "system"])

/** True when a body is the API's error shape. */
function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  if (typeof body !== "object" || body === null) return false
  const b = body as Record<string, unknown>
  return Array.isArray(b.errors) && b.errors.every((e) => typeof e === "object" && e !== null)
}

/** The Field a code belongs to, or undefined for a form-level error. */
function fieldOf(code: string | null | undefined, options: ApiErrorOptions): string | undefined {
  if (!code) return undefined
  if (options.fields?.[code]) return options.fields[code]
  const m = MEMBER_CODE.exec(code)
  if (!m || NOT_FIELDS.has(m[1].split(".")[0])) return undefined
  return options.paths?.[m[1]] ?? m[1]
}

/** Maps an API failure (status + parsed body) to Form's `{ errors, error }`. */
function formResultFromApi(status: number, body: unknown, options: ApiErrorOptions = {}): ApiFormResult {
  const correlationId = isApiErrorResponse(body) && typeof body.correlationId === "string" ? body.correlationId : undefined
  const done = (r: Omit<ApiFormResult, "correlationId">): ApiFormResult => (correlationId ? { ...r, correlationId } : r)

  if (status === 401) return done({ error: formMessages.signedOut })
  if (status === 403) return done({ error: formMessages.forbidden })
  if (status === 429) return done({ error: formMessages.tooMany })
  if (!isApiErrorResponse(body) || ![400, 409, 413].includes(status)) return done({ error: formMessages.failed })

  const errors: FieldErrors = {}
  const general: string[] = []
  const text = (e: ApiError) => (e.code && options.messages?.[e.code]) || e.message?.trim() || formMessages.failed
  for (const e of body.errors) {
    if (e.code === "request.binding" || e.code?.startsWith("system.")) {
      if (!general.includes(formMessages.failed)) general.push(formMessages.failed)
      continue
    }
    const field = fieldOf(e.code, options)
    if (field) {
      if (!errors[field]) errors[field] = text(e)
    } else {
      const m = text(e)
      if (!general.includes(m)) general.push(m)
    }
  }
  if (Object.keys(errors).length === 0 && general.length === 0) general.push(formMessages.failed)
  return done({ ...(Object.keys(errors).length ? { errors } : {}), ...(general.length ? { error: general.join(" ") } : {}) })
}

/** Reads a failed fetch Response (never throws) and maps it with formResultFromApi. */
async function formResultFromResponse(response: Response, options: ApiErrorOptions = {}): Promise<ApiFormResult> {
  let body: unknown
  try {
    body = JSON.parse(await response.text())
  } catch {
    body = undefined
  }
  return formResultFromApi(response.status, body, options)
}

export { formResultFromApi, formResultFromResponse, isApiErrorResponse }
export type { ApiError, ApiErrorOptions, ApiErrorResponse, ApiFormResult }
