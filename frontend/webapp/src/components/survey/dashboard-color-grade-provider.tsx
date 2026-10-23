import { useCallback, useMemo, useState, type ReactNode } from "react"

import { DashboardColorGradeContext } from "@/components/survey/dashboard-color-grade-context"
import {
  canRemoveColorSection,
  clearColorGrade,
  defaultColorGradeState,
  loadColorGrade,
  materializeAssignments,
  nextColorSection,
  paintSeries,
  persistColorGrade,
  type ColorGradeState,
  type ColorLayout,
  type ColorSeries,
} from "@/lib/dashboard-color-grade"

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

type DashboardColorGradeProviderProps = {
  formId: string
  catalog: ColorSeries[]
  children: ReactNode
}

export function DashboardColorGradeProvider({
  formId,
  catalog,
  children,
}: DashboardColorGradeProviderProps) {
  return (
    <ColorGradeState formId={formId} catalog={catalog} key={formId}>
      {children}
    </ColorGradeState>
  )
}

function ColorGradeState({
  formId,
  catalog,
  children,
}: DashboardColorGradeProviderProps) {
  const [stored, setStored] = useState<ColorGradeState>(() => loadColorGrade(formId))

  const update = useCallback(
    (recipe: (prev: ColorGradeState) => ColorGradeState) => {
      const base = materializeAssignments(stored, catalog)
      const next = recipe(base)
      if (next === stored) return
      persistColorGrade(formId, next)
      setStored(next)
    },
    [catalog, formId, stored],
  )

  const paint = useCallback(
    (key: string) => paintSeries(stored, catalog, key),
    [catalog, stored],
  )

  const value = useMemo(
    () => ({
      sections: stored.sections,
      layout: stored.layout,
      catalog,
      paint,
      setLayout: (layout: ColorLayout) =>
        update((prev) => (prev.layout === layout ? prev : { ...prev, layout })),
      setSectionEnabled: (id: string, enabled: boolean) =>
        update((prev) => ({
          ...prev,
          sections: prev.sections.map((section) =>
            section.id === id ? { ...section, enabled } : section,
          ),
        })),
      setSectionColor: (id: string, color: string) => {
        if (!HEX_COLOR.test(color)) return
        update((prev) => ({
          ...prev,
          sections: prev.sections.map((section) =>
            section.id === id ? { ...section, color } : section,
          ),
        }))
      },
      setSectionLabel: (id: string, label: string) =>
        update((prev) => ({
          ...prev,
          sections: prev.sections.map((section) =>
            section.id === id ? { ...section, label: label.slice(0, 24) } : section,
          ),
        })),
      setAllEnabled: (enabled: boolean) =>
        update((prev) => ({
          ...prev,
          sections: prev.sections.map((section) => ({ ...section, enabled })),
        })),
      assign: (seriesKey: string, sectionId: string) =>
        update((prev) => {
          if (!prev.sections.some((section) => section.id === sectionId)) return prev
          if (prev.assignments[seriesKey] === sectionId) return prev
          return {
            ...prev,
            assignments: { ...prev.assignments, [seriesKey]: sectionId },
          }
        }),
      assignMany: (seriesKeys: string[], sectionId: string) =>
        update((prev) => {
          if (!prev.sections.some((section) => section.id === sectionId)) return prev
          const assignments = { ...prev.assignments }
          let changed = false
          for (const key of seriesKeys) {
            if (assignments[key] !== sectionId) {
              assignments[key] = sectionId
              changed = true
            }
          }
          if (!changed) return prev
          return { ...prev, assignments }
        }),
      addSection: () =>
        update((prev) => {
          const section = nextColorSection(prev.sections)
          if (!section) return prev
          return { ...prev, sections: [...prev.sections, section] }
        }),
      removeSection: (id: string) =>
        update((prev) => {
          if (!canRemoveColorSection(prev.sections)) return prev
          const sections = prev.sections.filter((section) => section.id !== id)
          const fallback = sections[0]?.id
          if (!fallback) return prev
          const assignments = { ...prev.assignments }
          for (const [key, sectionId] of Object.entries(assignments)) {
            if (sectionId === id) assignments[key] = fallback
          }
          return { ...prev, sections, assignments }
        }),
      reset: () => {
        clearColorGrade(formId)
        setStored(defaultColorGradeState())
      },
    }),
    [catalog, formId, paint, stored, update],
  )

  return (
    <DashboardColorGradeContext.Provider value={value}>
      {children}
    </DashboardColorGradeContext.Provider>
  )
}
