"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRole = void 0;
exports.toUserResponse = toUserResponse;
exports.toActorContext = toActorContext;
const user_entity_1 = require("../../../domain/entities/user.entity");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return user_entity_1.UserRole; } });
Object.defineProperty(exports, "UserStatus", { enumerable: true, get: function () { return user_entity_1.UserStatus; } });
function toUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        officeId: user.officeId,
        officeName: user.officeName,
        officeType: user.officeType,
        tehsilName: user.tehsilName,
        createdById: user.createdById,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function toActorContext(user) {
    return { id: user.id, role: user.role };
}
//# sourceMappingURL=user.mapper.js.map