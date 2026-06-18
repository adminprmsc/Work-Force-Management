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
exports.ListTehsilVillagesUseCase = exports.ListTehsilsUseCase = void 0;
const common_1 = require("@nestjs/common");
const tehsil_repository_port_1 = require("../../ports/tehsil.repository.port");
let ListTehsilsUseCase = class ListTehsilsUseCase {
    tehsilRepository;
    constructor(tehsilRepository) {
        this.tehsilRepository = tehsilRepository;
    }
    execute() {
        return this.tehsilRepository.findAll();
    }
};
exports.ListTehsilsUseCase = ListTehsilsUseCase;
exports.ListTehsilsUseCase = ListTehsilsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tehsil_repository_port_1.TEHSIL_REPOSITORY)),
    __metadata("design:paramtypes", [tehsil_repository_port_1.TehsilRepositoryPort])
], ListTehsilsUseCase);
let ListTehsilVillagesUseCase = class ListTehsilVillagesUseCase {
    tehsilRepository;
    constructor(tehsilRepository) {
        this.tehsilRepository = tehsilRepository;
    }
    async execute(tehsilId) {
        const tehsil = await this.tehsilRepository.findById(tehsilId);
        if (!tehsil) {
            throw new common_1.NotFoundException('Tehsil not found');
        }
        return this.tehsilRepository.findVillagesByTehsilId(tehsilId);
    }
};
exports.ListTehsilVillagesUseCase = ListTehsilVillagesUseCase;
exports.ListTehsilVillagesUseCase = ListTehsilVillagesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tehsil_repository_port_1.TEHSIL_REPOSITORY)),
    __metadata("design:paramtypes", [tehsil_repository_port_1.TehsilRepositoryPort])
], ListTehsilVillagesUseCase);
//# sourceMappingURL=list-tehsils.use-case.js.map