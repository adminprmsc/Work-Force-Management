import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CreateUserInput, UpdateUserInput } from "@/modules/api/users-api"
import { createUser, deleteUser, listUsers, updateUser, updateUserStatus } from "@/modules/api/users-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuthToken } from "@/hooks/use-auth-token"

export function useUsersQuery() {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => listUsers(token!),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUserMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(token!, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.users.all })
      await qc.invalidateQueries({ queryKey: queryKeys.audit.list({ page: 1, limit: 20 }) })
    },
  })
}

export function useUpdateUserMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { userId: string; input: UpdateUserInput }) =>
      updateUser(token!, params.userId, params.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.users.all })
      await qc.invalidateQueries({ queryKey: queryKeys.audit.list({ page: 1, limit: 20 }) })
    },
  })
}

export function useUpdateUserStatusMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { userId: string; active: boolean }) =>
      updateUserStatus(token!, params.userId, params.active),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.users.all })
      await qc.invalidateQueries({ queryKey: queryKeys.audit.list({ page: 1, limit: 20 }) })
    },
  })
}

export function useDeleteUserMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deleteUser(token!, userId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.users.all })
      await qc.invalidateQueries({ queryKey: queryKeys.audit.list({ page: 1, limit: 20 }) })
    },
  })
}

