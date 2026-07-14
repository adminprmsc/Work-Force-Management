import { useMutation, useQuery } from "@tanstack/react-query"

import { useAuthToken } from "@/hooks/use-auth-token"
import { queryKeys } from "@/lib/query-keys"
import {
  getSurveyAttachmentUrl,
  uploadSurveyAttachment,
} from "@/modules/api/storage-api"
import type { UploadSurveyAttachmentInput } from "@/modules/api/storage-types"

export function useUploadSurveyAttachmentMutation() {
  const token = useAuthToken()

  return useMutation({
    mutationFn: ({
      input,
      file,
    }: {
      input: UploadSurveyAttachmentInput
      file: File
    }) => uploadSurveyAttachment(token!, input, file),
  })
}

export function useSurveyAttachmentUrlQuery(
  attachmentId: string | null | undefined,
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.storage.attachmentUrl(attachmentId ?? ""),
    queryFn: () => getSurveyAttachmentUrl(token!, attachmentId!),
    enabled: Boolean(token && attachmentId) && enabled,
    staleTime: 45 * 60 * 1000,
  })
}
