import { fieldHasOptions } from "@/lib/survey"
import type {
  SurveyFieldType,
  SurveyFormBaselineField,
  SurveyFormBaselineFieldInput,
} from "@/modules/api/survey-types"

export type BaselineFieldDraft = {
  key: string
  fieldId?: string
  type: SurveyFieldType
  label: string
  helpText: string
  required: boolean
  writeOnce: boolean
  options: { key: string; label: string }[]
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function baselineDraftFromField(
  field: SurveyFormBaselineField,
): BaselineFieldDraft {
  return {
    key: field.id,
    fieldId: field.id,
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? "",
    required: field.required,
    writeOnce: field.writeOnce,
    options: (field.config?.options ?? []).map((option) => ({
      key: uid(),
      label: option.label,
    })),
  }
}

export function emptyBaselineDraft(type: SurveyFieldType): BaselineFieldDraft {
  return {
    key: uid(),
    type,
    label: "",
    helpText: "",
    required: true,
    writeOnce: false,
    options: fieldHasOptions(type)
      ? [
          { key: uid(), label: "Yes" },
          { key: uid(), label: "No" },
        ]
      : [],
  }
}

export function baselineDraftToInput(
  draft: BaselineFieldDraft,
  index: number,
): SurveyFormBaselineFieldInput {
  let config: SurveyFormBaselineFieldInput["config"] = null
  if (fieldHasOptions(draft.type)) {
    config = {
      options: draft.options
        .map((o) => o.label.trim())
        .filter(Boolean)
        .map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "_"), label })),
    }
  }

  return {
    ...(draft.fieldId ? { id: draft.fieldId } : {}),
    type: draft.type,
    label: draft.label.trim(),
    helpText: draft.helpText.trim() || null,
    required: draft.required,
    writeOnce: draft.writeOnce,
    order: index,
    config,
  }
}
