export type ImpactTone = "positive" | "neutral" | "warning" | "negative"

export const IMPACT_COLOR_VARS: Record<ImpactTone, string> = {
  positive: "var(--impact-positive)",
  neutral: "var(--impact-neutral)",
  warning: "var(--impact-warning)",
  negative: "var(--impact-negative)",
}

export const IMPACT_LABELS: Record<ImpactTone, string> = {
  positive: "Favourable",
  neutral: "Moderate",
  warning: "Attention",
  negative: "Unfavourable",
}

export const IMPACT_CHIP_CLASSES: Record<ImpactTone, string> = {
  positive:
    "bg-[color-mix(in_oklch,var(--impact-positive)_14%,transparent)] text-[var(--impact-positive)]",
  neutral:
    "bg-[color-mix(in_oklch,var(--impact-neutral)_14%,transparent)] text-[var(--impact-neutral)]",
  warning:
    "bg-[color-mix(in_oklch,var(--impact-warning)_16%,transparent)] text-[var(--impact-warning)]",
  negative:
    "bg-[color-mix(in_oklch,var(--impact-negative)_14%,transparent)] text-[var(--impact-negative)]",
}

export function impactColor(tone: ImpactTone): string {
  return IMPACT_COLOR_VARS[tone]
}

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace("oftenly", "often")
}

function findScaleIndex(label: string, scale: string[]): number {
  const normalized = normalizeLabel(label)
  return scale.findIndex(
    (entry) => normalized.includes(entry) || entry.includes(normalized),
  )
}

function toneFromRatio(ratio: number): ImpactTone {
  if (ratio >= 0.8) return "positive"
  if (ratio >= 0.55) return "neutral"
  if (ratio >= 0.3) return "warning"
  return "negative"
}

function toneFromOrderedLabel(
  label: string,
  scale: string[],
  invert = false,
): ImpactTone {
  const index = findScaleIndex(label, scale)
  if (index < 0) return "neutral"
  const ratio = index / Math.max(scale.length - 1, 1)
  return toneFromRatio(invert ? 1 - ratio : ratio)
}

/** How compliance / environmental field answers should be coloured. */
export type ComplianceImpactKind =
  | "ppe-wearing"
  | "yes-no"
  | "noise-severity"
  | "dust-severity"
  | "mitigation-frequency"
  | "rating"

const PPE_WEARING_SCALE = ["none", "some", "many", "most", "everyone"]
const DUST_LEVEL_SCALE = [
  "no dust",
  "low dust",
  "medium dust",
  "high dust",
  "extreme dust",
]
const NOISE_LEVEL_SCALE = [
  "faint",
  "moderate",
  "loud",
  "very loud",
  "extremely loud",
]
const FREQUENCY_SCALE = ["never", "rarely", "occasionally", "often", "always"]
const RATING_SCALE = ["poor", "below average", "average", "good", "excellent"]

export function impactToneForComplianceLabel(
  label: string,
  kind: ComplianceImpactKind,
): ImpactTone {
  const normalized = normalizeLabel(label)

  if (kind === "yes-no") {
    if (normalized === "yes") return "positive"
    if (normalized === "no") return "negative"
    return "neutral"
  }

  switch (kind) {
    case "ppe-wearing":
      return toneFromOrderedLabel(label, PPE_WEARING_SCALE)
    case "dust-severity":
      return toneFromOrderedLabel(label, DUST_LEVEL_SCALE, true)
    case "noise-severity":
      return toneFromOrderedLabel(label, NOISE_LEVEL_SCALE, true)
    case "mitigation-frequency":
      return toneFromOrderedLabel(label, FREQUENCY_SCALE)
    case "rating":
      return toneFromOrderedLabel(label, RATING_SCALE)
    default:
      return "neutral"
  }
}

export function impactColorForComplianceLabel(
  label: string,
  kind: ComplianceImpactKind,
): string {
  return impactColor(impactToneForComplianceLabel(label, kind))
}

/** Geographic share — low coverage is a monitoring gap (negative impact). */
export function impactToneForCoverageShare(sharePct: number): ImpactTone {
  if (sharePct >= 20) return "positive"
  if (sharePct >= 10) return "neutral"
  if (sharePct >= 5) return "warning"
  return "negative"
}

export function impactColorForCoverageShare(sharePct: number): string {
  return impactColor(impactToneForCoverageShare(sharePct))
}

export function impactBarGradient(color: string): string {
  return `linear-gradient(90deg, ${color}, color-mix(in oklch, ${color} 68%, white))`
}
