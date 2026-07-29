import { Navigate, useParams } from "react-router-dom"

import { ProcurementPackageEditPanel } from "@/components/procurement/procurement-package-edit-panel"
import {
  canManageProcurement,
  procurementPackagesPath,
} from "@/lib/procurement-access"
import { useAuth } from "@/modules/auth/use-auth"

export function ProcurementPackageEditPage() {
  const { packageId } = useParams<{ packageId: string }>()
  const { user } = useAuth()

  if (!user || !canManageProcurement(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!packageId) {
    return <Navigate to={procurementPackagesPath(user.role)} replace />
  }

  return <ProcurementPackageEditPanel packageId={packageId} role={user.role} />
}
