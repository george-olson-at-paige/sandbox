/* The colours a data mark draws in (R21-07…R21-09, R21-13): MeterBar's fill, RangeBar's parts,
   ShareBar's segments and Legend's swatches name one of these, so a bar and the legend beside
   it can't disagree. Each is a fill class over a theme role, never a raw colour:
   - brand: the brand blue (`--primary`), the main quantity ("Reached", "On to the next screen");
   - brand-subtle: the light blue (`--primary-subtle`), a spread or a secondary share ("Most
     people's time", "Same screen again");
   - brand-ink: the dark blue (`--info-foreground`), a marker on a brand fill (the median tick);
   - attention: the attention ink (`--attention`), the share that needs a look ("Left Setup");
   - neutral: the stronger neutral (`--border-strong`), a share that is neither ("Back a screen");
   - chart-1…chart-5: the categorical series colours, for a share bar of categories.
   Never told apart by colour alone: a Legend (or the bar's own text) names each one. Server-safe. */
export const DATA_COLORS = ["brand", "brand-subtle", "brand-ink", "attention", "neutral", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const
export type DataColor = (typeof DATA_COLORS)[number]

export const dataFill: Record<DataColor, string> = {
  brand: "bg-primary",
  "brand-subtle": "bg-primary-subtle",
  "brand-ink": "bg-info-foreground",
  attention: "bg-attention",
  neutral: "bg-border-strong",
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
}

/** A share of a whole as a CSS length, clamped to 0–100%: the one place a data value becomes a width. */
export function percentOf(value: number, whole: number): string {
  if (!(whole > 0) || !Number.isFinite(value)) return "0%"
  return `${Math.min(100, Math.max(0, (value / whole) * 100))}%`
}
