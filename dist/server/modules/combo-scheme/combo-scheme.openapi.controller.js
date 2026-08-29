"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboSchemeOpenApiController = void 0;
const tslib_1 = require("tslib");
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const combo_scheme_service_1 = require("./combo-scheme.service");
let ComboSchemeOpenApiController = class ComboSchemeOpenApiController {
    comboSchemeService;
    constructor(comboSchemeService) {
        this.comboSchemeService = comboSchemeService;
    }
    async list() {
        const data = await this.comboSchemeService.list();
        return { success: true, data, message: 'ok' };
    }
};
exports.ComboSchemeOpenApiController = ComboSchemeOpenApiController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ComboSchemeOpenApiController.prototype, "list", null);
exports.ComboSchemeOpenApiController = ComboSchemeOpenApiController = tslib_1.__decorate([
    (0, common_1.Controller)('openapi/combo-schemes'),
    tslib_1.__metadata("design:paramtypes", [combo_scheme_service_1.ComboSchemeService])
], ComboSchemeOpenApiController);
