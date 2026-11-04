"use client"

import type { ChangeEvent } from "react"
import { possessive } from "../lib/format"
import { useCallback, useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Plus } from "lucide-react"

import {
  AD_CONTEXT_LABEL,
  adContextLabel,
  emptyOfferDraft,
  moveOffer,
  orderedOffers,
  validateOfferDraft,
  type OfferDraft,
  type PartnerOffer,
  type PartnerRow,
} from "./partner-rules"
import { Button } from "../components/actions/button"
import { Badge } from "../components/display/badge"
import { Callout, CalloutAction } from "../components/feedback/callout"
import { Checkbox } from "../components/inputs/checkbox"
import { Input } from "../components/inputs/input"
import { Select } from "../components/inputs/select"
import { Textarea } from "../components/inputs/textarea"
import { ConfirmDialog } from "../components/overlays/confirm-dialog"
import { Dialog } from "../components/overlays/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "../forms/field"
import { Form, useForm } from "../forms/form"
import { FormFooter } from "../forms/form-footer"
import { PartnerLogo } from "./partner-logo"

// todo: this shouldn't be here

/* @archetype Composite (ARCHETYPES.md).
   Manage offers (R15-15): a partner's ad strip offers (`PartnerOffer`), from the contract only:
   title, description, button label, link, image or "use the partner's logo", where it shows (ad
   context), order and on/off. No other fields.
   - The list: each offer with where it shows and whether it's off; Move up and Move down (within
     its ad context), Edit, and Turn off (confirmed) or Turn on. Add offer opens the editor empty.
     Each change goes to the API at once and the list shows what the API answered; while one runs
     every row's buttons are off and the one pressed says what it's doing; a failure shows above
     the list with Try again, the list as it was.
   - The editor: the fields beside a live preview (below them at narrow widths), a plain rendering
     of the offer as the app would show it, with no frame or style isolation. It becomes the real
     offer card once the vault has one. Save (Form: pending, field errors, ErrorSummary, input
     kept on a failure). Leaving with unsaved changes asks first (Back to offers, Close, Escape).
     A new offer is saved on, as the contract's default (`Enabled` true).
   - The result shows in place: the list, and a polite line under it ("Turned off."). */

/** What the API answers to an offer change: the partner's offers as they now stand, or a message. */
type OffersResult = { offers: PartnerOffer[] } | { error: string }

/** The API calls the dialog makes (fixtures in the spike; API-NEEDS A32). */
type PartnerOfferActions = {
  /** Creates (id null) or updates an offer. */
  save: (partner: PartnerRow, offer: OfferDraft & { id: string | null }) => Promise<OffersResult>
  /** Turns an offer on or off. */
  setEnabled: (partner: PartnerRow, id: string, enabled: boolean) => Promise<OffersResult>
  /** Saves a new order (positions renumbered from 0 within each ad context). */
  reorder: (partner: PartnerRow, offers: PartnerOffer[]) => Promise<OffersResult>
}

type Busy = { id: string; what: "up" | "down" | "on" } | null

/** The offer as the app shows it: a plain rendering, no frame (R15-15). */
function OfferPreview({ draft, partner }: { draft: OfferDraft; partner: Pick<PartnerRow, "name" | "logoUrl"> }) {
  const image = draft.useLogoAsImage ? partner.logoUrl : draft.imageUrl?.trim() || null
  return (
    // inert: a picture of the offer, not a second set of controls.
    <div inert data-slot="offer-preview" className="flex flex-wrap items-center gap-4 rounded-lg border border-divider bg-card p-4">
      {draft.useLogoAsImage ? (
        <PartnerLogo partner={partner} />
      ) : image ? (
        <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-muted">
          <img src={image} alt="" className="max-h-full max-w-full object-contain" />
        </span>
      ) : null}
      {/* At least 192px for the words; the button drops under them when the row is narrower. */}
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
        <span className="font-semibold break-words text-foreground-strong">{draft.title.trim() || "Title"}</span>
        {draft.description?.trim() && <span className="text-sm font-medium break-words text-body-muted">{draft.description}</span>}
      </div>
      {draft.buttonLabel?.trim() && (
        <Button variant="secondary" size="sm" className="shrink-0">
          {draft.buttonLabel}
        </Button>
      )}
    </div>
  )
}

/** The editor: the contract's fields beside the live preview; Save goes to the API. */
function OfferEditor({
  partner,
  offer,
  onSave,
  onDone,
  registerLeave,
}: {
  partner: PartnerRow
  /** The offer being edited; null for a new one. */
  offer: PartnerOffer | null
  onSave: PartnerOfferActions["save"]
  /** Back to the list, with the API's answer when it saved. */
  onDone: (offers?: PartnerOffer[]) => void
  /** Lets the dialog ask before it closes over unsaved changes. */
  registerLeave: (confirmLeave: (() => boolean) | null) => void
}) {
  const [values, setValues] = useState<OfferDraft>(() =>
    offer
      ? { adContext: offer.adContext, title: offer.title, description: offer.description, buttonLabel: offer.buttonLabel, imageUrl: offer.imageUrl, url: offer.url, useLogoAsImage: offer.useLogoAsImage }
      : emptyOfferDraft
  )
  const form = useForm<OfferDraft>({
    values,
    validate: validateOfferDraft,
    onSubmit: async (v) => {
      const result = await onSave(partner, { ...v, id: offer?.id ?? null })
      if ("error" in result) return { error: result.error }
      onDone(result.offers)
    },
  })
  useEffect(() => {
    registerLeave(form.confirmLeave)
    return () => registerLeave(null)
  }, [form.confirmLeave, registerLeave])
  const text = (k: "title" | "description" | "buttonLabel" | "url" | "imageUrl") => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: k === "title" ? e.target.value : e.target.value || null }))
  const contexts = Object.entries(AD_CONTEXT_LABEL).map(([value, label]) => ({ value, label }))
  if (!AD_CONTEXT_LABEL[values.adContext]) contexts.push({ value: values.adContext, label: values.adContext })

  return (
    <Form form={form} aria-label={offer ? `Edit ${offer.title}` : "New offer"}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Field name="title">
            <FieldLabel>Title</FieldLabel>
            {/* The editor replaces the list, so focus starts in its first field. */}
            <Input value={values.title} onChange={text("title")} autoFocus />
            <FieldError />
          </Field>
          <Field name="description">
            <FieldLabel>Description</FieldLabel>
            <Textarea value={values.description ?? ""} onChange={text("description")} />
          </Field>
          <Field name="buttonLabel">
            <FieldLabel>Button label</FieldLabel>
            <Input value={values.buttonLabel ?? ""} onChange={text("buttonLabel")} />
          </Field>
          <Field name="url">
            <FieldLabel>Link</FieldLabel>
            <Input type="url" inputMode="url" value={values.url ?? ""} onChange={text("url")} placeholder="https://" />
            <FieldDescription>Where the button goes.</FieldDescription>
            <FieldError />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <Checkbox checked={values.useLogoAsImage} onCheckedChange={(useLogoAsImage) => setValues((v) => ({ ...v, useLogoAsImage }))} />
            Use the partner&apos;s logo as the image
          </label>
          {!values.useLogoAsImage && (
            <Field name="imageUrl">
              <FieldLabel>Image address</FieldLabel>
              <Input type="url" inputMode="url" value={values.imageUrl ?? ""} onChange={text("imageUrl")} placeholder="https://" />
              <FieldError />
            </Field>
          )}
          <Field name="adContext">
            <FieldLabel>Where it shows</FieldLabel>
            <Select options={contexts} value={values.adContext} onValueChange={(adContext) => setValues((v) => ({ ...v, adContext }))} />
          </Field>
        </div>
        <section aria-label="Preview" className="flex min-w-0 flex-col gap-2">
          <span className="eyebrow">Preview</span>
          <OfferPreview draft={values} partner={partner} />
          <p className="text-xs font-medium text-muted-foreground">How it looks in the app&apos;s {adContextLabel(values.adContext).toLowerCase()}.</p>
        </section>
      </div>
      <FormFooter
        submitLabel={offer ? "Save offer" : "Add offer"}
        cancel={{ label: "Back to offers", onClick: () => form.confirmLeave() && onDone() }}
        className="mt-6"
      />
    </Form>
  )
}

/** Manage a partner's ad strip offers: the list (add, edit, reorder, turn off) and an editor with a live preview. */
function ManageOffersDialog({
  partner,
  open,
  onOpenChange,
  actions,
  onChange,
}: {
  /** The partner whose offers these are (null while closed). */
  partner: PartnerRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The API calls (save, turn on or off, reorder). */
  actions: PartnerOfferActions
  /** Hears the partner's offers after each change, so the screen's row stays current. */
  onChange?: (partner: PartnerRow, offers: PartnerOffer[]) => void
}) {
  if (!partner) return null
  // Keyed so each opening starts from the partner's offers as they stand.
  return <ManageOffersBody key={`${partner.id}:${open}`} partner={partner} open={open} onOpenChange={onOpenChange} actions={actions} onChange={onChange} />
}

function ManageOffersBody({ partner, open, onOpenChange, actions, onChange }: { partner: PartnerRow; open: boolean; onOpenChange: (open: boolean) => void; actions: PartnerOfferActions; onChange?: (partner: PartnerRow, offers: PartnerOffer[]) => void }) {
  const [offers, setOffers] = useState(() => orderedOffers(partner.offers))
  const [editing, setEditing] = useState<{ offer: PartnerOffer | null } | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [failure, setFailure] = useState<{ message: string; retry: () => void } | null>(null)
  const [said, setSaid] = useState("")
  const [turningOff, setTurningOff] = useState<PartnerOffer | null>(null)
  const [confirmLeave, setConfirmLeave] = useState<(() => boolean) | null>(null)
  const registerLeave = useCallback((fn: (() => boolean) | null) => setConfirmLeave(() => fn), [])

  const apply = (next: PartnerOffer[], words: string) => {
    const ordered = orderedOffers(next)
    setOffers(ordered)
    setSaid(words)
    onChange?.(partner, ordered)
  }

  async function run(b: NonNullable<Busy>, call: () => Promise<OffersResult>, words: string) {
    setBusy(b)
    setFailure(null)
    setSaid("")
    let result: OffersResult
    try {
      result = await call()
    } catch {
      result = { error: "That didn't go through. Try again in a moment." }
    }
    setBusy(null)
    if ("error" in result) setFailure({ message: result.error, retry: () => void run(b, call, words) })
    else apply(result.offers, words)
  }

  const move = (o: PartnerOffer, by: -1 | 1) => run({ id: o.id, what: by < 0 ? "up" : "down" }, () => actions.reorder(partner, moveOffer(offers, o.id, by)), `${o.title} moved ${by < 0 ? "up" : "down"}.`)

  const title = `Manage ${possessive(partner.name)} offers`
  const description = editing
    ? editing.offer
      ? `Editing "${editing.offer.title}". The preview shows it as the app will.`
      : "A new offer for the ad strip. The preview shows it as the app will."
    : "The ads in the app's ad strip for this partner's people. Each change takes effect when it's made."

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="xl" onCloseRequest={() => confirmLeave?.() ?? true}>
      {editing ? (
        <OfferEditor
          partner={partner}
          offer={editing.offer}
          onSave={actions.save}
          registerLeave={registerLeave}
          onDone={(next) => {
            if (next) apply(next, editing.offer ? `${editing.offer.title} saved.` : "Offer added.")
            setEditing(null)
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {failure && (
            <Callout tone="attention" title="That didn't go through" actions={<CalloutAction onClick={failure.retry}>Try again</CalloutAction>}>
              {failure.message}
            </Callout>
          )}
          {offers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm font-medium text-muted-foreground">
              No offers yet. An offer is an ad in the app&apos;s ad strip, shown to this partner&apos;s people.
            </p>
          ) : (
            <ol aria-label="Offers" className="flex flex-col divide-y divide-divider rounded-lg border border-border">
              {offers.map((o) => {
                const same = offers.filter((x) => x.adContext === o.adContext)
                const i = same.indexOf(o)
                const off = busy !== null
                return (
                  <li key={o.id} data-slot="offer-row" data-enabled={o.enabled} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={o.enabled ? "truncate font-medium text-card-foreground" : "truncate font-medium text-muted-foreground"}>{o.title}</span>
                        {!o.enabled && (
                          <Badge tone="neutral" appearance="outline" size="xs">
                            Off
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {adContextLabel(o.adContext)} · {i + 1} of {same.length}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        icon={<ArrowUp aria-hidden />}
                        aria-label={busy?.id === o.id && busy.what === "up" ? "Moving…" : `Move ${o.title} up`}
                        disabled={off || i === 0}
                        onClick={() => void move(o, -1)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        icon={<ArrowDown aria-hidden />}
                        aria-label={busy?.id === o.id && busy.what === "down" ? "Moving…" : `Move ${o.title} down`}
                        disabled={off || i === same.length - 1}
                        onClick={() => void move(o, 1)}
                      />
                      <Button variant="secondary" size="sm" disabled={off} onClick={() => setEditing({ offer: o })} aria-label={`Edit ${o.title}`}>
                        Edit
                      </Button>
                      {o.enabled ? (
                        <Button variant="secondary" size="sm" disabled={off} onClick={() => setTurningOff(o)} aria-label={`Turn off ${o.title}`}>
                          Turn off
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={off}
                          aria-label={busy?.id === o.id ? undefined : `Turn on ${o.title}`}
                          onClick={() => void run({ id: o.id, what: "on" }, () => actions.setEnabled(partner, o.id, true), `${o.title} turned on.`)}
                        >
                          {busy?.id === o.id && busy.what === "on" ? "Turning on…" : "Turn on"}
                        </Button>
                      )}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} disabled={busy !== null} onClick={() => setEditing({ offer: null })}>
              Add offer
            </Button>
            <span role="status" className="text-sm font-medium text-muted-foreground">
              {busy ? "Saving…" : said}
            </span>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={turningOff !== null}
        onOpenChange={(o) => !o && setTurningOff(null)}
        title="Turn off this offer?"
        description={`"${turningOff?.title ?? ""}" stops showing in the app for ${possessive(partner.name)} people. You can turn it back on.`}
        confirmLabel="Turn off"
        onConfirm={async () => {
          if (!turningOff) return
          const o = turningOff
          const result = await actions.setEnabled(partner, o.id, false)
          if ("error" in result) return { error: result.error }
          apply(result.offers, `${o.title} turned off.`)
        }}
      />
    </Dialog>
  )
}

type ManageOffersDialogProps = Parameters<typeof ManageOffersDialog>[0]
type OfferPreviewProps = Parameters<typeof OfferPreview>[0]

export { ManageOffersDialog, OfferPreview }
export type { ManageOffersDialogProps, OfferPreviewProps, OffersResult, PartnerOfferActions }
/* R13-02: the offer types live in partner-rules.ts; re-exported so a screen imports one entry. */
export type { OfferDraft, PartnerOffer } from "./partner-rules"
