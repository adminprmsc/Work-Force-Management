export type SurveyAttachmentFileValue = {
  attachmentId: string;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
};

export type UploadSurveyAttachmentInput = {
  formId: string;
  fieldId: string;
  assignmentId?: string;
  responseId?: string;
};

export type UploadSurveyAttachmentResult = SurveyAttachmentFileValue & {
  id: string;
};

export type SurveyAttachmentUrlResult = {
  id: string;
  url: string;
  expiresInSeconds: number;
};
