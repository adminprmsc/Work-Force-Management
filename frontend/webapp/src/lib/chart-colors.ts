/** Theme-aligned series colors — use `var(--chart-N)` directly (oklch in CSS). */
export const CHART_SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

export function chartSeriesColor(index: number): string {
  return CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]!
}

/** Accent tints for demographic section headers and KPI chips. */
export const DEMOGRAPHIC_ACCENTS = {
  tehsil: {
    border: "border-l-[var(--chart-1)]",
    chip: "bg-[color-mix(in_oklch,var(--chart-1)_12%,transparent)] text-[var(--chart-1)]",
    icon: "text-[var(--chart-1)]",
  },
  village: {
    border: "border-l-[var(--chart-3)]",
    chip: "bg-[color-mix(in_oklch,var(--chart-3)_12%,transparent)] text-[var(--chart-3)]",
    icon: "text-[var(--chart-3)]",
  },
} as const
