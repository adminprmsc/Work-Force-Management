import { fieldIsPresentational } from '@/lib/survey';
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
  return answerableFields(fields)
    .filter((field) => !isEmpty(answers[field.id]))
    .map((field) => ({ fieldId: field.id, value: answers[field.id] }));
}
