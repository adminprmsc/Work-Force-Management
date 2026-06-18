import { Navigate } from "react-router-dom"
import { useAuth } from "@/modules/auth/use-auth"
import { roleToDashboardPath } from "@/modules/auth/roles"

export function DashboardRouter() {
  const auth = useAuth()

  if (auth.status !== "authenticated") return <Navigate to="/login" replace />

  return <Navigate to={roleToDashboardPath(auth.user.role)} replace />
}

