"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProcurementPackageExpenseDto = exports.CreateProcurementPackageExpenseDto = exports.UpdateProcurementPackageDto = exports.CreateProcurementPackageDto = exports.UpdateMasterNameDto = exports.CreateMasterNameDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMasterNameDto {
    name;
}
exports.CreateMasterNameDto = CreateMasterNameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateMasterNameDto.prototype, "name", void 0);
class UpdateMasterNameDto {
    name;
}
exports.UpdateMasterNameDto = UpdateMasterNameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateMasterNameDto.prototype, "name", void 0);
class CreateProcurementPackageDto {
    name;
    budgetAmount;
    contractorId;
    consultantId;
    tehsilId;
    villageIds;
}
exports.CreateProcurementPackageDto = CreateProcurementPackageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateProcurementPackageDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProcurementPackageDto.prototype, "budgetAmount", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProcurementPackageDto.prototype, "contractorId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProcurementPackageDto.prototype, "consultantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProcurementPackageDto.prototype, "tehsilId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateProcurementPackageDto.prototype, "villageIds", void 0);
class UpdateProcurementPackageDto {
    budgetAmount;
    villageIds;
}
exports.UpdateProcurementPackageDto = UpdateProcurementPackageDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateProcurementPackageDto.prototype, "budgetAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], UpdateProcurementPackageDto.prototype, "villageIds", void 0);
class CreateProcurementPackageExpenseDto {
    amount;
    description;
    expenseDate;
}
exports.CreateProcurementPackageExpenseDto = CreateProcurementPackageExpenseDto;
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateProcurementPackageExpenseDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateProcurementPackageExpenseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateProcurementPackageExpenseDto.prototype, "expenseDate", void 0);
class UpdateProcurementPackageExpenseDto {
    amount;
    description;
    expenseDate;
}
exports.UpdateProcurementPackageExpenseDto = UpdateProcurementPackageExpenseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], UpdateProcurementPackageExpenseDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpdateProcurementPackageExpenseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateProcurementPackageExpenseDto.prototype, "expenseDate", void 0);
//# sourceMappingURL=procurement.dto.js.map