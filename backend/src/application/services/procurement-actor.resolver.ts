import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import {
  canManageProcurementMasters,
  ProcurementActorContext,
} from '../../domain/policies/procurement-access.policy';
import {
  OFFICE_REPOSITORY,
  OfficeRepositoryPort,
} from '../ports/office.repository.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../ports/user.repository.port';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class ProcurementActorResolver {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(OFFICE_REPOSITORY)
    private readonly officeRepository: OfficeRepositoryPort,
  ) {}

  async resolve(user: AuthenticatedUser): Promise<ProcurementActorContext> {
    if (user.role !== UserRole.RA_ES_TEHSIL) {
      return { id: user.id, role: user.role, tehsilId: null };
    }

    const fullUser = await this.userRepository.findById(user.id);
    if (!fullUser?.officeId) {
      throw new ForbiddenException(
        'Tehsil office is not assigned to this user',
      );
    }

    const office = await this.officeRepository.findById(fullUser.officeId);
    if (!office?.tehsilId) {
      throw new ForbiddenException('User office is not linked to a tehsil');
    }

    return {
      id: user.id,
      role: user.role,
      tehsilId: office.tehsilId,
    };
  }

  assertManageMasters(actor: ProcurementActorContext): void {
    if (!canManageProcurementMasters(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}

export function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new BadRequestException('Name is required');
  }
  return trimmed;
}
