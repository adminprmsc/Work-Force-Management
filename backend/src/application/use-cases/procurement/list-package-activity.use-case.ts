import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AUDIT_RESOURCE_TYPES,
  AuditLog,
} from '../../../domain/entities/audit-log.entity';
import { canReadProcurementPackage } from '../../../domain/policies/procurement-access.policy';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
} from '../../ports/audit-log.repository.port';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

@Injectable()
export class ListPackageActivityUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    filter?: { page?: number; limit?: number },
  ): Promise<{ items: AuditLog[]; total: number }> {
    const actor = await this.actorResolver.resolve(user);
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }

    if (!canReadProcurementPackage(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.auditLogRepository.findAll({
      resourceType: AUDIT_RESOURCE_TYPES.PROCUREMENT_PACKAGE,
      resourceId: packageId,
      page: filter?.page ?? 1,
      limit: filter?.limit ?? 50,
    });
  }
}
