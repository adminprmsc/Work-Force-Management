"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserResponse = toUserResponse;
exports.toAuthResponse = toAuthResponse;
function toUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
    };
}
function toAuthResponse(accessToken) {
    return { accessToken };
}
//# sourceMappingURL=auth.mapper.js.map