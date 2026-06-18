import { OfficeRepositoryPort } from '../../ports/office.repository.port';
import { OfficeType } from '../../../domain/entities/user.entity';
export declare class ListOfficesUseCase {
    private readonly officeRepository;
    constructor(officeRepository: OfficeRepositoryPort);
    execute(filter?: {
        type?: OfficeType;
    }): Promise<import("../../../domain/entities/office.entity").Office[]>;
}
