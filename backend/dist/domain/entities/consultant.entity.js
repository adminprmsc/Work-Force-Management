"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consultant = void 0;
class Consultant {
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
exports.Consultant = Consultant;
//# sourceMappingURL=consultant.entity.js.map