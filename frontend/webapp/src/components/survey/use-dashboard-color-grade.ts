import { useContext } from "react"

import { DashboardColorGradeContext } from "@/components/survey/dashboard-color-grade-context"

export function useDashboardColorGrade() {
  const value = useContext(DashboardColorGradeContext)
  if (!value) {
    throw new Error("useDashboardColorGrade must be used within DashboardColorGradeProvider")
  }
  return value
}
