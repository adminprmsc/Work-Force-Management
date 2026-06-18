import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  composePackageNameWithTehsil,
  getTehsilDisplayName,
  getTehsilPackageNaming,
  type TehsilPackageNaming,
} from '../../domain/constants/tehsil-package-naming';
import {
  TEHSIL_REPOSITORY,
  TehsilRepositoryPort,
} from '../ports/tehsil.repository.port';

export type TehsilNamingPreview = {
  tehsilDisplayName: string;
  suggestedZoneLabel: string | null;
  suggestedAbbrev: string | null;
  naming: TehsilPackageNaming | null;
};

@Injectable()
export class ProcurementPackageNamingService {
  constructor(
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async previewTehsilNaming(tehsilId: string): Promise<TehsilNamingPreview> {
    const tehsil = await this.tehsilRepository.findById(tehsilId);
    if (!tehsil) {
      throw new NotFoundException('Tehsil not found');
    }

    const naming = getTehsilPackageNaming(tehsil.name);
    return {
      tehsilDisplayName: getTehsilDisplayName(tehsil.name),
      suggestedZoneLabel: naming?.zoneLabel ?? null,
      suggestedAbbrev: naming?.abbrev ?? null,
      naming,
    };
  }

  async resolvePackageName(
    namePart: string,
    tehsilId: string,
  ): Promise<string> {
    const preview = await this.previewTehsilNaming(tehsilId);
    return composePackageNameWithTehsil(namePart, preview.tehsilDisplayName);
  }
}
