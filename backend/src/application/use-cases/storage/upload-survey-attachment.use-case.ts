import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SurveyFieldType } from '../../../domain/entities/survey.entity';
import {
  canFillSurveyResponses,
  canManageSurveyForms,
} from '../../../domain/policies/survey-access.policy';
import {
  OBJECT_STORAGE,
  ObjectStoragePort,
} from '../../ports/object-storage.port';
import {
  SURVEY_ASSIGNMENT_REPOSITORY,
  SurveyAssignmentRepositoryPort,
} from '../../ports/survey-assignment.repository.port';
import {
  SURVEY_ATTACHMENT_REPOSITORY,
  SurveyAttachmentRepositoryPort,
} from '../../ports/survey-attachment.repository.port';
import {
  SURVEY_FORM_REPOSITORY,
  SurveyFormRepositoryPort,
} from '../../ports/survey-form.repository.port';
import {
  SURVEY_RESPONSE_REPOSITORY,
  SurveyResponseRepositoryPort,
} from '../../ports/survey-response.repository.port';
import { SurveyAttachmentPathService } from '../../services/survey-attachment-path.service';
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
import type { UploadedFilePayload } from '../../types/uploaded-file.type';

export interface UploadSurveyAttachmentCommand {
  formId: string;
  fieldId: string;
  assignmentId?: string | null;
  responseId?: string | null;
  file: UploadedFilePayload;
}

export interface UploadSurveyAttachmentResult {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

const DEFAULT_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const DEFAULT_FILE_MIMES = [
  ...DEFAULT_IMAGE_MIMES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class UploadSurveyAttachmentUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    @Inject(SURVEY_ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: SurveyAttachmentRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStoragePort,
    private readonly pathService: SurveyAttachmentPathService,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    command: UploadSurveyAttachmentCommand,
  ): Promise<UploadSurveyAttachmentResult> {
    const actor = await this.scopeResolver.resolve(user);
    if (
      !canFillSurveyResponses(actor.role) &&
      !canManageSurveyForms(actor.role)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(command.formId);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }

    const field = form.fields.find((item) => item.id === command.fieldId);
    if (!field) {
      throw new NotFoundException('Survey field not found');
    }
    if (
      field.type !== SurveyFieldType.IMAGE &&
      field.type !== SurveyFieldType.FILE
    ) {
      throw new BadRequestException('Field does not accept file uploads');
    }

    await this.assertUploadScope(actor, command);

    const maxMb =
      field.config?.maxSizeMb ??
      this.configService.get<number>('supabase.uploadMaxMb') ??
      10;
    const maxBytes = maxMb * 1024 * 1024;
    if (command.file.size > maxBytes) {
      throw new BadRequestException(`File exceeds ${maxMb} MB limit`);
    }

    this.assertAllowedMime(field.type, field.config?.accept, command.file);

    const bucket =
      this.configService.get<string>('supabase.storageBucket') ?? 'LOCAL';
    const storagePath = this.pathService.buildPath({
      formId: command.formId,
      fieldId: command.fieldId,
      fileName: command.file.originalname,
      responseId: command.responseId,
      userId: user.id,
      assignmentId: command.assignmentId,
    });

    await this.objectStorage.upload({
      bucket,
      path: storagePath,
      body: command.file.buffer,
      contentType: command.file.mimetype,
    });

    const attachment = await this.attachmentRepository.create({
      bucket,
      storagePath,
      fileName: command.file.originalname,
      mimeType: command.file.mimetype,
      sizeBytes: command.file.size,
      formId: command.formId,
      assignmentId: command.assignmentId ?? null,
      responseId: command.responseId ?? null,
      fieldId: command.fieldId,
      uploadedById: user.id,
    });

    const ttl =
      this.configService.get<number>('supabase.signedUrlTtlSeconds') ?? 3600;
    const url = await this.objectStorage.createSignedUrl(
      bucket,
      storagePath,
      ttl,
    );

    return {
      id: attachment.id,
      url,
      name: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.sizeBytes,
      storagePath: attachment.storagePath,
    };
  }

  private async assertUploadScope(
    actor: Awaited<ReturnType<SurveyScopeResolver['resolve']>>,
    command: UploadSurveyAttachmentCommand,
  ): Promise<void> {
    if (canManageSurveyForms(actor.role)) {
      return;
    }

    if (!command.assignmentId) {
      throw new BadRequestException('assignmentId is required');
    }

    const assignment = await this.assignmentRepository.findById(
      command.assignmentId,
    );
    if (!assignment || assignment.formId !== command.formId) {
      throw new NotFoundException('Survey assignment not found');
    }
    if (actor.tehsilId !== assignment.tehsil.id) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (command.responseId) {
      const response = await this.responseRepository.findById(
        command.responseId,
      );
      if (!response || response.assignmentId !== command.assignmentId) {
        throw new NotFoundException('Survey response not found');
      }
      if (response.respondent.id !== actor.id) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }
  }

  private assertAllowedMime(
    fieldType: SurveyFieldType,
    accept: string | undefined,
    file: UploadedFilePayload,
  ): void {
    const allowed = this.resolveAllowedMimes(fieldType, accept);
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('File type is not allowed for this field');
    }
  }

  private resolveAllowedMimes(
    fieldType: SurveyFieldType,
    accept: string | undefined,
  ): string[] {
    if (!accept || accept.trim().length === 0) {
      return fieldType === SurveyFieldType.IMAGE
        ? DEFAULT_IMAGE_MIMES
        : DEFAULT_FILE_MIMES;
    }

    const tokens = accept
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

    const mimes = new Set<string>();
    for (const token of tokens) {
      if (token.includes('/')) {
        mimes.add(token);
        continue;
      }
      if (token === 'jpg' || token === 'jpeg') {
        mimes.add('image/jpeg');
      } else if (token === 'png') {
        mimes.add('image/png');
      } else if (token === 'webp') {
        mimes.add('image/webp');
      } else if (token === 'pdf') {
        mimes.add('application/pdf');
      }
    }

    return mimes.size > 0 ? Array.from(mimes) : DEFAULT_FILE_MIMES;
  }
}
