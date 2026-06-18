import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { OfficeType } from "@/modules/api/types"
import { listOffices } from "@/modules/api/offices-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuthToken } from "@/hooks/use-auth-token"

export function useOfficesQuery(type?: OfficeType) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.offices.list(type),
    queryFn: () => listOffices(token!, type),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  })
}
