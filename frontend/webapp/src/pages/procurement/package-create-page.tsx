import { Navigate } from "react-router-dom"

import { ProcurementPackageCreatePanel } from "@/components/procurement/procurement-package-create-panel"
import { canManageProcurement } from "@/lib/procurement-access"
import { useAuth } from "@/modules/auth/use-auth"

export function ProcurementPackageCreatePage() {
  const { user } = useAuth()

  if (!user || !canManageProcurement(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <ProcurementPackageCreatePanel role={user.role} />
}
