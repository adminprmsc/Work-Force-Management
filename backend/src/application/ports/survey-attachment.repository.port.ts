import { SurveyAttachment } from '../../domain/entities/survey-attachment.entity';

export interface CreateSurveyAttachmentData {
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  formId: string;
  assignmentId?: string | null;
  responseId?: string | null;
  fieldId: string;
  uploadedById: string;
}

export abstract class SurveyAttachmentRepositoryPort {
  abstract create(data: CreateSurveyAttachmentData): Promise<SurveyAttachment>;
  abstract findById(id: string): Promise<SurveyAttachment | null>;
  abstract linkToResponse(
    attachmentIds: string[],
    responseId: string,
  ): Promise<number>;
}

export const SURVEY_ATTACHMENT_REPOSITORY = Symbol(
  'SURVEY_ATTACHMENT_REPOSITORY',
);
