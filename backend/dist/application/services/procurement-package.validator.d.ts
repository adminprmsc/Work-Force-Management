import { ContractorRepositoryPort } from '../ports/contractor.repository.port';
import { ConsultantRepositoryPort } from '../ports/consultant.repository.port';
import { TehsilRepositoryPort } from '../ports/tehsil.repository.port';
export interface ProcurementPackageInput {
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    villageIds: string[];
}
export declare class ProcurementPackageValidator {
    private readonly contractorRepository;
    private readonly consultantRepository;
    private readonly tehsilRepository;
    constructor(contractorRepository: ContractorRepositoryPort, consultantRepository: ConsultantRepositoryPort, tehsilRepository: TehsilRepositoryPort);
    validate(input: ProcurementPackageInput): Promise<void>;
}
