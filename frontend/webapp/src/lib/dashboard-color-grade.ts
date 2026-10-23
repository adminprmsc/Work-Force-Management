import type { SurveyFormAnalytics } from "@/modules/api/survey-types"

/** A named color the user can turn on or off and assign demographic series to. */
export type ColorSection = {
  id: string
  label: string
  color: string
  enabled: boolean
}

export type ColorLayout = "combined" | "by-section"

export type ColorSeriesGroup = "tehsil" | "village" | "choice"

export type ColorSeries = {
  key: string
  group: ColorSeriesGroup
  /** Question label for choice answers. Tehsils and villages use a fixed group title. */
  groupLabel: string
  label: string
  detail?: string
  value: number
}

export type ColorGradeState = {
  sections: ColorSection[]
  /** series key -> section id. Missing keys use a stable default section. */
  assignments: Record<string, string>
  layout: ColorLayout
}

export type PaintedSeries = {
  sectionId: string
  sectionLabel: string
  color: string
  visible: boolean
}

const STORAGE_PREFIX = "wfm.form-dashboard.color-grade."
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const SECTION_ID = /^[a-zA-Z0-9-]{1,80}$/
const MAX_SECTIONS = 8
const MIN_SECTIONS = 2

const CHOICE_FIELD_TYPES = new Set(["CHECKBOXES", "MULTIPLE_CHOICE", "DROPDOWN"])

export const DEFAULT_COLOR_SECTIONS: readonly ColorSection[] = [
  { id: "navy", label: "Navy", color: "#1d4e89", enabled: true },
  { id: "teal", label: "Teal", color: "#0f766e", enabled: true },
  { id: "amber", label: "Amber", color: "#b45309", enabled: true },
  { id: "rose", label: "Rose", color: "#be123c", enabled: true },
  { id: "violet", label: "Violet", color: "#6d28d9", enabled: true },
  { id: "slate", label: "Slate", color: "#475569", enabled: true },
]

const SPARE_COLORS = ["#0369a1", "#047857", "#a16207", "#9f1239", "#7c3aed", "#0e7490"]

export function defaultColorGradeState(): ColorGradeState {
  return {
    sections: DEFAULT_COLOR_SECTIONS.map((section) => ({ ...section })),
    assignments: {},
    layout: "combined",
  }
}

export function tehsilSeriesKey(tehsilId: string) {
  return `tehsil:${tehsilId}`
}

export function villageSeriesKey(villageId: string) {
  return `village:${villageId}`
}

export function choiceSeriesKey(fieldId: string, answer: string) {
  return `choice:${fieldId}:${encodeURIComponent(answer)}`
}

export function buildColorSeriesCatalog(analytics: SurveyFormAnalytics): ColorSeries[] {
  const tehsils = [...analytics.byTehsil]
    .sort((a, b) => a.tehsilName.localeCompare(b.tehsilName))
    .map((row) => ({
      key: tehsilSeriesKey(row.tehsilId),
      group: "tehsil" as const,
      groupLabel: "Tehsils",
      label: row.tehsilName,
      value: row.accepted,
    }))

  const villages = [...analytics.byVillage]
    .sort(
      (a, b) =>
        a.villageName.localeCompare(b.villageName) ||
        a.tehsilName.localeCompare(b.tehsilName),
    )
    .map((row) => ({
      key: villageSeriesKey(row.villageId),
      group: "village" as const,
      groupLabel: "Villages",
      label: row.villageName,
      detail: row.tehsilName,
      value: row.accepted,
    }))

  const fields = analytics.fieldBreakdown
    .filter(
      (field) =>
        CHOICE_FIELD_TYPES.has(field.type) &&
        field.choiceCounts &&
        Object.keys(field.choiceCounts).length > 0,
    )
    .sort((a, b) => a.label.localeCompare(b.label))

  const choices: ColorSeries[] = []
  for (const field of fields) {
    const answers = Object.entries(field.choiceCounts ?? {}).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    for (const [answer, count] of answers) {
      choices.push({
        key: choiceSeriesKey(field.fieldId, answer),
        group: "choice",
        groupLabel: field.label,
        label: answer,
        value: count,
      })
    }
  }

  return [...tehsils, ...villages, ...choices]
}

export function resolveSection(
  state: ColorGradeState,
  catalog: ColorSeries[],
  key: string,
): ColorSection {
  const assigned = state.sections.find((section) => section.id === state.assignments[key])
  if (assigned) return assigned

  const item = catalog.find((series) => series.key === key)
  const peers = item ? catalog.filter((series) => series.group === item.group) : []
  const index = Math.max(
    0,
    peers.findIndex((series) => series.key === key),
  )
  const count = Math.max(state.sections.length, 1)
  return state.sections[index % count] ?? state.sections[0]!
}

export function paintSeries(
  state: ColorGradeState,
  catalog: ColorSeries[],
  key: string,
): PaintedSeries {
  const section = resolveSection(state, catalog, key)
  return {
    sectionId: section.id,
    sectionLabel: section.label.trim() || "Color",
    color: section.color,
    visible: section.enabled,
  }
}

/** Freeze current default colors so later catalog changes do not reshuffle them. */
export function materializeAssignments(
  state: ColorGradeState,
  catalog: ColorSeries[],
): ColorGradeState {
  let changed = false
  const assignments = { ...state.assignments }
  for (const item of catalog) {
    const resolved = resolveSection(state, catalog, item.key)
    if (assignments[item.key] !== resolved.id) {
      assignments[item.key] = resolved.id
      changed = true
    }
  }
  if (!changed) return state
  return { ...state, assignments }
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Keep a shared section color, but separate slices that use it on the same chart. */
export function distinguishFills<T extends { sectionId: string; color: string }>(
  items: T[],
): string[] {
  const totals = new Map<string, number>()
  for (const item of items) {
    totals.set(item.sectionId, (totals.get(item.sectionId) ?? 0) + 1)
  }
  const seen = new Map<string, number>()
  return items.map((item) => {
    const total = totals.get(item.sectionId) ?? 1
    const index = seen.get(item.sectionId) ?? 0
    seen.set(item.sectionId, index + 1)
    if (total <= 1) return item.color
    const step = 0.5 / Math.max(total - 1, 1)
    return hexToRgba(item.color, Math.max(0.4, 1 - index * step))
  })
}

export function canAddColorSection(sections: ColorSection[]) {
  return sections.length < MAX_SECTIONS
}

export function nextColorSection(sections: ColorSection[]): ColorSection | null {
  if (!canAddColorSection(sections)) return null
  const used = new Set(sections.map((section) => section.color.toLowerCase()))
  const color =
    SPARE_COLORS.find((candidate) => !used.has(candidate)) ??
    SPARE_COLORS[sections.length % SPARE_COLORS.length]!
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `color-${crypto.randomUUID()}`
      : `color-${Date.now()}`
  return {
    id,
    label: `Color ${sections.length + 1}`,
    color,
    enabled: true,
  }
}

export function canRemoveColorSection(sections: ColorSection[]) {
  return sections.length > MIN_SECTIONS
}

function isColorSection(value: unknown): value is ColorSection {
  if (!value || typeof value !== "object") return false
  const section = value as Partial<ColorSection>
  return (
    typeof section.id === "string" &&
    SECTION_ID.test(section.id) &&
    typeof section.label === "string" &&
    typeof section.color === "string" &&
    HEX_COLOR.test(section.color) &&
    typeof section.enabled === "boolean"
  )
}

export function sanitizeColorGrade(value: unknown): ColorGradeState {
  const fallback = defaultColorGradeState()
  if (!value || typeof value !== "object") return fallback
  const raw = value as Partial<ColorGradeState>
  const sections = Array.isArray(raw.sections)
    ? raw.sections.filter(isColorSection).slice(0, MAX_SECTIONS)
    : []
  if (sections.length < MIN_SECTIONS) return fallback

  const seen = new Set<string>()
  const unique = sections.filter((section) => {
    if (seen.has(section.id)) return false
    seen.add(section.id)
    return true
  })
  if (unique.length < MIN_SECTIONS) return fallback

  const assignments: Record<string, string> = {}
  if (raw.assignments && typeof raw.assignments === "object") {
    for (const [key, sectionId] of Object.entries(raw.assignments)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue
      if (typeof sectionId !== "string" || !seen.has(sectionId)) continue
      if (key.length > 400) continue
      assignments[key] = sectionId
    }
  }

  return {
    sections: unique.map((section) => ({
      ...section,
      label: section.label.trim().slice(0, 24) || "Color",
    })),
    assignments,
    layout: raw.layout === "by-section" ? "by-section" : "combined",
  }
}

export function loadColorGrade(formId: string): ColorGradeState {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_PREFIX + formId)
    if (!raw) return defaultColorGradeState()
    return sanitizeColorGrade(JSON.parse(raw))
  } catch {
    return defaultColorGradeState()
  }
}

export function persistColorGrade(formId: string, state: ColorGradeState) {
  try {
    globalThis.localStorage?.setItem(STORAGE_PREFIX + formId, JSON.stringify(state))
  } catch {
    // Private mode or a full disk should not block the dashboard.
  }
}

export function clearColorGrade(formId: string) {
  try {
    globalThis.localStorage?.removeItem(STORAGE_PREFIX + formId)
  } catch {
    // Ignore storage failures.
  }
}
