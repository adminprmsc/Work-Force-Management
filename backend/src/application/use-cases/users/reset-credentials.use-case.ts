import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuditAction } from '../../../domain/entities/audit-log.entity';
import { UserRole } from '../../../domain/entities/user.entity';
import { canManageUser } from '../../../domain/policies/user-management.policy';
import {
  HASHING_SERVICE,
  HashingServicePort,
} from '../../ports/hashing.service.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../ports/user.repository.port';
import { AuditService } from '../../services/audit.service';

export interface ActorContext {
  id: string;
  role: UserRole;
}

export interface ResetCredentialsResult {
  email: string;
  username: string;
  temporaryPassword: string;
}

@Injectable()
export class ResetUserCredentialsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashingService: HashingServicePort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: ActorContext,
    userId: string,
  ): Promise<ResetCredentialsResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!canManageUser(actor.role)) {
      throw new ForbiddenException(
        'You cannot reset credentials for this user',
      );
    }

    const temporaryPassword = randomBytes(9).toString('base64url');
    const hashedPassword = await this.hashingService.hash(temporaryPassword);

    await this.userRepository.update(userId, { password: hashedPassword });

    await this.auditService.logUserAction(
      actor.id,
      AuditAction.USER_CREDENTIALS_RESET,
      userId,
      { targetEmail: user.email, targetRole: user.role },
    );

    return {
      email: user.email,
      username: user.username,
      temporaryPassword,
    };
  }
}
