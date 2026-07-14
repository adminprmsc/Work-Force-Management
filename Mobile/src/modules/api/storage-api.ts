import { apiFormDataRequest, apiRequest } from '@/lib/api-client';
import type {
  SurveyAttachmentUrlResult,
  UploadSurveyAttachmentInput,
  UploadSurveyAttachmentResult,
} from '@/modules/api/types';

type MobileUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export function uploadSurveyAttachment(
  token: string,
  input: UploadSurveyAttachmentInput,
  file: MobileUploadFile,
): Promise<UploadSurveyAttachmentResult> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  formData.append('formId', input.formId);
  formData.append('fieldId', input.fieldId);
  if (input.assignmentId) formData.append('assignmentId', input.assignmentId);
  if (input.responseId) formData.append('responseId', input.responseId);

  return apiFormDataRequest<UploadSurveyAttachmentResult>(
    '/storage/survey-attachments',
    formData,
    { token },
  );
}

export function getSurveyAttachmentUrl(
  token: string,
  attachmentId: string,
): Promise<SurveyAttachmentUrlResult> {
  return apiRequest<SurveyAttachmentUrlResult>(
    `/storage/survey-attachments/${attachmentId}/url`,
    { method: 'GET', token },
  );
}
