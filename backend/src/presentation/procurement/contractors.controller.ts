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
  CreateContractorUseCase,
  DeleteContractorUseCase,
  ListContractorsUseCase,
  UpdateContractorUseCase,
} from '../../application/use-cases/procurement/manage-contractors.use-case';
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
import { toContractorResponse } from './mappers/procurement.mapper';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SENIOR_MANAGER_ES, UserRole.RA_ENVIRONMENT_HO)
export class ContractorsController {
  constructor(
    private readonly listContractorsUseCase: ListContractorsUseCase,
    private readonly createContractorUseCase: CreateContractorUseCase,
    private readonly updateContractorUseCase: UpdateContractorUseCase,
    private readonly deleteContractorUseCase: DeleteContractorUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const contractors = await this.listContractorsUseCase.execute(user);
    return contractors.map(toContractorResponse);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMasterNameDto,
  ) {
    const contractor = await this.createContractorUseCase.execute(
      user,
      dto.name,
    );
    return toContractorResponse(contractor);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMasterNameDto,
  ) {
    const contractor = await this.updateContractorUseCase.execute(
      user,
      id,
      dto.name,
    );
    return toContractorResponse(contractor);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteContractorUseCase.execute(user, id);
    return { success: true };
  }
}
