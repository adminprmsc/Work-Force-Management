import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '../../../domain/entities/audit-log.entity';
import {
  User,
  UserRole,
  UserStatus,
  OfficeType,
} from '../../../domain/entities/user.entity';
import {
  canDeleteUser,
  canManageUser,
  requiredOfficeTypeForRole,
} from '../../../domain/policies/user-management.policy';
import {
  OFFICE_REPOSITORY,
  OfficeRepositoryPort,
} from '../../ports/office.repository.port';
import {
  UpdateUserData,
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../ports/user.repository.port';
import { AuditService } from '../../services/audit.service';

export interface UpdateUserInput {
  email?: string;
  username?: string;
  role?: UserRole;
  officeId?: string;
}

export interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(OFFICE_REPOSITORY)
    private readonly officeRepository: OfficeRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: ActorContext,
    userId: string,
    input: UpdateUserInput,
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!canManageUser(actor.role)) {
      throw new ForbiddenException('You cannot update this user');
    }

    if (input.role && input.role !== user.role) {
      throw new ForbiddenException('Changing user role is not allowed');
    }

    if (input.officeId) {
      const requiredType = requiredOfficeTypeForRole(user.role);
      const office = await this.officeRepository.findById(input.officeId);
      if (!office) {
        throw new NotFoundException('Office not found');
      }
      const expectedOfficeType: OfficeType | null = requiredType;
      if (expectedOfficeType && office.type !== expectedOfficeType) {
        throw new ForbiddenException(
          `User must be assigned to a ${requiredType} office`,
        );
      }
      if (user.role === UserRole.RA_ES_TEHSIL && !office.tehsilId) {
        throw new ForbiddenException(
          'RA E&S Tehsil user must be assigned to a tehsil office',
        );
      }
    }

    const updateData: UpdateUserData = {
      email: input.email,
      username: input.username,
      officeId: input.officeId,
    };

    const updated = await this.userRepository.update(userId, updateData);

    await this.auditService.logUserAction(
      actor.id,
      AuditAction.USER_UPDATED,
      userId,
      { changes: input },
    );

    return updated;
  }
}

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(actor: ActorContext, userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!canDeleteUser(actor.role)) {
      throw new ForbiddenException('You cannot delete this user');
    }

    if (user.id === actor.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.userRepository.delete(userId);

    await this.auditService.logUserAction(
      actor.id,
      AuditAction.USER_DELETED,
      userId,
      {
        targetEmail: user.email,
        targetUsername: user.username,
        targetRole: user.role,
      },
    );
  }
}

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: ActorContext,
    userId: string,
    active: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!canManageUser(actor.role)) {
      throw new ForbiddenException('You cannot update this user status');
    }

    const updated = await this.userRepository.updateStatus(
      userId,
      active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
    );

    await this.auditService.logUserAction(
      actor.id,
      active ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
      userId,
      {
        targetEmail: user.email,
        targetRole: user.role,
        tehsilName: user.tehsilName,
      },
    );

    return updated;
  }
}
