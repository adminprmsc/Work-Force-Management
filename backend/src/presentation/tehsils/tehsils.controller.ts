import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ListTehsilVillagesUseCase,
  ListTehsilsUseCase,
} from '../../application/use-cases/tehsils/list-tehsils.use-case';
import { ListVillageSettlementsUseCase } from '../../application/use-cases/tehsils/list-village-settlements.use-case';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { toSettlementResponse } from './mappers/tehsil.mapper';

@Controller('tehsils')
@UseGuards(JwtAuthGuard)
export class TehsilsController {
  constructor(
    private readonly listTehsilsUseCase: ListTehsilsUseCase,
    private readonly listTehsilVillagesUseCase: ListTehsilVillagesUseCase,
    private readonly listVillageSettlementsUseCase: ListVillageSettlementsUseCase,
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
}
