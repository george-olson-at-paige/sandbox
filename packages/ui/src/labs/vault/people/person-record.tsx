"use client"

import type { ComponentProps, ElementType } from "react"
import { useState } from "react"
import { KeyRoundIcon, FileTextIcon } from "lucide-react"

import type { FormResult } from "../../../forms/form"
import { AreaLines, RecordCard, RecordSection } from "../record-section"
import type { Person } from "../views/data"
import { PersonLetterhead } from "./person-letterhead"
import { ReachForm, type ReachDraft, type ReachFormProps } from "./reach-form"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §1a "Record card" (D-V5: lands in labs, for
   vault/people/). A person's record on the stage, top to bottom:
   - the letterhead (their contact card), with "Add a phone or email" where the reach would show;
   - "Who they are to you" (a pet: "What they're part of"), a shared section: what they are
     named as, Area by Area, each line linking to where it lives;
   - "What they can see", an owner section (not for a pet): the Delegate grant and the shares.
   View only in this pass. Edit (the fields by kinship) waits on PersonAddForm taking a saved
   person (VIEWS-PLAN.md, finding); Remove and Assign live in the stage bar's ⋯. */

export type PersonRecordCopy = {
  roles: string
  rolesPet: string
  rolesEmpty: string
  canSee: string
  canSeeEmpty: string
  ownerOnly: string
  addReach: string
  reach: ReachFormProps["labels"]
}

/** A person's record: their contact card, who they are to you, and (owner only) what they can see. */
export function PersonRecord({
  person,
  copy,
  onSaveReach,
  linkAs,
}: {
  /** The person. */
  person: Person
  /** The record's words (docs/views.md). */
  copy: PersonRecordCopy
  /** Saves a phone and email from the letterhead's to-do. Without it, no to-do. */
  onSaveReach?: (draft: ReachDraft) => FormResult | Promise<FormResult>
  /** Link component for in-app links (Next's `Link`). */
  linkAs?: ElementType
}) {
  const [reaching, setReaching] = useState(false)
  return (
    <RecordCard label={person.name}>
      <PersonLetterhead
        person={person}
        addReach={copy.addReach}
        onAddReach={onSaveReach && (() => setReaching(true))}
        reach={
          reaching &&
          onSaveReach && (
            <ReachForm
              who={person.name}
              labels={copy.reach}
              onCancel={() => setReaching(false)}
              onSave={async (draft) => {
                const result = await onSaveReach(draft)
                if (!result) setReaching(false)
                return result
              }}
            />
          )
        }
      />
      <RecordSection audience="shared" title={person.pet ? copy.rolesPet : copy.roles} empty={person.groups.length ? undefined : copy.rolesEmpty}>
        {person.groups.length > 0 && <AreaLines groups={person.groups} linkAs={linkAs} />}
      </RecordSection>
      {!person.pet && (
        <RecordSection audience="owner" ownerLabel={copy.ownerOnly} title={copy.canSee} empty={person.canSee.length ? undefined : copy.canSeeEmpty}>
          {person.canSee.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {person.canSee.map((line) => (
                <li key={line.key} className="flex items-start gap-2.5 text-sm [&_svg]:mt-0.5 [&_svg]:size-icon [&_svg]:text-muted-foreground">
                  {line.key === "delegate" ? <KeyRoundIcon aria-hidden /> : <FileTextIcon aria-hidden />}
                  <span>
                    <span className="font-semibold">{line.label}</span>
                    {line.detail && <span className="block font-medium text-muted-foreground">{line.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </RecordSection>
      )}
    </RecordCard>
  )
}

export type PersonRecordProps = ComponentProps<typeof PersonRecord>
