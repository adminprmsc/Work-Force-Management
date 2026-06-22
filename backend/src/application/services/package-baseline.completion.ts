import {
  PRESENTATION_FIELD_TYPES,
  SurveyField,
  SurveyFormBaselineField,
} from '../../domain/entities/survey.entity';

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function baselineFieldToSurveyField(
  field: SurveyFormBaselineField,
): SurveyField {
  return new SurveyField(
    field.id,
    field.type,
    field.label,
    field.helpText,
    field.required,
    field.order,
    field.config,
  );
}

export function isBaselineComplete(
  fields: SurveyFormBaselineField[],
  answers: Map<string, unknown>,
): boolean {
  const answerable = fields.filter(
    (field) => !PRESENTATION_FIELD_TYPES.includes(field.type),
  );
  if (answerable.length === 0) return true;

  return answerable.every((field) => {
    if (!field.required) return true;
    return !isEmpty(answers.get(field.id));
  });
}

export function completionKey(packageId: string, formId: string): string {
  return `${packageId}:${formId}`;
}
