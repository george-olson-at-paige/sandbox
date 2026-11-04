import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

/* @archetype Chart (ARCHETYPES.md).
   Sparkline (R8-08): a trend at card size, drawn as inline SVG (no chart library, so a Stat never
   pulls Recharts into a page). Readable small: no axes, no grid, no labels; the line fills the
   width and a fixed height, and the last point is marked (a dot on the line, the solid bar among
   lighter ones) because "where are we now" is what a card is read for. A running period
   (`partialLast`) draws its last segment dashed and its dot hollow, or its bar as an outline, so a
   half-finished month doesn't read as a drop. Gaps (`null`) break the line.
   Accessible: one image with a text summary (`summary`, which Stat builds with
   lib/metrics.ts describeSeries: "Trending up, from 10 to 20; low 9, high 20."); `labels` adds a
   hover title per point. No data draws a dashed baseline and says so.
   Strokes don't scale with the width (`vector-effect`), and the dot is a zero-length round-capped
   line for the same reason: it stays round however wide the card is. Server-safe. */
/* The drawn height is the chart scale's spark steps (T-05, theme.css --spacing-spark-*); Stat's
   skeleton and no-data ghost read the same map (sparklineHeight), so they never restate it.
   HEIGHT is the viewBox's height in px and must match the token: the line's geometry (PAD, the
   dot) is computed in those units. Change the two together. */
const HEIGHT = { sm: 24, md: 32, lg: 48 } as const
const HEIGHT_CLASS = { sm: "h-spark-sm", md: "h-spark", lg: "h-spark-lg" } as const
const TONE = {
  brand: "text-chart-1",
  neutral: "text-muted-foreground",
  better: "text-success",
  worse: "text-attention",
} as const
const W = 100
const PAD = 3

/** A small trend line or bars for a card: no axes, the last point marked, a text summary for screen readers. */
function Sparkline({
  values,
  summary,
  variant = "line",
  tone = "brand",
  size = "md",
  partialLast = false,
  labels,
  className,
}: {
  /** The series, oldest first; null is a gap. */
  values: ReadonlyArray<number | null>
  /** What the trend says, for screen readers (the image's name). */
  summary: string
  /** line (default) for a level over time · bar for counts per period. */
  variant?: "line" | "bar"
  /** brand (default) · neutral · better · worse (match the Stat's delta tone, or leave brand). */
  tone?: keyof typeof TONE
  /** Height: sm 24 · md 32 (default) · lg 48. The width is the container's. */
  size?: keyof typeof HEIGHT
  /** The last period is still running: dashed last segment and hollow dot, or an outlined last bar. */
  partialLast?: boolean
  /** A hover title per point ("Mar 2026: 2,333"), same order as values. */
  labels?: ReadonlyArray<string>
  className?: string
}) {
  const H = HEIGHT[size]
  const known = values.filter((v): v is number => v !== null && Number.isFinite(v))
  const svg = cn("block w-full overflow-visible", HEIGHT_CLASS[size], TONE[tone], className)

  if (known.length === 0)
    return (
      <svg role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn(svg, "text-track")} data-slot="sparkline" data-empty="">
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
    )

  const lo = Math.min(...known, variant === "bar" ? 0 : Infinity)
  const hi = Math.max(...known)
  const span = hi - lo || 1
  const y = (v: number) => (hi === lo && variant === "line" ? H / 2 : PAD + (1 - (v - lo) / span) * (H - PAD * 2))
  const n = values.length
  const last = n - 1

  if (variant === "bar") {
    const slot = W / n
    const gap = Math.min(slot * 0.25, 2)
    const base = y(Math.max(lo, 0))
    return (
      <svg role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={svg} data-slot="sparkline" data-variant="bar">
        {values.map((v, i) => {
          if (v === null || !Number.isFinite(v)) return null
          const top = Math.min(y(v), base - 1)
          const isLast = i === last
          const outline = isLast && partialLast
          return (
            <rect
              key={i}
              x={i * slot + gap / 2}
              y={top}
              width={Math.max(slot - gap, 0.5)}
              height={Math.max(base - top, 1)}
              rx={0.5}
              fill={outline ? "none" : "currentColor"}
              stroke={outline ? "currentColor" : undefined}
              strokeWidth={outline ? 1 : undefined}
              strokeDasharray={outline ? "2 2" : undefined}
              vectorEffect="non-scaling-stroke"
              className={isLast ? undefined : "opacity-dim"}
            >
              {labels?.[i] && <title>{labels[i]}</title>}
            </rect>
          )
        })}
      </svg>
    )
  }

  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W)
  // Segments of consecutive known points (a null breaks the line).
  const segments: Array<Array<[number, number]>> = []
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) return void segments.push([])
    const seg = segments.at(-1)
    const p: [number, number] = [x(i), y(v)]
    if (seg && (i === 0 || values[i - 1] !== null)) seg.push(p)
    else segments.push([p])
  })
  const path = (pts: Array<[number, number]>) => pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(2)} ${py.toFixed(2)}`).join(" ")
  const lastKnown = values[last]
  const solid = segments.filter((s) => s.length > 0)
  // A running last period: the final segment dashed.
  let dashed: Array<[number, number]> | null = null
  if (partialLast && lastKnown !== null && solid.length) {
    const tail = solid[solid.length - 1]
    if (tail.length >= 2) {
      dashed = tail.slice(-2)
      solid[solid.length - 1] = tail.slice(0, -1)
    }
  }
  const area = solid.filter((s) => s.length > 1).map((s) => `${path(s)} L${s.at(-1)![0].toFixed(2)} ${H} L${s[0][0].toFixed(2)} ${H} Z`)

  return (
    <svg role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={svg} data-slot="sparkline" data-variant="line">
      {area.map((d, i) => (
        <path key={`a${i}`} d={d} className="fill-current/10" />
      ))}
      {solid.map((s, i) =>
        s.length > 1 ? (
          <path key={`l${i}`} d={path(s)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ) : null
      )}
      {dashed && <path d={path(dashed)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />}
      {labels &&
        values.map((v, i) =>
          v === null || !labels[i] ? null : (
            <line key={`t${i}`} x1={x(i)} y1={y(v)} x2={x(i)} y2={y(v)} stroke="transparent" strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke">
              <title>{labels[i]}</title>
            </line>
          )
        )}
      {lastKnown !== null && Number.isFinite(lastKnown) && (
        <>
          {/* The last point: a card-coloured halo, the dot, and (running period) a hollow centre. */}
          <line x1={x(last)} y1={y(lastKnown)} x2={x(last)} y2={y(lastKnown)} strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-card" />
          <line x1={x(last)} y1={y(lastKnown)} x2={x(last)} y2={y(lastKnown)} stroke="currentColor" strokeWidth={6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {partialLast && (
            <line x1={x(last)} y1={y(lastKnown)} x2={x(last)} y2={y(lastKnown)} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-card" />
          )}
        </>
      )}
    </svg>
  )
}

export { Sparkline, HEIGHT_CLASS as sparklineHeight }

/* Each component's props, for screens and adapters that build them (R13-02). */
export type SparklineProps = ComponentProps<typeof Sparkline>
