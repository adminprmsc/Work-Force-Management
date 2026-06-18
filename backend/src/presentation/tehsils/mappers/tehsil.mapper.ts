import type { Settlement } from '../../../domain/entities/location.entity';

export function toSettlementResponse(settlement: Settlement) {
  return {
    id: settlement.id,
    name: settlement.name,
    villageId: settlement.villageId,
    createdAt: settlement.createdAt,
  };
}
