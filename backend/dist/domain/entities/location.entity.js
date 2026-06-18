"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settlement = exports.Village = exports.Tehsil = void 0;
class Tehsil {
    id;
    name;
    createdAt;
    villageCount;
    constructor(id, name, createdAt, villageCount) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.villageCount = villageCount;
    }
}
exports.Tehsil = Tehsil;
class Village {
    id;
    name;
    tehsilId;
    createdAt;
    settlementCount;
    constructor(id, name, tehsilId, createdAt, settlementCount) {
        this.id = id;
        this.name = name;
        this.tehsilId = tehsilId;
        this.createdAt = createdAt;
        this.settlementCount = settlementCount;
    }
}
exports.Village = Village;
class Settlement {
    id;
    name;
    villageId;
    createdAt;
    constructor(id, name, villageId, createdAt) {
        this.id = id;
        this.name = name;
        this.villageId = villageId;
        this.createdAt = createdAt;
    }
}
exports.Settlement = Settlement;
//# sourceMappingURL=location.entity.js.map