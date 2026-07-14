import type { SurveyAnswerInput } from '../ports/survey-response.repository.port';

export function extractAttachmentIdsFromAnswers(
  answers: SurveyAnswerInput[],
): string[] {
  const ids = new Set<string>();
  for (const answer of answers) {
    const value = answer.value;
    if (!value || typeof value !== 'object') continue;
    const attachmentId = (value as { attachmentId?: unknown }).attachmentId;
    if (typeof attachmentId === 'string' && attachmentId.trim().length > 0) {
      ids.add(attachmentId.trim());
    }
  }
  return Array.from(ids);
}

async function linkSurveyAttachmentsToResponse(
  attachmentRepository: {
    linkToResponse: (
      attachmentIds: string[],
      responseId: string,
    ) => Promise<number>;
  },
  answers: SurveyAnswerInput[],
  responseId: string,
): Promise<void> {
  const attachmentIds = extractAttachmentIdsFromAnswers(answers);
  if (attachmentIds.length === 0) return;
  await attachmentRepository.linkToResponse(attachmentIds, responseId);
}

export { linkSurveyAttachmentsToResponse };
