import { Navigate } from "react-router-dom"

import { UserCreatePanel } from "@/components/dashboard/user-create-panel"
import { isUserAdmin } from "@/lib/user-management"
import { roleToDashboardPath } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"

export function UserCreatePage() {
  const auth = useAuth()

  if (auth.status !== "authenticated" || !auth.user) {
    return null
  }

  if (!isUserAdmin(auth.user)) {
    return <Navigate to={roleToDashboardPath(auth.user.role)} replace />
  }

  return <UserCreatePanel />
}
