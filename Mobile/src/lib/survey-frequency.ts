import type { SurveyFrequency, SurveyResponse, SurveyResponseStatus } from '@/modules/api/types';

/**
 * Statuses that occupy a village/settlement slot for a frequency period. Mirrors
 * the backend rule: a new visit is blocked while any of these exist; only a
 * REJECTED response frees the slot again.
 */
const SLOT_OCCUPYING_STATUSES: SurveyResponseStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVERTED',
  'ACCEPTED',
];

/**
 * Resolve the [start, end) window (UTC) for the current submission period.
 * ONE_TIME surveys have no window — one non-rejected response occupies the slot
 * for the whole assignment.
 */
export function getFrequencyPeriod(
  frequency: SurveyFrequency,
  now: Date = new Date(),
): { start: number; end: number } | null {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  switch (frequency) {
    case 'DAILY':
      return { start: Date.UTC(year, month, day), end: Date.UTC(year, month, day + 1) };
    case 'WEEKLY': {
      const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
      const daysFromMonday = (weekday + 6) % 7;
      return {
        start: Date.UTC(year, month, day - daysFromMonday),
        end: Date.UTC(year, month, day - daysFromMonday + 7),
      };
    }
    case 'MONTHLY':
      return { start: Date.UTC(year, month, 1), end: Date.UTC(year, month + 1, 1) };
    case 'ONE_TIME':
    default:
      return null;
  }
}

/**
 * Find an existing response that blocks a new visit to the given village /
 * settlement for this assignment and frequency period.
 */
export function findBlockingResponse(
  responses: SurveyResponse[],
  params: {
    assignmentId: string;
    villageId: string;
    settlementId: string | null;
    frequency: SurveyFrequency;
    now?: Date;
  },
): SurveyResponse | null {
  const period = getFrequencyPeriod(params.frequency, params.now ?? new Date());
  const candidates = responses.filter((response) => {
    if (response.assignmentId !== params.assignmentId) return false;
    if (response.village.id !== params.villageId) return false;
    if ((response.settlement?.id ?? null) !== params.settlementId) return false;
    if (!SLOT_OCCUPYING_STATUSES.includes(response.status)) return false;
    if (period) {
      const created = new Date(response.createdAt).getTime();
      if (Number.isNaN(created) || created < period.start || created >= period.end) {
        return false;
      }
    }
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

export function periodLabel(frequency: SurveyFrequency): string {
  switch (frequency) {
    case 'DAILY':
      return ' today';
    case 'WEEKLY':
      return ' this week';
    case 'MONTHLY':
      return ' this month';
    default:
      return '';
  }
}
