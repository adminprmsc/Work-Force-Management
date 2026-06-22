"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.OfficeType = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SENIOR_MANAGER_ES"] = "SENIOR_MANAGER_ES";
    UserRole["RA_ENVIRONMENT_HO"] = "RA_ENVIRONMENT_HO";
    UserRole["RA_ES_TEHSIL"] = "RA_ES_TEHSIL";
    UserRole["WORLD_BANK_USER"] = "WORLD_BANK_USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var OfficeType;
(function (OfficeType) {
    OfficeType["HEAD_OFFICE"] = "HEAD_OFFICE";
    OfficeType["WORLD_BANK_OFFICE"] = "WORLD_BANK_OFFICE";
    OfficeType["TEHSIL_OFFICE"] = "TEHSIL_OFFICE";
})(OfficeType || (exports.OfficeType = OfficeType = {}));
class User {
    id;
    email;
    username;
    password;
    role;
    status;
    mustChangePassword;
    officeId;
    officeName;
    officeType;
    tehsilName;
    createdById;
    createdAt;
    updatedAt;
    constructor(id, email, username, password, role, status, mustChangePassword, officeId, officeName, officeType, tehsilName, createdById, createdAt, updatedAt) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role;
        this.status = status;
        this.mustChangePassword = mustChangePassword;
        this.officeId = officeId;
        this.officeName = officeName;
        this.officeType = officeType;
        this.tehsilName = tehsilName;
        this.createdById = createdById;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map