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

/** Prefix for optional section toggle answer keys. */
export const SECTION_TOGGLE_PREFIX = '__section_toggle__';

/**
 * fieldId may be either:
 * - a normal field UUID
 * - `__section_toggle__` + section field UUID (optional SECTION_BREAK yes/no)
 *
 * Loosely validates UUID shape so class-validator and domain rules stay aligned.
 */
export const SECTION_TOGGLE_FIELD_ID_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|__section_toggle__[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function isSectionToggleFieldId(fieldId: string): boolean {
  return fieldId.startsWith(SECTION_TOGGLE_PREFIX);
}

export function sectionIdFromToggleKey(fieldId: string): string | null {
  if (!isSectionToggleFieldId(fieldId)) return null;
  return fieldId.slice(SECTION_TOGGLE_PREFIX.length);
}

/**
 * Whether an answer fieldId is a real form field UUID or a valid section toggle
 * for one of the given form field IDs.
 */
export function isAllowedSurveyAnswerFieldId(
  fieldId: string,
  validFieldIds: Set<string>,
): boolean {
  if (validFieldIds.has(fieldId)) return true;
  const sectionId = sectionIdFromToggleKey(fieldId);
  return sectionId !== null && validFieldIds.has(sectionId);
}

function selectedAnswerValues(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string =>
        typeof entry === 'string' && entry.trim().length > 0,
    );
  }
  return [];
}

/** True when every selected option is marked as ending the form. */
export function selectionEndsForm(
  field: SurveyField,
  value: unknown,
): boolean {
  const ending = new Set(
    (field.config?.options ?? [])
      .filter((option) => option.endsForm)
      .map((option) => option.value),
  );
  if (ending.size === 0) return false;
  const selected = selectedAnswerValues(value);
  if (selected.length === 0) return false;
  return selected.every((entry) => ending.has(entry));
}

/**
 * Resolves which fields are visible given the current answers.
 *
 * Rules:
 * - SECTION_BREAK with `config.optional: true`:
 *   visible only when answers contain `sectionToggleKey(field.id) === "yes"`
 * - SECTION_BREAK with `config.visibleWhen`:
 *   visible only when the controlling field answer matches
 * - A question with `config.visibleWhen` is visible only when that answer
 *   matches and the controlling question itself is visible
 * - All other sections: always visible
 * - Non-section fields inherit their section's visibility
 * - An option with `endsForm` hides every field after that question
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
  let formEnded = false;

  for (const field of sorted) {
    if (formEnded) continue;

    if (field.type === SurveyFieldType.SECTION_BREAK) {
      const config = field.config;

      if (config?.optional) {
        const toggleValue = answerByField.get(sectionToggleKey(field.id));
        sectionVisible = toggleValue === 'yes';
      } else if (config?.visibleWhen) {
        sectionVisible =
          visible.has(config.visibleWhen.fieldId) &&
          answerMatchesVisibleWhen(
            answerByField.get(config.visibleWhen.fieldId),
            config.visibleWhen,
          );
      } else {
        sectionVisible = true;
      }

      visible.add(field.id);
      continue;
    }

    if (!sectionVisible) continue;

    const rule = field.config?.visibleWhen;
    if (rule) {
      if (!visible.has(rule.fieldId)) continue;
      if (
        !answerMatchesVisibleWhen(answerByField.get(rule.fieldId), rule)
      ) {
        continue;
      }
    }

    visible.add(field.id);
    if (selectionEndsForm(field, answerByField.get(field.id))) {
      formEnded = true;
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
  const next = { ...config };
  delete next.optional;
  return Object.keys(next).length > 0 ? next : null;
}
