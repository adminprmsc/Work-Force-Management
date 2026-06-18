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
exports.ProcurementPackageNamingService = void 0;
const common_1 = require("@nestjs/common");
const tehsil_package_naming_1 = require("../../domain/constants/tehsil-package-naming");
const tehsil_repository_port_1 = require("../ports/tehsil.repository.port");
let ProcurementPackageNamingService = class ProcurementPackageNamingService {
    tehsilRepository;
    constructor(tehsilRepository) {
        this.tehsilRepository = tehsilRepository;
    }
    async previewTehsilNaming(tehsilId) {
        const tehsil = await this.tehsilRepository.findById(tehsilId);
        if (!tehsil) {
            throw new common_1.NotFoundException('Tehsil not found');
        }
        const naming = (0, tehsil_package_naming_1.getTehsilPackageNaming)(tehsil.name);
        return {
            tehsilDisplayName: (0, tehsil_package_naming_1.getTehsilDisplayName)(tehsil.name),
            suggestedZoneLabel: naming?.zoneLabel ?? null,
            suggestedAbbrev: naming?.abbrev ?? null,
            naming,
        };
    }
    async resolvePackageName(namePart, tehsilId) {
        const preview = await this.previewTehsilNaming(tehsilId);
        return (0, tehsil_package_naming_1.composePackageNameWithTehsil)(namePart, preview.tehsilDisplayName);
    }
};
exports.ProcurementPackageNamingService = ProcurementPackageNamingService;
exports.ProcurementPackageNamingService = ProcurementPackageNamingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tehsil_repository_port_1.TEHSIL_REPOSITORY)),
    __metadata("design:paramtypes", [tehsil_repository_port_1.TehsilRepositoryPort])
], ProcurementPackageNamingService);
//# sourceMappingURL=procurement-package-naming.service.js.map