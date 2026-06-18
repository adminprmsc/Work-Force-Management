import { useMemo } from "react"

import { OfficesTableCard } from "@/components/dashboard/dashboard-tables"
import { useOfficesQuery } from "@/hooks/api"
import { getQueryViewState } from "@/lib/query-view-state"
import type { Office } from "@/modules/api/types"

export function OfficesPage() {
  const officesQuery = useOfficesQuery()
  const officesView = useMemo(
    () => getQueryViewState<Office[]>(officesQuery),
    [officesQuery],
  )

  return (
    <OfficesTableCard
      offices={officesView.data}
      error={officesView.error}
      isInitialLoading={officesView.isInitialLoading}
      isRefreshing={officesView.isRefreshing}
    />
  )
}
