import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ListOfficesUseCase } from '../../application/use-cases/offices/list-offices.use-case';
import { OfficeType, UserRole } from '../../domain/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IsEnum, IsOptional } from 'class-validator';

class ListOfficesQueryDto {
  @IsOptional()
  @IsEnum(OfficeType)
  type?: OfficeType;
}

@Controller('offices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SENIOR_MANAGER_ES)
export class OfficesController {
  constructor(private readonly listOfficesUseCase: ListOfficesUseCase) {}

  @Get()
  async list(@Query() query: ListOfficesQueryDto) {
    const offices = await this.listOfficesUseCase.execute(
      query.type ? { type: query.type } : undefined,
    );
    return offices.map((office) => ({
      id: office.id,
      type: office.type,
      name: office.name,
      tehsilId: office.tehsilId,
      tehsilName: office.tehsilName,
      createdAt: office.createdAt,
      updatedAt: office.updatedAt,
    }));
  }
}
