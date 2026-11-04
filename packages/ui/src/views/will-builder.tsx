"use client"

import { useId, useState } from "react"
import type { ReactNode } from "react"
import { CheckIcon, PlusIcon, ScrollTextIcon, XIcon } from "lucide-react"

import { Button } from "../components/actions/button"
import { Input } from "../components/inputs/input"
import { cn } from "../lib/utils"
import { StepRail } from "../setup/step-rail"
import { Page } from "../templates/page"
import { PageHeader } from "../templates/page-header"
import { ViewIcon } from "./view-frame"

/* @archetype Frame (ARCHETYPES.md).
   WillBuilder: a guided will in six steps. A step list on the left (done steps can be
   revisited), one question group on the right, Back and Continue under it. People come from
   the Vault, so choosing an executor or a guardian is picking someone, not typing a name. */

export type WillPerson = { id: string; name: string; relation: string }

export type WillDraft = {
  legalName: string
  state: string
  status?: "single" | "married" | "partnered" | "divorced" | "widowed"
  children: string[]
  executor?: string
  backupExecutor?: string
  guardian?: string
  gifts: { item: string; to: string }[]
  residueTo?: string
}

const STEPS = ["About you", "Your family", "Executor", "Guardian", "Gifts", "Review"] as const

const STATUS: Array<[NonNullable<WillDraft["status"]>, string]> = [
  ["single", "Single"],
  ["married", "Married"],
  ["partnered", "Domestic partnership"],
  ["divorced", "Divorced"],
  ["widowed", "Widowed"],
]

const selectClass =
  "h-control w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus-ring disabled:opacity-50"

/** A labelled field. */
function Field({ label, hint, children, id }: { label: string; hint?: string; children: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground-strong">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** One-of-many choice as large tappable rows (radio semantics). */
function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: T; title: string; detail?: string }>
  value?: T
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const checked = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors focus-ring hover:border-primary",
              checked && "border-primary bg-primary-subtle"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong [&>svg]:size-3",
                checked && "border-primary bg-primary text-primary-foreground"
              )}
            >
              {checked && <CheckIcon strokeWidth={3} />}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold text-foreground-strong">{o.title}</span>
              {o.detail && <span className="text-sm text-muted-foreground">{o.detail}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function StepIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-2xl leading-display font-bold tracking-display text-balance text-foreground-strong">{title}</h2>
      <p className="max-w-measure leading-relaxed text-pretty text-muted-foreground">{children}</p>
    </div>
  )
}

function ReviewRow({ label, value, onEdit }: { label: string; value: ReactNode; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-1 border-b border-divider py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase sm:w-40">{label}</dt>
      <dd className="flex-1 text-foreground-strong">{value}</dd>
      <Button variant="link" size="inline" onClick={onEdit} className="text-sm">
        Edit
      </Button>
    </div>
  )
}

/** The will builder: step list, the current step's questions, Back and Continue. */
function WillBuilder({ people, initialDraft, initialStep = 1 }: { people: WillPerson[]; initialDraft: WillDraft; initialStep?: number }) {
  const [step, setStep] = useState(initialStep)
  const [reached, setReached] = useState(initialStep)
  const [draft, setDraft] = useState<WillDraft>(initialDraft)
  const [newGift, setNewGift] = useState({ item: "", to: "" })
  const ids = useId()

  const set = (patch: Partial<WillDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const nameOf = (id?: string) => people.find((p) => p.id === id)?.name
  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }
  const asOptions = (list: WillPerson[]) => list.map((p) => ({ value: p.id, title: p.name, detail: p.relation }))
  const children = people.filter((p) => draft.children.includes(p.id))
  const adults = people.filter((p) => !draft.children.includes(p.id))

  const canContinue =
    (step === 1 && draft.legalName.trim() !== "" && draft.state.trim() !== "" && !!draft.status) ||
    step === 2 ||
    (step === 3 && !!draft.executor) ||
    step === 4 ||
    step === 5

  const toggleChild = (id: string) =>
    set({ children: draft.children.includes(id) ? draft.children.filter((c) => c !== id) : [...draft.children, id] })

  let body: ReactNode
  if (step === 1) {
    body = (
      <>
        <StepIntro title="Let's start with you">Your will uses your full legal name and the state you live in, so it holds up where it counts.</StepIntro>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${ids}-name`} label="Full legal name" hint="As it appears on your ID.">
            <Input id={`${ids}-name`} value={draft.legalName} onChange={(e) => set({ legalName: e.target.value })} autoComplete="name" />
          </Field>
          <Field id={`${ids}-state`} label="State you live in">
            <Input id={`${ids}-state`} value={draft.state} onChange={(e) => set({ state: e.target.value })} autoComplete="address-level1" />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground-strong">Your relationship status</p>
          <Choices label="Your relationship status" value={draft.status} onChange={(v) => set({ status: v })} options={STATUS.map(([value, title]) => ({ value, title }))} />
        </div>
      </>
    )
  } else if (step === 2) {
    body = (
      <>
        <StepIntro title="Who are your children?">Choose everyone from your Vault who should be named as your child. Leave it empty if you don&apos;t have children.</StepIntro>
        <div role="group" aria-label="Your children" className="grid gap-2 sm:grid-cols-2">
          {people.map((p) => {
            const on = draft.children.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleChild(p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors focus-ring hover:border-primary",
                  on && "border-primary bg-primary-subtle"
                )}
              >
                <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded-sm border-2 border-border-strong [&>svg]:size-3", on && "border-primary bg-primary text-primary-foreground")}>
                  {on && <CheckIcon strokeWidth={3} />}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold text-foreground-strong">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{p.relation}</span>
                </span>
              </button>
            )
          })}
        </div>
      </>
    )
  } else if (step === 3) {
    body = (
      <>
        <StepIntro title="Who will carry out your will?">Your executor settles your estate: pays final bills, files the paperwork and hands things on. Pick someone organised you trust.</StepIntro>
        <Choices label="Executor" value={draft.executor} onChange={(v) => set({ executor: v, backupExecutor: draft.backupExecutor === v ? undefined : draft.backupExecutor })} options={asOptions(adults)} />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground-strong">And if they can&apos;t? (optional)</p>
          <Choices label="Backup executor" value={draft.backupExecutor} onChange={(v) => set({ backupExecutor: v })} options={asOptions(adults.filter((p) => p.id !== draft.executor))} />
        </div>
      </>
    )
  } else if (step === 4) {
    body =
      children.length === 0 ? (
        <StepIntro title="No guardian needed">You haven&apos;t named any children, so there&apos;s nothing to choose here. Continue to gifts.</StepIntro>
      ) : (
        <>
          <StepIntro title={`Who would raise ${children.map((c) => c.name.split(" ")[0]).join(" and ")}?`}>
            If both parents are gone, a guardian takes care of your children until they&apos;re adults. Talk to them before you choose.
          </StepIntro>
          <Choices label="Guardian" value={draft.guardian} onChange={(v) => set({ guardian: v })} options={asOptions(adults)} />
        </>
      )
  } else if (step === 5) {
    const giftId = `${ids}-gift`
    const toId = `${ids}-gift-to`
    body = (
      <>
        <StepIntro title="Anything you want to go to someone specific?">A ring, a car, a sum of money. Everything else goes to the person you choose below.</StepIntro>
        {draft.gifts.length > 0 && (
          <ul className="flex flex-col divide-y divide-divider rounded-lg border border-divider">
            {draft.gifts.map((g, i) => (
              <li key={g.item + i} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1">
                  <span className="font-semibold text-foreground-strong">{g.item}</span>
                  <span className="text-muted-foreground">{` to ${nameOf(g.to)}`}</span>
                </span>
                <Button variant="quiet" size="icon" aria-label={`Remove ${g.item}`} onClick={() => set({ gifts: draft.gifts.filter((_, j) => j !== i) })}>
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto]"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newGift.item.trim() || !newGift.to) return
            set({ gifts: [...draft.gifts, { item: newGift.item.trim(), to: newGift.to }] })
            setNewGift({ item: "", to: "" })
          }}
        >
          <Field id={giftId} label="Gift">
            <Input id={giftId} placeholder="Grandpa's watch" value={newGift.item} onChange={(e) => setNewGift((g) => ({ ...g, item: e.target.value }))} />
          </Field>
          <Field id={toId} label="Goes to">
            <select id={toId} className={selectClass} value={newGift.to} onChange={(e) => setNewGift((g) => ({ ...g, to: e.target.value }))}>
              <option value="">Choose someone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" variant="secondary" icon={<PlusIcon />} disabled={!newGift.item.trim() || !newGift.to}>
            Add
          </Button>
        </form>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground-strong">Everything else goes to</p>
          <Choices label="Everything else goes to" value={draft.residueTo} onChange={(v) => set({ residueTo: v })} options={asOptions(people)} />
        </div>
      </>
    )
  } else {
    const status = STATUS.find(([v]) => v === draft.status)?.[1]
    body = (
      <>
        <StepIntro title="Here's your will">Read it through. Once it looks right, Paige prepares a document for you to sign in front of two witnesses.</StepIntro>
        <dl className="flex flex-col">
          <ReviewRow label="You" value={`${draft.legalName}, ${draft.state}${status ? ` · ${status}` : ""}`} onEdit={() => setStep(1)} />
          <ReviewRow label="Children" value={children.length ? children.map((c) => c.name).join(", ") : "None named"} onEdit={() => setStep(2)} />
          <ReviewRow
            label="Executor"
            value={nameOf(draft.executor) ? `${nameOf(draft.executor)}${draft.backupExecutor ? `, then ${nameOf(draft.backupExecutor)}` : ""}` : "Not chosen"}
            onEdit={() => setStep(3)}
          />
          {children.length > 0 && <ReviewRow label="Guardian" value={nameOf(draft.guardian) ?? "Not chosen"} onEdit={() => setStep(4)} />}
          <ReviewRow label="Gifts" value={draft.gifts.length ? draft.gifts.map((g) => `${g.item} to ${nameOf(g.to)}`).join("; ") : "None"} onEdit={() => setStep(5)} />
          <ReviewRow label="Everything else" value={nameOf(draft.residueTo) ?? "Not chosen"} onEdit={() => setStep(5)} />
        </dl>
      </>
    )
  }

  return (
    <Page>
      <PageHeader
        back={{ href: "/area/estate", label: "Estate" }}
        icon={
          <ViewIcon>
            <ScrollTextIcon />
          </ViewIcon>
        }
        title="Your will"
        description="Six short steps. Your answers save as you go, so you can stop and come back."
        meta={<StepRail step={step} total={STEPS.length} label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`} />}
      />
      <div className="grid items-start gap-column lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <nav aria-label="Will steps">
          <ol className="flex gap-1 overflow-x-auto lg:flex-col">
            {STEPS.map((label, i) => {
              const n = i + 1
              const current = n === step
              const done = n < reached || (n < step)
              const open = n <= reached
              return (
                <li key={label} className="shrink-0">
                  <button
                    type="button"
                    disabled={!open}
                    aria-current={current ? "step" : undefined}
                    onClick={() => setStep(n)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-muted-foreground transition-colors focus-ring enabled:hover:bg-muted disabled:opacity-50",
                      current && "bg-primary-subtle text-foreground-strong enabled:hover:bg-primary-subtle"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs [&>svg]:size-3",
                        current && "border-primary text-primary",
                        done && !current && "border-success bg-success text-on-tone"
                      )}
                    >
                      {done && !current ? <CheckIcon strokeWidth={3} /> : n}
                    </span>
                    {label}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
        <section aria-label={STEPS[step - 1]} className="flex flex-col gap-6 rounded-lg border border-divider bg-card p-6 text-card-foreground shadow-card">
          {body}
          <div className="flex items-center justify-between gap-3 border-t border-divider pt-5">
            {step > 1 ? (
              <Button variant="quiet" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length ? (
              <Button onClick={() => go(step + 1)} disabled={!canContinue}>
                Save and continue
              </Button>
            ) : (
              <Button>Prepare my will</Button>
            )}
          </div>
        </section>
      </div>
    </Page>
  )
}

export { WillBuilder }
