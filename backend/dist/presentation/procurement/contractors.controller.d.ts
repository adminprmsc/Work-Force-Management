import { CreateContractorUseCase, DeleteContractorUseCase, ListContractorsUseCase, UpdateContractorUseCase } from '../../application/use-cases/procurement/manage-contractors.use-case';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { CreateMasterNameDto, UpdateMasterNameDto } from './dto/procurement.dto';
export declare class ContractorsController {
    private readonly listContractorsUseCase;
    private readonly createContractorUseCase;
    private readonly updateContractorUseCase;
    private readonly deleteContractorUseCase;
    constructor(listContractorsUseCase: ListContractorsUseCase, createContractorUseCase: CreateContractorUseCase, updateContractorUseCase: UpdateContractorUseCase, deleteContractorUseCase: DeleteContractorUseCase);
    list(user: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(user: AuthenticatedUser, dto: CreateMasterNameDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateMasterNameDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
    }>;
}
