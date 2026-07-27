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

export function resolveVisibleFieldIds(
  fields: SurveyField[],
  answers: Record<string, unknown>,
): Set<string> {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const visible = new Set<string>();
  let sectionVisible = true;

  for (const field of sorted) {
    if (field.type === 'SECTION_BREAK') {
      const config = field.config;

      if (config?.optional) {
        const toggleValue = answers[sectionToggleKey(field.id)];
        sectionVisible = toggleValue === 'yes';
      } else if (config?.visibleWhen) {
        sectionVisible = answerMatchesVisibleWhen(
          answers[config.visibleWhen.fieldId],
          config.visibleWhen,
        );
      } else {
        sectionVisible = true;
      }

      visible.add(field.id);
      continue;
    }

    if (sectionVisible) visible.add(field.id);
  }

  return visible;
}
