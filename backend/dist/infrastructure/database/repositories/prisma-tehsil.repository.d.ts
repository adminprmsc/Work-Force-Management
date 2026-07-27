import { Settlement, Tehsil, Village } from '../../../domain/entities/location.entity';
import { SettlementUsage, TehsilRepositoryPort, VillageUsage } from '../../../application/ports/tehsil.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaTehsilRepository implements TehsilRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<Tehsil[]>;
    findById(id: string): Promise<Tehsil | null>;
    findVillagesByTehsilId(tehsilId: string): Promise<Village[]>;
    findVillageById(id: string): Promise<Village | null>;
    findSettlementsByVillageId(villageId: string): Promise<Settlement[]>;
    findSettlementById(id: string): Promise<Settlement | null>;
    findVillageByTehsilAndName(tehsilId: string, name: string): Promise<Village | null>;
    findSettlementByVillageAndName(villageId: string, name: string): Promise<Settlement | null>;
    createVillage(tehsilId: string, name: string): Promise<Village>;
    updateVillageName(id: string, name: string): Promise<Village>;
    deleteVillage(id: string): Promise<void>;
    getVillageUsage(id: string): Promise<VillageUsage>;
    createSettlement(villageId: string, name: string): Promise<Settlement>;
    updateSettlementName(id: string, name: string): Promise<Settlement>;
    deleteSettlement(id: string): Promise<void>;
    getSettlementUsage(id: string): Promise<SettlementUsage>;
    private toTehsilDomain;
    private toVillageDomain;
}
