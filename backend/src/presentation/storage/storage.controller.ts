import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '../../domain/entities/user.entity';
import type { UploadedFilePayload } from '../../application/types/uploaded-file.type';
import { GetSurveyAttachmentUrlUseCase } from '../../application/use-cases/storage/get-survey-attachment-url.use-case';
import { UploadSurveyAttachmentUseCase } from '../../application/use-cases/storage/upload-survey-attachment.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { UploadSurveyAttachmentDto } from './dto/storage.dto';

const SURVEY_UPLOADERS = [
  UserRole.RA_ES_TEHSIL,
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
] as const;

const SURVEY_ATTACHMENT_READERS = [
  UserRole.RA_ES_TEHSIL,
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.WORLD_BANK_USER,
] as const;

function toUploadedFilePayload(
  file: UploadedFilePayload | undefined,
): UploadedFilePayload {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    typeof file.originalname !== 'string' ||
    typeof file.mimetype !== 'string' ||
    typeof file.size !== 'number'
  ) {
    throw new BadRequestException('file is required');
  }
  return file;
}

@Controller('storage/survey-attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(
    private readonly uploadAttachment: UploadSurveyAttachmentUseCase,
    private readonly getAttachmentUrl: GetSurveyAttachmentUrlUseCase,
  ) {}

  @Post()
  @Roles(...SURVEY_UPLOADERS)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body() body: UploadSurveyAttachmentDto,
  ) {
    return this.uploadAttachment.execute(user, {
      formId: body.formId,
      fieldId: body.fieldId,
      assignmentId: body.assignmentId,
      responseId: body.responseId,
      file: toUploadedFilePayload(file),
    });
  }

  @Get(':id/url')
  @Roles(...SURVEY_ATTACHMENT_READERS)
  async getUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getAttachmentUrl.execute(user, id);
  }
}
