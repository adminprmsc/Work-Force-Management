import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Settlement } from '../../../domain/entities/location.entity';
import {
  TEHSIL_REPOSITORY,
  TehsilRepositoryPort,
} from '../../ports/tehsil.repository.port';

@Injectable()
export class ListVillageSettlementsUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(villageId: string): Promise<Settlement[]> {
    const village = await this.tehsilRepository.findVillageById(villageId);
    if (!village) {
      throw new NotFoundException('Village not found');
    }

    return this.tehsilRepository.findSettlementsByVillageId(villageId);
  }
}
