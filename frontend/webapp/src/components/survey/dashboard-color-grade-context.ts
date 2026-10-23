import { createContext } from "react"

import type {
  ColorLayout,
  ColorSection,
  ColorSeries,
  PaintedSeries,
} from "@/lib/dashboard-color-grade"

export type DashboardColorGradeValue = {
  sections: ColorSection[]
  layout: ColorLayout
  catalog: ColorSeries[]
  paint: (key: string) => PaintedSeries
  setLayout: (layout: ColorLayout) => void
  setSectionEnabled: (id: string, enabled: boolean) => void
  setSectionColor: (id: string, color: string) => void
  setSectionLabel: (id: string, label: string) => void
  setAllEnabled: (enabled: boolean) => void
  assign: (seriesKey: string, sectionId: string) => void
  assignMany: (seriesKeys: string[], sectionId: string) => void
  addSection: () => void
  removeSection: (id: string) => void
  reset: () => void
}

export const DashboardColorGradeContext =
  createContext<DashboardColorGradeValue | null>(null)
