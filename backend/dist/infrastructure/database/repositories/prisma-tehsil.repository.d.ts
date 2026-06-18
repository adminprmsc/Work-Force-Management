import { Settlement, Tehsil, Village } from '../../../domain/entities/location.entity';
import { TehsilRepositoryPort } from '../../../application/ports/tehsil.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaTehsilRepository implements TehsilRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<Tehsil[]>;
    findById(id: string): Promise<Tehsil | null>;
    findVillagesByTehsilId(tehsilId: string): Promise<Village[]>;
    findVillageById(id: string): Promise<Village | null>;
    findSettlementsByVillageId(villageId: string): Promise<Settlement[]>;
    private toTehsilDomain;
    private toVillageDomain;
}
