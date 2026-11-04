import type { RichTextValue } from "../../../components/inputs/rich-text"

/* @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §1, D-V5: lands in labs.
   @from the API's messages (Paige.Application/Messages: MessageItem, MessageScheduleItem, the
   types and schedule types; ADR 0050). The shapes a screen hands the pieces; the pieces never
   fetch. The body is the rich text value (the editor's JSON document); the wire's body is
   sanitized HTML today, so the API and the editor need one shape before this leaves labs.
   Recipients exist in the domain but not on the wire, so they aren't here (COLLECTIONS-PLAN
   §4.6). Nothing sends yet (D2): the status is shown as the owner's intent, not a promise. */

/** A message's type ("Personal letter", "Birthday"). */
export type MessageType = { id: string; label: string }

/** When a message goes: right away, on a date, every year on a month and day, when a delegate says, or after the owner's death. */
export type DeliveryRule =
  { kind: "now" } | { kind: "date"; date: string } | { kind: "yearly"; month: number; day: number } | { kind: "delegate" } | { kind: "after" }

export type DeliveryKind = DeliveryRule["kind"]

/** Draft until the owner says it's ready; Sent only from the past (legacy). */
export type MessageStatus = "draft" | "scheduled" | "sent"

/** A letter written now for someone, to go later. */
export type Message = {
  id: string
  subject: string
  type: MessageType
  body: RichTextValue
  rule: DeliveryRule
  status: MessageStatus
  /** "Written Oct 2, 2026", in the View's words. */
  written: string
  /** Up to 2. */
  files: Array<{ id: string; name: string }>
}
