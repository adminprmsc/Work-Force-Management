import { Navigate } from "react-router-dom"

import { SurveyMyAssignmentsPanel } from "@/components/survey/survey-my-assignments-panel"
import { canFillSurveys } from "@/lib/survey"
import { Role, roleToDashboardPath } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"

export function MySurveysPage() {
  const { user } = useAuth()

  if (!user || !canFillSurveys(user.role)) {
    return <Navigate to={roleToDashboardPath(user?.role ?? Role.SENIOR_MANAGER_ES)} replace />
  }

  return <SurveyMyAssignmentsPanel />
}
