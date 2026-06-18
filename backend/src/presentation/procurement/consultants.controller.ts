import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateConsultantUseCase,
  DeleteConsultantUseCase,
  ListConsultantsUseCase,
  UpdateConsultantUseCase,
} from '../../application/use-cases/procurement/manage-consultants.use-case';
import { UserRole } from '../../domain/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  CreateMasterNameDto,
  UpdateMasterNameDto,
} from './dto/procurement.dto';
import { toConsultantResponse } from './mappers/procurement.mapper';

@Controller('consultants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SENIOR_MANAGER_ES, UserRole.RA_ENVIRONMENT_HO)
export class ConsultantsController {
  constructor(
    private readonly listConsultantsUseCase: ListConsultantsUseCase,
    private readonly createConsultantUseCase: CreateConsultantUseCase,
    private readonly updateConsultantUseCase: UpdateConsultantUseCase,
    private readonly deleteConsultantUseCase: DeleteConsultantUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const consultants = await this.listConsultantsUseCase.execute(user);
    return consultants.map(toConsultantResponse);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMasterNameDto,
  ) {
    const consultant = await this.createConsultantUseCase.execute(
      user,
      dto.name,
    );
    return toConsultantResponse(consultant);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMasterNameDto,
  ) {
    const consultant = await this.updateConsultantUseCase.execute(
      user,
      id,
      dto.name,
    );
    return toConsultantResponse(consultant);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteConsultantUseCase.execute(user, id);
    return { success: true };
  }
}
