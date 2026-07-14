export class SurveyAttachment {
  constructor(
    public readonly id: string,
    public readonly bucket: string,
    public readonly storagePath: string,
    public readonly fileName: string,
    public readonly mimeType: string,
    public readonly sizeBytes: number,
    public readonly formId: string,
    public readonly assignmentId: string | null,
    public readonly responseId: string | null,
    public readonly fieldId: string,
    public readonly uploadedById: string,
    public readonly createdAt: Date,
  ) {}
}

export interface SurveyAttachmentFileValue {
  attachmentId: string;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
}
