import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  canManageSurveyForms,
  canReadResponseForTehsil,
} from '../../../domain/policies/survey-access.policy';
import {
  OBJECT_STORAGE,
  ObjectStoragePort,
} from '../../ports/object-storage.port';
import {
  SURVEY_ATTACHMENT_REPOSITORY,
  SurveyAttachmentRepositoryPort,
} from '../../ports/survey-attachment.repository.port';
import {
  SURVEY_RESPONSE_REPOSITORY,
  SurveyResponseRepositoryPort,
} from '../../ports/survey-response.repository.port';
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface GetSurveyAttachmentUrlResult {
  id: string;
  url: string;
  expiresInSeconds: number;
}

@Injectable()
export class GetSurveyAttachmentUrlUseCase {
  constructor(
    @Inject(SURVEY_ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: SurveyAttachmentRepositoryPort,
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStoragePort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    attachmentId: string,
  ): Promise<GetSurveyAttachmentUrlResult> {
    const actor = await this.scopeResolver.resolve(user);
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.assertReadAccess(actor, attachment);

    const expiresInSeconds =
      this.configService.get<number>('supabase.signedUrlTtlSeconds') ?? 3600;
    const url = await this.objectStorage.createSignedUrl(
      attachment.bucket,
      attachment.storagePath,
      expiresInSeconds,
    );

    return { id: attachment.id, url, expiresInSeconds };
  }

  private async assertReadAccess(
    actor: Awaited<ReturnType<SurveyScopeResolver['resolve']>>,
    attachment: {
      uploadedById: string;
      responseId: string | null;
    },
  ): Promise<void> {
    if (canManageSurveyForms(actor.role)) {
      return;
    }
    if (attachment.uploadedById === actor.id) {
      return;
    }
    if (!attachment.responseId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const response = await this.responseRepository.findById(
      attachment.responseId,
    );
    if (!response) {
      throw new NotFoundException('Survey response not found');
    }
    if (!canReadResponseForTehsil(actor, response.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
