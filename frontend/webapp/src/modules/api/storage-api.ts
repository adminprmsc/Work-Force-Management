import { apiBaseUrl } from "@/lib/api-client"
import type {
  SurveyAttachmentUrlResult,
  UploadSurveyAttachmentInput,
  UploadSurveyAttachmentResult,
} from "./storage-types"

async function parseError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "")
  if (!text) return `Request failed (${res.status})`

  try {
    const json = JSON.parse(text) as { message?: string | string[] }
    if (json.message) {
      return Array.isArray(json.message) ? json.message.join(", ") : json.message
    }
  } catch {
    // fall through
  }

  return text
}

export function uploadSurveyAttachment(
  token: string,
  input: UploadSurveyAttachmentInput,
  file: File,
): Promise<UploadSurveyAttachmentResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("formId", input.formId)
  formData.append("fieldId", input.fieldId)
  if (input.assignmentId) formData.append("assignmentId", input.assignmentId)
  if (input.responseId) formData.append("responseId", input.responseId)

  return fetch(`${apiBaseUrl()}/storage/survey-attachments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  }).then(async (res) => {
    if (!res.ok) throw new Error(await parseError(res))
    return res.json() as Promise<UploadSurveyAttachmentResult>
  })
}

export function getSurveyAttachmentUrl(
  token: string,
  attachmentId: string,
): Promise<SurveyAttachmentUrlResult> {
  return fetch(`${apiBaseUrl()}/storage/survey-attachments/${attachmentId}/url`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (!res.ok) throw new Error(await parseError(res))
    return res.json() as Promise<SurveyAttachmentUrlResult>
  })
}
