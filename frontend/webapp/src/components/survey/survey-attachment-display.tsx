import { ExternalLink, Loader2, Paperclip } from "lucide-react"

import { useSurveyAttachmentUrlQuery } from "@/hooks/api/storage-hooks"
import {
  attachmentDisplayName,
  isSurveyAttachmentValue,
} from "@/lib/survey-attachment"
import type { SurveyField } from "@/modules/api/survey-types"

type SurveyAttachmentDisplayProps = {
  field: SurveyField
  value: unknown
}

export function SurveyAttachmentDisplay({
  field,
  value,
}: SurveyAttachmentDisplayProps) {
  const attachment = isSurveyAttachmentValue(value) ? value : null
  const urlQuery = useSurveyAttachmentUrlQuery(
    attachment?.attachmentId,
    Boolean(attachment?.attachmentId),
  )

  if (!attachment) {
    return <span>{attachmentDisplayName(value)}</span>
  }

  const href = urlQuery.data?.url ?? attachment.url
  const loading = urlQuery.isLoading && !urlQuery.data

  if (field.type === "IMAGE") {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          {loading ? (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-muted/30">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <img
              src={href}
              alt={attachment.name}
              className="max-h-48 max-w-full rounded-lg border object-contain"
            />
          )}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          {attachment.name}
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Paperclip className="size-4" />
      )}
      {attachment.name}
      <ExternalLink className="size-3.5" />
    </a>
  )
}
