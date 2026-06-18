import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '../../../domain/entities/audit-log.entity';
import {
  User,
  UserRole,
  OfficeType,
} from '../../../domain/entities/user.entity';
import {
  canCreateRole,
  requiredOfficeTypeForRole,
} from '../../../domain/policies/user-management.policy';
import {
  HASHING_SERVICE,
  HashingServicePort,
} from '../../ports/hashing.service.port';
import {
  OFFICE_REPOSITORY,
  OfficeRepositoryPort,
} from '../../ports/office.repository.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../ports/user.repository.port';
import { AuditService } from '../../services/audit.service';

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  officeId?: string;
}

export interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(OFFICE_REPOSITORY)
    private readonly officeRepository: OfficeRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashingService: HashingServicePort,
    private readonly auditService: AuditService,
  ) {}

  async execute(actor: ActorContext, input: CreateUserInput): Promise<User> {
    if (!canCreateRole(actor.role, input.role)) {
      throw new ForbiddenException(
        `You are not allowed to create users with role ${input.role}`,
      );
    }

    const requiredOfficeType = requiredOfficeTypeForRole(input.role);

    let officeId: string | null = input.officeId ?? null;

    if (requiredOfficeType) {
      if (!officeId) {
        throw new ForbiddenException('officeId is required for this user type');
      }

      const office = await this.officeRepository.findById(officeId);
      if (!office) {
        throw new NotFoundException('Office not found');
      }
      const expectedOfficeType: OfficeType = requiredOfficeType;
      if (office.type !== expectedOfficeType) {
        throw new ForbiddenException(
          `Role ${input.role} must be assigned to a ${requiredOfficeType} office`,
        );
      }
      if (input.role === UserRole.RA_ES_TEHSIL && !office.tehsilId) {
        throw new ForbiddenException(
          'RA E&S Tehsil user must be assigned to a tehsil office',
        );
      }
    } else {
      officeId = null;
    }

    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const hashedPassword = await this.hashingService.hash(input.password);

    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      password: hashedPassword,
      role: input.role,
      officeId,
      createdById: actor.id,
    });

    await this.auditService.logUserAction(
      actor.id,
      AuditAction.USER_CREATED,
      user.id,
      {
        targetEmail: user.email,
        targetUsername: user.username,
        targetRole: user.role,
        officeId: user.officeId,
        officeName: user.officeName,
        createdByRole: actor.role,
      },
    );

    return user;
  }
}
