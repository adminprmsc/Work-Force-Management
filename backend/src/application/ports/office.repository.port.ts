import { Office } from '../../domain/entities/office.entity';
import { OfficeType } from '../../domain/entities/user.entity';

export abstract class OfficeRepositoryPort {
  abstract findById(id: string): Promise<Office | null>;
  abstract findAll(filter?: { type?: OfficeType }): Promise<Office[]>;
  abstract findByTehsilId(tehsilId: string): Promise<Office | null>;
}

export const OFFICE_REPOSITORY = Symbol('OFFICE_REPOSITORY');
