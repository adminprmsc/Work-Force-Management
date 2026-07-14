import { ImageIcon, Loader2, Paperclip, Upload, X } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUploadSurveyAttachmentMutation } from "@/hooks/api/storage-hooks"
import {
  isSurveyAttachmentValue,
  type SurveyAttachmentUploadContext,
} from "@/lib/survey-attachment"
import type { SurveyField } from "@/modules/api/survey-types"
import type { SurveyAttachmentFileValue } from "@/modules/api/storage-types"

type SurveyAttachmentFieldProps = {
  field: SurveyField
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  uploadContext?: SurveyAttachmentUploadContext
}

function acceptAttribute(field: SurveyField): string | undefined {
  const accept = field.config?.accept?.trim()
  if (accept) return accept
  return field.type === "IMAGE" ? "image/*" : undefined
}

export function SurveyAttachmentField({
  field,
  value,
  onChange,
  disabled,
  uploadContext,
}: SurveyAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadSurveyAttachmentMutation()
  const fileValue = isSurveyAttachmentValue(value) ? value : null
  const canUpload = Boolean(uploadContext?.formId) && !disabled

  const handleFile = async (file: File | undefined) => {
    if (!file || !uploadContext) return

    try {
      const result = await uploadMutation.mutateAsync({
        input: {
          formId: uploadContext.formId,
          fieldId: field.id,
          assignmentId: uploadContext.assignmentId,
          responseId: uploadContext.responseId ?? undefined,
        },
        file,
      })

      const next: SurveyAttachmentFileValue = {
        attachmentId: result.id,
        url: result.url,
        name: result.name,
        mimeType: result.mimeType,
        size: result.size,
        storagePath: result.storagePath,
      }
      onChange(next)
      toast.success("File uploaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="grid gap-2">
      {fileValue ? (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
          {field.type === "IMAGE" ? (
            <img
              src={fileValue.url}
              alt={fileValue.name}
              className="h-20 w-20 rounded-md border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-background">
              <Paperclip className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fileValue.name}</p>
            {fileValue.size ? (
              <p className="text-xs text-muted-foreground">
                {(fileValue.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
            <a
              href={fileValue.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              Open file
            </a>
          </div>
          {canUpload ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove file"
              onClick={() => onChange(null)}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {canUpload ? (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={acceptAttribute(field)}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : field.type === "IMAGE" ? (
              <ImageIcon className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            {fileValue ? "Replace file" : field.type === "IMAGE" ? "Upload image" : "Upload file"}
          </Button>
          {field.config?.maxSizeMb ? (
            <p className="text-xs text-muted-foreground">
              Max size {field.config.maxSizeMb} MB
            </p>
          ) : null}
        </>
      ) : (
        <div className="grid gap-2">
          <Input
            placeholder="File URL"
            disabled={disabled}
            value={fileValue?.url ?? ""}
            onChange={(e) =>
              onChange({
                attachmentId: fileValue?.attachmentId ?? "",
                url: e.target.value,
                name: fileValue?.name ?? e.target.value,
              })
            }
          />
          <Input
            placeholder="File name (optional)"
            disabled={disabled}
            value={fileValue?.name ?? ""}
            onChange={(e) =>
              onChange({
                attachmentId: fileValue?.attachmentId ?? "",
                url: fileValue?.url ?? "",
                name: e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  )
}
