import { fieldIsPresentational } from "@/lib/survey"
import type { SurveyField } from "@/modules/api/survey-types"

/** Render a stored answer value as readable text for a given field. */
export function formatAnswerValue(field: SurveyField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"

  const options = field.config?.options ?? []
  const labelFor = (optionValue: string) =>
    options.find((o) => o.value === optionValue)?.label ?? optionValue

  switch (field.type) {
    case "CHECKBOXES":
      return Array.isArray(value)
        ? (value as string[]).map(labelFor).join(", ") || "—"
        : "—"
    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return labelFor(String(value))
    case "FILE":
    case "IMAGE": {
      const file = value as { url?: string; name?: string }
      return file.name || file.url || "—"
    }
    default:
      return String(value)
  }
}

export function answerableFields(fields: SurveyField[]): SurveyField[] {
  return fields.filter((field) => !fieldIsPresentational(field.type))
}
