import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.use-case';
import { UserRole } from '../../domain/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { toActorContext } from '../users/mappers/user.mapper';
import { ListAuditLogsQueryDto } from './dto/audit-log.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SENIOR_MANAGER_ES)
export class AuditLogsController {
  constructor(private readonly listAuditLogsUseCase: ListAuditLogsUseCase) {}

  @Get()
  async list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListAuditLogsQueryDto,
  ) {
    const result = await this.listAuditLogsUseCase.execute(
      toActorContext(actor),
      query,
    );

    return {
      items: result.items.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        metadata: log.metadata,
        createdAt: log.createdAt,
        actor: {
          id: log.actorId,
          email: log.actorEmail,
          username: log.actorUsername,
        },
      })),
      total: result.total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }
}
