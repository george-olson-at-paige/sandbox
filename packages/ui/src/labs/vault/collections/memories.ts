import type { FileKind } from "../../../lib/file-kind"

/* @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §1, D-V5: lands in labs.
   @from the API's memories (Paige.Application/Memories: MemoryItem, the categories with their
   prompts, ADR 0041). The shapes a screen hands the pieces; the pieces never fetch.
   One file per memory (the agreed demand; the domain allows more). No recipients or delivery:
   sharing a memory is deferred (D10), so the record says so rather than offering it. */

/** A memory's category, with the prompts that suggest its sections' titles. */
export type MemoryCategory = { id: string; label: string; prompts: string[] }

/** One titled part of a memory's story. */
export type MemorySection = { id: string; title: string; text: string }

/** A memory: a moment, dated by when it happened. */
export type Memory = {
  id: string
  title: string
  category: MemoryCategory
  /** When it happened, "YYYY-MM-DD". */
  occurredOn: string
  /** "June 14, 1987", in the View's words. */
  when: string
  note?: string
  sections: MemorySection[]
  /** The one photo, video or file. `src` is a viewable picture when it is one. */
  file?: { id: string; name: string; kind: FileKind; src?: string }
}
