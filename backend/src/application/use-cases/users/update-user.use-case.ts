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
  canAdministerTarget,
  canChangeRole,
  canDeleteUser,
  canGrantUserAdmin,
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
  canManageUsers?: boolean;
}

export interface ActorContext {
  id: string;
  role: UserRole;
  canManageUsers: boolean;
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

    if (!canManageUser(actor) || !canAdministerTarget(actor, user.role)) {
      throw new ForbiddenException('You cannot update this user');
    }

    const nextRole = input.role ?? user.role;

    if (input.role && input.role !== user.role) {
      if (!canChangeRole(actor, input.role)) {
        throw new ForbiddenException('Changing user role is not allowed');
      }
    }

    if (input.canManageUsers !== undefined) {
      if (input.canManageUsers) {
        if (!canGrantUserAdmin(actor, nextRole)) {
          throw new ForbiddenException(
            'User administration can only be granted to RA Environment (HO) by a Senior Manager',
          );
        }
      } else if (actor.role !== UserRole.SENIOR_MANAGER_ES) {
        throw new ForbiddenException(
          'You cannot change user administration privileges',
        );
      }
    }

    let officeId: string | null | undefined = input.officeId;

    if (input.role && input.role !== user.role) {
      const requiredType = requiredOfficeTypeForRole(nextRole);
      if (!requiredType) {
        officeId = null;
      } else if (officeId === undefined) {
        if (!user.officeId) {
          throw new ForbiddenException(
            'officeId is required when changing to this role',
          );
        }
        const existingOffice = await this.officeRepository.findById(
          user.officeId,
        );
        if (!existingOffice || existingOffice.type !== requiredType) {
          throw new ForbiddenException(
            'officeId is required when changing to this role',
          );
        }
      }
    }

    const officeIdToValidate =
      officeId !== undefined ? officeId : user.officeId;
    if (officeId !== undefined || (input.role && input.role !== user.role)) {
      const requiredType = requiredOfficeTypeForRole(nextRole);
      if (requiredType) {
        if (!officeIdToValidate) {
          throw new ForbiddenException('officeId is required for this role');
        }
        const office = await this.officeRepository.findById(officeIdToValidate);
        if (!office) {
          throw new NotFoundException('Office not found');
        }
        const expectedOfficeType: OfficeType = requiredType;
        if (office.type !== expectedOfficeType) {
          throw new ForbiddenException(
            `User must be assigned to a ${requiredType} office`,
          );
        }
        if (nextRole === UserRole.RA_ES_TEHSIL && !office.tehsilId) {
          throw new ForbiddenException(
            'RA E&S Tehsil user must be assigned to a tehsil office',
          );
        }
      }
    } else if (input.officeId) {
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
      role: input.role,
      officeId,
    };

    if (nextRole !== UserRole.RA_ENVIRONMENT_HO) {
      updateData.canManageUsers = false;
    } else if (input.canManageUsers !== undefined) {
      updateData.canManageUsers = input.canManageUsers;
    }

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

    if (!canDeleteUser(actor, user.role)) {
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

    if (!canManageUser(actor) || !canAdministerTarget(actor, user.role)) {
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
