import { Module } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '../../application/ports/audit-log.repository.port';
import { HASHING_SERVICE } from '../../application/ports/hashing.service.port';
import { OFFICE_REPOSITORY } from '../../application/ports/office.repository.port';
import { TEHSIL_REPOSITORY } from '../../application/ports/tehsil.repository.port';
import { USER_REPOSITORY } from '../../application/ports/user.repository.port';
import { AuditService } from '../../application/services/audit.service';
import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.use-case';
import { ListOfficesUseCase } from '../../application/use-cases/offices/list-offices.use-case';
import {
  ListTehsilVillagesUseCase,
  ListTehsilsUseCase,
} from '../../application/use-cases/tehsils/list-tehsils.use-case';
import { ListVillageSettlementsUseCase } from '../../application/use-cases/tehsils/list-village-settlements.use-case';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import {
  GetUserUseCase,
  ListUsersUseCase,
} from '../../application/use-cases/users/list-users.use-case';
import { ResetUserCredentialsUseCase } from '../../application/use-cases/users/reset-credentials.use-case';
import {
  DeleteUserUseCase,
  UpdateUserStatusUseCase,
  UpdateUserUseCase,
} from '../../application/use-cases/users/update-user.use-case';
import { PrismaAuditLogRepository } from '../../infrastructure/database/repositories/prisma-audit-log.repository';
import { PrismaOfficeRepository } from '../../infrastructure/database/repositories/prisma-office.repository';
import { PrismaTehsilRepository } from '../../infrastructure/database/repositories/prisma-tehsil.repository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { BcryptHashingService } from '../../infrastructure/security/bcrypt-hashing.service';
import { AuditLogsController } from '../audit/audit-logs.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OfficesController } from '../offices/offices.controller';
import { TehsilsController } from '../tehsils/tehsils.controller';
import { UsersController } from '../users/users.controller';

@Module({
  controllers: [
    UsersController,
    OfficesController,
    TehsilsController,
    AuditLogsController,
  ],
  providers: [
    RolesGuard,
    AuditService,
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    UpdateUserStatusUseCase,
    ResetUserCredentialsUseCase,
    ListOfficesUseCase,
    ListTehsilsUseCase,
    ListTehsilVillagesUseCase,
    ListVillageSettlementsUseCase,
    ListAuditLogsUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: OFFICE_REPOSITORY, useClass: PrismaOfficeRepository },
    { provide: TEHSIL_REPOSITORY, useClass: PrismaTehsilRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: HASHING_SERVICE, useClass: BcryptHashingService },
  ],
})
export class RbacModule {}
