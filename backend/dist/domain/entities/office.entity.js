"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Office = void 0;
class Office {
    id;
    type;
    name;
    tehsilId;
    tehsilName;
    createdAt;
    updatedAt;
    constructor(id, type, name, tehsilId, tehsilName, createdAt, updatedAt) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.tehsilId = tehsilId;
        this.tehsilName = tehsilName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.Office = Office;
//# sourceMappingURL=office.entity.js.map