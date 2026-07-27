import type { SurveyField, SurveyFieldVisibleWhen } from "@/modules/api/survey-types"

function asEqualsList(equals: string | string[]): string[] {
  return (Array.isArray(equals) ? equals : [equals])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

export function answerMatchesVisibleWhen(
  value: unknown,
  rule: SurveyFieldVisibleWhen,
): boolean {
  const expected = new Set(asEqualsList(rule.equals))
  if (expected.size === 0) return false

  if (typeof value === "string") return expected.has(value)
  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === "string" && expected.has(entry))
  }
  return false
}

/**
 * The answer key used for optional section toggles.
 * Keyed by the section field's own ID — value is "yes" or "no".
 */
export function sectionToggleKey(sectionFieldId: string): string {
  return `__section_toggle__${sectionFieldId}`
}

/**
 * Resolves which fields are visible given the current answers.
 *
 * - SECTION_BREAK with config.optional: visible when toggle answer is "yes"
 * - SECTION_BREAK with config.visibleWhen: visible when controlling field matches
 * - Other sections: always visible
 * - Non-section fields inherit their section's visibility
 * - Section break headers are always visible (so the toggle renders)
 */
export function resolveVisibleFieldIds(
  fields: SurveyField[],
  answers: Record<string, unknown>,
): Set<string> {
  const sorted = [...fields].sort((a, b) => a.order - b.order)
  const visible = new Set<string>()
  let sectionVisible = true

  for (const field of sorted) {
    if (field.type === "SECTION_BREAK") {
      const config = field.config

      if (config?.optional) {
        const toggleValue = answers[sectionToggleKey(field.id)]
        sectionVisible = toggleValue === "yes"
      } else if (config?.visibleWhen) {
        sectionVisible = answerMatchesVisibleWhen(
          answers[config.visibleWhen.fieldId],
          config.visibleWhen,
        )
      } else {
        sectionVisible = true
      }

      // Section header always visible so user can toggle
      visible.add(field.id)
      continue
    }

    if (sectionVisible) visible.add(field.id)
  }

  return visible
}

export function isChoiceControllerType(
  type: SurveyField["type"],
): boolean {
  return (
    type === "MULTIPLE_CHOICE" ||
    type === "DROPDOWN" ||
    type === "CHECKBOXES"
  )
}
