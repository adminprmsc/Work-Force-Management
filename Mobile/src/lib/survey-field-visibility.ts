import type { SurveyField, SurveyFieldVisibleWhen } from '@/modules/api/types';

function asEqualsList(equals: string | string[]): string[] {
  return (Array.isArray(equals) ? equals : [equals])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function answerMatchesVisibleWhen(
  value: unknown,
  rule: SurveyFieldVisibleWhen,
): boolean {
  const expected = new Set(asEqualsList(rule.equals));
  if (expected.size === 0) return false;

  if (typeof value === 'string') return expected.has(value);
  if (Array.isArray(value)) {
    return value.some(
      (entry) => typeof entry === 'string' && expected.has(entry),
    );
  }
  return false;
}

export function sectionToggleKey(sectionFieldId: string): string {
  return `__section_toggle__${sectionFieldId}`;
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

export function resolveVisibleFieldIds(
  fields: SurveyField[],
  answers: Record<string, unknown>,
): Set<string> {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const visible = new Set<string>();
  let sectionVisible = true;
  let formEnded = false;

  for (const field of sorted) {
    if (formEnded) continue;

    if (field.type === 'SECTION_BREAK') {
      const config = field.config;

      if (config?.optional) {
        const toggleValue = answers[sectionToggleKey(field.id)];
        sectionVisible = toggleValue === 'yes';
      } else if (config?.visibleWhen) {
        sectionVisible =
          visible.has(config.visibleWhen.fieldId) &&
          answerMatchesVisibleWhen(
            answers[config.visibleWhen.fieldId],
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
      if (!answerMatchesVisibleWhen(answers[rule.fieldId], rule)) continue;
    }

    visible.add(field.id);
    if (selectionEndsForm(field, answers[field.id])) formEnded = true;
  }

  return visible;
}
