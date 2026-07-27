import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createSettlement,
  createVillage,
  deleteSettlement,
  deleteVillage,
  listSettlements,
  listTehsils,
  listVillages,
  updateSettlement,
  updateVillage,
} from "@/modules/api/tehsils-api"
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

export function useCreateVillageMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { tehsilId: string; name: string }) =>
      createVillage(token!, params.tehsilId, params.name),
    onSuccess: async (_data, params) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.tehsils.villages(params.tehsilId) }),
        qc.invalidateQueries({ queryKey: queryKeys.tehsils.list() }),
      ])
    },
  })
}

export function useUpdateVillageMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; tehsilId: string; name: string }) =>
      updateVillage(token!, params.id, params.name),
    onSuccess: async (_data, params) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.tehsils.villages(params.tehsilId),
      })
    },
  })
}

export function useDeleteVillageMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; tehsilId: string }) =>
      deleteVillage(token!, params.id),
    onSuccess: async (_data, params) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.tehsils.villages(params.tehsilId) }),
        qc.invalidateQueries({ queryKey: queryKeys.tehsils.list() }),
      ])
    },
  })
}

export function useCreateSettlementMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { villageId: string; tehsilId: string; name: string }) =>
      createSettlement(token!, params.villageId, params.name),
    onSuccess: async (_data, params) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: queryKeys.tehsils.settlements(params.villageId),
        }),
        qc.invalidateQueries({
          queryKey: queryKeys.tehsils.villages(params.tehsilId),
        }),
      ])
    },
  })
}

export function useUpdateSettlementMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; villageId: string; name: string }) =>
      updateSettlement(token!, params.id, params.name),
    onSuccess: async (_data, params) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.tehsils.settlements(params.villageId),
      })
    },
  })
}

export function useDeleteSettlementMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; villageId: string; tehsilId: string }) =>
      deleteSettlement(token!, params.id),
    onSuccess: async (_data, params) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: queryKeys.tehsils.settlements(params.villageId),
        }),
        qc.invalidateQueries({
          queryKey: queryKeys.tehsils.villages(params.tehsilId),
        }),
      ])
    },
  })
}
