import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { listSettlements, listTehsils, listVillages } from "@/modules/api/tehsils-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuthToken } from "@/hooks/use-auth-token"

export function useTehsilsQuery() {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.tehsils.list(),
    queryFn: () => listTehsils(token!),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  })
}

export function useVillagesQuery(tehsilId: string | null) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.tehsils.villages(tehsilId ?? ""),
    queryFn: () => listVillages(token!, tehsilId!),
    enabled: Boolean(token && tehsilId),
    placeholderData: keepPreviousData,
  })
}

export function useSettlementsQuery(villageId: string | null) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.tehsils.settlements(villageId ?? ""),
    queryFn: () => listSettlements(token!, villageId!),
    enabled: Boolean(token && villageId),
    placeholderData: keepPreviousData,
  })
}
