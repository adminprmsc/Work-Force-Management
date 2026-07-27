import { fieldIsPresentational } from '@/lib/survey';
import { resolveVisibleFieldIds } from '@/lib/survey-field-visibility';
import type { SurveyField } from '@/modules/api/types';

export function answerableFields(fields: SurveyField[]): SurveyField[] {
  return fields.filter((field) => !fieldIsPresentational(field.type));
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.values(obj).every((v) => v === undefined || v === '');
  }
  return false;
}

export function buildAnswers(
  fields: SurveyField[],
  answers: Record<string, unknown>,
): { fieldId: string; value: unknown }[] {
  const visible = resolveVisibleFieldIds(fields, answers);
  const result = answerableFields(fields)
    .filter((field) => visible.has(field.id))
    .filter((field) => !isEmpty(answers[field.id]))
    .map((field) => ({ fieldId: field.id, value: answers[field.id] }));

  const togglePrefix = '__section_toggle__';
  for (const [key, value] of Object.entries(answers)) {
    if (key.startsWith(togglePrefix) && value) {
      result.push({ fieldId: key, value });
    }
  }

  return result;
}
