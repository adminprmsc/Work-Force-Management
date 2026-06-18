import { Contractor } from '../../domain/entities/contractor.entity';
export declare abstract class ContractorRepositoryPort {
    abstract findAll(): Promise<Contractor[]>;
    abstract findById(id: string): Promise<Contractor | null>;
    abstract findByName(name: string): Promise<Contractor | null>;
    abstract create(name: string): Promise<Contractor>;
    abstract update(id: string, name: string): Promise<Contractor>;
    abstract delete(id: string): Promise<void>;
    abstract isReferencedByPackage(id: string): Promise<boolean>;
}
export declare const CONTRACTOR_REPOSITORY: unique symbol;
