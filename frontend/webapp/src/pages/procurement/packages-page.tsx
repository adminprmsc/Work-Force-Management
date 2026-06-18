import { ProcurementPackagesPanel } from "@/components/procurement/procurement-packages-panel"
import { canManageProcurement } from "@/lib/procurement-access"
import { useAuth } from "@/modules/auth/use-auth"

export function ProcurementPackagesPage() {
  const { user } = useAuth()
  const canManage = user ? canManageProcurement(user.role) : false

  return <ProcurementPackagesPanel canManage={canManage} />
}
