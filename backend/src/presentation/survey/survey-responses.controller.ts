import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import {
  GetSurveyResponseUseCase,
  ListSurveyResponsesUseCase,
  SaveSurveyResponseUseCase,
  StartSurveyResponseUseCase,
  SubmitSurveyResponseUseCase,
} from '../../application/use-cases/survey/manage-survey-responses.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  SaveSurveyResponseDto,
  StartSurveyResponseDto,
} from './dto/survey.dto';
import { toSurveyResponseResponse } from './mappers/survey.mapper';

const SURVEY_READERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.WORLD_BANK_USER,
  UserRole.RA_ES_TEHSIL,
] as const;

@Controller('survey-responses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyResponsesController {
  constructor(
    private readonly listResponses: ListSurveyResponsesUseCase,
    private readonly getResponse: GetSurveyResponseUseCase,
    private readonly startResponse: StartSurveyResponseUseCase,
    private readonly saveResponse: SaveSurveyResponseUseCase,
    private readonly submitResponse: SubmitSurveyResponseUseCase,
  ) {}

  @Get()
  @Roles(...SURVEY_READERS)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('formId') formId?: string,
    @Query('tehsilId') tehsilId?: string,
    @Query('assignmentId') assignmentId?: string,
  ) {
    const responses = await this.listResponses.execute(user, {
      formId,
      tehsilId,
      assignmentId,
    });
    return responses.map(toSurveyResponseResponse);
  }

  @Post()
  @Roles(UserRole.RA_ES_TEHSIL)
  async start(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartSurveyResponseDto,
  ) {
    const response = await this.startResponse.execute(user, {
      assignmentId: dto.assignmentId,
      villageId: dto.villageId,
      settlementId: dto.settlementId ?? null,
      visitDate: dto.visitDate ?? null,
    });
    return toSurveyResponseResponse(response);
  }

  @Get(':id')
  @Roles(...SURVEY_READERS)
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const response = await this.getResponse.execute(user, id);
    return toSurveyResponseResponse(response);
  }

  @Patch(':id')
  @Roles(UserRole.RA_ES_TEHSIL)
  async save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSurveyResponseDto,
  ) {
    const response = await this.saveResponse.execute(user, id, {
      answers: dto.answers,
    });
    return toSurveyResponseResponse(response);
  }

  @Post(':id/submit')
  @Roles(UserRole.RA_ES_TEHSIL)
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSurveyResponseDto,
  ) {
    const response = await this.submitResponse.execute(user, id, {
      answers: dto.answers,
    });
    return toSurveyResponseResponse(response);
  }
}
