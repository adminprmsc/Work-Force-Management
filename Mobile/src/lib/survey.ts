import type { SurveyFieldType, SurveyResponseStatus } from '@/modules/api/types';

export function fieldIsPresentational(type: SurveyFieldType): boolean {
  return type === 'SECTION_BREAK';
}

const EDITABLE_RESPONSE_STATUSES: SurveyResponseStatus[] = ['DRAFT', 'REVERTED'];

export function responseIsEditable(status: SurveyResponseStatus): boolean {
  return EDITABLE_RESPONSE_STATUSES.includes(status);
}

export function responseStatusLabel(status: SurveyResponseStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SUBMITTED':
      return 'Pending review';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
    case 'REVERTED':
      return 'Reverted — action required';
    default:
      return status;
  }
}

export type ResponseStatusBadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'warning'
  | 'success';

export function responseStatusBadgeVariant(
  status: SurveyResponseStatus,
): ResponseStatusBadgeVariant {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'SUBMITTED':
      return 'secondary';
    case 'REVERTED':
      return 'warning';
    case 'REJECTED':
      return 'destructive';
    case 'DRAFT':
    default:
      return 'secondary';
  }
}

export function responseActionLabel(status: SurveyResponseStatus): string {
  if (!responseIsEditable(status)) return 'View';
  if (status === 'REVERTED') return 'Edit & resubmit';
  return 'Continue';
}
