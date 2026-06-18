"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSettlementResponse = toSettlementResponse;
function toSettlementResponse(settlement) {
    return {
        id: settlement.id,
        name: settlement.name,
        villageId: settlement.villageId,
        createdAt: settlement.createdAt,
    };
}
//# sourceMappingURL=tehsil.mapper.js.map