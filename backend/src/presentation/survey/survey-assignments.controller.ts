import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import {
  DeleteSurveyAssignmentUseCase,
  ListMyAssignmentsUseCase,
} from '../../application/use-cases/survey/manage-survey-assignments.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { toSurveyAssignmentResponse } from './mappers/survey.mapper';

const SURVEY_MANAGERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
] as const;

@Controller('survey-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyAssignmentsController {
  constructor(
    private readonly listMine: ListMyAssignmentsUseCase,
    private readonly deleteAssignment: DeleteSurveyAssignmentUseCase,
  ) {}

  @Get('mine')
  @Roles(UserRole.RA_ES_TEHSIL)
  async mine(@CurrentUser() user: AuthenticatedUser) {
    const assignments = await this.listMine.execute(user);
    return assignments.map(toSurveyAssignmentResponse);
  }

  @Delete(':id')
  @Roles(...SURVEY_MANAGERS)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteAssignment.execute(user, id);
    return { success: true };
  }
}
