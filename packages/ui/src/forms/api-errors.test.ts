import { test } from "node:test"
import assert from "node:assert/strict"

import { formResultFromApi, formResultFromResponse } from "./api-errors.ts"
import { formMessages } from "./messages.ts"

/* Payloads as the API's error boundary writes them (Paige.AspNetCore/Errors/ErrorBoundaryMiddleware:
   ErrorResponse, camelCase, string enums camelCase, nulls omitted). */
const cid = "4bf92f3577b34da6a3ce929d0e0e4736"

test("400 input: attribute codes land on the Field named after the member; first error per field wins", () => {
  const body = {
    status: 400,
    correlationId: cid,
    errors: [
      { code: "legalName.notNullOrWhiteSpace", message: "Legal name is required.", type: "input", rule: "" },
      { code: "legalName.stringLength", message: "Legal name must be 200 characters or fewer.", type: "input", rule: "" },
      { code: "email.emailAddress", message: "Email must be a valid email address.", type: "input", rule: "" },
    ],
  }
  assert.deepEqual(formResultFromApi(400, body), {
    errors: { legalName: "Legal name is required.", email: "Email must be a valid email address." },
    correlationId: cid,
  })
})

test("400 wire refusal: a nested JSON path maps through `paths`", () => {
  const body = {
    status: 400,
    correlationId: cid,
    errors: [{ code: "address.zip.invalid", message: "Send a 5-digit ZIP code or ZIP+4.", type: "input", rule: "" }],
  }
  assert.deepEqual(formResultFromApi(400, body).errors, { "address.zip": "Send a 5-digit ZIP code or ZIP+4." })
  assert.deepEqual(formResultFromApi(400, body, { paths: { "address.zip": "zip" } }).errors, { zip: "Send a 5-digit ZIP code or ZIP+4." })
})

test("409 business: snake_case codes are form-level unless `fields` names their Field", () => {
  const body = {
    status: 409,
    correlationId: cid,
    errors: [{ code: "email_in_use", message: "That email is already used by another account.", type: "business", rule: "EmailInUse" }],
  }
  assert.deepEqual(formResultFromApi(409, body), { error: "That email is already used by another account.", correlationId: cid })
  assert.deepEqual(formResultFromApi(409, body, { fields: { email_in_use: "email" } }), {
    errors: { email: "That email is already used by another account." },
    correlationId: cid,
  })
})

test("409 *_not_found is a form-level error (a missing subject, never a field)", () => {
  const body = { status: 409, correlationId: cid, errors: [{ code: "profile_not_found", message: "Profile not found.", type: "business", rule: "" }] }
  assert.deepEqual(formResultFromApi(409, body), { error: "Profile not found.", correlationId: cid })
})

test("Product's copy for a code wins over the API's message", () => {
  const body = { status: 409, correlationId: cid, errors: [{ code: "email_in_use", message: "That email is already used by another account.", type: "business" }] }
  const r = formResultFromApi(409, body, { fields: { email_in_use: "email" }, messages: { email_in_use: "Someone already signs in with that email." } })
  assert.equal(r.errors?.email, "Someone already signs in with that email.")
})

test("request.binding never shows its text (a client bug, not the person's)", () => {
  const body = { status: 400, correlationId: cid, errors: [{ code: "request.binding", message: "body could not be bound.", type: "input", rule: "" }] }
  assert.deepEqual(formResultFromApi(400, body), { error: formMessages.failed, correlationId: cid })
})

test("mixed field and form-level errors", () => {
  const body = {
    status: 400,
    correlationId: cid,
    errors: [
      { code: "dateOfBirth.invalid", message: "Send the date as yyyy-MM-dd.", type: "input" },
      { code: "email_unchanged", message: "This is already the sign-in email.", type: "input" },
    ],
  }
  assert.deepEqual(formResultFromApi(400, body), {
    errors: { dateOfBirth: "Send the date as yyyy-MM-dd." },
    error: "This is already the sign-in email.",
    correlationId: cid,
  })
})

test("401, 403 and 429 use our copy whatever the body says", () => {
  const body = (status: number, code: string) => ({ status, correlationId: cid, errors: [{ code, message: "raw", type: "authentication" }] })
  assert.equal(formResultFromApi(401, body(401, "unauthorized")).error, formMessages.signedOut)
  assert.equal(formResultFromApi(403, body(403, "forbidden")).error, formMessages.forbidden)
  assert.equal(formResultFromApi(429, body(429, "rate_limited")).error, formMessages.tooMany)
})

test("500 and bodies that aren't the shape give the generic failure, never the body", () => {
  const unhandled = {
    status: 500,
    correlationId: cid,
    errors: [{ code: "system.unhandled", message: "An unexpected error occurred. Quote the correlationId when reporting this issue.", type: "unspecified" }],
  }
  assert.deepEqual(formResultFromApi(500, unhandled), { error: formMessages.failed, correlationId: cid })
  assert.deepEqual(formResultFromApi(502, "<html><body>502 Bad Gateway</body></html>"), { error: formMessages.failed })
  assert.deepEqual(formResultFromApi(400, undefined), { error: formMessages.failed })
  assert.deepEqual(formResultFromApi(404, { status: 404, correlationId: cid, errors: [] }), { error: formMessages.failed, correlationId: cid })
  assert.deepEqual(formResultFromApi(400, { status: 400, correlationId: cid, errors: [] }), { error: formMessages.failed, correlationId: cid })
})

test("formResultFromResponse reads a fetch Response and never throws on a bad body", async () => {
  const json = new Response(JSON.stringify({ status: 400, correlationId: cid, errors: [{ code: "phone.invalid", message: "Send E.164.", type: "input" }] }), { status: 400 })
  assert.deepEqual(await formResultFromResponse(json), { errors: { phone: "Send E.164." }, correlationId: cid })
  const html = new Response("<html>nginx</html>", { status: 502 })
  assert.deepEqual(await formResultFromResponse(html), { error: formMessages.failed })
})
