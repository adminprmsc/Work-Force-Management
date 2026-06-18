import { Office } from '../../domain/entities/office.entity';
import { OfficeType } from '../../domain/entities/user.entity';
export declare abstract class OfficeRepositoryPort {
    abstract findById(id: string): Promise<Office | null>;
    abstract findAll(filter?: {
        type?: OfficeType;
    }): Promise<Office[]>;
    abstract findByTehsilId(tehsilId: string): Promise<Office | null>;
}
export declare const OFFICE_REPOSITORY: unique symbol;
