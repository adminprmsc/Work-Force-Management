import { SurveyFormsPanel } from "@/components/survey/survey-forms-panel"
import { canManageSurveys } from "@/lib/survey"
import { Role, roleToDashboardPath } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"
import { Navigate } from "react-router-dom"

export function SurveyFormsPage() {
  const { user } = useAuth()

  if (!user || !canManageSurveys(user.role)) {
    return <Navigate to={roleToDashboardPath(user?.role ?? Role.RA_ES_TEHSIL)} replace />
  }

  return <SurveyFormsPanel />
}
