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
  ListTehsilVillagesUseCase,
  ListTehsilsUseCase,
} from '../../application/use-cases/tehsils/list-tehsils.use-case';
import { ListVillageSettlementsUseCase } from '../../application/use-cases/tehsils/list-village-settlements.use-case';
import {
  CreateSettlementUseCase,
  CreateVillageUseCase,
  DeleteSettlementUseCase,
  DeleteVillageUseCase,
  UpdateSettlementUseCase,
  UpdateVillageUseCase,
} from '../../application/use-cases/tehsils/manage-geography.use-case';
import { UserRole } from '../../domain/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GeographyNameDto } from './dto/geography.dto';
import { toSettlementResponse } from './mappers/tehsil.mapper';

const GEOGRAPHY_MANAGERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
] as const;

@Controller('tehsils')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TehsilsController {
  constructor(
    private readonly listTehsilsUseCase: ListTehsilsUseCase,
    private readonly listTehsilVillagesUseCase: ListTehsilVillagesUseCase,
    private readonly listVillageSettlementsUseCase: ListVillageSettlementsUseCase,
    private readonly createVillageUseCase: CreateVillageUseCase,
    private readonly updateVillageUseCase: UpdateVillageUseCase,
    private readonly deleteVillageUseCase: DeleteVillageUseCase,
    private readonly createSettlementUseCase: CreateSettlementUseCase,
    private readonly updateSettlementUseCase: UpdateSettlementUseCase,
    private readonly deleteSettlementUseCase: DeleteSettlementUseCase,
  ) {}

  @Get()
  async list() {
    const tehsils = await this.listTehsilsUseCase.execute();
    return tehsils.map((t) => ({
      id: t.id,
      name: t.name,
      villageCount: t.villageCount,
      createdAt: t.createdAt,
    }));
  }

  @Get('villages/:id/settlements')
  async listVillageSettlements(@Param('id', ParseUUIDPipe) id: string) {
    const settlements = await this.listVillageSettlementsUseCase.execute(id);
    return settlements.map(toSettlementResponse);
  }

  @Post('villages/:villageId/settlements')
  @Roles(...GEOGRAPHY_MANAGERS)
  async createSettlement(
    @Param('villageId', ParseUUIDPipe) villageId: string,
    @Body() dto: GeographyNameDto,
  ) {
    const settlement = await this.createSettlementUseCase.execute(
      villageId,
      dto.name,
    );
    return toSettlementResponse(settlement);
  }

  @Patch('settlements/:id')
  @Roles(...GEOGRAPHY_MANAGERS)
  async updateSettlement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeographyNameDto,
  ) {
    const settlement = await this.updateSettlementUseCase.execute(id, dto.name);
    return toSettlementResponse(settlement);
  }

  @Delete('settlements/:id')
  @Roles(...GEOGRAPHY_MANAGERS)
  async deleteSettlement(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteSettlementUseCase.execute(id);
    return { success: true };
  }

  @Patch('villages/:id')
  @Roles(...GEOGRAPHY_MANAGERS)
  async updateVillage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeographyNameDto,
  ) {
    const village = await this.updateVillageUseCase.execute(id, dto.name);
    return {
      id: village.id,
      name: village.name,
      tehsilId: village.tehsilId,
      settlementCount: village.settlementCount ?? 0,
      createdAt: village.createdAt,
    };
  }

  @Delete('villages/:id')
  @Roles(...GEOGRAPHY_MANAGERS)
  async deleteVillage(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteVillageUseCase.execute(id);
    return { success: true };
  }

  @Get(':id/villages')
  async listVillages(@Param('id', ParseUUIDPipe) id: string) {
    const villages = await this.listTehsilVillagesUseCase.execute(id);
    return villages.map((v) => ({
      id: v.id,
      name: v.name,
      tehsilId: v.tehsilId,
      settlementCount: v.settlementCount,
      createdAt: v.createdAt,
    }));
  }

  @Post(':tehsilId/villages')
  @Roles(...GEOGRAPHY_MANAGERS)
  async createVillage(
    @Param('tehsilId', ParseUUIDPipe) tehsilId: string,
    @Body() dto: GeographyNameDto,
  ) {
    const village = await this.createVillageUseCase.execute(tehsilId, dto.name);
    return {
      id: village.id,
      name: village.name,
      tehsilId: village.tehsilId,
      settlementCount: village.settlementCount ?? 0,
      createdAt: village.createdAt,
    };
  }
}
