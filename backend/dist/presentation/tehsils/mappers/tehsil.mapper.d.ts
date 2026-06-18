import type { Settlement } from '../../../domain/entities/location.entity';
export declare function toSettlementResponse(settlement: Settlement): {
    id: string;
    name: string;
    villageId: string;
    createdAt: Date;
};
