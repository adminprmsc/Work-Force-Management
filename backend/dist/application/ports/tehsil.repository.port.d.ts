import { Settlement, Tehsil, Village } from '../../domain/entities/location.entity';
export declare abstract class TehsilRepositoryPort {
    abstract findAll(): Promise<Tehsil[]>;
    abstract findById(id: string): Promise<Tehsil | null>;
    abstract findVillagesByTehsilId(tehsilId: string): Promise<Village[]>;
    abstract findVillageById(id: string): Promise<Village | null>;
    abstract findSettlementsByVillageId(villageId: string): Promise<Settlement[]>;
}
export declare const TEHSIL_REPOSITORY: unique symbol;
