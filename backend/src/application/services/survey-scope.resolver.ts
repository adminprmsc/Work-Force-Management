import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import { SurveyActorContext } from '../../domain/policies/survey-access.policy';
import {
  OFFICE_REPOSITORY,
  OfficeRepositoryPort,
} from '../ports/office.repository.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../ports/user.repository.port';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * Resolves the acting user into a survey context, including the tehsil a
 * RA_ES_TEHSIL user is scoped to (derived from their office).
 */
@Injectable()
export class SurveyScopeResolver {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(OFFICE_REPOSITORY)
    private readonly officeRepository: OfficeRepositoryPort,
  ) {}

  async resolve(user: AuthenticatedUser): Promise<SurveyActorContext> {
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

    return { id: user.id, role: user.role, tehsilId: office.tehsilId };
  }
}
