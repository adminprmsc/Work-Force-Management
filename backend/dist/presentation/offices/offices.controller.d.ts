import { ListOfficesUseCase } from '../../application/use-cases/offices/list-offices.use-case';
import { OfficeType } from '../../domain/entities/user.entity';
declare class ListOfficesQueryDto {
    type?: OfficeType;
}
export declare class OfficesController {
    private readonly listOfficesUseCase;
    constructor(listOfficesUseCase: ListOfficesUseCase);
    list(query: ListOfficesQueryDto): Promise<{
        id: string;
        type: OfficeType;
        name: string;
        tehsilId: string | null;
        tehsilName: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
export {};
