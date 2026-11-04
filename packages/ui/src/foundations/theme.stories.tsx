import { useEffect, useRef, useState, type ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { cn } from "../lib/utils"
import { AREA_ORDER } from "../icons/area-glyphs"
import { AreaIcon } from "../vault/areas/area-icon"
import { Eyebrow } from "../components/display/eyebrow"
import { Field, FieldError, FieldLabel } from "../forms/field"
import { Input } from "../components/inputs/input"

/* Every swatch paints with the theme's own utility (which reads the CSS variable) and
   prints the value the browser resolved, so this page shows theme.css as built. */

function useComputed(prop: "backgroundColor" | "boxShadow" | "borderRadius" | "width") {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")
  useEffect(() => {
    if (ref.current) setValue(getComputedStyle(ref.current)[prop])
  }, [prop])
  return [ref, value] as const
}

function Swatch({ token, className }: { token: string; className: string }) {
  const [ref, value] = useComputed("backgroundColor")
  return (
    <div className="flex items-center gap-3">
      <div ref={ref} className={cn("size-12 shrink-0 rounded-md border", className)} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-card-foreground">{token}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 font-display text-xl font-bold text-foreground-strong">{title}</h2>
      {note && <p className="mb-4 max-w-prose text-sm text-muted-foreground">{note}</p>}
      {children}
    </section>
  )
}

const meta = {
  tags: ["!autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const semantic: Array<[string, string]> = [
  ["--background", "bg-background"],
  ["--foreground", "bg-foreground"],
  ["--foreground-strong", "bg-foreground-strong"],
  ["--body-muted", "bg-body-muted"],
  ["--placeholder", "bg-placeholder"],
  ["--card", "bg-card"],
  ["--card-foreground", "bg-card-foreground"],
  ["--popover", "bg-popover"],
  ["--primary", "bg-primary"],
  ["--primary-hover", "bg-primary-hover"],
  ["--primary-subtle", "bg-primary-subtle"],
  ["--primary-foreground", "bg-primary-foreground"],
  ["--secondary", "bg-secondary"],
  ["--secondary-foreground", "bg-secondary-foreground"],
  ["--muted", "bg-muted"],
  ["--muted-foreground", "bg-muted-foreground"],
  ["--accent", "bg-accent"],
  ["--accent-foreground", "bg-accent-foreground"],
  ["--destructive", "bg-destructive"],
  ["--error", "bg-error"],
  ["--error-border", "bg-error-border"],
  ["--border", "bg-border"],
  ["--input", "bg-input"],
  ["--ring", "bg-ring"],
  ["--divider", "bg-divider"],
  ["--divider-tint", "bg-divider-tint"],
  ["--track", "bg-track"],
  ["--surface-warm", "bg-surface-warm"],
  ["--surface-page", "bg-surface-page"],
  ["--pet", "bg-pet"],
  ["--pet-subtle", "bg-pet-subtle"],
]

export const SemanticColours: Story = {
  name: "Colour: semantic roles",
  render: () => (
    <Section title="Semantic roles" note="shadcn roles plus Paige extras (theme.css layers 2 and 3). Components use only these, never the raw palette.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {semantic.map(([t, c]) => <Swatch key={t} token={t} className={c} />)}
      </div>
    </Section>
  ),
}

const tones: Array<{ tone: string; roles: Array<[string, string]> }> = [
  { tone: "neutral", roles: [["--muted-foreground", "bg-muted-foreground"], ["--foreground", "bg-foreground"], ["--muted", "bg-muted"], ["--border", "bg-border"]] },
  { tone: "info", roles: [["--info", "bg-info"], ["--info-foreground", "bg-info-foreground"], ["--info-subtle", "bg-info-subtle"], ["--info-border", "bg-info-border"]] },
  { tone: "success", roles: [["--success", "bg-success"], ["--success-foreground", "bg-success-foreground"], ["--success-subtle", "bg-success-subtle"], ["--success-border", "bg-success-border"]] },
  { tone: "warning", roles: [["--warning", "bg-warning"], ["--warning-foreground", "bg-warning-foreground"], ["--warning-subtle", "bg-warning-subtle"], ["--warning-border", "bg-warning-border"]] },
  { tone: "attention", roles: [["--attention", "bg-attention"], ["--attention-foreground", "bg-attention-foreground"], ["--attention-subtle", "bg-attention-subtle"], ["--attention-border", "bg-attention-border"]] },
  { tone: "area (default context)", roles: [["--area", "bg-area"], ["--area-ink", "bg-area-ink"], ["--area-tint", "bg-area-tint"], ["--area-wash", "bg-area-wash"]] },
]

export const Tones: Story = {
  name: "Colour: tones",
  render: () => (
    <Section title="Tones" note="Status is shown by tone. Each tone has four roles: solid, foreground, subtle, border (GAPS.md #8).">
      <div className="flex flex-col gap-6">
        {tones.map(({ tone, roles }) => (
          <div key={tone}>
            <Eyebrow as="p" className="mb-2">{tone}</Eyebrow>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map(([t, c]) => <Swatch key={t} token={t} className={c} />)}
            </div>
          </div>
        ))}
      </div>
    </Section>
  ),
}

export const Error: Story = {
  name: "Colour: error",
  render: () => (
    <Section
      title="Error (R1-02)"
      note={
        <>
          From the old Vue app (Paige.Webapp tailwind.css:62-77). <code>--error</code> (the old app’s field-error red) is for labels and messages: 5.23:1 on
          white (AA for normal text). <code>--error-border</code> is the 1px stroke at rest: 3.61:1 on white, so a radio or checkbox
          that shows an error by its border alone still meets the 3:1 non-text rule (R2-01; it was 2.68:1). Hover and focus while
          invalid darken the stroke to <code>--error</code>. <code>--destructive</code> is the same hue, kept for irreversible
          actions only (delete), always behind a confirm (R2-03).
        </>
      }
    >
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="grid gap-4">
          <Swatch token="--error" className="bg-error" />
          <Swatch token="--error-border" className="bg-error-border" />
          <Swatch token="--destructive" className="bg-destructive" />
        </div>
        <Field id="theme-dob" invalid className="max-w-sm">
          <FieldLabel>Date of birth</FieldLabel>
          <Input aria-invalid defaultValue="31/02/1984" />
          <FieldError>That date doesn’t exist. Check the day and month.</FieldError>
        </Field>
      </div>
    </Section>
  ),
}

export const LifeAreas: Story = {
  name: "Colour: Life Areas",
  render: () => (
    <Section title="Nine Life Area colours" note={<>Set by <code>data-area</code> on any ancestor (theme.css layer 5). Each area defines display, ink, tint (12%) and wash (7%).</>}>
      <div className="flex flex-col gap-6">
        {AREA_ORDER.map((a) => (
          <div key={a} data-area={a} className="grid items-center gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center gap-2">
              <AreaIcon area={a} size="md" />
              <span className="text-sm font-semibold text-area-ink capitalize">{a}</span>
            </div>
            <Swatch token="--area" className="bg-area" />
            <Swatch token="--area-ink" className="bg-area-ink" />
            <Swatch token="--area-tint" className="bg-area-tint" />
            <Swatch token="--area-wash" className="bg-area-wash" />
          </div>
        ))}
      </div>
    </Section>
  ),
}

const sizes: Array<[string, string]> = [
  ["text-xs · 12", "text-xs"],
  ["text-sm · 14", "text-sm"],
  ["text-base · 16", "text-base"],
  ["text-lg · 18", "text-lg"],
  ["text-xl · 20", "text-xl"],
  ["text-2xl · 24", "text-2xl"],
  ["text-3xl · 30", "text-3xl"],
  ["text-4xl · 40", "text-4xl"],
]

export const TypeScale: Story = {
  name: "Type scale",
  render: () => (
    <>
      <Section title="Sans (Montserrat)" note="UI text. Body 400, headings and labels 600, emphasis 700.">
        <div className="flex flex-col gap-3">
          {sizes.map(([l, c]) => (
            <div key={c} className="flex items-baseline gap-6">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{l}</span>
              <span className={cn(c, "text-card-foreground")}>Maya keeps everything in one place</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Display (slab)" note="Roboto Slab, the stand-in for Museo Slab. Display titles are 700.">
        <div className="flex flex-col gap-3">
          {sizes.slice(3).map(([l, c]) => (
            <div key={c} className="flex items-baseline gap-6">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{l}</span>
              <span className={cn(c, "font-display leading-display font-bold tracking-display text-foreground-strong")}>Your Family Area</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Weights">
        <div className="flex flex-col gap-2 text-lg text-card-foreground">
          <span className="font-normal">400 normal: body</span>
          <span className="font-medium">500 medium: what the base layer sets today (GAPS.md #60)</span>
          <span className="font-semibold">600 semibold: headings, labels, buttons</span>
          <span className="font-bold">700 bold: emphasis, display titles</span>
        </div>
      </Section>
      <Section title="Eyebrow" note={<>The one eyebrow: the <code>eyebrow</code> utility (12px, 600, uppercase, 0.05em, muted).</>}>
        <Eyebrow as="p">Step 2 of 6</Eyebrow>
      </Section>
    </>
  ),
}

function Bar({ label, className }: { label: string; className: string }) {
  const [ref, value] = useComputed("width")
  return (
    <div className="flex items-center gap-4">
      <span className="w-14 shrink-0 text-xs font-semibold text-card-foreground">{label}</span>
      <div ref={ref} className={cn("h-3 rounded-sm bg-primary", className)} />
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  )
}

function DensityStack({ step, label }: { step: string; label: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-card-foreground">{label}</p>
      <div className={cn("flex w-40 flex-col", step)}>
        {["One", "Two", "Three"].map((name) => (
          <div key={name} className="h-8 rounded-md border bg-card" />
        ))}
      </div>
    </div>
  )
}

export const Spacing: Story = {
  render: () => (
    <Section title="Spacing" note="The label is the step. One step is 4px (--spacing: 0.25rem). The length beside the bar is what that step resolves to.">
      <div className="flex flex-col gap-3">
        <Bar label="1" className="w-1" />
        <Bar label="2" className="w-2" />
        <Bar label="3" className="w-3" />
        <Bar label="4" className="w-4" />
        <Bar label="6" className="w-6" />
        <Bar label="8" className="w-8" />
        <Bar label="12" className="w-12" />
      </div>
      <h3 className="mt-8 mb-1 text-base font-semibold text-foreground-strong">Density</h3>
      <p className="mb-4 max-w-prose text-sm text-muted-foreground">
        Density is which step sits between rows. The words are compact, default, and roomy. A component says the word. This scale says the step. Roomy is one step looser than that component’s default, and compact is one step tighter. A few pixels between two sizes is not a density.
      </p>
      <div className="flex gap-10">
        <DensityStack step="gap-6" label="default · step 6" />
        <DensityStack step="gap-8" label="roomy · step 8" />
      </div>
    </Section>
  ),
}

function RadiusBox({ label, className }: { label: string; className: string }) {
  const [ref, value] = useComputed("borderRadius")
  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} className={cn("size-20 border bg-muted", className)} />
      <span className="text-xs font-semibold text-card-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  )
}

export const Radius: Story = {
  render: () => (
    <Section title="Radius" note="--radius 12px: sm 8 · md 10 · lg 12 · xl 16 · full.">
      <div className="flex flex-wrap gap-8">
        <RadiusBox label="rounded-sm" className="rounded-sm" />
        <RadiusBox label="rounded-md" className="rounded-md" />
        <RadiusBox label="rounded-lg" className="rounded-lg" />
        <RadiusBox label="rounded-xl" className="rounded-xl" />
        <RadiusBox label="rounded-full" className="rounded-full" />
      </div>
    </Section>
  ),
}

function ShadowBox({ label, className }: { label: string; className: string }) {
  const [ref, value] = useComputed("boxShadow")
  return (
    <div className="flex w-56 flex-col gap-2">
      <div ref={ref} className={cn("h-24 rounded-lg bg-card", className)} />
      <span className="text-xs font-semibold text-card-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  )
}

export const Shadows: Story = {
  render: () => (
    <Section
      title="Shadows"
      note="Three shadows: card (interactive surfaces at rest), lift (R1-03: a surface that would otherwise blend into the background), pop (hover, menus). Static surfaces are flat. Upstream's names alias them (R2-18): shadow-xs and shadow-sm are card, shadow-md and shadow-lg are pop, so shadcn bases cast real shadows unedited."
    >
      <div className="flex flex-wrap gap-10 rounded-lg bg-muted p-8">
        <ShadowBox label="shadow-card" className="shadow-card" />
        <ShadowBox label="shadow-lift" className="shadow-lift" />
        <ShadowBox label="shadow-pop" className="shadow-pop" />
      </div>
      <p className="mt-6 mb-3 text-sm text-muted-foreground">Upstream aliases (shadcn bases use these names):</p>
      <div className="flex flex-wrap gap-10 rounded-lg border p-8">
        <ShadowBox label="shadow-xs = card" className="shadow-xs" />
        <ShadowBox label="shadow-sm = card" className="shadow-sm" />
        <ShadowBox label="shadow-md = pop" className="shadow-md" />
        <ShadowBox label="shadow-lg = pop" className="shadow-lg" />
      </div>
      <p className="mt-6 mb-3 text-sm text-muted-foreground">On white, where lift earns its place:</p>
      <div className="flex flex-wrap gap-10 rounded-lg border p-8">
        <ShadowBox label="shadow-card" className="shadow-card" />
        <ShadowBox label="shadow-lift" className="shadow-lift" />
        <ShadowBox label="shadow-pop" className="shadow-pop" />
      </div>
    </Section>
  ),
}

