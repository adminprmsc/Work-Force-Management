import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Contractor } from '../../../domain/entities/contractor.entity';
import {
  CONTRACTOR_REPOSITORY,
  ContractorRepositoryPort,
} from '../../ports/contractor.repository.port';
import {
  normalizeName,
  ProcurementActorResolver,
} from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

@Injectable()
export class ListContractorsUseCase {
  constructor(
    @Inject(CONTRACTOR_REPOSITORY)
    private readonly contractorRepository: ContractorRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser): Promise<Contractor[]> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);
    return this.contractorRepository.findAll();
  }
}

@Injectable()
export class CreateContractorUseCase {
  constructor(
    @Inject(CONTRACTOR_REPOSITORY)
    private readonly contractorRepository: ContractorRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser, name: string): Promise<Contractor> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);

    const normalized = normalizeName(name);
    const existing = await this.contractorRepository.findByName(normalized);
    if (existing) {
      throw new ConflictException('Contractor with this name already exists');
    }

    return this.contractorRepository.create(normalized);
  }
}

@Injectable()
export class UpdateContractorUseCase {
  constructor(
    @Inject(CONTRACTOR_REPOSITORY)
    private readonly contractorRepository: ContractorRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    name: string,
  ): Promise<Contractor> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);

    const contractor = await this.contractorRepository.findById(id);
    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    const normalized = normalizeName(name);
    const existing = await this.contractorRepository.findByName(normalized);
    if (existing && existing.id !== id) {
      throw new ConflictException('Contractor with this name already exists');
    }

    return this.contractorRepository.update(id, normalized);
  }
}

@Injectable()
export class DeleteContractorUseCase {
  constructor(
    @Inject(CONTRACTOR_REPOSITORY)
    private readonly contractorRepository: ContractorRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<void> {
    const actor = await this.actorResolver.resolve(user);
    this.actorResolver.assertManageMasters(actor);

    const contractor = await this.contractorRepository.findById(id);
    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    const referenced =
      await this.contractorRepository.isReferencedByPackage(id);
    if (referenced) {
      throw new ConflictException(
        'Contractor is linked to a procurement package and cannot be deleted',
      );
    }

    await this.contractorRepository.delete(id);
  }
}
