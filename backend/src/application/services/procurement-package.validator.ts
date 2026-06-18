import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CONTRACTOR_REPOSITORY,
  ContractorRepositoryPort,
} from '../ports/contractor.repository.port';
import {
  CONSULTANT_REPOSITORY,
  ConsultantRepositoryPort,
} from '../ports/consultant.repository.port';
import {
  TEHSIL_REPOSITORY,
  TehsilRepositoryPort,
} from '../ports/tehsil.repository.port';

export interface ProcurementPackageInput {
  contractorId: string;
  consultantId: string;
  tehsilId: string;
  villageIds: string[];
}

@Injectable()
export class ProcurementPackageValidator {
  constructor(
    @Inject(CONTRACTOR_REPOSITORY)
    private readonly contractorRepository: ContractorRepositoryPort,
    @Inject(CONSULTANT_REPOSITORY)
    private readonly consultantRepository: ConsultantRepositoryPort,
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
  ) {}

  async validate(input: ProcurementPackageInput): Promise<void> {
    if (!input.villageIds.length) {
      throw new BadRequestException('At least one village is required');
    }

    const uniqueVillageIds = new Set(input.villageIds);
    if (uniqueVillageIds.size !== input.villageIds.length) {
      throw new BadRequestException('Duplicate village IDs are not allowed');
    }

    const [contractor, consultant, tehsil] = await Promise.all([
      this.contractorRepository.findById(input.contractorId),
      this.consultantRepository.findById(input.consultantId),
      this.tehsilRepository.findById(input.tehsilId),
    ]);

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }
    if (!consultant) {
      throw new NotFoundException('Consultant not found');
    }
    if (!tehsil) {
      throw new NotFoundException('Tehsil not found');
    }

    const tehsilVillages = await this.tehsilRepository.findVillagesByTehsilId(
      input.tehsilId,
    );
    const allowedVillageIds = new Set(
      tehsilVillages.map((village) => village.id),
    );

    const invalidVillageIds = input.villageIds.filter(
      (villageId) => !allowedVillageIds.has(villageId),
    );
    if (invalidVillageIds.length > 0) {
      throw new BadRequestException(
        'One or more villages do not belong to the selected tehsil',
      );
    }
  }
}
