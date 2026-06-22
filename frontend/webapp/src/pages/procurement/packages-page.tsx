import { ProcurementPackagesPanel } from "@/components/procurement/procurement-packages-panel"
import {
  canManagePackageCompliance,
  canManageProcurement,
} from "@/lib/procurement-access"
import { useAuth } from "@/modules/auth/use-auth"

export function ProcurementPackagesPage() {
  const { user } = useAuth()
  const canManage = user ? canManageProcurement(user.role) : false
  const canEditCompliance = user ? canManagePackageCompliance(user.role) : false

  return (
    <ProcurementPackagesPanel
      canManage={canManage}
      canEditCompliance={canEditCompliance}
    />
  )
}
