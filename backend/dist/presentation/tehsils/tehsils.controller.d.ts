import { ListTehsilVillagesUseCase, ListTehsilsUseCase } from '../../application/use-cases/tehsils/list-tehsils.use-case';
import { ListVillageSettlementsUseCase } from '../../application/use-cases/tehsils/list-village-settlements.use-case';
export declare class TehsilsController {
    private readonly listTehsilsUseCase;
    private readonly listTehsilVillagesUseCase;
    private readonly listVillageSettlementsUseCase;
    constructor(listTehsilsUseCase: ListTehsilsUseCase, listTehsilVillagesUseCase: ListTehsilVillagesUseCase, listVillageSettlementsUseCase: ListVillageSettlementsUseCase);
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
    listVillages(id: string): Promise<{
        id: string;
        name: string;
        tehsilId: string;
        settlementCount: number | undefined;
        createdAt: Date;
    }[]>;
}
