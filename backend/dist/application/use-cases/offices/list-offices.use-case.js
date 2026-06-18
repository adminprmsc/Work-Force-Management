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
exports.ListOfficesUseCase = void 0;
const common_1 = require("@nestjs/common");
const office_repository_port_1 = require("../../ports/office.repository.port");
let ListOfficesUseCase = class ListOfficesUseCase {
    officeRepository;
    constructor(officeRepository) {
        this.officeRepository = officeRepository;
    }
    execute(filter) {
        return this.officeRepository.findAll(filter);
    }
};
exports.ListOfficesUseCase = ListOfficesUseCase;
exports.ListOfficesUseCase = ListOfficesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(office_repository_port_1.OFFICE_REPOSITORY)),
    __metadata("design:paramtypes", [office_repository_port_1.OfficeRepositoryPort])
], ListOfficesUseCase);
//# sourceMappingURL=list-offices.use-case.js.map