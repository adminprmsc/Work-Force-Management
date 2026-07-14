import { IsOptional, IsUUID } from 'class-validator';

export class UploadSurveyAttachmentDto {
  @IsUUID()
  formId!: string;

  @IsUUID()
  fieldId!: string;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsUUID()
  responseId?: string;
}
