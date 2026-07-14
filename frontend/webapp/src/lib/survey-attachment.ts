import type { SurveyAttachmentFileValue } from "@/modules/api/storage-types"

export function isSurveyAttachmentValue(
  value: unknown,
): value is SurveyAttachmentFileValue {
  if (!value || typeof value !== "object") return false
  const file = value as SurveyAttachmentFileValue
  return (
    typeof file.attachmentId === "string" &&
    file.attachmentId.length > 0 &&
    typeof file.url === "string" &&
    file.url.length > 0
  )
}

export function attachmentDisplayName(value: unknown): string {
  if (!isSurveyAttachmentValue(value)) return "—"
  return value.name || value.url
}

export type SurveyAttachmentUploadContext = {
  formId: string
  assignmentId?: string
  responseId?: string | null
}
