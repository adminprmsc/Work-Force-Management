"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contractor = void 0;
class Contractor {
    id;
    name;
    createdAt;
    updatedAt;
    linkedPackageNames;
    constructor(id, name, createdAt, updatedAt, linkedPackageNames = []) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.linkedPackageNames = linkedPackageNames;
    }
}
exports.Contractor = Contractor;
//# sourceMappingURL=contractor.entity.js.map