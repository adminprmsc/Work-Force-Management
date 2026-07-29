import { Navigate } from "react-router-dom"

import { SeniorManagerUsersPanel } from "@/components/dashboard/senior-manager-users-panel"
import { isUserAdmin } from "@/lib/user-management"
import { roleToDashboardPath } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"

export function UsersPage() {
  const auth = useAuth()

  if (auth.status !== "authenticated" || !auth.user) {
    return null
  }

  if (!isUserAdmin(auth.user)) {
    return <Navigate to={roleToDashboardPath(auth.user.role)} replace />
  }

  return <SeniorManagerUsersPanel />
}
