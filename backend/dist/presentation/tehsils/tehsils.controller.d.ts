import { ListTehsilVillagesUseCase, ListTehsilsUseCase } from '../../application/use-cases/tehsils/list-tehsils.use-case';
import { ListVillageSettlementsUseCase } from '../../application/use-cases/tehsils/list-village-settlements.use-case';
import { CreateSettlementUseCase, CreateVillageUseCase, DeleteSettlementUseCase, DeleteVillageUseCase, UpdateSettlementUseCase, UpdateVillageUseCase } from '../../application/use-cases/tehsils/manage-geography.use-case';
import { GeographyNameDto } from './dto/geography.dto';
export declare class TehsilsController {
    private readonly listTehsilsUseCase;
    private readonly listTehsilVillagesUseCase;
    private readonly listVillageSettlementsUseCase;
    private readonly createVillageUseCase;
    private readonly updateVillageUseCase;
    private readonly deleteVillageUseCase;
    private readonly createSettlementUseCase;
    private readonly updateSettlementUseCase;
    private readonly deleteSettlementUseCase;
    constructor(listTehsilsUseCase: ListTehsilsUseCase, listTehsilVillagesUseCase: ListTehsilVillagesUseCase, listVillageSettlementsUseCase: ListVillageSettlementsUseCase, createVillageUseCase: CreateVillageUseCase, updateVillageUseCase: UpdateVillageUseCase, deleteVillageUseCase: DeleteVillageUseCase, createSettlementUseCase: CreateSettlementUseCase, updateSettlementUseCase: UpdateSettlementUseCase, deleteSettlementUseCase: DeleteSettlementUseCase);
    list(): Promise<{
        id: string;
        name: string;
        villageCount: number | undefined;
        createdAt: Date;
    }[]>;
    listVillageSettlements(id: string): Promise<{
        id: string;
        name: string;
        villageId: string;
        createdAt: Date;
    }[]>;
    createSettlement(villageId: string, dto: GeographyNameDto): Promise<{
        id: string;
        name: string;
        villageId: string;
        createdAt: Date;
    }>;
    updateSettlement(id: string, dto: GeographyNameDto): Promise<{
        id: string;
        name: string;
        villageId: string;
        createdAt: Date;
    }>;
    deleteSettlement(id: string): Promise<{
        success: boolean;
    }>;
    updateVillage(id: string, dto: GeographyNameDto): Promise<{
        id: string;
        name: string;
        tehsilId: string;
        settlementCount: number;
        createdAt: Date;
    }>;
    deleteVillage(id: string): Promise<{
        success: boolean;
    }>;
    listVillages(id: string): Promise<{
        id: string;
        name: string;
        tehsilId: string;
        settlementCount: number | undefined;
        createdAt: Date;
    }[]>;
    createVillage(tehsilId: string, dto: GeographyNameDto): Promise<{
        id: string;
        name: string;
        tehsilId: string;
        settlementCount: number;
        createdAt: Date;
    }>;
}
