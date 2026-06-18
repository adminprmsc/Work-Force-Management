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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementPackageValidator = void 0;
const common_1 = require("@nestjs/common");
const contractor_repository_port_1 = require("../ports/contractor.repository.port");
const consultant_repository_port_1 = require("../ports/consultant.repository.port");
const tehsil_repository_port_1 = require("../ports/tehsil.repository.port");
let ProcurementPackageValidator = class ProcurementPackageValidator {
    contractorRepository;
    consultantRepository;
    tehsilRepository;
    constructor(contractorRepository, consultantRepository, tehsilRepository) {
        this.contractorRepository = contractorRepository;
        this.consultantRepository = consultantRepository;
        this.tehsilRepository = tehsilRepository;
    }
    async validate(input) {
        if (!input.villageIds.length) {
            throw new common_1.BadRequestException('At least one village is required');
        }
        const uniqueVillageIds = new Set(input.villageIds);
        if (uniqueVillageIds.size !== input.villageIds.length) {
            throw new common_1.BadRequestException('Duplicate village IDs are not allowed');
        }
        const [contractor, consultant, tehsil] = await Promise.all([
            this.contractorRepository.findById(input.contractorId),
            this.consultantRepository.findById(input.consultantId),
            this.tehsilRepository.findById(input.tehsilId),
        ]);
        if (!contractor) {
            throw new common_1.NotFoundException('Contractor not found');
        }
        if (!consultant) {
            throw new common_1.NotFoundException('Consultant not found');
        }
        if (!tehsil) {
            throw new common_1.NotFoundException('Tehsil not found');
        }
        const tehsilVillages = await this.tehsilRepository.findVillagesByTehsilId(input.tehsilId);
        const allowedVillageIds = new Set(tehsilVillages.map((village) => village.id));
        const invalidVillageIds = input.villageIds.filter((villageId) => !allowedVillageIds.has(villageId));
        if (invalidVillageIds.length > 0) {
            throw new common_1.BadRequestException('One or more villages do not belong to the selected tehsil');
        }
    }
};
exports.ProcurementPackageValidator = ProcurementPackageValidator;
exports.ProcurementPackageValidator = ProcurementPackageValidator = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(contractor_repository_port_1.CONTRACTOR_REPOSITORY)),
    __param(1, (0, common_1.Inject)(consultant_repository_port_1.CONSULTANT_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tehsil_repository_port_1.TEHSIL_REPOSITORY)),
    __metadata("design:paramtypes", [contractor_repository_port_1.ContractorRepositoryPort,
        consultant_repository_port_1.ConsultantRepositoryPort,
        tehsil_repository_port_1.TehsilRepositoryPort])
], ProcurementPackageValidator);
//# sourceMappingURL=procurement-package.validator.js.map