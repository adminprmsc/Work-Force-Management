import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthToken } from "@/hooks/use-auth-token"
import { queryKeys } from "@/lib/query-keys"
import {
  getPublicLatestMobileApp,
  listMobileAppReleases,
  uploadMobileAppRelease,
} from "@/modules/api/mobile-app-api"
import type { UploadMobileAppReleaseInput } from "@/modules/api/mobile-app-types"

export function useMobileAppReleasesQuery(enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.mobileApp.releases(),
    queryFn: () => listMobileAppReleases(token!),
    enabled: Boolean(token) && enabled,
  })
}

export function usePublicLatestMobileAppQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.mobileApp.publicLatest(),
    queryFn: () => getPublicLatestMobileApp(),
    enabled,
    retry: false,
  })
}

export function useUploadMobileAppReleaseMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UploadMobileAppReleaseInput) =>
      uploadMobileAppRelease(token!, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.mobileApp.all })
    },
  })
}
