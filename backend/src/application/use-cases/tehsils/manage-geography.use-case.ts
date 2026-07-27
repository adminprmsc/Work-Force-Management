import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Settlement,
  Village,
} from '../../../domain/entities/location.entity';
import {
  TEHSIL_REPOSITORY,
  TehsilRepositoryPort,
} from '../../ports/tehsil.repository.port';

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new BadRequestException('Name is required');
  }
  return trimmed;
}

@Injectable()
export class CreateVillageUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(tehsilId: string, name: string): Promise<Village> {
    const tehsil = await this.tehsilRepository.findById(tehsilId);
    if (!tehsil) {
      throw new NotFoundException('Tehsil not found');
    }

    const normalized = normalizeName(name);
    const existing = await this.tehsilRepository.findVillageByTehsilAndName(
      tehsilId,
      normalized,
    );
    if (existing) {
      throw new ConflictException(
        'A village with this name already exists in this tehsil',
      );
    }

    return this.tehsilRepository.createVillage(tehsilId, normalized);
  }
}

@Injectable()
export class UpdateVillageUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(id: string, name: string): Promise<Village> {
    const village = await this.tehsilRepository.findVillageById(id);
    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const normalized = normalizeName(name);
    const existing = await this.tehsilRepository.findVillageByTehsilAndName(
      village.tehsilId,
      normalized,
    );
    if (existing && existing.id !== id) {
      throw new ConflictException(
        'A village with this name already exists in this tehsil',
      );
    }

    return this.tehsilRepository.updateVillageName(id, normalized);
  }
}

@Injectable()
export class DeleteVillageUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const village = await this.tehsilRepository.findVillageById(id);
    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const usage = await this.tehsilRepository.getVillageUsage(id);
    if (usage.settlementCount > 0) {
      throw new ConflictException(
        'Village has settlements and cannot be deleted. Remove settlements first.',
      );
    }
    if (usage.packageLinkCount > 0) {
      throw new ConflictException(
        'Village is linked to a procurement package and cannot be deleted',
      );
    }
    if (usage.surveyResponseCount > 0) {
      throw new ConflictException(
        'Village is used in survey responses and cannot be deleted',
      );
    }

    await this.tehsilRepository.deleteVillage(id);
  }
}

@Injectable()
export class CreateSettlementUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(villageId: string, name: string): Promise<Settlement> {
    const village = await this.tehsilRepository.findVillageById(villageId);
    if (!village) {
      throw new NotFoundException('Village not found');
    }

    const normalized = normalizeName(name);
    const existing =
      await this.tehsilRepository.findSettlementByVillageAndName(
        villageId,
        normalized,
      );
    if (existing) {
      throw new ConflictException(
        'A settlement with this name already exists in this village',
      );
    }

    return this.tehsilRepository.createSettlement(villageId, normalized);
  }
}

@Injectable()
export class UpdateSettlementUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(id: string, name: string): Promise<Settlement> {
    const settlement = await this.tehsilRepository.findSettlementById(id);
    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }

    const normalized = normalizeName(name);
    const existing =
      await this.tehsilRepository.findSettlementByVillageAndName(
        settlement.villageId,
        normalized,
      );
    if (existing && existing.id !== id) {
      throw new ConflictException(
        'A settlement with this name already exists in this village',
      );
    }

    return this.tehsilRepository.updateSettlementName(id, normalized);
  }
}

@Injectable()
export class DeleteSettlementUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const settlement = await this.tehsilRepository.findSettlementById(id);
    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }

    const usage = await this.tehsilRepository.getSettlementUsage(id);
    if (usage.surveyResponseCount > 0) {
      throw new ConflictException(
        'Settlement is used in survey responses and cannot be deleted',
      );
    }

    await this.tehsilRepository.deleteSettlement(id);
  }
}
