import { Consultant } from '../../domain/entities/consultant.entity';
export declare abstract class ConsultantRepositoryPort {
    abstract findAll(): Promise<Consultant[]>;
    abstract findById(id: string): Promise<Consultant | null>;
    abstract findByName(name: string): Promise<Consultant | null>;
    abstract create(name: string): Promise<Consultant>;
    abstract update(id: string, name: string): Promise<Consultant>;
    abstract delete(id: string): Promise<void>;
    abstract isReferencedByPackage(id: string): Promise<boolean>;
}
export declare const CONSULTANT_REPOSITORY: unique symbol;
