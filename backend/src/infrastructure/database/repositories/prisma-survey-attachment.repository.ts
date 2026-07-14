import { Injectable } from '@nestjs/common';
import { SurveyAttachment } from '../../../domain/entities/survey-attachment.entity';
import {
  CreateSurveyAttachmentData,
  SurveyAttachmentRepositoryPort,
} from '../../../application/ports/survey-attachment.repository.port';
import { PrismaService } from '../prisma/prisma.service';

function mapRecord(record: {
  id: string;
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  formId: string;
  assignmentId: string | null;
  responseId: string | null;
  fieldId: string;
  uploadedById: string;
  createdAt: Date;
}): SurveyAttachment {
  return new SurveyAttachment(
    record.id,
    record.bucket,
    record.storagePath,
    record.fileName,
    record.mimeType,
    record.sizeBytes,
    record.formId,
    record.assignmentId,
    record.responseId,
    record.fieldId,
    record.uploadedById,
    record.createdAt,
  );
}

@Injectable()
export class PrismaSurveyAttachmentRepository implements SurveyAttachmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSurveyAttachmentData): Promise<SurveyAttachment> {
    const record = await this.prisma.surveyAttachment.create({
      data: {
        bucket: data.bucket,
        storagePath: data.storagePath,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        formId: data.formId,
        assignmentId: data.assignmentId ?? null,
        responseId: data.responseId ?? null,
        fieldId: data.fieldId,
        uploadedById: data.uploadedById,
      },
    });
    return mapRecord(record);
  }

  async findById(id: string): Promise<SurveyAttachment | null> {
    const record = await this.prisma.surveyAttachment.findUnique({
      where: { id },
    });
    return record ? mapRecord(record) : null;
  }

  async linkToResponse(
    attachmentIds: string[],
    responseId: string,
  ): Promise<number> {
    if (attachmentIds.length === 0) return 0;
    const result = await this.prisma.surveyAttachment.updateMany({
      where: { id: { in: attachmentIds } },
      data: { responseId },
    });
    return result.count;
  }
}
