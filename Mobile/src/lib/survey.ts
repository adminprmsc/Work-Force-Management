import type { SurveyFieldType } from '@/modules/api/types';

export function fieldIsPresentational(type: SurveyFieldType): boolean {
  return type === 'SECTION_BREAK';
}
