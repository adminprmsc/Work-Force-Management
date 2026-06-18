import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Tehsil, Village } from '../../../domain/entities/location.entity';
import {
  TEHSIL_REPOSITORY,
  TehsilRepositoryPort,
} from '../../ports/tehsil.repository.port';

@Injectable()
export class ListTehsilsUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  execute(): Promise<Tehsil[]> {
    return this.tehsilRepository.findAll();
  }
}

@Injectable()
export class ListTehsilVillagesUseCase {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async execute(tehsilId: string): Promise<Village[]> {
    const tehsil = await this.tehsilRepository.findById(tehsilId);
    if (!tehsil) {
      throw new NotFoundException('Tehsil not found');
    }
    return this.tehsilRepository.findVillagesByTehsilId(tehsilId);
  }
}
