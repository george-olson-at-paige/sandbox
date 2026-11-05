"use client"

import type { ComponentProps, ElementType, ReactNode } from "react"
import { useCallback, useId, useState } from "react"
import { CheckIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react"

import { Button } from "../../../components/actions/button"
import { IconButton } from "../../../components/actions/icon-button"
import { Attachment } from "../../../components/display/attachment"
import { Checkbox } from "../../../components/inputs/checkbox"
import { Input } from "../../../components/inputs/input"
import { RadioGroup, RadioGroupItem } from "../../../components/inputs/radio-group"
import { Select } from "../../../components/inputs/select"
import { Field } from "../../../forms/field"
import { FieldGroup } from "../../../forms/field-group"
import { DateField } from "../../../forms/fields/date-field"
import { Form } from "../../../forms/form"
import { FormSection } from "../../../forms/form-section"
import { cn } from "../../../lib/utils"
import { FlowFooter } from "../../../setup/flow-footer"
import { AppHeader } from "../../../shell/app-header"
import { SetupBeat } from "../../../templates/setup-beat"
import type { PersonPickerPerson } from "../../../vault/people/person-picker"
import { ShareField, splitEvenly, totalOf, type ShareRow } from "../../components/share-field"
import { RecordCard, RecordSection } from "../record-section"
import { useRoutes } from "../collections/use-routes"
import type { WILL_COPY } from "./fixtures"
import { PersonSlots, type Slot } from "./person-slots"

/* @archetype Composite (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). WILL-PLAN.md §2 (George 2026-11-04): the Will Builder as guided
   steps on SetupBeat — the step rail in the bar, one question per step, a Form whose FlowFooter
   saves and moves on (Back, Save and continue), "Save and finish later" in the bar.
   The steps, by the answers: You · Your spouse (married only) · Children (and who would raise
   them) · Who carries it out · Who inherits · Specific gifts · Anyone left out · Review, then
   Finalize and sign (no rail: it's after the questions).
   - People come from the Vault (PersonSlots: pick, or someone new; ordered where order matters).
   - Who inherits is one step (Vue had three on one save): a choice that fits the family
     (everything to the spouse; then to the children; to the children; your own split), then a
     ShareField only when it's needed, and optional backups. Shares must total 100 to save.
   - Review is the record of the answers, each with Edit; the draft PDF behind "See the draft";
     Finalize when paid, otherwise Pay and finalize (`checkoutHref`).
   - Finalize and sign in order: finalize (Paige makes the clean copy), then download *that*
     copy, then the state's signing steps. Vue offered the watermarked draft first.
   Saving is the caller's (`onSave(step, answers)`); here it resolves and moves on. */

type Copy = typeof WILL_COPY
type Result = void | { error: string }

export type Child = { id: string; name: string; dob: string; guardians: Slot[] }
export type Gift = { id: string; to: string; what: string }
export type InheritPlan = "spouse" | "spouseThenChildren" | "children" | "own" | ""
export type WillAnswers = {
  you: { legalName: string; dob: string; marital: "" | "married" | "single" | "widowed"; state: string; county: string }
  spouse: { name: string; dob: string }
  children: { has?: boolean; list: Child[] }
  executors: Slot[]
  digitalToo: boolean
  inherit: { plan: InheritPlan; shares: ShareRow[]; backups: ShareRow[] }
  gifts: Gift[]
  leftOut: { any?: boolean; people: Slot[] }
}

type StepId = "you" | "spouse" | "children" | "executors" | "inherit" | "gifts" | "leftOut" | "review" | "sign"

/** The steps these answers make, in order (the questions, Review, then Finalize and sign). */
export function stepsFor(a: WillAnswers): StepId[] {
  return [
    "you",
    ...(a.you.marital === "married" ? (["spouse"] as const) : []),
    "children",
    "executors",
    "inherit",
    "gifts",
    "leftOut",
    "review",
    "sign",
  ]
}

/** A yes/no or one-of-a-few question as radios in a bordered list, each with its words. */
function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const id = useId()
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={onChange}
      className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border-medium"
    >
      {options.map((o) => (
        <label
          key={o.value}
          htmlFor={`${id}-${o.value}`}
          className={cn(
            "flex cursor-pointer items-center gap-3 border-t border-divider px-4 py-3 text-sm font-semibold first:border-t-0",
            value === o.value ? "bg-accent" : "",
          )}
        >
          <RadioGroupItem id={`${id}-${o.value}`} value={o.value} />
          {o.label}
        </label>
      ))}
    </RadioGroup>
  )
}

/** The Will Builder: the steps on SetupBeat, Review, then Finalize and sign. */
export function WillBuilder({
  start,
  people,
  states,
  signing,
  copy,
  paid,
  initialStep = "you",
  onSave,
  checkoutHref,
  onFinalize,
  logo,
  linkAs = "a",
}: {
  start: WillAnswers
  /** The owner's people, to pick from. */
  people: PersonPickerPerson[]
  states: Array<{ value: string; label: string; counties: string[] }>
  /** The state's signing steps, from the PDF's cover. */
  signing: string[]
  copy: Copy
  /** A will is paid for: Review offers Finalize, not Pay and finalize. */
  paid: boolean
  initialStep?: StepId
  /** Saves a step's answers. */
  onSave: (step: StepId, answers: WillAnswers) => Promise<Result>
  /** Checkout for a will; it comes back to Finalize. */
  checkoutHref: string
  /** Makes the clean PDF and files it in the Vault. */
  onFinalize: () => Promise<Result>
  logo: ReactNode
  linkAs?: ElementType
}) {
  const [a, setA] = useState(start)
  const steps = stepsFor(a)
  const resolve = useCallback((href: string) => {
    const m = /[?&]step=([a-zA-Z]+)/.exec(href)
    return m ? (m[1] as StepId) : undefined
  }, [])
  const { route: step, setRoute: go, NavLink } = useRoutes<StepId>(initialStep, resolve, linkAs)
  const href = (s: StepId) => `?step=${s}`
  const i = steps.indexOf(step)
  const prev = steps[i - 1]
  const next = steps[i + 1]
  const questions: StepId[] = steps.filter((s) => s !== "sign")
  const set = <K extends keyof WillAnswers>(k: K, v: WillAnswers[K]) => setA((x) => ({ ...x, [k]: v }))
  let nextId = 100
  const newId = () => `n${nextId++}-${Date.now()}`
  const spouseName = a.spouse.name || people.find((p) => p.detail === "Spouse")?.name || ""
  const slotCopy = {
    pick: copy.pick,
    someoneNew: copy.someoneNew,
    first: copy.first,
    name: copy.name,
    relationship: copy.relationship,
    email: copy.email,
    up: copy.up,
    down: copy.down,
    remove: copy.remove,
  }

  const beat = (s: StepId, body: ReactNode, validate?: () => Record<string, string> | undefined, footer?: { ctaLabel?: string; skip?: boolean }) => {
    const c = copy[s as keyof Copy] as { eyebrow: string; title: string | ((n: string) => string); lede: string }
    return (
      <SetupBeat
        logo={logo}
        step={questions.indexOf(s) + 1}
        total={questions.length}
        stepLabel={copy.rail(questions.indexOf(s) + 1, questions.length)}
        exit={
          <Button asChild variant="quiet" size="inline">
            <NavLink href="#vault">{copy.bar.finishLater}</NavLink>
          </Button>
        }
        eyebrow={c.eyebrow}
        eyebrowTone="primary"
        title={typeof c.title === "function" ? c.title(spouseName) : c.title}
        lede={c.lede}
        density="roomy"
        footer={null}
      >
        <Form
          values={a}
          validate={() => validate?.()}
          warnUnsaved={false}
          onSubmit={async () => {
            const result = await onSave(s, a)
            if (result && "error" in result) return { error: result.error }
            if (next) go(next)
          }}
        >
          <div className="flex flex-col gap-8">{body}</div>
          <FlowFooter
            linkAs={NavLink}
            backHref={prev ? href(prev) : "#will"}
            ctaLabel={footer?.ctaLabel ?? copy.next}
            skipLabel={footer?.skip ? copy.gifts.skip : undefined}
            skipHref={footer?.skip && next ? href(next) : undefined}
            submit={{ pendingLabel: copy.saving }}
          />
        </Form>
      </SetupBeat>
    )
  }

  if (step === "you") {
    const st = states.find((x) => x.value === a.you.state)
    const y = copy.you
    return beat(
      "you",
      <FieldGroup density="roomy">
        <Field label={y.legalName} name="legalName" span={8}>
          <Input value={a.you.legalName} autoComplete="name" onChange={(e) => set("you", { ...a.you, legalName: e.target.value })} />
        </Field>
        <Field label={y.dob} name="dob" span={4}>
          <DateField value={a.you.dob} onValueChange={(dob) => set("you", { ...a.you, dob })} />
        </Field>
        <Field label={y.marital} name="marital">
          <Choice
            label={y.marital}
            value={a.you.marital}
            onChange={(m) => set("you", { ...a.you, marital: m as WillAnswers["you"]["marital"] })}
            options={y.maritalOptions}
          />
        </Field>
        <Field label={y.state} name="state" span={6}>
          <Select
            placeholder={y.statePlaceholder}
            value={a.you.state}
            onValueChange={(state) => set("you", { ...a.you, state, county: "" })}
            options={states.map((x) => ({ value: x.value, label: x.label }))}
          />
        </Field>
        {st && st.counties.length > 0 && (
          <Field label={y.county} name="county" span={6}>
            <Select
              placeholder={y.countyPlaceholder}
              value={a.you.county}
              onValueChange={(county) => set("you", { ...a.you, county })}
              options={st.counties.map((c) => ({ value: c, label: c }))}
            />
          </Field>
        )}
      </FieldGroup>,
      () => ({
        ...(a.you.legalName.trim() ? {} : { legalName: copy.required }),
        ...(a.you.dob ? {} : { dob: copy.required }),
        ...(a.you.marital ? {} : { marital: copy.required }),
        ...(a.you.state ? {} : { state: copy.required }),
        ...(st?.counties.length && !a.you.county ? { county: copy.required } : {}),
      }),
    )
  }

  if (step === "spouse") {
    const sp = copy.spouse
    return beat(
      "spouse",
      <FieldGroup density="roomy">
        <Field label={sp.legalName} name="spouseName" span={8}>
          <Input value={a.spouse.name} onChange={(e) => set("spouse", { ...a.spouse, name: e.target.value })} />
        </Field>
        <Field label={sp.dob} name="spouseDob" span={4}>
          <DateField value={a.spouse.dob} onValueChange={(dob) => set("spouse", { ...a.spouse, dob })} />
        </Field>
      </FieldGroup>,
      () => ({ ...(a.spouse.name.trim() ? {} : { spouseName: copy.required }), ...(a.spouse.dob ? {} : { spouseDob: copy.required }) }),
    )
  }

  if (step === "children") {
    const ch = copy.children
    const kids = a.children.list
    const setKid = (k: number, patch: Partial<Child>) =>
      set("children", { ...a.children, list: kids.map((x, j) => (j === k ? { ...x, ...patch } : x)) })
    return beat(
      "children",
      <>
        <Field label={ch.title} name="hasChildren">
          <Choice
            label={ch.title}
            value={a.children.has === undefined ? "" : a.children.has ? "yes" : "no"}
            onChange={(v) =>
              set("children", { has: v === "yes", list: v === "yes" && kids.length === 0 ? [{ id: newId(), name: "", dob: "", guardians: [] }] : kids })
            }
            options={[
              { value: "yes", label: copy.yes },
              { value: "no", label: copy.no },
            ]}
          />
        </Field>
        {a.children.has &&
          kids.map((k, n) => (
            <FormSection key={k.id} title={ch.child(n)}>
              <div className="flex items-start gap-2">
                <FieldGroup className="flex-1">
                  <Field label={ch.childName} span={8}>
                    <Input value={k.name} onChange={(e) => setKid(n, { name: e.target.value })} />
                  </Field>
                  <Field label={ch.childDob} span={4}>
                    <DateField value={k.dob} onValueChange={(dob) => setKid(n, { dob })} />
                  </Field>
                </FieldGroup>
                {kids.length > 1 && (
                  <IconButton
                    type="button"
                    variant="ghost"
                    shape="rect"
                    icon={<XIcon />}
                    aria-label={copy.remove(k.name || ch.child(n))}
                    onClick={() => set("children", { ...a.children, list: kids.filter((_, j) => j !== n) })}
                    className="mt-6"
                  />
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-semibold">{ch.guardians(k.name)}</span>
                <span className="text-sm font-medium text-muted-foreground">{ch.guardiansHint}</span>
                <PersonSlots
                  slots={k.guardians}
                  onChange={(guardians) => setKid(n, { guardians })}
                  people={people.filter((p) => p.detail !== "Child")}
                  newId={newId}
                  copy={slotCopy}
                />
              </div>
            </FormSection>
          ))}
        {a.children.has && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            shape="rect"
            icon={<PlusIcon />}
            className="self-start"
            onClick={() => set("children", { ...a.children, list: [...kids, { id: newId(), name: "", dob: "", guardians: [] }] })}
          >
            {ch.addChild}
          </Button>
        )}
      </>,
      () => ({
        ...(a.children.has === undefined ? { hasChildren: copy.required } : {}),
        ...(a.children.has && kids.some((k) => !k.name.trim() || !k.dob) ? { hasChildren: copy.required } : {}),
      }),
    )
  }

  if (step === "executors") {
    const ex = copy.executors
    return beat(
      "executors",
      <>
        <Field name="executors">
          <PersonSlots
            slots={a.executors}
            onChange={(executors) => set("executors", executors)}
            people={people}
            askEmail
            newId={newId}
            copy={slotCopy}
          />
        </Field>
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox checked={a.digitalToo} onCheckedChange={(digitalToo) => set("digitalToo", digitalToo)} className="mt-0.5" />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{ex.digital}</span>
            <span className="text-sm font-medium text-muted-foreground">{ex.digitalHint}</span>
          </span>
        </label>
      </>,
      () => (a.executors.length && a.executors.every((s) => s.name.trim()) ? undefined : { executors: copy.required }),
    )
  }

  if (step === "inherit") {
    const ih = copy.inherit
    const married = a.you.marital === "married"
    const hasKids = Boolean(a.children.has && a.children.list.length)
    const plans = [
      ...(married ? [{ value: "spouse", label: ih.everythingTo(spouseName) }] : []),
      ...(married && hasKids ? [{ value: "spouseThenChildren", label: ih.thenChildren(spouseName.split(" ")[0]!) }] : []),
      ...(!married && hasKids ? [{ value: "children", label: ih.toChildren }] : []),
      { value: "own", label: ih.own },
    ]
    const plan = plans.length === 1 ? "own" : a.inherit.plan
    const pickFor = (rows: ShareRow[], key: "shares" | "backups") => {
      const offered = people.filter((p) => !rows.some((r) => r.id === p.id))
      return offered.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{copy.pick}</span>
          {offered.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="secondary"
              size="sm"
              shape="rect"
              icon={<PlusIcon />}
              onClick={() => set("inherit", { ...a.inherit, plan, [key]: [...rows, { id: p.id, name: p.name, detail: p.detail, share: "" }] })}
            >
              {p.name}
            </Button>
          ))}
        </div>
      ) : null
    }
    return beat(
      "inherit",
      <>
        {plans.length > 1 && (
          <Field label={ih.plan} name="plan">
            <Choice label={ih.plan} value={plan} onChange={(v) => set("inherit", { ...a.inherit, plan: v as InheritPlan })} options={plans} />
          </Field>
        )}
        {plan === "own" && (
          <FormSection title={ih.shares}>
            <Field name="shares">
              <ShareField
                rows={a.inherit.shares}
                onChange={(shares) => set("inherit", { ...a.inherit, plan, shares })}
                add={pickFor(a.inherit.shares, "shares")}
                copy={ih.share}
              />
            </Field>
          </FormSection>
        )}
        {plan && plan !== "own" && (
          <FormSection title={ih.backups} description={ih.backupsHint}>
            <Field name="backups">
              <ShareField
                rows={a.inherit.backups}
                onChange={(backups) => set("inherit", { ...a.inherit, plan, backups })}
                add={pickFor(a.inherit.backups, "backups")}
                copy={ih.share}
              />
            </Field>
          </FormSection>
        )}
      </>,
      () => ({
        ...(plan ? {} : { plan: ih.choosePlan }),
        ...(plan === "own" && totalOf(a.inherit.shares) !== 100 ? { shares: ih.mustTotal } : {}),
        ...(a.inherit.backups.length && totalOf(a.inherit.backups) !== 100 ? { backups: ih.mustTotal } : {}),
      }),
    )
  }

  if (step === "gifts") {
    const g = copy.gifts
    return beat(
      "gifts",
      <>
        {a.gifts.map((gift, n) => (
          <div key={gift.id} role="group" aria-label={g.gift(n)} className="flex items-start gap-2 rounded-lg border border-border-medium p-3">
            <FieldGroup className="flex-1">
              <Field label={g.to} span={5}>
                <Select
                  placeholder={g.toPlaceholder}
                  value={gift.to}
                  onValueChange={(to) =>
                    set(
                      "gifts",
                      a.gifts.map((x, j) => (j === n ? { ...x, to } : x)),
                    )
                  }
                  options={people.map((p) => ({ value: p.id, label: p.name }))}
                />
              </Field>
              <Field label={g.what} span={7}>
                <Input
                  value={gift.what}
                  placeholder={g.whatPlaceholder}
                  onChange={(e) =>
                    set(
                      "gifts",
                      a.gifts.map((x, j) => (j === n ? { ...x, what: e.target.value } : x)),
                    )
                  }
                />
              </Field>
            </FieldGroup>
            <IconButton
              type="button"
              variant="ghost"
              shape="rect"
              icon={<XIcon />}
              aria-label={copy.remove(g.gift(n))}
              onClick={() =>
                set(
                  "gifts",
                  a.gifts.filter((_, j) => j !== n),
                )
              }
              className="mt-6"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          shape="rect"
          icon={<PlusIcon />}
          className="self-start"
          onClick={() => set("gifts", [...a.gifts, { id: newId(), to: "", what: "" }])}
        >
          {g.addGift}
        </Button>
      </>,
      () => (a.gifts.some((x) => !x.to || !x.what.trim()) ? { gifts: copy.required } : undefined),
      { skip: a.gifts.length === 0 },
    )
  }

  if (step === "leftOut") {
    const lo = copy.leftOut
    return beat(
      "leftOut",
      <>
        <Field label={lo.title} name="leftOut">
          <Choice
            label={lo.title}
            value={a.leftOut.any === undefined ? "" : a.leftOut.any ? "yes" : "no"}
            onChange={(v) => set("leftOut", { ...a.leftOut, any: v === "yes" })}
            options={[
              { value: "no", label: copy.no },
              { value: "yes", label: copy.yes },
            ]}
          />
        </Field>
        {a.leftOut.any && (
          <PersonSlots
            slots={a.leftOut.people}
            onChange={(p) => set("leftOut", { ...a.leftOut, people: p })}
            people={people}
            ordered={false}
            newId={newId}
            copy={slotCopy}
          />
        )}
      </>,
      () => ({
        ...(a.leftOut.any === undefined ? { leftOut: copy.required } : {}),
        ...(a.leftOut.any && !a.leftOut.people.length ? { leftOut: copy.required } : {}),
      }),
    )
  }

  if (step === "review") {
    const r = copy.review
    const st = states.find((x) => x.value === a.you.state)
    const names = (slots: Slot[]) => (slots.length ? slots.map((s) => s.name).join(", ") : r.none)
    const shares = (rows: ShareRow[]) => rows.map((x) => `${x.name} ${x.share || 0}%`).join(", ")
    const section = (id: StepId, title: string, lines: string[]) => (
      <RecordSection key={id} audience="shared" title={title}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 text-sm font-medium">
            {lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
          <Button asChild variant="link" size="inline" icon={<PencilIcon />} className="text-xs">
            <NavLink href={href(id)}>{r.edit}</NavLink>
          </Button>
        </div>
      </RecordSection>
    )
    const plan = a.inherit.plan
    return (
      <SetupBeat
        logo={logo}
        step={questions.indexOf("review") + 1}
        total={questions.length}
        stepLabel={copy.rail(questions.indexOf("review") + 1, questions.length)}
        eyebrow={r.eyebrow}
        eyebrowTone="primary"
        title={r.title}
        lede={r.lede}
        footer={
          <FlowFooter
            linkAs={NavLink}
            backHref={href(prev!)}
            note={paid ? undefined : r.payNote}
            ctaLabel={paid ? r.finalize : r.pay}
            ctaHref={paid ? href("sign") : checkoutHref}
          />
        }
      >
        <div className="flex flex-col gap-6">
          <Attachment name={r.draftName} description={r.draftLine} onOpen={() => {}} openLabel={r.seeDraft} />
          <RecordCard label={r.title}>
            {section("you", r.sections.you, [
              a.you.legalName,
              `${copy.you.maritalOptions.find((o) => o.value === a.you.marital)?.label ?? ""} · ${[a.you.county, st?.label].filter(Boolean).join(", ")}`,
            ])}
            {a.you.marital === "married" && section("spouse", r.sections.spouse, [a.spouse.name])}
            {section(
              "children",
              r.sections.children,
              a.children.has ? a.children.list.map((k) => `${k.name}${k.guardians.length ? ` — ${names(k.guardians)}` : ""}`) : [r.none],
            )}
            {section("executors", r.sections.executors, [names(a.executors), ...(a.digitalToo ? [r.digital] : [])])}
            {section("inherit", r.sections.inherit, [
              plan === "spouse"
                ? copy.inherit.everythingTo(spouseName)
                : plan === "spouseThenChildren"
                  ? copy.inherit.thenChildren(spouseName.split(" ")[0]!)
                  : plan === "children"
                    ? copy.inherit.toChildren
                    : shares(a.inherit.shares),
              ...(a.inherit.backups.length ? [`${copy.inherit.backups}: ${shares(a.inherit.backups)}`] : []),
            ])}
            {section(
              "gifts",
              r.sections.gifts,
              a.gifts.length ? a.gifts.map((x) => `${x.what} → ${people.find((p) => p.id === x.to)?.name ?? ""}`) : [r.none],
            )}
            {section("leftOut", r.sections.leftOut, [a.leftOut.any ? names(a.leftOut.people) : r.none])}
          </RecordCard>
        </div>
      </SetupBeat>
    )
  }

  // Finalize and sign.
  return (
    <SignStep
      copy={copy}
      logo={logo}
      state={states.find((x) => x.value === a.you.state)?.label ?? ""}
      signing={signing}
      onFinalize={onFinalize}
      linkAs={NavLink}
      back={href("review")}
    />
  )
}

/** Finalize, then download the clean copy, then the state's signing steps. */
function SignStep({
  copy,
  logo,
  state,
  signing,
  onFinalize,
  linkAs,
  back,
}: {
  copy: Copy
  logo: ReactNode
  state: string
  signing: string[]
  onFinalize: () => Promise<Result>
  linkAs: ElementType
  back: string
}) {
  const s = copy.sign
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle")
  const [error, setError] = useState("")
  const [checked, setChecked] = useState<boolean[]>(signing.map(() => false))
  const done = status === "done"
  return (
    <SetupBeat
      topBar={<AppHeader logo={logo} />}
      eyebrow={s.eyebrow}
      eyebrowTone="primary"
      title={s.title}
      lede={s.lede}
      footer={<FlowFooter linkAs={linkAs} backHref={back} ctaLabel={s.done} ctaHref="#vault" ctaDisabled={!done} />}
    >
      <ol className="flex flex-col gap-8">
        <li className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-foreground-strong">{s.finalizeTitle}</h2>
          <p className="text-sm font-medium text-muted-foreground">{s.finalizeLine}</p>
          {done ? (
            <p role="status" className="flex items-center gap-2 text-sm font-semibold text-success [&_svg]:size-icon">
              <CheckIcon aria-hidden />
              {s.finalized}
            </p>
          ) : (
            <Button
              className="self-start"
              disabled={status === "pending"}
              onClick={async () => {
                setStatus("pending")
                setError("")
                const result = await onFinalize()
                if (result && "error" in result) {
                  setError(result.error)
                  setStatus("idle")
                } else setStatus("done")
              }}
            >
              {status === "pending" ? s.finalizing : s.finalize}
            </Button>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {error}
            </p>
          )}
        </li>
        <li className={cn("flex flex-col gap-3", done ? "" : "opacity-disabled")} aria-disabled={!done || undefined}>
          <h2 className="font-display text-lg font-bold text-foreground-strong">{s.downloadTitle}</h2>
          {done && <Attachment name={s.fileName} description={s.fileLine} onOpen={() => {}} />}
        </li>
        <li className={cn("flex flex-col gap-3", done ? "" : "opacity-disabled")} aria-disabled={!done || undefined}>
          <h2 className="font-display text-lg font-bold text-foreground-strong">{s.signTitle(state)}</h2>
          <ul className="flex flex-col gap-2">
            {signing.map((line, n) => (
              <li key={line}>
                <label className="flex cursor-pointer items-start gap-3 text-sm font-medium">
                  <Checkbox
                    checked={checked[n]!}
                    disabled={!done}
                    onCheckedChange={(c) => setChecked((x) => x.map((v, j) => (j === n ? c : v)))}
                    className="mt-0.5"
                  />
                  {line}
                </label>
              </li>
            ))}
          </ul>
        </li>
      </ol>
    </SetupBeat>
  )
}

/** Equal shares for the rows given (for a story's start). */
export const evenShares = splitEvenly

export type WillBuilderProps = ComponentProps<typeof WillBuilder>
