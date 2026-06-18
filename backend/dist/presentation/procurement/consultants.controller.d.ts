import { CreateConsultantUseCase, DeleteConsultantUseCase, ListConsultantsUseCase, UpdateConsultantUseCase } from '../../application/use-cases/procurement/manage-consultants.use-case';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { CreateMasterNameDto, UpdateMasterNameDto } from './dto/procurement.dto';
export declare class ConsultantsController {
    private readonly listConsultantsUseCase;
    private readonly createConsultantUseCase;
    private readonly updateConsultantUseCase;
    private readonly deleteConsultantUseCase;
    constructor(listConsultantsUseCase: ListConsultantsUseCase, createConsultantUseCase: CreateConsultantUseCase, updateConsultantUseCase: UpdateConsultantUseCase, deleteConsultantUseCase: DeleteConsultantUseCase);
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
