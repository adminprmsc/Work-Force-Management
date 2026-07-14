import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const ROOT = 'survey-submissions';

@Injectable()
export class SurveyAttachmentPathService {
  buildPath(input: {
    formId: string;
    fieldId: string;
    fileName: string;
    responseId?: string | null;
    userId: string;
    assignmentId?: string | null;
  }): string {
    const ext = this.extensionFromFileName(input.fileName);
    const objectName = `${randomUUID()}.${ext}`;

    if (input.responseId) {
      return `${ROOT}/forms/${input.formId}/responses/${input.responseId}/fields/${input.fieldId}/${objectName}`;
    }

    if (!input.assignmentId) {
      throw new Error('assignmentId is required when responseId is not set');
    }

    return `${ROOT}/forms/${input.formId}/drafts/users/${input.userId}/assignments/${input.assignmentId}/fields/${input.fieldId}/${objectName}`;
  }

  private extensionFromFileName(fileName: string): string {
    const idx = fileName.lastIndexOf('.');
    if (idx <= 0) return 'bin';
    const ext = fileName
      .slice(idx + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return ext.length > 0 ? ext : 'bin';
  }
}
