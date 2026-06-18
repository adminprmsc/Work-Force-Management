import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Consultant } from '../../../domain/entities/consultant.entity';
import {
  CONSULTANT_REPOSITORY,
  ConsultantRepositoryPort,
} from '../../ports/consultant.repository.port';
import {
  normalizeName,
  ProcurementActorResolver,
} from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

@Injectable()
export class ListConsultantsUseCase {
  constructor(
    @Inject(CONSULTANT_REPOSITORY)
    private readonly consultantRepository: ConsultantRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser): Promise<Consultant[]> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);
    return this.consultantRepository.findAll();
  }
}

@Injectable()
export class CreateConsultantUseCase {
  constructor(
    @Inject(CONSULTANT_REPOSITORY)
    private readonly consultantRepository: ConsultantRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser, name: string): Promise<Consultant> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);

    const normalized = normalizeName(name);
    const existing = await this.consultantRepository.findByName(normalized);
    if (existing) {
      throw new ConflictException('Consultant with this name already exists');
    }

    return this.consultantRepository.create(normalized);
  }
}

@Injectable()
export class UpdateConsultantUseCase {
  constructor(
    @Inject(CONSULTANT_REPOSITORY)
    private readonly consultantRepository: ConsultantRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    name: string,
  ): Promise<Consultant> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);

    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new NotFoundException('Consultant not found');
    }

    const normalized = normalizeName(name);
    const existing = await this.consultantRepository.findByName(normalized);
    if (existing && existing.id !== id) {
      throw new ConflictException('Consultant with this name already exists');
    }

    return this.consultantRepository.update(id, normalized);
  }
}

@Injectable()
export class DeleteConsultantUseCase {
  constructor(
    @Inject(CONSULTANT_REPOSITORY)
    private readonly consultantRepository: ConsultantRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<void> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);

    const consultant = await this.consultantRepository.findById(id);
    if (!consultant) {
      throw new NotFoundException('Consultant not found');
    }

    const referenced =
      await this.consultantRepository.isReferencedByPackage(id);
    if (referenced) {
      throw new ConflictException(
        'Consultant is linked to a procurement package and cannot be deleted',
      );
    }

    await this.consultantRepository.delete(id);
  }
}
