import {
  CHOICE_FIELD_TYPES,
  SurveyField,
  SurveyFieldConfig,
  SurveyFieldType,
  SurveyFieldVisibleWhen,
} from '../../domain/entities/survey.entity';

function asEqualsList(equals: unknown): string[] {
  const values = Array.isArray(equals)
    ? equals
    : typeof equals === 'string'
      ? [equals]
      : [];
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/** Normalize raw config.visibleWhen; returns null when absent/invalid shape. */
export function normalizeVisibleWhen(
  raw: unknown,
): SurveyFieldVisibleWhen | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const fieldId =
    typeof record.fieldId === 'string' ? record.fieldId.trim() : '';
  if (!fieldId) return null;

  const equals = asEqualsList(record.equals);
  if (equals.length === 0) return null;

  return {
    fieldId,
    equals: equals.length === 1 ? equals[0] : equals,
  };
}

export function answerMatchesVisibleWhen(
  value: unknown,
  rule: SurveyFieldVisibleWhen,
): boolean {
  const expected = new Set(asEqualsList(rule.equals));
  if (expected.size === 0) return false;

  if (typeof value === 'string') {
    return expected.has(value);
  }
  if (Array.isArray(value)) {
    return value.some(
      (entry) => typeof entry === 'string' && expected.has(entry),
    );
  }
  return false;
}

function answerMapFrom(
  answers:
    | Map<string, unknown>
    | Record<string, unknown>
    | Array<{ fieldId: string; value: unknown }>,
): Map<string, unknown> {
  if (answers instanceof Map) return answers;
  if (Array.isArray(answers)) {
    return new Map(answers.map((answer) => [answer.fieldId, answer.value]));
  }
  return new Map(Object.entries(answers));
}

/**
 * The answer key used for optional section toggles.
 * Keyed by the section field's own ID — value is "yes" or "no".
 */
export function sectionToggleKey(sectionFieldId: string): string {
  return `__section_toggle__${sectionFieldId}`;
}

/**
 * Resolves which fields are visible given the current answers.
 *
 * Rules:
 * - SECTION_BREAK with `config.optional: true`:
 *   visible only when answers contain `sectionToggleKey(field.id) === "yes"`
 * - SECTION_BREAK with `config.visibleWhen`:
 *   visible only when the controlling field answer matches
 * - All other sections: always visible
 * - Non-section fields inherit their section's visibility
 */
export function resolveVisibleFieldIds(
  fields: SurveyField[],
  answers:
    | Map<string, unknown>
    | Record<string, unknown>
    | Array<{ fieldId: string; value: unknown }>,
): Set<string> {
  const answerByField = answerMapFrom(answers);
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const visible = new Set<string>();
  let sectionVisible = true;

  for (const field of sorted) {
    if (field.type === SurveyFieldType.SECTION_BREAK) {
      const config = field.config;

      if (config?.optional) {
        const toggleValue = answerByField.get(sectionToggleKey(field.id));
        sectionVisible = toggleValue === 'yes';
      } else if (config?.visibleWhen) {
        sectionVisible = answerMatchesVisibleWhen(
          answerByField.get(config.visibleWhen.fieldId),
          config.visibleWhen,
        );
      } else {
        sectionVisible = true;
      }

      // The section break header itself is always visible so the toggle can render
      visible.add(field.id);
      continue;
    }

    if (sectionVisible) {
      visible.add(field.id);
    }
  }

  return visible;
}

export function isChoiceControllerType(type: SurveyFieldType): boolean {
  return CHOICE_FIELD_TYPES.includes(type);
}

export function stripVisibleWhenFromConfig(
  type: SurveyFieldType,
  config: SurveyFieldConfig | null,
): SurveyFieldConfig | null {
  if (!config) return null;
  if (type === SurveyFieldType.SECTION_BREAK) return config;
  if (!config.visibleWhen) return config;
  const next = { ...config };
  delete next.visibleWhen;
  return Object.keys(next).length > 0 ? next : null;
}
