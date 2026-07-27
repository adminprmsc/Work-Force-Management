import { Settlement, Tehsil, Village } from '../../domain/entities/location.entity';
export type VillageUsage = {
    settlementCount: number;
    packageLinkCount: number;
    surveyResponseCount: number;
};
export type SettlementUsage = {
    surveyResponseCount: number;
};
export declare abstract class TehsilRepositoryPort {
    abstract findAll(): Promise<Tehsil[]>;
    abstract findById(id: string): Promise<Tehsil | null>;
    abstract findVillagesByTehsilId(tehsilId: string): Promise<Village[]>;
    abstract findVillageById(id: string): Promise<Village | null>;
    abstract findSettlementsByVillageId(villageId: string): Promise<Settlement[]>;
    abstract findSettlementById(id: string): Promise<Settlement | null>;
    abstract findVillageByTehsilAndName(tehsilId: string, name: string): Promise<Village | null>;
    abstract findSettlementByVillageAndName(villageId: string, name: string): Promise<Settlement | null>;
    abstract createVillage(tehsilId: string, name: string): Promise<Village>;
    abstract updateVillageName(id: string, name: string): Promise<Village>;
    abstract deleteVillage(id: string): Promise<void>;
    abstract getVillageUsage(id: string): Promise<VillageUsage>;
    abstract createSettlement(villageId: string, name: string): Promise<Settlement>;
    abstract updateSettlementName(id: string, name: string): Promise<Settlement>;
    abstract deleteSettlement(id: string): Promise<void>;
    abstract getSettlementUsage(id: string): Promise<SettlementUsage>;
}
export declare const TEHSIL_REPOSITORY: unique symbol;
