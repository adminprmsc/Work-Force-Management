import { Navigate } from "react-router-dom"

import { SurveyResponsesPanel } from "@/components/survey/survey-responses-panel"
import { canReadSurveyResponses } from "@/lib/survey"
import { Role, roleToDashboardPath } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"

export function SurveyResponsesPage() {
  const { user } = useAuth()

  if (!user || !canReadSurveyResponses(user.role)) {
    return <Navigate to={roleToDashboardPath(user?.role ?? Role.RA_ES_TEHSIL)} replace />
  }

  return <SurveyResponsesPanel />
}
