import type { ReactNode, SVGProps } from "react"

/* The nine Life Area glyphs: a hand-drawn Paige set (prototype src/components/Icons.tsx:9-17),
   not lucide. Stroke-only, 24px grid, currentColor; sized by the parent. */

export type AreaId =
  | "personal"
  | "family"
  | "household"
  | "money"
  | "assets"
  | "health"
  | "insurance"
  | "estate"
  | "final"

export const AREA_ORDER: readonly AreaId[] = [
  "personal",
  "family",
  "household",
  "money",
  "assets",
  "health",
  "insurance",
  "estate",
  "final",
]

type P = SVGProps<SVGSVGElement>

const base = (p: P): P => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.85,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
})

const paths: Record<AreaId, ReactNode> = {
  personal: (<><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" /></>),
  family: (<><circle cx="8" cy="7.5" r="2.9" /><circle cx="16.6" cy="9" r="2.3" /><path d="M2.6 19c0-3 2.4-5 5.4-5s5.4 2 5.4 5" /><path d="M15 14.2c2.6.2 4.4 2 4.4 4.8" /></>),
  household: (<><path d="M3.5 10.5L12 4l8.5 6.5" /><path d="M5.8 9.7V20h12.4V9.7" /><path d="M9.6 20v-5.2h4.8V20" /></>),
  money: (<><rect x="2.8" y="6" width="18.4" height="12" rx="2.4" /><circle cx="12" cy="12" r="2.6" /><path d="M6.2 12h.01M17.8 12h.01" /></>),
  assets: (<><path d="M4 20h16" /><path d="M5.5 20v-8.5M18.5 20v-8.5" /><path d="M3 11.5L12 4.5l9 7" /><path d="M9.6 20v-5h4.8v5" /></>),
  health: (<><path d="M20 8.6c0-2.5-2-4.5-4.5-4.5-1.6 0-3 .9-3.5 2-.5-1.1-1.9-2-3.5-2C6 4.1 4 6.1 4 8.6c0 5 8 11 8 11s8-6 8-11z" /><path d="M12 9.2v4.4M9.8 11.4h4.4" /></>),
  insurance: (<><path d="M12 3.2l7.2 2.6v5.4c0 4.5-3 8.1-7.2 9.1-4.2-1-7.2-4.6-7.2-9.1V5.8L12 3.2z" /><path d="M9 12.1l2.1 2.1 4-4.2" /></>),
  estate: (<><path d="M7 3.2h6.6L18 7.7V20.8H7z" /><path d="M13.4 3.2v4.5H18" /><path d="M9.6 12.2h5.2M9.6 15.4h5.2M9.6 18h2.6" /></>),
  final: (<><path d="M12 20.8c4.4-2.5 6.9-6 6.9-9.9a3.9 3.9 0 0 0-6.9-2.5 3.9 3.9 0 0 0-6.9 2.5c0 3.9 2.5 7.4 6.9 9.9z" /><path d="M12 3.4v2.6" /></>),
}

export function AreaGlyph({ area, ...props }: { area: AreaId } & P) {
  return <svg {...base(props)}>{paths[area]}</svg>
}
